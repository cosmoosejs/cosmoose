## Why

The Cosmoose documentation site currently serves a single version of docs. As the library evolves through releases, users on older versions need access to documentation matching their installed version. Without versioning, users encounter docs that describe APIs or behaviors not available in their version, leading to confusion and broken workflows.

## What Changes

- Restructure docs content from `content/docs/` to `content/v0.1/` with all versions stored in explicitly named directories
- Add a `versions.json` config file as the single source of truth declaring all available versions and which is "latest"
- Create a version-aware routing system: latest version served at `/docs/*` (implicit), older versions at `/docs/<version>/*`
- Create separate Fumadocs MDX collections (`defineDocs`) and loaders per version
- Add a version selector dropdown component at the top of the docs sidebar
- Add an inline "not available in this version" component with a link to the latest version, shown when a page doesn't exist in the selected version
- Update Next.js app routes to support both `/docs/[[...slug]]` (latest) and `/docs/[version]/[[...slug]]` (versioned)

## Capabilities

### New Capabilities

- `docs-versioning`: Version management system — versions.json config, multi-collection source setup, version-aware routing, version selector UI component, and "not available" fallback component

### Modified Capabilities

- `docs-site`: Content directory moves from `content/docs/` to `content/v0.1/`. Routing structure changes to support versioned paths. Sidebar layout updated to include version selector.

## Impact

- `docs/content/docs/` — renamed to `docs/content/v0.1/`
- `docs/source.config.ts` — multiple `defineDocs()` calls, one per version
- `docs/lib/source.ts` — multiple `loader()` instances, version resolution logic
- `docs/app/docs/` — route structure changes to accommodate `[version]` segment
- `docs/app/docs/layout.tsx` — passes version selector to sidebar
- `docs/components/` — new `version-selector.tsx` and `version-not-found.tsx` components
- `docs/versions.json` — new file
- Vercel deployment unaffected (still single app, same build command)
