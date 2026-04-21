## 1. Version Configuration

- [x] 1.1 Create `docs/versions.json` with `{ "versions": ["v0.1"], "latest": "v0.1" }`
- [x] 1.2 Rename `docs/content/docs/` to `docs/content/v0.1/`

## 2. Multi-Version Source Setup

- [x] 2.1 Update `docs/source.config.ts` to define a `defineDocs()` collection for v0.1 pointing to `content/v0.1`
- [x] 2.2 Update `docs/lib/source.ts` to create a `loader()` per version with correct `baseUrl`, expose a version-keyed source map and `getSource(version?)` helper

## 3. Route Structure

- [x] 3.1 Update `docs/app/docs/[[...slug]]/page.tsx` to use `getSource()` for the latest version
- [x] 3.2 Update `docs/app/docs/layout.tsx` to use `getSource()` for the latest version's page tree
- [x] 3.3 Create `docs/app/docs/[version]/layout.tsx` that validates the version segment, redirects to canonical URL if it matches latest, and renders `DocsLayout` with the versioned source's page tree
- [x] 3.4 Create `docs/app/docs/[version]/[[...slug]]/page.tsx` that serves versioned content or renders the "not available" component

## 4. Version Selector Component

- [x] 4.1 Create `docs/components/version-selector.tsx` — a client-side dropdown that reads versions from config, shows the current version, and navigates to the equivalent page in the selected version
- [x] 4.2 Wire the version selector into both `docs/app/docs/layout.tsx` and `docs/app/docs/[version]/layout.tsx` via the `sidebar.banner` prop

## 5. Version Not Found Component

- [x] 5.1 Create `docs/components/version-not-found.tsx` — an inline component showing "This page is not available in this version" with a link to the latest version of the same page

## 6. Verification

- [x] 6.1 Verify the docs site builds successfully with `pnpm exec nx build docs`
- [x] 6.2 Verify latest pages serve at `/docs/*` without version prefix
- [x] 6.3 Verify the version selector is hidden when only one version exists
