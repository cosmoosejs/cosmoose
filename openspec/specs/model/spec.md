## ADDED Requirements

### Requirement: Model provides create operation
The Model SHALL create documents in the CosmosDB container with schema validation and auto-generated IDs.

#### Scenario: Create with all required fields
- **WHEN** `model.create({ name: 'John', email: 'john@example.com' })` is called
- **THEN** the document SHALL be validated against the create schema, stored in the container, and returned as `Document<T>`

#### Scenario: Create without id
- **WHEN** `model.create(data)` is called without an `id` field
- **THEN** a UUID v7 (no hyphens) SHALL be generated and assigned as the document `id`

#### Scenario: Create with explicit id
- **WHEN** `model.create({ id: 'custom-id', ...data })` is called
- **THEN** the provided `id` SHALL be used instead of auto-generation

#### Scenario: Create with timestamps enabled
- **WHEN** the schema has `timestamps: true` and `model.create(data)` is called
- **THEN** `createdAt` and `updatedAt` SHALL be set to the current Date

#### Scenario: Create validation failure
- **WHEN** `model.create(data)` is called with data that fails schema validation
- **THEN** a validation error SHALL be thrown with details about which fields failed

### Requirement: Model provides getById operation
The Model SHALL retrieve a single document by its `id`.

#### Scenario: Get existing document
- **WHEN** `model.getById(id)` is called with an existing document ID
- **THEN** the document SHALL be returned as `Document<T>` with CosmosDB metadata

#### Scenario: Get non-existing document
- **WHEN** `model.getById(id)` is called with a non-existing ID
- **THEN** `undefined` SHALL be returned

#### Scenario: Get with partition key
- **WHEN** `model.getById(id, { partitionKeyValue })` is called
- **THEN** the read SHALL use the specified partition key for efficient point-read

### Requirement: Model provides updateById operation
The Model SHALL replace a document entirely by its `id`.

#### Scenario: Update existing document
- **WHEN** `model.updateById(id, data)` is called with valid data
- **THEN** the document SHALL be fully replaced and the updated document returned as `Document<T>`

#### Scenario: Update non-existing document
- **WHEN** `model.updateById(id, data)` is called with a non-existing ID
- **THEN** `undefined` SHALL be returned

#### Scenario: Update with timestamps enabled
- **WHEN** the schema has `timestamps: true` and `model.updateById(id, data)` is called
- **THEN** `updatedAt` SHALL be set to the current Date and `createdAt` SHALL remain unchanged

### Requirement: Model provides patchById operation with operators
The Model SHALL support partial updates using `$set`, `$add`, `$incr`, and `$unset` operators.

#### Scenario: Patch with $set operator
- **WHEN** `model.patchById(id, { $set: { name: 'Jane' } })` is called
- **THEN** the specified fields SHALL be set to the provided values using CosmosDB `set` patch operations

#### Scenario: Patch with implicit $set
- **WHEN** `model.patchById(id, { name: 'Jane' })` is called without an explicit operator
- **THEN** the fields SHALL be treated as `$set` operations

#### Scenario: Patch with $add operator
- **WHEN** `model.patchById(id, { $add: { tags: 'new-tag' } })` is called
- **THEN** the CosmosDB `add` patch operation SHALL be used

#### Scenario: Patch with $incr operator
- **WHEN** `model.patchById(id, { $incr: { viewCount: 1 } })` is called
- **THEN** the CosmosDB `incr` patch operation SHALL be used to atomically increment the field

#### Scenario: Patch with $unset operator
- **WHEN** `model.patchById(id, { $unset: { nickname: true } })` is called
- **THEN** the CosmosDB `remove` patch operation SHALL be used to remove the field from the document

#### Scenario: Patch null vs $unset distinction
- **WHEN** `model.patchById(id, { nickname: null })` is called
- **THEN** the field SHALL be set to `null` (NOT removed), using CosmosDB `set` patch operation with null value

#### Scenario: Patch with timestamps enabled
- **WHEN** the schema has `timestamps: true` and `model.patchById(id, data)` is called
- **THEN** `updatedAt` SHALL be automatically set to the current Date

