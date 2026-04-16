## ADDED Requirements

### Requirement: Schema class accepts a typed definition and options
The Schema class SHALL accept a generic type parameter and a definition object mapping field names to type descriptors, plus optional schema-level configuration.

#### Scenario: Construct a schema with field definitions
- **WHEN** a Schema is created with `new Schema<T>(definition, options)`
- **THEN** the schema SHALL store the definition and options for use by Model and migration

#### Scenario: Schema with partition key option
- **WHEN** a Schema is created with `{ partitionKey: '/networkId' }` in options
- **THEN** `schema.getPartitionKey()` SHALL return the partition key definition

#### Scenario: Schema with TTL option
- **WHEN** a Schema is created with `{ ttl: 3600 }` in options
- **THEN** `schema.getTtl()` SHALL return `3600`

#### Scenario: Schema with timestamps option
- **WHEN** a Schema is created with `{ timestamps: true }` in options
- **THEN** the schema SHALL include `createdAt` and `updatedAt` fields of type Date in its compiled validation schemas

### Requirement: Custom type system supports primitive types
The type system SHALL support `STRING`, `NUMBER`, `BOOLEAN`, `DATE`, `EMAIL`, and `ANY` as primitive field types.

#### Scenario: String type with transforms
- **WHEN** a field is defined as `{ type: Type.STRING, trim: true, lowercase: true }`
- **THEN** the compiled Zod schema SHALL apply `.trim()` and `.toLowerCase()` transforms during validation

#### Scenario: String type with uppercase
- **WHEN** a field is defined as `{ type: Type.STRING, uppercase: true }`
- **THEN** the compiled Zod schema SHALL apply `.toUpperCase()` transform during validation

#### Scenario: Number type with default
- **WHEN** a field is defined as `{ type: Type.NUMBER, default: 0 }`
- **THEN** the compiled create schema SHALL use `0` as the default value when the field is omitted

#### Scenario: Boolean type
- **WHEN** a field is defined as `{ type: Type.BOOLEAN }`
- **THEN** the compiled Zod schema SHALL accept only boolean values

#### Scenario: Date type serialization
- **WHEN** a field is defined as `{ type: Type.DATE }`
- **THEN** the create schema SHALL accept Date objects and the deserialize schema SHALL convert ISO strings from the database to Date objects

#### Scenario: Email type
- **WHEN** a field is defined as `{ type: Type.EMAIL }`
- **THEN** the compiled Zod schema SHALL validate email format and apply trim + toLowerCase transforms

#### Scenario: Any type
- **WHEN** a field is defined as `{ type: Type.ANY }`
- **THEN** the compiled Zod schema SHALL accept any value

### Requirement: Custom type system supports complex types
The type system SHALL support `OBJECT`, `ARRAY`, and `MAP` as complex field types.

#### Scenario: Object type with nested schema
- **WHEN** a field is defined as `{ type: Type.OBJECT, schema: new Schema<T>({...}) }`
- **THEN** the compiled Zod schema SHALL validate the nested object according to the nested schema definition

#### Scenario: Array type with typed items
- **WHEN** a field is defined as `{ type: Type.ARRAY, items: { type: Type.STRING } }`
- **THEN** the compiled Zod schema SHALL validate that each array element matches the item type

#### Scenario: Map type with value type
- **WHEN** a field is defined as `{ type: Type.MAP, of: Type.NUMBER }`
- **THEN** the compiled Zod schema SHALL validate a `Record<string, number>` structure

### Requirement: Field metadata controls validation behavior
Fields SHALL support `unique`, `optional`, and `default` metadata.

#### Scenario: Optional field on create
- **WHEN** a field is defined with `{ optional: true }`
- **THEN** the create validation schema SHALL allow the field to be omitted

#### Scenario: Required field on create
- **WHEN** a field is defined without `{ optional: true }` and without a `default` value
- **THEN** the create validation schema SHALL require the field to be present

#### Scenario: Default value on create
- **WHEN** a field is defined with `{ default: 'value' }` and the field is omitted on create
- **THEN** the create validation SHALL populate the field with the default value

#### Scenario: Unique field metadata
- **WHEN** a field is defined with `{ unique: true }`
- **THEN** `schema.getUniqueKeys()` SHALL include that field's path in the unique key collection

### Requirement: Schema compiles to Zod schemas internally
The Schema class SHALL generate Zod schemas from the type definition for use in validation.

#### Scenario: Create schema compilation
- **WHEN** the schema compiles a create variant
- **THEN** it SHALL produce a Zod schema with required fields enforced, defaults applied, and an optional `id` field

#### Scenario: Patch schema compilation
- **WHEN** the schema compiles a patch variant
- **THEN** it SHALL produce a Zod schema with all fields partial

#### Scenario: Deserialize schema compilation
- **WHEN** the schema compiles a deserialize variant
- **THEN** it SHALL produce a Zod schema that transforms ISO date strings to Date objects and includes CosmosDB metadata fields

### Requirement: Schema supports composite unique keys
Composite unique keys SHALL be configurable after schema construction.

#### Scenario: Add composite unique key
- **WHEN** `schema.addCompositeUniqueKey(['/field1', '/field2'])` is called
- **THEN** `schema.getUniqueKeys()` SHALL include `['/field1', '/field2']` in the collection

#### Scenario: Invalid unique key format
- **WHEN** `schema.addCompositeUniqueKey(['field1'])` is called without a leading `/`
- **THEN** the schema SHALL throw an error indicating invalid key format

### Requirement: Schema supports composite indexes
Composite indexes SHALL be configurable after schema construction.

#### Scenario: Add composite index
- **WHEN** `schema.addCompositeIndex({ '/createdAt': 1, '/status': -1 })` is called
- **THEN** `schema.getCompositeIndexes()` SHALL include the index with ascending/descending order

#### Scenario: Invalid index key format
- **WHEN** `schema.addCompositeIndex({ 'field': 1 })` is called without a leading `/`
- **THEN** the schema SHALL throw an error indicating invalid index key format
