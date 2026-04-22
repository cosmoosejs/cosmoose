## Context

The Cosmoose docs site is a Fumadocs MDX application (Next.js 16) serving a single unversioned set of documentation from `docs/content/docs/`. Content is loaded via a single `defineDocs()` collection in `source.config.ts` and exposed through a single `loader()` in `lib/source.ts`. Routing uses a catch-all `[[...slug]]` route under `app/docs/`.

As the library begins releasing versioned packages, the docs need to serve multiple versions simultaneously with in-app navigation between them.

## Goals / Non-Goals

**Goals:**

- Serve documentation for multiple library versions from a single deployment
- Provide an in-app version selector (sidebar dropdown) for switching between versions
- Route latest version at `/docs/*` (no version prefix) and older versions at `/docs/v<X>/...`
- Handle missing pages gracefully with an inline "not available" message and link to latest
- Make adding a new version a mechanical process: copy folder + update config

**Non-Goals:**

- Per-page or per-section versioning (every page belongs to exactly one version snapshot)
- Automated content diffing or partial snapshots (versions are full copies)
- Version-specific search scoping (search may return results across versions)
- Branched deployments or subdomains

## Decisions

### D1: Version config as `versions.json`

A static JSON file at `docs/versions.json` declares all versions and which is latest:

```json
{
  "versions": ["v0.1"],
  "latest": "v0.1"
}
```

**Rationale:** Single source of truth, easy to read at build time and runtime. No code changes needed to add a version — just update the JSON and copy the content folder. Preferred over environment variables or code-level constants because it's declarative and version-controllable.

### D2: One `defineDocs()` collection per version

Each version gets its own `defineDocs()` call in `source.config.ts` pointing to `content/<version>/`:

```ts
export const v0_1 = defineDocs({ dir: 'content/v0.1' });
```

**Rationale:** Fumadocs MDX generates typed collections at build time. Each collection produces its own source that can be independently loaded. This is the natural Fumadocs pattern for multiple content trees.

**Trade-off:** Adding a version requires a code change to `source.config.ts` (new `defineDocs` call). However, this file is simple and mechanical. A fully dynamic approach (scanning `content/` for folders) would fight Fumadocs' build-time collection model.

### D3: Version-keyed source map in `lib/source.ts`

Create a `loader()` per version and expose a `Map<string, Source>`:

```ts
const sources = {
  'v0.1': loader({ source: v0_1Docs.toFumadocsSource(), baseUrl: '/docs' }),
};
```

A `getSource(version?: string)` helper resolves a version string to the correct loader, defaulting to latest. The latest version's loader uses `baseUrl: '/docs'`, older versions use `baseUrl: '/docs/<version>'`.

**Rationale:** Keeps version resolution logic centralized. Routes and components call `getSource()` without knowing the internal mapping.

### D4: Route structure with `[version]` dynamic segment

```
app/docs/
  layout.tsx                    ← latest version layout
  [[...slug]]/page.tsx          ← latest version pages
  [version]/
    layout.tsx                  ← versioned layout
    [[...slug]]/page.tsx        ← versioned pages
```

The `[version]` segment is validated against `versions.json`. If the segment matches a known non-latest version, the versioned layout/page renders. If it doesn't match any version, Next.js falls through to 404.

**Alternative considered:** A single `[...slug]` catch-all that parses the first segment as a potential version. Rejected because it makes layout composition harder — the version selector needs to be in a layout, and splitting latest vs versioned into separate route groups gives cleaner layout boundaries.

### D5: Version selector as sidebar banner component

The version selector is a dropdown rendered via the `sidebar.banner` slot of Fumadocs' `DocsLayout`:

```tsx
<DocsLayout sidebar={{ banner: <VersionSelector current={version} /> }} ... />
```

**Rationale:** Fumadocs provides a `sidebar.banner` prop specifically for content above the sidebar navigation. This places the selector exactly where the design calls for it (sidebar top) without custom layout overrides.

**Behavior:** On version switch, the component navigates to the equivalent page in the target version. If the page doesn't exist, the catch-all route renders the "not available" component.

### D6: Inline "not available" component

When a user navigates to a versioned URL where the page doesn't exist in that version's source, the page route renders a `VersionNotFound` component instead of calling `notFound()`. This component shows within the docs layout (sidebar remains visible) and includes a link to the same page in the latest version.

**Rationale:** Keeps the user within the docs navigation context. They can browse other pages in that version or jump to latest. Calling `notFound()` would show a generic 404 outside the docs layout.

### D7: Latest version redirect from explicit URL

If a user visits `/docs/v0.1/guide/schema` and `v0.1` is the current latest, redirect to `/docs/guide/schema` to canonicalize URLs.

**Rationale:** Prevents duplicate content for SEO. The latest version should only be accessible at the unprefixed URL.

## Risks / Trade-offs

- **Build time scales linearly with versions** → Acceptable for a small number of versions (2-4). If it becomes an issue, old versions could be pre-built or lazy-loaded. Not a concern now.

- **`source.config.ts` requires manual update per version** → Mechanical change (one line per version). Could be automated with a codegen script later if needed. Acceptable for the expected version frequency.

- **Content duplication across versions** → Full snapshots mean disk usage grows. Acceptable trade-off for simplicity and independence between versions. Git handles deduplication at the storage level.

- **Search returns results from all versions** → Fumadocs search indexes all loaded content. Users might see results from old versions. Could be addressed later with search filtering, but not in scope.

- **Version selector navigation to missing pages** → Mitigated by D6 (inline "not available" component). The selector attempts navigation; the page route handles the fallback.
