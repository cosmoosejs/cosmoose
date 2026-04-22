## Context

Cosmoose is a TypeScript ODM library published as two npm packages (`@cosmoose/core` and `@cosmoose/nestjs`) from an Nx monorepo. Currently there is no automated release pipeline — publishing requires manual version bumps, builds, and `npm publish` commands. The project uses Commitizen with conventional commits, which provides a foundation for automated semantic versioning.

Both packages follow lockstep versioning (currently `0.1.0`). `@cosmoose/nestjs` depends on `@cosmoose/core`, so releases must be coordinated. The monorepo uses Nx, which has built-in release orchestration via `nx release`.

The docs site (`docs/`) is a Next.js 16 app using Fumadocs for versioned MDX documentation. It is a private package (not published to npm) and has no deployment pipeline. It will be deployed to Vercel.

## Goals / Non-Goals

**Goals:**
- Automate versioning and publishing of both packages to npm via GitHub Actions.
- Use semantic versioning derived from conventional commits.
- Support pre-release dist-tags: `alpha`, `beta`, `next`, `rc` — in addition to `latest` for stable releases.
- Ensure packages are only published after passing lint, test, and build gates.
- Coordinate versioning across both packages using Nx release.
- Deploy the docs site to Vercel via GitHub Actions when `docs/` content changes on `main`.

**Non-Goals:**
- Automated changelog publishing to GitHub Releases (can be added later).
- Monorepo-independent versioning (packages stay in lockstep for now).
- Preview deployments for docs on pull requests (can be added later).
- Branch protection rules or repository settings (assumed to be configured separately).

## Decisions

### 1. Use Nx Release for versioning and publishing

**Decision**: Use `nx release` (built into Nx) for version bumping, changelog generation, and publish orchestration.

**Rationale**: Nx release understands the monorepo dependency graph, handles lockstep versioning, generates changelogs from conventional commits, and publishes in the correct order. It eliminates the need for additional tools like Lerna, Changesets, or semantic-release.

**Alternatives considered**:
- **semantic-release**: Powerful but designed for single-package repos; multi-package support requires plugins and is more complex.
- **Changesets**: Good for independent versioning, but adds friction (manual changeset files) and the project uses lockstep versioning anyway.

### 2. GitHub Actions workflow triggered manually and on tags

**Decision**: Use a manually-dispatched workflow (`workflow_dispatch`) with a required input for the release channel (`latest`, `alpha`, `beta`, `next`, `rc`). The workflow will version, build, test, and publish.

**Rationale**: Manual dispatch gives maintainers explicit control over when releases happen and which channel to target. This is safer than auto-publishing on every merge, especially during the `0.x` phase where breaking changes are frequent.

**Alternatives considered**:
- **Auto-publish on merge to main**: Too aggressive for a young project; accidental publishes are hard to undo.
- **Tag-based triggers only**: Requires manual tag creation which is error-prone; `workflow_dispatch` is more user-friendly.

### 3. Dist-tag strategy

**Decision**: Map release channels to npm dist-tags and pre-release identifiers:

| Channel | Version example | npm dist-tag | Branch |
|---------|----------------|--------------|--------|
| `latest` | `0.2.0` | `latest` | `main` |
| `rc` | `0.2.0-rc.0` | `rc` | `main` or release branch |
| `beta` | `0.2.0-beta.0` | `beta` | any |
| `alpha` | `0.2.0-alpha.0` | `alpha` | any |
| `next` | `0.2.0-next.0` | `next` | any |

**Rationale**: This follows npm conventions. Users install stable versions by default (`npm install @cosmoose/core`), and opt-in to pre-release channels explicitly (`npm install @cosmoose/core@beta`).

### 4. Lockstep versioning for both packages

**Decision**: Both `@cosmoose/core` and `@cosmoose/nestjs` share the same version number and are released together.

**Rationale**: `@cosmoose/nestjs` is a thin integration layer over `@cosmoose/core`. Independent versioning adds complexity without meaningful benefit at this stage. Nx release supports this natively via grouped projects.

### 5. Docs deployment via GitHub Actions + Vercel CLI

**Decision**: Deploy the docs site using a GitHub Actions workflow that runs the Vercel CLI (`vercel build` + `vercel deploy --prebuilt`), triggered on pushes to `main` that change `docs/` files, with a `workflow_dispatch` fallback for manual deploys.

**Rationale**: Using GitHub Actions instead of Vercel Git integration gives explicit control over the build pipeline and keeps all CI configuration in one place. The `paths: [docs/**]` filter avoids unnecessary rebuilds when only package code changes. Vercel CLI with `--prebuilt` separates the build and deploy steps cleanly.

**Alternatives considered**:
- **Vercel Git integration**: Zero-config auto-deploy on push. Simpler but less controllable — no path filtering, no explicit build gates, harder to debug. Also provides free preview deploys on PRs, but those aren't needed yet.
- **Vercel CLI without path filter**: Would rebuild docs on every push to `main`, even for package-only changes.

### 6. Provenance and access control

**Decision**: Publish with npm provenance enabled (links published packages to the GitHub Actions run) and use a scoped `NPM_TOKEN` secret with automation-type access.

**Rationale**: Provenance is an npm best practice for supply-chain security. Automation tokens bypass 2FA requirements for CI publishing.

## Risks / Trade-offs

- **[Risk] NPM_TOKEN exposure** → Token stored as GitHub Actions secret with minimal permissions. Provenance provides auditability.
- **[Risk] Accidental stable publish** → Workflow requires explicit channel selection; `latest` publishes only from `main` branch (enforced in workflow).
- **[Risk] Pre-release version conflicts** → Nx release uses incrementing pre-release counters (e.g., `alpha.0`, `alpha.1`) to avoid collisions.
- **[Trade-off] Lockstep versioning** → Simpler but means a patch to `cosmoose-nestjs` bumps `cosmoose` too. Acceptable for now; can decouple later.
- **[Trade-off] Manual dispatch** → Requires a human to trigger releases. This is intentional for the `0.x` phase but could be automated for stable releases later.
- **[Risk] Vercel token exposure** → Token stored as GitHub Actions secret. Scoped to the docs project only.
- **[Trade-off] No preview deploys** → Docs PRs won't get preview URLs. Acceptable for now; can add later by deploying without `--prod` on PRs.
