## Context

The `@cosmoose/core` package scaffold exists at `packages/cosmoose` but contains only an empty `index.ts`. Two internal projects have proven the ODM concept:

- **asap-backend** (`libs/cosmoose`) — Full ODM with custom type system, AJV validation (via JSON Schema generation), QueryBuilder with SQL translation, Model with CRUD + batch + patch operators, connection manager with container auto-provisioning. Used in production across 10+ services.
- **ekoai-assistant** — Lighter approach using Zod schemas directly, CosmosBaseRepository for CRUD, CosmosDatabaseSerializer for data transformation. Uses `z.object()` as schema source of truth.

Both solve the same problem: Azure CosmosDB's JavaScript SDK is schemaless and low-level. Developers need validation, type safety, structured queries, and Mongoose-like ergonomics.

The stack is TypeScript 6, Node.js 24, Vitest, built with Vite via Nx.

## Goals / Non-Goals

**Goals:**
- Mongoose-familiar API surface: `Schema`, `Model`, `cosmoose.connect()`, `cosmoose.model()`, `await model.find(query)`
- Custom type system with database-specific metadata (partition keys, unique keys, TTL, composite indexes)
- Zod as internal validation engine — replacing AJV from asap-backend
- Type-safe CRUD with proper TypeScript inference from schema to model operations
- Container provisioning as a separate migration concern
- UUID v7 (no hyphens) for time-sortable document IDs
- Expose CosmosDB metadata (`_etag`, `_ts`, `_rid`, `_self`, `_attachments`) on documents

