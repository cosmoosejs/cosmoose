## MODIFIED Requirements

### Requirement: Coordinated multi-package publishing
The system SHALL publish `cosmoose`, `@cosmoose/cosmoose`, `@cosmoose/core` (deprecated), and `@cosmoose/nestjs` in a single release operation with the same version number (lockstep versioning). `cosmoose` SHALL be published first, followed by the alias and deprecated wrapper, then `@cosmoose/nestjs`.

#### Scenario: All packages published with same version
- **WHEN** a release is triggered
- **THEN** all packages SHALL be published with identical version numbers

#### Scenario: Publish order respects dependencies
- **WHEN** a release publishes all packages
- **THEN** `cosmoose` SHALL be published before `@cosmoose/cosmoose`, `@cosmoose/core`, and `@cosmoose/nestjs`

#### Scenario: Default install gets stable version
- **WHEN** a user runs `npm install cosmoose` without specifying a tag
- **THEN** the `latest` dist-tagged version SHALL be installed

### Requirement: Nx release project list
The Nx release configuration SHALL include all four publishable packages.

#### Scenario: Release projects configured
- **WHEN** `nx.json` release configuration is inspected
- **THEN** the `projects` array SHALL include `cosmoose`, `cosmoose-alias`, `cosmoose-deprecated`, and `cosmoose-nestjs`
