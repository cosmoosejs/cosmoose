### Requirement: Semantic version bumping from conventional commits
The system SHALL derive the next semantic version from conventional commit messages using Nx release. Commits with `fix:` prefix SHALL produce a patch bump, `feat:` SHALL produce a minor bump, and commits containing `BREAKING CHANGE:` or `!` suffix SHALL produce a major bump.

#### Scenario: Patch version bump
- **WHEN** all commits since the last release use `fix:` prefixes
- **THEN** the patch version component is incremented (e.g., `0.1.0` → `0.1.1`)

#### Scenario: Minor version bump
- **WHEN** any commit since the last release uses a `feat:` prefix
- **THEN** the minor version component is incremented and patch is reset (e.g., `0.1.1` → `0.2.0`)

#### Scenario: Major version bump
- **WHEN** any commit since the last release contains `BREAKING CHANGE:` in its footer or uses `!` suffix
- **THEN** the major version component is incremented and minor/patch are reset (e.g., `0.2.0` → `1.0.0`)

### Requirement: Pre-release version tagging
The system SHALL support pre-release version identifiers for `alpha`, `beta`, `next`, and `rc` channels. Pre-release versions SHALL follow the format `{version}-{channel}.{n}` where `{n}` is an auto-incrementing counter.

#### Scenario: Alpha pre-release version
- **WHEN** a release is triggered with the `alpha` channel
- **THEN** the version SHALL be formatted as `{next-version}-alpha.{n}` (e.g., `0.2.0-alpha.0`)

#### Scenario: Beta pre-release version
- **WHEN** a release is triggered with the `beta` channel
- **THEN** the version SHALL be formatted as `{next-version}-beta.{n}` (e.g., `0.2.0-beta.0`)

#### Scenario: Next pre-release version
- **WHEN** a release is triggered with the `next` channel
- **THEN** the version SHALL be formatted as `{next-version}-next.{n}` (e.g., `0.2.0-next.0`)

#### Scenario: Release candidate version
- **WHEN** a release is triggered with the `rc` channel
- **THEN** the version SHALL be formatted as `{next-version}-rc.{n}` (e.g., `0.2.0-rc.0`)

#### Scenario: Incremental pre-release counter
- **WHEN** a pre-release version already exists for the same base version and channel
- **THEN** the counter SHALL be incremented (e.g., `0.2.0-alpha.0` → `0.2.0-alpha.1`)

### Requirement: npm dist-tag assignment
The system SHALL assign the correct npm dist-tag matching the release channel. Stable releases SHALL use the `latest` dist-tag. Pre-release channels SHALL use their channel name as the dist-tag.

#### Scenario: Stable release dist-tag
- **WHEN** a release is triggered with the `latest` channel
- **THEN** the packages SHALL be published with the `latest` npm dist-tag

#### Scenario: Pre-release dist-tag
- **WHEN** a release is triggered with a pre-release channel (alpha, beta, next, rc)
- **THEN** the packages SHALL be published with the channel name as the npm dist-tag

#### Scenario: Default install gets stable version
- **WHEN** a user runs `npm install @cosmoose/core` without specifying a tag
- **THEN** the `latest` dist-tagged version SHALL be installed

### Requirement: Coordinated multi-package publishing
The system SHALL publish both `@cosmoose/core` and `@cosmoose/nestjs` in a single release operation with the same version number (lockstep versioning). `@cosmoose/core` SHALL be published before `@cosmoose/nestjs`.

#### Scenario: Both packages published with same version
- **WHEN** a release is triggered
- **THEN** both `@cosmoose/core` and `@cosmoose/nestjs` SHALL be published with identical version numbers

#### Scenario: Publish order respects dependencies
- **WHEN** a release publishes both packages
- **THEN** `@cosmoose/core` SHALL be published before `@cosmoose/nestjs`

### Requirement: Quality gates before publishing
The system SHALL run lint, test, and build checks before publishing. Publishing SHALL NOT proceed if any gate fails.

#### Scenario: All gates pass
- **WHEN** lint, test, and build all succeed
- **THEN** the workflow SHALL proceed to the publish step

#### Scenario: Test failure blocks publish
- **WHEN** tests fail during the release workflow
- **THEN** the workflow SHALL abort and no packages SHALL be published

#### Scenario: Build failure blocks publish
- **WHEN** the build fails during the release workflow
- **THEN** the workflow SHALL abort and no packages SHALL be published

### Requirement: Manual workflow dispatch with channel selection
The system SHALL provide a GitHub Actions workflow that is triggered manually via `workflow_dispatch`. The workflow SHALL require a `channel` input with options: `latest`, `alpha`, `beta`, `next`, `rc`.

#### Scenario: Manual trigger with channel
- **WHEN** a maintainer triggers the workflow from the GitHub Actions UI
- **THEN** they SHALL be prompted to select a release channel from the available options

#### Scenario: Stable release restricted to main branch
- **WHEN** a maintainer triggers a `latest` channel release from a branch other than `main`
- **THEN** the workflow SHALL fail with an error indicating stable releases require the `main` branch

### Requirement: npm provenance
The system SHALL publish packages with npm provenance enabled, linking each published version to its GitHub Actions build.

#### Scenario: Provenance attestation included
- **WHEN** packages are published via the CI pipeline
- **THEN** the published packages SHALL include provenance attestation linking to the GitHub Actions workflow run

### Requirement: Changelog generation
The system SHALL generate a changelog from conventional commits as part of the release process.

#### Scenario: Changelog generated on release
- **WHEN** a release is triggered
- **THEN** a changelog SHALL be generated from conventional commits since the last release
