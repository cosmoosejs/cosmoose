## Context

The Cosmoose project currently has a bare root `package.json` with no source code scaffolded. Two libraries need to coexist in a single repository: the core `cosmoose` ODM and the `cosmoose-nestjs` NestJS integration module. Both will be published to npm independently. The project uses pnpm (v10.33.0) as its package manager.

## Goals / Non-Goals

**Goals:**
- Initialize an Nx workspace at the repo root with pnpm as the package manager
- Scaffold two publishable TypeScript library projects (`cosmoose`, `cosmoose-nestjs`)
- Establish shared TypeScript, linting, and testing configuration
- Enable Nx build caching and task orchestration across both libraries
- Ensure `cosmoose-nestjs` declares a dependency on `cosmoose`
- Set up Husky with a pre-push git hook that runs lint and test across all affected projects
- Set up Commitizen with `cz-conventional-changelog` for standardized commit messages

**Non-Goals:**
- Implementing any library source code (schemas, models, decorators, etc.)
- Setting up CI/CD pipelines
- Configuring npm publishing automation
- Adding an application or demo project
- Setting up documentation site or storybook

## Decisions

### 1. Project layout: `packages/` directory

Use `packages/cosmoose` and `packages/cosmoose-nestjs` as the project directories.

**Rationale**: The `packages/` convention is the most widely recognized layout for library-focused monorepos. It signals clearly that each subdirectory is a publishable package.

**Alternative considered**: Nx-default `libs/` — rejected because `libs/` is a convention from Nx's older integrated style; `packages/` better communicates publishable npm intent.

### 2. Nx integrated monorepo (not standalone)

Use Nx in integrated monorepo mode where `nx.json` lives at the root and each project has a `project.json`.

**Rationale**: Integrated mode gives full control over build targets, dependency graph, and caching. Both libraries share tooling and are versioned from the same repo.

**Alternative considered**: Nx standalone with package-based mode — rejected because with only two tightly related packages, integrated mode is simpler and avoids duplicating config.

### 3. Build toolchain: `@nx/js` with TypeScript compiler (tsc)

Use `@nx/js:tsc` executor for building both libraries.

**Rationale**: The libraries are pure TypeScript with no bundling or framework-specific compilation needs. `tsc` is the simplest, most transparent build for npm-published libraries. Consumers bundle their own applications.

**Alternative considered**: SWC (`@nx/js:swc`) — faster but adds another dependency and less transparent for debugging; esbuild — not appropriate for library builds that need to emit declarations.

### 4. Test framework: Vitest

Use Vitest as the test runner for both libraries.

**Rationale**: Vitest is fast, has native TypeScript/ESM support, and a familiar Jest-compatible API. It works well with Nx via `@nx/vite`.

**Alternative considered**: Jest — heavier config overhead with TypeScript ESM; Nx has first-class Vitest support now.

### 5. Lint: ESLint with `@nx/eslint`

Use the Nx ESLint plugin with a shared root ESLint configuration.

**Rationale**: Standard across the Nx ecosystem; provides module boundary enforcement via `@nx/enforce-module-boundaries`.

### 6. Package scope: `@cosmoose/*`

Use npm scope `@cosmoose` for published packages: `@cosmoose/core` and `@cosmoose/nestjs`.

**Rationale**: Scoped packages avoid name collisions and group the packages visually on npm. Using `/core` and `/nestjs` is cleaner than `cosmoose` and `cosmoose-nestjs`.

**Alternative considered**: Unscoped names `cosmoose` / `cosmoose-nestjs` — works but loses the visual grouping and namespace safety.

### 7. Git hooks: Husky with pre-push hook

Use Husky to install a `pre-push` git hook that runs `nx affected --target=lint` and `nx affected --target=test` before pushing.

**Rationale**: A pre-push hook catches broken code before it reaches the remote. Using `nx affected` ensures only projects impacted by the changes are tested/linted, keeping the hook fast.

**Alternative considered**: Pre-commit hook — rejected because running full test+lint on every commit is too slow and disruptive to workflow. Pre-push is the right gate for remote-bound code.

### 8. Commit conventions: Commitizen with cz-conventional-changelog

Use Commitizen with the `cz-conventional-changelog` adapter. Add a `commit` script to root `package.json` that runs `cz`.

**Rationale**: Conventional commits enable automated changelogs and semantic versioning in the future. `cz-conventional-changelog` is the standard adapter and widely understood.

**Alternative considered**: `commitlint` with a commit-msg hook — complementary but not requested; can be added later. Commitizen alone provides the guided commit experience.

## Risks / Trade-offs

- **[Nx version churn]** → Pin Nx major version in `package.json`; use `nx migrate` for updates.
- **[Scope availability on npm]** → Verify `@cosmoose` scope is available or user-owned before first publish. Not a blocker for repo setup.
- **[Over-scaffolding]** → Keep generated code minimal; only create the project skeleton with placeholder `index.ts` files. Actual implementation comes in subsequent changes.
- **[Pre-push hook speed]** → Using `nx affected` mitigates this; if the hook becomes slow, consider switching to `lint-staged` for lint and keeping only test in pre-push.
