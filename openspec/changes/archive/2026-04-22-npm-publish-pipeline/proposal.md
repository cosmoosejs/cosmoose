## Why

There is no automated pipeline for publishing `@cosmoose/core` and `@cosmoose/nestjs` to npm. Publishing is manual, error-prone, and lacks support for pre-release channels. Additionally, the docs site (`docs/`) has no deployment pipeline — it needs to be deployed to Vercel via GitHub Actions when docs content changes. A CI-driven pipeline for both npm publishing and docs deployment will ensure consistent, reproducible releases and deployments.

## What Changes

- Add a GitHub Actions workflow for publishing packages to npm with semantic version tags.
- Support release channels via npm dist-tags: `latest` (stable), `alpha`, `beta`, `next`, and `rc`.
- Automate version bumping, changelog generation, and npm publish across both packages in the monorepo.
- Add Nx release configuration for coordinated versioning of `@cosmoose/core` and `@cosmoose/nestjs`.
- Gate publishing behind lint, test, and build checks.
- Add a GitHub Actions workflow for deploying the docs site to Vercel on pushes to `main` that change `docs/`, with manual dispatch fallback.

## Capabilities

### New Capabilities
- `npm-publish`: CI pipeline for publishing packages to npm with semantic versioning, dist-tag management (latest, alpha, beta, next, rc), and Nx-coordinated releases.
- `docs-deploy`: GitHub Actions workflow for deploying the docs site to Vercel, triggered on `docs/` changes to `main` and via manual dispatch.

### Modified Capabilities
_(none)_

## Impact

- **CI/CD**: New GitHub Actions workflow file(s) in `.github/workflows/`.
- **Nx config**: `nx.json` updated with release configuration for versioning and changelog.
- **Package config**: `package.json` files may need `publishConfig` or metadata adjustments.
- **Dependencies**: May add `nx release` related tooling or conventional-changelog packages.
- **npm registry**: Packages will be published to the public npm registry under the `@cosmoose` scope.
- **Secrets**: Requires `NPM_TOKEN`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` secrets configured in the GitHub repository.
