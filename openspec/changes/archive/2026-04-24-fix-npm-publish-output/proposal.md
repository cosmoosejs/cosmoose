## Why

Both `@cosmoose/core` and `@cosmoose/nestjs` publish empty packages to npm — the tarballs contain only `package.json` and `README.md` with zero JavaScript or type declaration files. Consumers who install either package get nothing usable.

The root cause is a mismatch between the TypeScript compiler output structure and the `package.json` fields (`files`, `main`, `module`, `types`, `exports`). The `tsconfig.lib.json` files lack a `rootDir` setting, so `tsc` preserves the `src/` directory prefix in the output (e.g., `dist/packages/cosmoose/src/index.js`). Meanwhile, `package.json` points to `./dist/index.js` and filters with `"files": ["dist"]` — a path that doesn't exist in the build output.

## What Changes

- Set `rootDir` to `./src` in both `tsconfig.lib.json` files so `tsc` emits a flat output without the `src/` prefix
- Update `package.json` in both packages to correct `main`, `module`, `types`, and `exports` paths to match the flattened output
- Remove or replace the `"files": ["dist"]` filter since the publish root *is* the dist directory — there's no nested `dist/` subfolder

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `cosmoose-lib-scaffold`: Fix `package.json` entry point paths and `tsconfig.lib.json` rootDir so the build output is correctly structured for publishing
- `cosmoose-nestjs-lib-scaffold`: Same fix applied to the NestJS package
- `npm-publish`: No spec-level requirement change — the existing requirement that "build produces output" and packages are publishable already covers this; this change fixes the implementation to meet existing requirements

## Impact

- **packages/cosmoose/tsconfig.lib.json** — add `rootDir`
- **packages/cosmoose/package.json** — fix `main`, `module`, `types`, `exports`, `files`
- **packages/cosmoose-nestjs/tsconfig.lib.json** — add `rootDir`
- **packages/cosmoose-nestjs/package.json** — fix `main`, `module`, `types`, `exports`, `files`
- **Build output structure changes** — `dist/packages/*/` will no longer have a `src/` subdirectory; files emit directly to the output root
- **tsc-alias** — the `build` target runs `tsc-alias` after compile; path resolution should still work since `outDir` doesn't change, but needs verification
