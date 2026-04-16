## ADDED Requirements

### Requirement: syncContainers provisions all registered models
The `syncContainers()` function SHALL create CosmosDB containers for all registered models with their schema-defined configuration.

#### Scenario: Create container with partition key
- **WHEN** `cosmoose.syncContainers()` is called and a model has a schema with `partitionKey: '/networkId'`
- **THEN** the container SHALL be created with the specified partition key using `createIfNotExists`

#### Scenario: Create container with unique key policy
- **WHEN** a schema has unique keys defined (via field `unique: true` or `addCompositeUniqueKey`)
- **THEN** the container SHALL be created with a `uniqueKeyPolicy` containing the unique key paths

#### Scenario: Create container with TTL
- **WHEN** a schema has `ttl: 3600` in its options
- **THEN** the container SHALL be created with `defaultTtl: 3600`

#### Scenario: Create container with composite indexes
- **WHEN** a schema has composite indexes defined via `addCompositeIndex`
- **THEN** the container SHALL be created with the corresponding `indexingPolicy.compositeIndexes`

#### Scenario: Container already exists
- **WHEN** `syncContainers()` is called and the container already exists
- **THEN** the existing container SHALL NOT be modified (using `createIfNotExists` semantics)

### Requirement: syncContainer provisions a single model
The `syncContainer(name)` function SHALL create the CosmosDB container for a specific registered model.

#### Scenario: Sync specific container
- **WHEN** `cosmoose.syncContainer('users')` is called
- **THEN** only the `users` container SHALL be provisioned

#### Scenario: Sync unregistered container name
- **WHEN** `cosmoose.syncContainer('unknown')` is called with an unregistered model name
- **THEN** an error SHALL be thrown indicating the model is not registered

### Requirement: Migration is separate from runtime model registration
Container provisioning SHALL NOT occur during `cosmoose.model()` calls.

#### Scenario: Model registration without provisioning
- **WHEN** `cosmoose.model('users', schema)` is called
- **THEN** no CosmosDB container API calls SHALL be made

#### Scenario: Migration before app start
- **WHEN** a developer runs a migration script calling `cosmoose.syncContainers()`
- **THEN** all containers SHALL be provisioned before the application starts normal operation
