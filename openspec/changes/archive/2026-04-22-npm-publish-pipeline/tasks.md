## 1. Nx Release Configuration

- [x] 1.1 Add `release` configuration to `nx.json` with lockstep versioning group for `@cosmoose/core` and `@cosmoose/nestjs`
- [x] 1.2 Configure conventional-commits-based version bump in Nx release config
- [x] 1.3 Configure changelog generation in Nx release config
- [x] 1.4 Add `publishConfig` with `access: "public"` to both package `package.json` files

## 2. GitHub Actions Publish Workflow

- [x] 2.1 Create `.github/workflows/publish.yml` with `workflow_dispatch` trigger and `channel` input (latest, alpha, beta, next, rc)
- [x] 2.2 Add quality gate jobs: lint, test, and build steps that must pass before publishing
- [x] 2.3 Add branch guard to block `latest` channel releases from non-`main` branches
- [x] 2.4 Add version step using `nx release version` with pre-release identifier based on selected channel
- [x] 2.5 Add changelog generation step using `nx release changelog`
- [x] 2.6 Add publish step using `nx release publish` with correct `--tag` dist-tag matching the channel
- [x] 2.7 Enable npm provenance via `--provenance` flag and `id-token: write` permission
- [x] 2.8 Configure `NPM_TOKEN` secret usage and `NODE_AUTH_TOKEN` environment variable for npm authentication

## 3. GitHub Actions Docs Workflow

- [x] 3.1 Create `.github/workflows/docs.yml` with `push` trigger on `main` branch filtered to `docs/**` paths, plus `workflow_dispatch` for manual deploys
- [x] 3.2 Add setup steps: checkout, pnpm, Node.js
- [x] 3.3 Add Vercel CLI steps: `vercel pull`, `vercel build`, `vercel deploy --prebuilt --prod` using `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` secrets

## 4. Validation

- [x] 4.1 Verify workflow syntax with `actionlint` or dry-run trigger
- [x] 4.2 Test Nx release version and changelog commands locally with `--dry-run` for both stable and pre-release channels
