## Why

Azure CosmosDB's official JavaScript SDK is schemaless — it provides no validation, no type-safe queries, and no structured CRUD patterns. Two internal projects (asap-backend and ekoai-assistant) have independently built ODM layers on top of it, each solving the same problem differently. Cosmoose consolidates these efforts into a standalone, publishable ODM library that mirrors Mongoose's developer experience for CosmosDB.

## What Changes

- Implement a **custom type system** (`Type.STRING`, `Type.NUMBER`, `Type.OBJECT`, etc.) for defining schemas in a Mongoose-style declarative format, with **Zod** as the internal validation engine
- Implement a **Schema** class that holds field definitions, partition key configuration, unique key policies, composite indexes, and TTL — with an optional `timestamps: true` feature for automatic `createdAt`/`updatedAt` management
- Implement a **Model** class that provides typed CRUD operations: `create`, `getById`, `updateById`, `patchById` (with `$set`, `$add`, `$incr`, `$unset` operators), `deleteById`, batch operations, and raw queries
- Implement a **QueryBuilder** that translates Mongoose-style query objects (`$or`, `$and`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`) into CosmosDB SQL, with support for `find`, `findOne`, `findAll`, `count`, cursor-based iteration, and token-based pagination
- Implement a **Cosmoose** connection manager that wraps `CosmosClient`, manages database connections via `connect()`, and registers models via `model(name, schema)`
- Implement a **migration function** (`syncContainers`) as a separate concern from runtime — creates containers with partition keys, unique key policies, composite indexes, and TTL configuration
- Auto-generate **UUID v7** (without hyphens) as document `id` when not provided, giving time-sortable, lexicographically ordered identifiers
- Expose all **CosmosDB metadata** on documents: `_etag`, `_ts`, `_rid`, `_self`, `_attachments`
- Implement a **serialization layer** that transforms data between application types and database types (e.g., `Date` ↔ ISO strings, stripping/including CosmosDB system fields)

## Capabilities

### New Capabilities
- `schema`: Schema class with custom type system, field metadata (default, optional, trim, lowercase, uppercase), nested container config (partition key including hierarchical, unique keys, composite indexes, TTL), and timestamps option — compiled to Zod schemas internally
- `model`: Model class providing typed CRUD operations (create, getById, updateById, patchById with $set/$add/$incr/$unset, deleteById), batch operations (createBatch, upsertBatch, deleteMany), and query entry points
- `query-builder`: QueryBuilder translating Mongoose-style query objects to CosmosDB SQL with support for logical operators, comparison operators, sorting, pagination (offset/limit and token-based), and cursor iteration
- `connection`: Cosmoose connection manager wrapping CosmosClient with connect/disconnect lifecycle, model registration, and event emission
- `migration`: Separate container provisioning function (syncContainers) for creating/configuring CosmosDB containers with partition keys (including hierarchical), unique keys, composite indexes, TTL, and indexing policies — with drift detection that warns on immutable property differences and auto-applies mutable changes
- `id-generation`: UUID v7 (no hyphens) auto-generation for document IDs when not provided on create
- `serialization`: Serialization layer for transforming between application types and database types, with CosmosDB metadata exposure (_etag, _ts, _rid, _self, _attachments)

### Modified Capabilities

_(none — this is the initial implementation of the core package)_

## Impact

- **Package**: `packages/cosmoose` (`@cosmoose/core`) — currently an empty scaffold, will contain the full ODM implementation
- **Dependencies**: Adds `@azure/cosmos`, `zod`, and `uuid` as runtime dependencies
- **Downstream**: `@cosmoose/nestjs` will depend on these primitives (Schema, Model, Cosmoose) for its NestJS integration, but that package is out of scope for this change
- **API surface**: All exports from `packages/cosmoose/src/index.ts` — Schema, Model, Cosmoose, QueryBuilder, Type enum, and supporting types
