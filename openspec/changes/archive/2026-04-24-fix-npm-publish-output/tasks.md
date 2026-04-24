## 1. Fix cosmoose (core) package

- [x] 1.1 Add `"rootDir": "./src"` to `packages/cosmoose/tsconfig.lib.json` compilerOptions
- [x] 1.2 Update `packages/cosmoose/package.json` — set `main` to `./index.js`, `module` to `./index.js`, `types` to `./index.d.ts`, update `exports` accordingly
- [x] 1.3 Update `packages/cosmoose/package.json` — replace `"files": ["dist"]` with `["**/*.js", "**/*.d.ts", "**/*.js.map", "**/*.d.ts.map"]`

## 2. Fix cosmoose-nestjs package

- [x] 2.1 Add `"rootDir": "./src"` to `packages/cosmoose-nestjs/tsconfig.lib.json` compilerOptions
- [x] 2.2 Update `packages/cosmoose-nestjs/package.json` — set `main` to `./index.js`, `module` to `./index.js`, `types` to `./index.d.ts`, update `exports` accordingly
- [x] 2.3 Update `packages/cosmoose-nestjs/package.json` — replace `"files": ["dist"]` with `["**/*.js", "**/*.d.ts", "**/*.js.map", "**/*.d.ts.map"]`

## 3. Verify

- [x] 3.1 Run `pnpm nx build cosmoose` and confirm output is flat (no `src/` prefix in `dist/packages/cosmoose/`)
- [x] 3.2 Run `pnpm pack --dry-run` in `dist/packages/cosmoose/` and confirm JS and `.d.ts` files are listed
- [x] 3.3 Run `pnpm nx build cosmoose-nestjs` and confirm output is flat
- [x] 3.4 Run `pnpm pack --dry-run` in `dist/packages/cosmoose-nestjs/` and confirm JS and `.d.ts` files are listed
- [x] 3.5 Run `pnpm nx test cosmoose` and `pnpm nx test cosmoose-nestjs` to ensure no regressions
