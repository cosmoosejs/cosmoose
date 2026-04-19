## ADDED Requirements

### Requirement: Cosmoose class manages CosmosDB connection
The Cosmoose class SHALL wrap `CosmosClient` and manage the database connection lifecycle.

#### Scenario: Construct with connection options
- **WHEN** `new Cosmoose({ endpoint, key, databaseName })` is called
- **THEN** a CosmosClient SHALL be created with the provided credentials but no connection established yet

#### Scenario: Connect to database
- **WHEN** `cosmoose.connect()` is called
- **THEN** the database reference SHALL be obtained from CosmosDB and connection events emitted

#### Scenario: Connect is idempotent
- **WHEN** `cosmoose.connect()` is called multiple times
- **THEN** only the first call SHALL establish the connection; subsequent calls SHALL be no-ops

### Requirement: Cosmoose emits connection lifecycle events
The Cosmoose class SHALL emit events during connection lifecycle.

#### Scenario: Initiate event
- **WHEN** `cosmoose.connect()` begins
- **THEN** an `initiate` event SHALL be emitted

#### Scenario: Initiated event
- **WHEN** `cosmoose.connect()` completes successfully
- **THEN** an `initiated` event SHALL be emitted with the database name

### Requirement: Cosmoose registers models
The Cosmoose class SHALL register schema-model pairs by container name.

#### Scenario: Register a model
- **WHEN** `cosmoose.model(name, schema)` is called after `connect()`
- **THEN** a Model instance SHALL be created bound to the named container and returned

#### Scenario: Register model before connect
- **WHEN** `cosmoose.model(name, schema)` is called before `connect()`
- **THEN** an error SHALL be thrown indicating the database is not connected

#### Scenario: Duplicate model name
- **WHEN** `cosmoose.model(name, schema)` is called with a name that is already registered
- **THEN** an error SHALL be thrown indicating the duplicate model name

### Requirement: Model registration does not create containers
The `model()` method SHALL only bind a schema to a container reference without creating or verifying the container.

#### Scenario: Model binds to container reference
- **WHEN** `cosmoose.model('users', userSchema)` is called
- **THEN** the Model SHALL reference the `users` container but SHALL NOT call `createIfNotExists` or any container management API
