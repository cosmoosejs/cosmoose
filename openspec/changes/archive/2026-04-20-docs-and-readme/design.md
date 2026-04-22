## Context

Cosmoose is a TypeScript ODM for Azure CosmosDB, published from an Nx monorepo with two packages (`cosmoose` and `cosmoose-nestjs`). There is currently no README, no package-level documentation, and no docs site. The library has a stable public API (schema, model, query builder, migrations, connection) with comprehensive integration tests.

The monorepo uses pnpm 10, Nx (integrated mode), Vite for builds, and Vitest for testing. The user is a React developer (no Vue experience).

## Goals / Non-Goals

**Goals:**

- Stand up a Fumadocs documentation site at `docs/` with local dev preview (`nx serve docs`) and production build (`nx build docs`).
- Write a root `README.md` with a self-contained quick-start (connect → schema → model → CRUD/query → migration sync).
- Write package-level `README.md` files that get published to npm.
- Deploy docs to `cosmoose.vercel.app` via Vercel using `pnpm exec nx build docs` as the build command.
- Register `docs` as an Nx project so it participates in the task graph and affected detection.

**Non-Goals:**

- Auto-generated API docs from TSDoc/TypeDoc (hand-written API reference instead).
- cosmoose-nestjs documentation beyond a placeholder (package is not yet implemented).
- Custom theme or branding for the docs site (use Fumadocs defaults).
- CI pipeline configuration for docs deployment (Vercel handles this via GitHub integration).
- Search configuration beyond Fumadocs built-in defaults.

## Decisions

### 1. Fumadocs over Nextra/Docusaurus/VitePress

**Choice**: Fumadocs (Next.js + React)

**Rationale**: The user is a React developer. Fumadocs is Next.js-based (React), has excellent built-in code blocks (tabs, highlighting, copy), built-in search (Orama), and auto-generates sidebar from file structure. It is modern and actively maintained with good defaults for library documentation.

**Alternatives rejected**:
- VitePress: Vue-based — user has no Vue experience.
- Nextra: Simpler but less feature-rich code blocks and less polished defaults.
- Docusaurus: Heavier than needed for a ~15-page docs site.
- Starlight: Astro ecosystem, different mental model from React.

### 2. `docs/` at repository root

**Choice**: Place the docs site at the top-level `docs/` directory.

**Rationale**: Documentation is a project concern, not a publishable package. Keeping it at the root makes it easy to find and avoids confusion with the `packages/` directory which holds npm-publishable libraries.

### 3. Nx project with `build` and `serve` targets

**Choice**: Register `docs` as an Nx project with a `project.json` using `nx:run-commands` executor wrapping Next.js commands.

**Rationale**: The user wants local dev preview (`nx serve docs`) and CI build integration. Using `nx:run-commands` is the simplest approach for wrapping Next.js CLI commands within Nx. The `build` target runs `next build` and the `serve` target runs `next dev`. This keeps the docs project consistent with the monorepo workflow.

### 4. Vercel deployment with Nx build command

**Choice**: Deploy via Vercel GitHub integration with build command `pnpm exec nx build docs` and output directory `docs/.next`.

**Rationale**: Vercel natively supports Next.js. Using `pnpm exec nx build docs` as the build command keeps the build through Nx so caching and affected detection work. The root directory in Vercel is set to the repo root (not `docs/`) so Nx resolution works correctly.

### 5. Hand-written API reference

**Choice**: Write API reference pages manually in MDX rather than auto-generating from TSDoc.

**Rationale**: The API surface is moderate (~15 primary exports). Hand-written docs are cleaner, more readable, and allow curated examples. Auto-generated docs (TypeDoc) tend to produce noisy output that requires significant customization to be useful for a library of this size.

### 6. Docs site structure

```
docs/
├── app/                        # Next.js app directory (Fumadocs layout)
│   ├── layout.tsx
│   ├── page.tsx                # Landing page
│   └── docs/
│       └── [[...slug]]/
│           └── page.tsx        # Docs catch-all route
├── content/
│   └── docs/
│       ├── index.mdx           # Docs home / overview
│       ├── getting-started/
│       │   ├── installation.mdx
│       │   ├── quick-start.mdx
│       │   └── configuration.mdx
│       ├── guide/
│       │   ├── schema.mdx
│       │   ├── model.mdx
│       │   ├── querying.mdx
│       │   ├── patching.mdx
│       │   ├── batch-operations.mdx
│       │   └── migrations.mdx
│       └── api/
│           ├── cosmoose.mdx
│           ├── schema.mdx
│           ├── model.mdx
│           ├── query-builder.mdx
│           └── types.mdx
├── source.config.ts            # Fumadocs source configuration
├── next.config.mjs             # Next.js config with Fumadocs plugin
├── package.json
├── project.json                # Nx project configuration
└── tsconfig.json
```

### 7. README quick-start scope

**Choice**: The root README quick-start covers five steps: connect, define schema, create model, CRUD + query, and migration sync.

**Rationale**: These are the core operations a user needs to get productive. The quick-start should be copy-pasteable and self-contained, then link to the docs site for depth. Additional topics (patching, batch operations, cursors) are guide-level content for the docs site.

## Risks / Trade-offs

- **[Fumadocs is newer than alternatives]** → Mitigated by: it has strong community momentum, is actively maintained, and is backed by a clean architecture. If it becomes unmaintained, migration to Nextra or Docusaurus is straightforward since content is just MDX files.
- **[Hand-written API docs can drift from code]** → Mitigated by: the API surface is small and stable. Review docs when making API changes. Could add auto-gen later if the API grows significantly.
- **[Next.js adds significant node_modules weight]** → Acceptable trade-off for a docs site. Only affects install time, not library consumers.
- **[Vercel free tier limits]** → Sufficient for a documentation site with low traffic. Can upgrade if needed.
