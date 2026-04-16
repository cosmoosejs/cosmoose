## ADDED Requirements

### Requirement: Husky is installed and initialized
The repository SHALL have Husky installed and configured to manage git hooks.

#### Scenario: Husky setup after install
- **WHEN** `pnpm install` is run in the repository
- **THEN** Husky SHALL be initialized and the `.husky/` directory SHALL exist at the repository root

### Requirement: Pre-push hook runs lint and test
A pre-push git hook SHALL run lint and test across all affected projects before allowing a push to remote.

#### Scenario: Push with passing code
- **WHEN** a developer runs `git push` and all affected projects pass lint and test
- **THEN** the push SHALL succeed

#### Scenario: Push with failing tests
- **WHEN** a developer runs `git push` and an affected project has failing tests
- **THEN** the push SHALL be rejected with test failure output

#### Scenario: Push with lint errors
- **WHEN** a developer runs `git push` and an affected project has lint errors
- **THEN** the push SHALL be rejected with lint error output

#### Scenario: Hook uses Nx affected
- **WHEN** the pre-push hook runs
- **THEN** it SHALL execute `nx affected --target=lint` and `nx affected --target=test` to only check projects impacted by the changes

### Requirement: Commitizen is configured with cz-conventional-changelog
The repository SHALL have Commitizen installed with the `cz-conventional-changelog` adapter for guided conventional commits.

#### Scenario: Commitizen config in package.json
- **WHEN** root `package.json` is inspected
- **THEN** a `config.commitizen` section SHALL exist with `path` set to `cz-conventional-changelog`

#### Scenario: Commit script available
- **WHEN** a developer runs `pnpm commit`
- **THEN** Commitizen SHALL launch the interactive conventional commit prompt

#### Scenario: Conventional commit format
- **WHEN** a developer completes the Commitizen prompt
- **THEN** the commit message SHALL follow the conventional commit format (`type(scope): subject`)
