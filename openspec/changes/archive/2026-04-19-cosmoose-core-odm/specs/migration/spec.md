## ADDED Requirements

### Requirement: syncContainers provisions all registered models
The `syncContainers()` function SHALL create CosmosDB containers for all registered models using the schema's `container` configuration.

#### Scenario: Create container with partition key
- **WHEN** `cosmoose.syncContainers()` is called and a schema has `container: { partitionKey: '/networkId' }`
- **THEN** the container SHALL be created with the specified partition key using `createIfNotExists`

#### Scenario: Create container with hierarchical partition key
- **WHEN** a schema has `container: { partitionKey: { paths: ['/tenantId', '/userId'], kind: 'MultiHash' } }`
- **THEN** the container SHALL be created with the hierarchical partition key definition

#### Scenario: Create container with unique key policy
- **WHEN** a schema has `container: { uniqueKeys: [['/email', '/networkId']] }`
- **THEN** the container SHALL be created with a `uniqueKeyPolicy` containing the unique key paths

#### Scenario: Create container with TTL
- **WHEN** a schema has `container: { ttl: 3600 }`
- **THEN** the container SHALL be created with `defaultTtl: 3600`

#### Scenario: Create container with composite indexes
- **WHEN** a schema has `container: { compositeIndexes: [{ '/createdAt': 1, '/status': -1 }] }`
- **THEN** the container SHALL be created with the corresponding `indexingPolicy.compositeIndexes`

### Requirement: syncContainers detects drift on existing containers
When a container already exists, `syncContainers()` SHALL read the container's current configuration and compare it against the schema's `container` config, reporting differences.

#### Scenario: Immutable drift on partition key
- **WHEN** `syncContainers()` is called and the existing container has partition key `/region` but the schema defines `/networkId`
- **THEN** a warning SHALL be emitted with the expected value, actual value, and the reason: partition key cannot be changed after container creation — the container must be recreated

#### Scenario: Immutable drift on unique key policy
- **WHEN** `syncContainers()` is called and the existing container has unique keys `[['/email']]` but the schema defines `[['/email', '/networkId']]`
- **THEN** a warning SHALL be emitted with the expected value, actual value, and the reason: unique key policy cannot be changed after container creation — the container must be recreated

#### Scenario: Mutable drift on TTL
- **WHEN** `syncContainers()` is called and the existing container has `defaultTtl: 1800` but the schema defines `ttl: 3600`
- **THEN** the container's TTL SHALL be updated to match the schema definition

#### Scenario: Mutable drift on composite indexes
- **WHEN** `syncContainers()` is called and the existing container's indexing policy differs from the schema's composite indexes
- **THEN** the container's indexing policy SHALL be updated to match the schema definition

#### Scenario: No drift
- **WHEN** `syncContainers()` is called and the existing container matches the schema definition
- **THEN** no warnings SHALL be emitted and no updates SHALL be made

### Requirement: syncContainers returns a sync report
The `syncContainers()` function SHALL return a report describing what happened for each container.

#### Scenario: Report for new container
- **WHEN** a container is created
- **THEN** the report SHALL include the container name and status `created`

#### Scenario: Report for container with immutable drift
- **WHEN** a container has immutable drift
- **THEN** the report SHALL include the container name, status `drift`, and an array of drift details each with `property`, `expected`, `actual`, `mutable: false`, and `reason`

#### Scenario: Report for container with mutable drift applied
- **WHEN** a container's mutable properties are updated
- **THEN** the report SHALL include the container name, status `updated`, and the properties that were changed

#### Scenario: Report for container with no changes
- **WHEN** a container matches the schema perfectly
- **THEN** the report SHALL include the container name and status `unchanged`

### Requirement: syncContainer provisions a single model
The `syncContainer(name)` function SHALL create or sync the CosmosDB container for a specific registered model, with the same drift detection behavior.

#### Scenario: Sync specific container
- **WHEN** `cosmoose.syncContainer('users')` is called
- **THEN** only the `users` container SHALL be provisioned or checked for drift

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
