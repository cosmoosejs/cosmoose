### Requirement: Docs deployment to Vercel on content changes
The system SHALL deploy the docs site to Vercel production when changes to `docs/` are pushed to the `main` branch.

#### Scenario: Docs content changed on main
- **WHEN** a push to `main` includes changes to files under `docs/`
- **THEN** the docs site SHALL be built and deployed to Vercel production

#### Scenario: No docs changes on main
- **WHEN** a push to `main` includes no changes to files under `docs/`
- **THEN** the docs deployment workflow SHALL NOT run

### Requirement: Manual docs deployment trigger
The system SHALL support manually triggering a docs deployment via `workflow_dispatch`.

#### Scenario: Manual trigger
- **WHEN** a maintainer triggers the docs workflow from the GitHub Actions UI
- **THEN** the docs site SHALL be built and deployed to Vercel production

### Requirement: Vercel CLI-based deployment
The system SHALL use the Vercel CLI to build and deploy the docs site, using the `--prebuilt` flag to separate build and deploy steps.

#### Scenario: Build and deploy steps
- **WHEN** the docs deployment workflow runs
- **THEN** the workflow SHALL execute `vercel pull`, `vercel build`, and `vercel deploy --prebuilt --prod` in sequence

### Requirement: Vercel deployment secrets
The system SHALL authenticate with Vercel using `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` secrets stored in GitHub Actions.

#### Scenario: Secrets used for authentication
- **WHEN** the docs deployment workflow runs
- **THEN** the workflow SHALL use `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` from GitHub Actions secrets for authentication
