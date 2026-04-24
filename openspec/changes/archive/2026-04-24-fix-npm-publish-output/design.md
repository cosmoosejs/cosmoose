## Context

Both `@cosmoose/core` and `@cosmoose/nestjs` produce empty npm tarballs — only `package.json` and `README.md` are included, with zero JavaScript or declaration files. This is a critical bug that makes the published packages unusable.

The build pipeline works as follows:
1. `compile` target runs `@nx/js:tsc` — outputs to `dist/packages/<pkg>/`
2. `build` target runs `tsc-alias` — resolves `~/` path aliases in the compiled output

TypeScript compiles `src/**/*.ts` with `outDir` set to `../../dist/packages/<pkg>`. Without an explicit `rootDir`, tsc infers it from the `include` glob and preserves the `src/` directory structure, producing `dist/packages/<pkg>/src/index.js`.

The `package.json` declares `"main": "./dist/index.js"` and `"files": ["dist"]` — these paths assume the compiled output lands in a `dist/` subfolder relative to the publish root. But the publish root *is* `dist/packages/<pkg>/`, and the compiled files are in `src/`, not `dist/`. The `files` filter excludes everything, and the entry points point to nonexistent paths.

## Goals / Non-Goals

**Goals:**
- Published tarballs include all compiled JavaScript and declaration files
- Entry points (`main`, `module`, `types`, `exports`) resolve correctly after install
- Build output structure is flat (no `src/` prefix) — clean import paths for consumers

**Non-Goals:**
- Changing the build toolchain (staying with `@nx/js:tsc` + `tsc-alias`)
- Changing the publish directory location (`dist/packages/<pkg>/`)
- Adding CJS output or dual-format publishing

## Decisions

### Decision 1: Add `rootDir: "./src"` to tsconfig.lib.json

**Choice**: Set `rootDir` explicitly to `./src` in both `tsconfig.lib.json` files.

**Rationale**: This tells tsc to strip the `src/` prefix when emitting, producing a flat output:
```
dist/packages/cosmoose/
├── index.js
├── index.d.ts
├── connection/
├── model/
└── ...
```

**Alternative considered**: Update `package.json` paths to point to `./src/index.js` instead. Rejected because `src/` in consumer-visible paths is unconventional and leaky.

### Decision 2: Fix package.json entry points to `./index.js`

**Choice**: Update `main`, `module`, `types`, and `exports` to reference `./index.js` and `./index.d.ts` (no `dist/` prefix).

**Rationale**: After the `rootDir` fix, `index.js` lives directly in the publish root. The `./dist/` prefix was always wrong for the publish-from-dist pattern used by Nx.

### Decision 3: Replace `"files": ["dist"]` with a correct filter

**Choice**: Use `"files": ["**/*.js", "**/*.d.ts", "**/*.js.map", "**/*.d.ts.map"]` to include all compiled output.

**Rationale**: There is no `dist/` subfolder in the publish directory. We need to include all `.js` and `.d.ts` files. Using globs rather than removing `files` entirely ensures we don't accidentally publish stray files (e.g., `tsconfig.json` copies). Source maps are included for debuggability.

## Risks / Trade-offs

- **[Risk] tsc-alias compatibility** — The `build` target runs `tsc-alias -p packages/<pkg>/tsconfig.lib.json --outDir dist/packages/<pkg>`. Adding `rootDir` changes the output structure, which could affect how `tsc-alias` resolves paths. → Mitigation: Verify by running `pnpm nx build cosmoose` and `pnpm pack --dry-run` after the fix.
- **[Risk] Nx cache invalidation** — Changing tsconfig and package.json will invalidate the build cache. → Mitigation: Acceptable; this is a one-time fix.
