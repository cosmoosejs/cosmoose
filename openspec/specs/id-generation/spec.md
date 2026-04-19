## ADDED Requirements

### Requirement: Auto-generate UUID v7 without hyphens
The ID generator SHALL produce UUID v7 identifiers with hyphens removed when a document is created without an explicit `id`.

#### Scenario: Generate ID format
- **WHEN** an ID is auto-generated
- **THEN** it SHALL be a 32-character lowercase hexadecimal string (UUID v7 with hyphens stripped)

#### Scenario: Time-sortable ordering
- **WHEN** two IDs are generated at different times (T1 < T2)
- **THEN** the ID generated at T1 SHALL be lexicographically less than the ID generated at T2

#### Scenario: Extractable timestamp
- **WHEN** a UUID v7 ID is generated
- **THEN** the creation timestamp SHALL be extractable from the first 12 hex characters as a 48-bit millisecond Unix timestamp

#### Scenario: Explicit ID takes precedence
- **WHEN** a document is created with `{ id: 'my-custom-id' }`
- **THEN** the provided ID SHALL be used and no UUID v7 SHALL be generated

### Requirement: ID generation uses cryptographically secure randomness
The random portion of the UUID v7 SHALL use cryptographically secure random number generation.

#### Scenario: Secure random bytes
- **WHEN** a UUID v7 is generated
- **THEN** the random portion SHALL be sourced from `crypto.getRandomValues` or equivalent, not `Math.random()`
