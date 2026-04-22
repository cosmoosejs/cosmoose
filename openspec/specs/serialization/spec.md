## ADDED Requirements

### Requirement: Serialize data for create operations
The serialization layer SHALL transform application-level data to database format on create.

#### Scenario: Date to ISO string
- **WHEN** a field of type `DATE` contains a `Date` object on create
- **THEN** it SHALL be serialized to an ISO 8601 string for storage in CosmosDB

#### Scenario: Apply timestamps on create
- **WHEN** the schema has `timestamps: true` and a document is created
- **THEN** `createdAt` and `updatedAt` SHALL be set as ISO 8601 strings in the stored document

#### Scenario: Apply field transforms on create
- **WHEN** a field has `trim: true` or `lowercase: true`
- **THEN** the Zod schema transforms SHALL be applied before the data is stored

### Requirement: Deserialize data from database reads
The serialization layer SHALL transform database-level data to application format on read.

#### Scenario: ISO string to Date
- **WHEN** a document is read from CosmosDB and contains ISO 8601 date strings for `DATE` fields
- **THEN** they SHALL be deserialized to `Date` objects in the returned document

#### Scenario: Timestamps deserialized as Date
- **WHEN** the schema has `timestamps: true` and a document is read
- **THEN** `createdAt` and `updatedAt` SHALL be returned as `Date` objects

#### Scenario: CosmosDB metadata included
- **WHEN** a document is read from CosmosDB
- **THEN** `_etag`, `_ts`, `_rid`, `_self`, and `_attachments` SHALL be included in the returned `Document<T>`

### Requirement: Serialize data for patch operations
The serialization layer SHALL transform application-level data to database format for partial updates.

#### Scenario: Flatten nested objects to patch paths
- **WHEN** a patch contains `{ $set: { settings: { theme: 'dark' } } }`
- **THEN** the serialization SHALL flatten to patch operation `{ op: 'set', path: '/settings/theme', value: 'dark' }`

#### Scenario: Auto-set updatedAt on patch
- **WHEN** the schema has `timestamps: true` and a patch operation is performed
- **THEN** `updatedAt` SHALL be automatically included as an additional patch operation with the current Date as ISO string

### Requirement: Document type exposes all CosmosDB system fields
The `Document<T>` type SHALL include CosmosDB metadata alongside user-defined fields.

#### Scenario: Document type shape
- **WHEN** a `Document<T>` is returned from any operation
- **THEN** the TypeScript type SHALL include `id: string`, `_etag: string`, `_ts: number`, `_rid: string`, `_self: string`, and `_attachments: string` in addition to all fields from `T`
