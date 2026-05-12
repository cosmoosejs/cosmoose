## Context

The core ODM package is currently published to npm as `@cosmoose/core`. It needs to be renamed to `cosmoose` (unscoped) for better DX, with `@cosmoose/cosmoose` as a scoped alias for symmetry with `@cosmoose/nestjs`. Since `@cosmoose/core` is already published, a deprecation strategy is needed.

The monorepo currently has two packages: `cosmoose` (Nx project name) at `packages/cosmoose/` and `cosmoose-nestjs` at `packages/cosmoose-nestjs/`. TypeScript path aliases, docs, and READMEs all reference `@cosmoose/core`.

## Goals / Non-Goals

**Goals:**
- Rename the primary npm package to `cosmoose`
- Publish `@cosmoose/cosmoose` as a scoped alias that re-exports `cosmoose`
- Deprecate `@cosmoose/core` with a final re-export release
- Update all internal references (configs, docs, READMEs)

**Non-Goals:**
- Renaming `@cosmoose/nestjs` (it stays as-is)
- Changing the Nx project name (`cosmoose`) — it already matches
- Changing the directory structure (`packages/cosmoose/` stays)

## Decisions

### 1. Package structure for alias and deprecation wrappers

**Decision**: Create two thin wrapper packages in the monorepo.

```
packages/
├── cosmoose/                  # primary — npm: cosmoose
├── cosmoose-alias/            # alias  — npm: @cosmoose/cosmoose
├── cosmoose-deprecated/       # final  — npm: @cosmoose/core
└── cosmoose-nestjs/           # stays  — npm: @cosmoose/nestjs
```

Each wrapper contains only:
- `package.json` with a dependency on `cosmoose`
- `src/index.ts` with `export * from 'cosmoose'`
- Minimal Nx project config (build + publish targets)

**Why not a post-publish script?** Separate packages are easier to reason about, version independently if needed, and test. They also play cleanly with Nx's project graph.

### 2. Deprecation approach for `@cosmoose/core`

**Decision**: Publish one final version of `@cosmoose/core` that:
1. Depends on `cosmoose` and re-exports everything
2. Has `"deprecated": "Use 'cosmoose' or '@cosmoose/cosmoose' instead"` in package.json

After publishing, run `npm deprecate @cosmoose/core "Renamed to 'cosmoose'. Install 'cosmoose' or '@cosmoose/cosmoose' instead."` to mark all existing versions.

The final version should match the current version of `cosmoose` so semver ranges resolve cleanly.

### 3. TypeScript path alias strategy

**Decision**: Change `tsconfig.base.json` path alias from `@cosmoose/core` to `cosmoose`.

```json
{
  "compilerOptions": {
    "paths": {
      "cosmoose": ["packages/cosmoose/src/index.ts"],
      "@cosmoose/nestjs": ["packages/cosmoose-nestjs/src/index.ts"]
    }
  }
}
```

This means `import { Schema } from 'cosmoose'` resolves to local source during development, matching the published package name exactly.

### 4. Nx release configuration

**Decision**: Add `cosmoose-alias` and `cosmoose-deprecated` to the Nx release projects list. All four packages publish in dependency order:

1. `cosmoose` (primary)
2. `@cosmoose/cosmoose` (alias, depends on cosmoose)
3. `@cosmoose/core` (deprecated, depends on cosmoose)
4. `@cosmoose/nestjs` (depends on cosmoose)

### 5. Version alignment

**Decision**: The alias and deprecated wrapper packages will use lockstep versioning with the primary `cosmoose` package. All packages publish at the same version.

## Risks / Trade-offs

- **[npm name availability]** → Verify `cosmoose` is available on npm before proceeding. If taken, the whole plan needs rethinking.
- **[Extra packages to maintain]** → Two wrapper packages add marginal overhead. They're trivial (one file each) and version in lockstep, so maintenance cost is near zero.
- **[Existing users on @cosmoose/core]** → Mitigated by the deprecation wrapper re-exporting from `cosmoose`. Their code continues to work; they just see a deprecation warning on install.
- **[Docs versioning]** → Existing versioned docs (v0.1) reference `@cosmoose/core`. These should be updated since v0.1 docs will reflect the state at the next publish, not the historical state.
