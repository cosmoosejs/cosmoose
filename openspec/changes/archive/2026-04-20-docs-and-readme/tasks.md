## 1. Docs Site Scaffold

- [x] 1.1 Create `docs/package.json` with Fumadocs dependencies (fumadocs-core, fumadocs-ui, fumadocs-mdx, next, react, react-dom)
- [x] 1.2 Create `docs/tsconfig.json` for the Next.js app
- [x] 1.3 Create `docs/next.config.mjs` with Fumadocs MDX plugin
- [x] 1.4 Create `docs/source.config.ts` for Fumadocs source/content configuration
- [x] 1.5 Create `docs/app/layout.tsx` with Fumadocs root layout
- [x] 1.6 Create `docs/app/page.tsx` landing page with library intro and "Get Started" link
- [x] 1.7 Create `docs/app/docs/[[...slug]]/page.tsx` catch-all docs route
- [x] 1.8 Create `docs/app/docs/layout.tsx` with Fumadocs docs layout (sidebar)
- [x] 1.9 Run `pnpm install` and verify the docs site starts locally with `pnpm --filter docs dev`

## 2. Nx Integration

- [x] 2.1 Create `docs/project.json` with `serve` (next dev) and `build` (next build) targets
- [x] 2.2 Verify `pnpm exec nx serve docs` starts the dev server
- [x] 2.3 Verify `pnpm exec nx build docs` produces a production build in `docs/.next/`

## 3. Docs Content — Getting Started

- [x] 3.1 Create `docs/content/docs/index.mdx` — docs home/overview page
- [x] 3.2 Create `docs/content/docs/getting-started/installation.mdx` — install instructions and prerequisites
- [x] 3.3 Create `docs/content/docs/getting-started/quick-start.mdx` — full walkthrough (connect → schema → model → CRUD/query → migration sync)
- [x] 3.4 Create `docs/content/docs/getting-started/configuration.mdx` — CosmooseOptions and connection configuration

## 4. Docs Content — Guides

- [x] 4.1 Create `docs/content/docs/guide/schema.mdx` — defining schemas, field types, validation, transforms
- [x] 4.2 Create `docs/content/docs/guide/model.mdx` — CRUD operations, timestamps, auto-ID
- [x] 4.3 Create `docs/content/docs/guide/querying.mdx` — QueryBuilder, operators, sorting, pagination, cursors
- [x] 4.4 Create `docs/content/docs/guide/patching.mdx` — $set, $incr, $unset, $add operators
- [x] 4.5 Create `docs/content/docs/guide/batch-operations.mdx` — createBatch, bulk operations
- [x] 4.6 Create `docs/content/docs/guide/migrations.mdx` — syncContainers, drift detection, indexing

## 5. Docs Content — API Reference

- [x] 5.1 Create `docs/content/docs/api/cosmoose.mdx` — Cosmoose class reference
- [x] 5.2 Create `docs/content/docs/api/schema.mdx` — Schema class and SchemaOptions reference
- [x] 5.3 Create `docs/content/docs/api/model.mdx` — Model class reference
- [x] 5.4 Create `docs/content/docs/api/query-builder.mdx` — QueryBuilder and Cursor reference
- [x] 5.5 Create `docs/content/docs/api/types.mdx` — Type enum, Document, PatchExpression, FieldDescriptor types

## 6. Section Metadata

- [x] 6.1 Create `docs/content/docs/getting-started/meta.json` for sidebar ordering and section title
- [x] 6.2 Create `docs/content/docs/guide/meta.json` for sidebar ordering and section title
- [x] 6.3 Create `docs/content/docs/api/meta.json` for sidebar ordering and section title

## 7. README Files

- [x] 7.1 Create root `README.md` with tagline, install, quick-start (connect/schema/model/CRUD/query/sync), features list, docs link, and license
- [x] 7.2 Create `packages/cosmoose/README.md` — same content as root README (or trimmed for npm)
- [x] 7.3 Create `packages/cosmoose-nestjs/README.md` — placeholder noting the package is under development with a link to the docs site
