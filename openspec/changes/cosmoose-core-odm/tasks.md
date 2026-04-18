## 1. Setup & Dependencies

- [ ] 1.1 Add runtime dependencies (`@azure/cosmos`, `zod`, `uuid`) and dev type dependencies (`@types/uuid`) to `packages/cosmoose/package.json`
- [ ] 1.2 Create `src/` directory structure: `schema/`, `model/`, `query/`, `connection/`, `migration/`, `serialization/`, `id/`, `types/`, `exceptions/`

## 2. Type System & Exceptions

- [ ] 2.1 Implement `Type` enum (`STRING`, `NUMBER`, `BOOLEAN`, `OBJECT`, `DATE`, `ARRAY`, `MAP`, `EMAIL`, `ANY`)
- [ ] 2.2 Implement `SchemaDefinition<T>` types — field descriptors for each `Type` with metadata (`optional`, `default`, `trim`, `lowercase`, `uppercase`)
- [ ] 2.3 Implement `ContainerConfig` type — partition key (simple and hierarchical), unique keys, composite indexes, TTL
- [ ] 2.4 Implement `Document<T>` type including CosmosDB metadata (`id`, `_etag`, `_ts`, `_rid`, `_self`, `_attachments`)
- [ ] 2.4 Implement `PatchExpression<T>` type with `$set`, `$add`, `$incr`, `$unset` operators
- [ ] 2.5 Implement exception classes (`SchemaValidationFailedException`, `InvalidUniqueKeyException`, `InvalidIndexKeyException`)

## 3. ID Generation

- [ ] 3.1 Implement UUID v7 generator (no hyphens, 32 hex chars) using `uuid` package
- [ ] 3.2 Write tests: format validation, time-sortable ordering, explicit ID precedence

## 4. Schema

- [ ] 4.1 Implement `Schema<T>` class constructor that stores definition, options with nested `container` config
- [ ] 4.2 Implement Zod schema compilation from `SchemaDefinition` — handle all primitive types (`STRING`, `NUMBER`, `BOOLEAN`, `DATE`, `EMAIL`, `ANY`) with transforms (trim, lowercase, uppercase)
- [ ] 4.3 Implement Zod schema compilation for complex types (`OBJECT` with nested Schema, `ARRAY` with typed items, `MAP` with value type)
- [ ] 4.4 Implement create schema variant (required fields enforced, defaults applied, optional `id`)
- [ ] 4.5 Implement patch schema variant (all fields partial)
- [ ] 4.6 Implement deserialize schema variant (ISO strings → Date, CosmosDB metadata fields included)
- [ ] 4.7 Implement `timestamps: true` option — auto-add `createdAt`/`updatedAt` to compiled schemas
- [ ] 4.8 Implement `getContainerConfig()` accessor returning partition key, unique keys, composite indexes, TTL
- [ ] 4.9 Implement accessors: `getDefinition()`, `getContainerConfig()`
- [ ] 4.10 Write tests for all type compilations, schema variants, timestamps, container config

## 5. Query Builder

- [ ] 5.1 Implement `QueryBuilder<T, Q>` class with query type generics (`find`, `findAll`, `findOne`, `count`, `findAsCursor`, `findAsTokenPagination`)
- [ ] 5.2 Implement SQL generation for simple equality filters and nested field access
- [ ] 5.3 Implement SQL generation for comparison operators (`$gt`, `$gte`, `$lt`, `$lte`, `$in`)
- [ ] 5.4 Implement SQL generation for logical operators (`$or`, `$and`)
- [ ] 5.5 Implement `.sort()`, `.limit()`, `.offset()` chaining methods
- [ ] 5.6 Implement `count` query (SELECT VALUE COUNT)
- [ ] 5.7 Implement `findAsCursor` with batch iteration and continuation tokens
- [ ] 5.8 Implement `findAsTokenPagination` with base64url-encoded continuation tokens
- [ ] 5.9 Implement `PromiseLike` interface (`.then()`) on QueryBuilder so queries are directly awaitable without `.exec()`
- [ ] 5.10 Write tests for SQL generation, parameterization, all query types, pagination, cursor

## 6. Model

- [ ] 6.1 Implement `Model<T>` class constructor binding Schema and Container
- [ ] 6.2 Implement `create()` — validate with create schema, auto-generate UUID v7 if no id, handle timestamps
- [ ] 6.3 Implement `getById()` — point read with optional partition key, deserialize result
- [ ] 6.4 Implement `updateById()` — full document replace with validation, handle timestamps, 404 handling
- [ ] 6.5 Implement `patchById()` — translate `$set`/`$add`/`$incr`/`$unset` to CosmosDB patch operations, null-vs-$unset distinction, batch operations >10, handle timestamps
- [ ] 6.6 Implement `deleteById()` — physical delete with partition key support, 404 handling
- [ ] 6.7 Implement `createBatch()` — bulk create with validation, retry on 429 with exponential backoff
- [ ] 6.8 Implement `upsertBatch()` — bulk upsert with validation
- [ ] 6.9 Implement `deleteMany()` — cursor-based bulk delete in batches of 100
- [ ] 6.10 Implement query entry points: `find()`, `findOne()`, `findAll()`, `count()`, `findAsCursor()`, `findAsTokenPagination()`, `findByIds()`, `rawQuery()`
- [ ] 6.11 Write tests for all CRUD operations, patch operators, batch operations, query entry points

## 7. Connection Manager

- [ ] 7.1 Implement `Cosmoose` class extending `EventEmitter` with `connect()`, idempotent connection, lifecycle events
- [ ] 7.2 Implement `model(name, schema)` — bind schema to container reference without provisioning, guard against pre-connect and duplicate names
- [ ] 7.3 Write tests for connection lifecycle, model registration, error cases

## 8. Migration

- [ ] 8.1 Implement `syncContainers()` — iterate registered models, create new containers with partition key, unique key policy, composite indexes, TTL, indexing policy via `createIfNotExists`
- [ ] 8.2 Implement drift detection — read existing container config and compare against schema's `container` config
- [ ] 8.3 Implement immutable drift warnings — partition key and unique key policy differences emit warnings with expected/actual values and reason why it cannot be changed
- [ ] 8.4 Implement mutable drift auto-apply — update TTL and composite indexes when they differ from schema
- [ ] 8.5 Implement `SyncReport` return type — per-container status (`created`, `updated`, `drift`, `unchanged`) with drift details
- [ ] 8.6 Implement `syncContainer(name)` — provision/sync a single named container, error on unregistered name
- [ ] 8.7 Write tests for container provisioning, drift detection (immutable + mutable), sync report

## 9. Public API & Exports

- [ ] 9.1 Export all public API from `packages/cosmoose/src/index.ts`: `Cosmoose`, `Schema`, `Model`, `QueryBuilder`, `Type`, `Document`, `PatchExpression`, and supporting types
- [ ] 9.2 Verify build (`nx build cosmoose`) produces correct output with declaration files
- [ ] 9.3 Verify all tests pass (`nx test cosmoose`)
- [ ] 9.4 Verify lint passes (`nx lint cosmoose`)
