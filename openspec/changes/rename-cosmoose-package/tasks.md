## 1. Rename Primary Package

- [x] 1.1 Verify `cosmoose` is available on npm (`npm view cosmoose`)
- [x] 1.2 Change `name` in `packages/cosmoose/package.json` from `@cosmoose/core` to `cosmoose`
- [x] 1.3 Update `tsconfig.base.json` path alias from `@cosmoose/core` to `cosmoose`
- [x] 1.4 Remove redundant `@cosmoose/core` path alias in `packages/cosmoose-nestjs/tsconfig.json`
- [x] 1.5 Update root `package.json` workspace dependency from `@cosmoose/core` to `cosmoose`

## 2. Update cosmoose-nestjs Dependency

- [x] 2.1 Change dependency in `packages/cosmoose-nestjs/package.json` from `@cosmoose/core` to `cosmoose`
- [x] 2.2 Update any `@cosmoose/core` imports in `packages/cosmoose-nestjs/src/` to `cosmoose` (none found — uses path alias)

## 3. Create Alias Package (@cosmoose/cosmoose)

- [x] 3.1 Create `packages/cosmoose-alias/package.json` with name `@cosmoose/cosmoose` and dependency on `cosmoose`
- [x] 3.2 Create `packages/cosmoose-alias/src/index.ts` with `export * from 'cosmoose'`
- [x] 3.3 Create `packages/cosmoose-alias/project.json` with build target
- [x] 3.4 Create `packages/cosmoose-alias/tsconfig.json` and `tsconfig.lib.json`

## 4. Create Deprecation Wrapper (@cosmoose/core)

- [x] 4.1 Create `packages/cosmoose-deprecated/package.json` with name `@cosmoose/core`, dependency on `cosmoose`, and `deprecated` field
- [x] 4.2 Create `packages/cosmoose-deprecated/src/index.ts` with `export * from 'cosmoose'`
- [x] 4.3 Create `packages/cosmoose-deprecated/project.json` with build target
- [x] 4.4 Create `packages/cosmoose-deprecated/tsconfig.json` and `tsconfig.lib.json`

## 5. Update Nx Release Config

- [x] 5.1 Add `cosmoose-alias` and `cosmoose-deprecated` to the `release.projects` array in `nx.json`

## 6. Update Documentation

- [x] 6.1 Update root `README.md` — install commands and import examples
- [x] 6.2 Update `packages/cosmoose/README.md` — install commands and import examples
- [x] 6.3 Update `packages/cosmoose-nestjs/README.md` — npm link to cosmoose
- [x] 6.4 Update `docs/app/page.tsx` — hero code snippet
- [x] 6.5 Update `docs/components/install-tabs.tsx` — install commands
- [x] 6.6 Update all `docs/content/v0.1/**/*.mdx` files — import examples

## 7. Regenerate Lockfile and Verify

- [x] 7.1 Run `pnpm install` to regenerate lockfile
- [x] 7.2 Run `pnpm exec nx run-many -t build` to verify all packages build
- [x] 7.3 Run `pnpm exec nx run-many -t test` to verify tests pass
- [x] 7.4 Run `pnpm exec nx run-many -t lint` to verify linting passes