**Non-Goals:**
- NestJS integration (belongs in `@cosmoose/nestjs`)
- Soft delete as a native feature (application-layer concern)
- Aggregation pipeline support (CosmosDB SQL doesn't have a direct equivalent)
- `populate()` / document references (CosmosDB is not a relational DB)
- CLI tooling (migration is a programmatic API, not a CLI command)
- Change feed / real-time subscriptions (can be added later)

## Decisions

### 1. Custom type system with Zod compilation

**Decision**: Keep Mongoose-style `{ type: Type.STRING, trim: true }` schema definitions. Internally compile them to Zod schemas for validation.

**Why not Zod schemas directly?** The type definition carries database-level metadata that Zod has no concept of. A custom type system lets the schema be the single source of truth for both validation AND container configuration.

**Schema options are split into two tiers** — app-level options (timestamps) live at the top, and container-level config (partition key, unique keys, composite indexes, TTL) is nested under a `container` key. This clearly separates mutable app concerns from infrastructure concerns that may be immutable after container creation:

```ts
new Schema<User>(definition, {
  timestamps: true,              // app-level, freely changeable
  container: {                   // infra-level, used by syncContainers()
    partitionKey: '/networkId',  // immutable after creation
    uniqueKeys: [["/email"]],   // immutable after creation
    compositeIndexes: [...],     // mutable (indexing policy update)
    ttl: 3600,                   // mutable (container settings)
  },
});
```

**Why Zod over AJV?** The asap-backend approach generates JSON Schema objects and feeds them to AJV. This works but is verbose, error-prone (manual JSON Schema construction), and loses TypeScript type inference. Zod provides:
- Built-in transforms (trim, toLowerCase) without post-processing
- Structured errors
- Parse-don't-validate pattern — validated data comes back typed
- Modern ecosystem standard

**Compilation**: Schema generates multiple Zod variants for different operations:
- `createSchema` — required fields enforced, defaults applied, `id` optional
- `patchSchema` — all fields partial, supports null values for `$unset`
- `deserializeSchema` — strips/maps CosmosDB system fields, ISO strings → Date

### 2. Patch operations as explicit operators

**Decision**: Patch uses explicit `$set`, `$add`, `$incr`, `$unset` operators, matching Mongoose's update operators and mapping to CosmosDB's patch operations.

**Key distinction**: Setting a field to `null` stores `null` in the document. Using `$unset` removes the field entirely. These map to different CosmosDB patch operations (`set` with null value vs `remove`).

**Alternative considered**: The ekoai-assistant approach auto-detects null-as-remove. Rejected because it's implicit — developers should explicitly choose between "set null" and "remove field."

### 3. UUID v7 without hyphens for document IDs

**Decision**: Auto-generate `0190ae5b1a3c7d4e8f2a3b4c5d6e7f8a` (32 hex chars) when `id` is not provided on create.

**Why UUID v7?** Time-sortable with millisecond precision, crypto-secure random portion, IETF standard (RFC 9562). Lexicographic string sort = chronological order, enabling `ORDER BY c.id` as a creation-time sort.

**Why no hyphens?** Saves 4 chars per document. CosmosDB `id` is a string — hyphens add no value and slightly increase index size.

**Alternative considered**: MongoDB-style ObjectId (24 hex chars). Rejected because UUID v7 is a formal standard, has better tooling support (`uuid` package), and offers millisecond vs second timestamp precision.

**Implementation**: Use the `uuid` package's `v7` function with hyphens stripped.

### 4. Container provisioning as separate migration

**Decision**: `cosmoose.model(name, schema)` only binds a schema to a container reference. It does NOT create the container. A separate `cosmoose.syncContainers()` (or `cosmoose.syncContainer(name)`) function handles provisioning.

**Why separate?** `createIfNotExists` on every app startup is:
- Wasteful (extra round-trip on every cold start)
- Dangerous (can't add unique keys to existing containers — CosmosDB limitation)
- Not production-appropriate (infra should be provisioned deliberately)

**Migration function responsibilities**: Create container with partition key, apply unique key policy, apply composite indexes, set TTL, configure indexing policy.

**Drift detection**: When `syncContainers()` runs against an existing container, it SHALL read the container's current configuration and compare it against the schema's `container` config. For each difference:
- **Immutable drift** (partition key, unique keys): Warn with the exact diff and explain the property cannot be changed after creation — the container must be recreated.
- **Mutable drift** (composite indexes, TTL, indexing policy): Apply the update automatically, or warn if the update fails.

This prevents silent misconfiguration where a developer changes a partition key in the schema and assumes it took effect.

### 5. Full CosmosDB metadata exposure

**Decision**: `Document<T>` includes `_etag`, `_ts`, `_rid`, `_self`, `_attachments` alongside user fields.

**Why expose all?** `_etag` enables optimistic concurrency. `_ts` provides server-side timestamps. `_rid`, `_self`, `_attachments` are less commonly used but cost nothing to expose and can be useful for advanced scenarios (direct REST API calls, cross-partition queries).

### 6. Timestamps as schema option

**Decision**: `{ timestamps: true }` auto-manages `createdAt` (Date, set on create) and `updatedAt` (Date, set on create and every update/patch). Stored as ISO strings in CosmosDB, deserialized as `Date` objects.

**Why not rely on `_ts`?** `_ts` is Unix seconds (not milliseconds), updates on every write, and doesn't distinguish creation from modification. Application-level timestamps give finer control and the `createdAt` vs `updatedAt` distinction.

### 7. QueryBuilder SQL generation

**Decision**: Translate Mongoose-style query objects to CosmosDB SQL. Support `$or`, `$and`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`. Parameterized queries (prevent SQL injection).

**Query types**: `find` (paginated), `findAll` (no limit), `findOne`, `count`, `findAsCursor` (batch iteration), `findAsTokenPagination` (continuation token). All return a `QueryBuilder` with `.sort()`, `.limit()`, `.offset()`. The QueryBuilder implements `PromiseLike` so it can be directly awaited — no `.exec()` call needed.

## Risks / Trade-offs

- **[Zod compilation performance]** → Compile Zod schemas once on Schema construction and cache. Different operation variants (create, patch, deserialize) are generated lazily and cached.
- **[CosmosDB unique key immutability]** → Once a container is created with a unique key policy, it cannot be changed. `syncContainers()` detects drift between schema definition and existing container and warns with reasons. Developers must recreate the container to change immutable properties.
- **[UUID v7 dependency]** → Adds `uuid` as a runtime dependency. Small footprint (~10KB), well-maintained, standard library. Acceptable trade-off.
- **[QueryBuilder SQL coverage]** → Not all MongoDB query operators map to CosmosDB SQL. Unsupported operators should throw clear errors at query construction time, not at execution.
- **[Patch operation batching]** → CosmosDB limits patch operations to 10 per request. Model must batch and execute sequentially when operations exceed 10. This adds latency for large patches.
