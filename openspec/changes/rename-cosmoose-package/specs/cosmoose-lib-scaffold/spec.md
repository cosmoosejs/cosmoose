## MODIFIED Requirements

### Requirement: Cosmoose core npm package configuration
The core library SHALL be configured as a publishable npm package named `cosmoose`.

#### Scenario: Package metadata
- **WHEN** `packages/cosmoose/package.json` is inspected
- **THEN** the `name` field SHALL be `cosmoose`

#### Scenario: Package main and types fields
- **WHEN** the package is built
- **THEN** `package.json` SHALL define `main`, `module`, and `types` fields pointing to the build output