#### Scenario: Patch non-existing document
- **WHEN** `model.patchById(id, data)` is called with a non-existing ID
- **THEN** `undefined` SHALL be returned

#### Scenario: Patch with more than 10 operations
- **WHEN** a patch results in more than 10 CosmosDB patch operations
- **THEN** the operations SHALL be batched into groups of 10 and executed sequentially

### Requirement: Model provides deleteById operation
The Model SHALL delete a document by its `id`.

#### Scenario: Delete existing document
- **WHEN** `model.deleteById(id)` is called with an existing document ID
- **THEN** the document SHALL be physically removed from the container and `true` SHALL be returned

#### Scenario: Delete non-existing document
- **WHEN** `model.deleteById(id)` is called with a non-existing ID
- **THEN** `undefined` SHALL be returned

#### Scenario: Delete with partition key
- **WHEN** `model.deleteById(id, { partitionKeyValue })` is called
- **THEN** the delete SHALL use the specified partition key

### Requirement: Model provides batch operations
The Model SHALL support batch create, upsert, and delete operations.

#### Scenario: Batch create
- **WHEN** `model.createBatch(items)` is called with an array of documents
- **THEN** all documents SHALL be validated and created via CosmosDB bulk operation, returning `{ succeed, failed }` result

#### Scenario: Batch create with retry on 429
- **WHEN** `model.createBatch(items, { retryOnError: true })` is called and some items receive a 429 status
- **THEN** the failed items SHALL be retried with exponential backoff

#### Scenario: Batch upsert
- **WHEN** `model.upsertBatch(items)` is called
- **THEN** all documents SHALL be upserted via CosmosDB bulk operation

#### Scenario: Delete many by query
- **WHEN** `model.deleteMany(queryField)` is called
- **THEN** all matching documents SHALL be deleted in batches of 100

### Requirement: Model provides query entry points
The Model SHALL provide methods that return QueryBuilder instances for different query types.

#### Scenario: find returns QueryBuilder
- **WHEN** `model.find(queryField)` is called
- **THEN** a QueryBuilder configured for paginated results SHALL be returned

#### Scenario: findOne returns QueryBuilder
- **WHEN** `model.findOne(queryField)` is called
- **THEN** a QueryBuilder configured to return a single document or undefined SHALL be returned

#### Scenario: findAll returns QueryBuilder
- **WHEN** `model.findAll(queryField)` is called
- **THEN** a QueryBuilder configured to return all matching documents (no limit) SHALL be returned

#### Scenario: count returns QueryBuilder
- **WHEN** `model.count(queryField)` is called
- **THEN** a QueryBuilder configured to return the count of matching documents SHALL be returned

#### Scenario: findAsCursor returns QueryBuilder
- **WHEN** `model.findAsCursor(queryField, { batchSize: 50 })` is called
- **THEN** a QueryBuilder configured for cursor-based batch iteration SHALL be returned

#### Scenario: findAsTokenPagination returns QueryBuilder
- **WHEN** `model.findAsTokenPagination(queryField, { limit: 20 })` is called
- **THEN** a QueryBuilder configured for continuation token pagination SHALL be returned

#### Scenario: findByIds
- **WHEN** `model.findByIds(['id1', 'id2', 'id3'])` is called
- **THEN** all documents with matching IDs SHALL be returned

#### Scenario: rawQuery
- **WHEN** `model.rawQuery({ query: 'SELECT * FROM c WHERE c.status = @s', parameters: [{ name: '@s', value: 'active' }] })` is called
- **THEN** the raw SQL query SHALL be executed against the container and results returned

### Requirement: Document type includes CosmosDB metadata
The `Document<T>` type SHALL include all CosmosDB system fields alongside user-defined fields.

#### Scenario: Document includes user fields and metadata
- **WHEN** a document is returned from any read operation
- **THEN** it SHALL contain the user-defined fields plus `id`, `_etag`, `_ts`, `_rid`, `_self`, and `_attachments`
