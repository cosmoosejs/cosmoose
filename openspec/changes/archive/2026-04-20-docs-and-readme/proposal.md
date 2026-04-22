## Why

Cosmoose has no public-facing documentation — no README, no package-level READMEs, and no docs site. Users discovering the library on npm or GitHub have no way to understand what it does, how to install it, or how to use it. A documentation site and README are essential for adoption.

## What Changes

- Add a root `README.md` with a quick-start guide covering connect → schema → model → CRUD/query → migration sync, plus a link to the full docs site.
- Add package-level `README.md` files for `packages/cosmoose` and `packages/cosmoose-nestjs` (published to npm).
- Add a Fumadocs (Next.js) documentation site under `docs/` with getting-started guides, concept guides, and hand-written API reference pages.
- Register `docs` as an Nx project with `build`, `serve`, and `lint` targets for local development and CI integration.
- Deploy the docs site to `cosmoose.vercel.app` via Vercel (build command: `pnpm exec nx build docs`).

## Capabilities

### New Capabilities

- `docs-site`: Fumadocs documentation site with getting-started, guides, and API reference sections.
- `readme`: Root and package-level README files with quick-start usage examples.

### Modified Capabilities

_(none — this change does not modify any existing spec-level behavior)_

## Impact

- **New files**: `docs/` directory (Fumadocs app), root `README.md`, `packages/cosmoose/README.md`, `packages/cosmoose-nestjs/README.md`.
- **New Nx project**: `docs` with `build`/`serve` targets.
- **New dependencies**: `fumadocs-core`, `fumadocs-ui`, `fumadocs-mdx`, `next`, `react`, `react-dom` (in `docs/package.json`).
- **Deployment**: Vercel project pointing at `docs/` with build command `pnpm exec nx build docs`.
- **No changes to library source code or existing packages.**
