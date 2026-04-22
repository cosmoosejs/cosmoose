## ADDED Requirements

### Requirement: QueryBuilder translates query objects to CosmosDB SQL
The QueryBuilder SHALL accept Mongoose-style query objects and produce parameterized CosmosDB SQL queries.

#### Scenario: Simple equality filter
- **WHEN** a query `{ status: 'active' }` is provided
- **THEN** the generated SQL SHALL be `SELECT * FROM root r WHERE r.status = @status` with parameter `@status = 'active'`

#### Scenario: Multiple equality filters
- **WHEN** a query `{ status: 'active', networkId: 'net1' }` is provided
- **THEN** the generated SQL SHALL join conditions with `AND`

#### Scenario: Nested field access
- **WHEN** a query `{ 'settings.theme': 'dark' }` is provided
- **THEN** the generated SQL SHALL use dot notation: `r.settings.theme = @settings_theme`

### Requirement: QueryBuilder supports comparison operators
The QueryBuilder SHALL support `$gt`, `$gte`, `$lt`, `$lte`, and `$in` operators.

#### Scenario: Greater than operator
- **WHEN** a query `{ age: { $gt: 18 } }` is provided
- **THEN** the generated SQL SHALL use `r.age > @age_0`

#### Scenario: Greater than or equal operator
- **WHEN** a query `{ age: { $gte: 18 } }` is provided
- **THEN** the generated SQL SHALL use `r.age >= @age_0`

#### Scenario: Less than operator
- **WHEN** a query `{ age: { $lt: 65 } }` is provided
- **THEN** the generated SQL SHALL use `r.age < @age_0`

#### Scenario: Less than or equal operator
- **WHEN** a query `{ age: { $lte: 65 } }` is provided
- **THEN** the generated SQL SHALL use `r.age <= @age_0`

#### Scenario: In operator
- **WHEN** a query `{ status: { $in: ['active', 'pending'] } }` is provided
- **THEN** the generated SQL SHALL use `r.status IN (@status_0_0, @status_0_1)`

#### Scenario: Combined comparison operators
- **WHEN** a query `{ age: { $gte: 18, $lt: 65 } }` is provided
- **THEN** the generated SQL SHALL combine both conditions with `AND`

### Requirement: QueryBuilder supports logical operators
The QueryBuilder SHALL support `$or` and `$and` logical operators.

#### Scenario: Or operator
- **WHEN** a query `{ $or: [{ status: 'active' }, { status: 'pending' }] }` is provided
- **THEN** the generated SQL SHALL wrap conditions in `((r.status = @status_00) OR (r.status = @status_01))`

#### Scenario: Or with multiple fields per clause
- **WHEN** a query `{ $or: [{ a: 1, b: 2 }, { c: 3 }] }` is provided
- **THEN** each clause's fields SHALL be joined with `AND`, and clauses joined with `OR`

### Requirement: QueryBuilder supports sorting
The QueryBuilder SHALL support sorting by one or more fields.

#### Scenario: Sort ascending
- **WHEN** `.sort({ createdAt: 1 })` is chained on a query
- **THEN** the generated SQL SHALL append `ORDER BY r['createdAt'] ASC`

#### Scenario: Sort descending
- **WHEN** `.sort({ createdAt: -1 })` is chained on a query
- **THEN** the generated SQL SHALL append `ORDER BY r['createdAt'] DESC`

#### Scenario: Multiple sort fields
- **WHEN** `.sort({ status: 1, createdAt: -1 })` is chained on a query
- **THEN** the generated SQL SHALL append `ORDER BY r['status'] ASC, r['createdAt'] DESC`

### Requirement: QueryBuilder supports offset/limit pagination
The QueryBuilder SHALL support offset and limit for paginated results.

#### Scenario: Default pagination
- **WHEN** `model.find(query).exec()` is called without explicit pagination
- **THEN** the generated SQL SHALL use `OFFSET 0 LIMIT 50` as defaults

#### Scenario: Custom pagination
- **WHEN** `.limit(20).offset(40)` is chained on a query
- **THEN** the generated SQL SHALL use `OFFSET 40 LIMIT 20`

### Requirement: QueryBuilder supports continuation token pagination
The QueryBuilder SHALL support CosmosDB continuation token pagination via `findAsTokenPagination`.

#### Scenario: First page
- **WHEN** `await model.findAsTokenPagination(query, { limit: 20 })` is called without a pagination token
- **THEN** the first page of results SHALL be returned with a `pagination.next` token if more results exist

#### Scenario: Subsequent page
- **WHEN** `await model.findAsTokenPagination(query, { limit: 20, paginationToken: token })` is called
- **THEN** the next page of results SHALL be returned starting from the token position

#### Scenario: Last page
- **WHEN** there are no more results after the current page
- **THEN** `pagination.next` SHALL be `undefined`

### Requirement: QueryBuilder supports cursor-based iteration
The QueryBuilder SHALL support iterating over large result sets in batches via `findAsCursor`.

#### Scenario: Cursor iteration
- **WHEN** `await model.findAsCursor(query, { batchSize: 100 })` is called
- **THEN** the result SHALL expose an `each(fn)` method that iterates over all matching documents in batches

#### Scenario: Cursor processes all documents
- **WHEN** `cursor.each(async (doc, index) => { ... })` is called
- **THEN** the callback SHALL be invoked for every matching document with the document and its sequential index

### Requirement: QueryBuilder is thenable (PromiseLike)
The QueryBuilder SHALL implement `PromiseLike` so it can be directly awaited without an explicit `.exec()` call.

#### Scenario: Direct await on find
- **WHEN** `await model.find(query)` is called
- **THEN** the result SHALL be `Document<T>[]`

#### Scenario: Direct await on findOne
- **WHEN** `await model.findOne(query)` is called
- **THEN** the result SHALL be `Document<T> | undefined`

#### Scenario: Direct await on count
- **WHEN** `await model.count(query)` is called
- **THEN** the result SHALL be `number`

#### Scenario: Direct await on findAll
- **WHEN** `await model.findAll(query)` is called
- **THEN** the result SHALL be `Document<T>[]` with no limit applied

#### Scenario: Chaining then await
- **WHEN** `await model.find(query).sort({ createdAt: -1 }).limit(10)` is called
- **THEN** the query SHALL execute with the chained options and return results directly

### Requirement: QueryBuilder uses parameterized queries
All generated SQL SHALL use parameterized queries to prevent SQL injection.

#### Scenario: Parameters are never interpolated
- **WHEN** any query is built
- **THEN** user-provided values SHALL appear only as named parameters (e.g., `@param`), never interpolated into the SQL string
