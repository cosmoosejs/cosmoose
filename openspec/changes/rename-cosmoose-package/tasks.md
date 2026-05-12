## 1. Rename Primary Package

- [ ] 1.1 Verify `cosmoose` is available on npm (`npm view cosmoose`)
- [ ] 1.2 Change `name` in `packages/cosmoose/package.json` from `@cosmoose/core` to `cosmoose`
- [ ] 1.3 Update `tsconfig.base.json` path alias from `@cosmoose/core` to `cosmoose`
- [ ] 1.4 Remove redundant `@cosmoose/core` path alias in `packages/cosmoose-nestjs/tsconfig.json`
- [ ] 1.5 Update root `package.json` workspace dependency from `@cosmoose/core` to `cosmoose`

## 2. Update cosmoose-nestjs Dependency

- [ ] 2.1 Change dependency in `packages/cosmoose-nestjs/package.json` from `@cosmoose/core` to `cosmoose`
- [ ] 2.2 Update any `@cosmoose/core` imports in `packages/cosmoose-nestjs/src/` to `cosmoose`

## 3. Create Alias Package (@cosmoose/cosmoose)

- [ ] 3.1 Create `packages/cosmoose-alias/package.json` with name `@cosmoose/cosmoose` and dependency on `cosmoose`
- [ ] 3.2 Create `packages/cosmoose-alias/src/index.ts` with `export * from 'cosmoose'`
- [ ] 3.3 Create `packages/cosmoose-alias/project.json` with build target
- [ ] 3.4 Create `packages/cosmoose-alias/tsconfig.json` and `tsconfig.lib.json`

## 4. Create Deprecation Wrapper (@cosmoose/core)

- [ ] 4.1 Create `packages/cosmoose-deprecated/package.json` with name `@cosmoose/core`, dependency on `cosmoose`, and `deprecated` field
- [ ] 4.2 Create `packages/cosmoose-deprecated/src/index.ts` with `export * from 'cosmoose'`
- [ ] 4.3 Create `packages/cosmoose-deprecated/project.json` with build target
- [ ] 4.4 Create `packages/cosmoose-deprecated/tsconfig.json` and `tsconfig.lib.json`

## 5. Update Nx Release Config

- [ ] 5.1 Add `cosmoose-alias` and `cosmoose-deprecated` to the `release.projects` array in `nx.json`

## 6. Update Documentation

- [ ] 6.1 Update root `README.md` — install commands and import examples
- [ ] 6.2 Update `packages/cosmoose/README.md` — install commands and import examples
- [ ] 6.3 Update `packages/cosmoose-nestjs/README.md` — npm link to cosmoose
- [ ] 6.4 Update `docs/app/page.tsx` — hero code snippet
- [ ] 6.5 Update `docs/components/install-tabs.tsx` — install commands
- [ ] 6.6 Update all `docs/content/v0.1/**/*.mdx` files — import examples

## 7. Regenerate Lockfile and Verify

- [ ] 7.1 Run `pnpm install` to regenerate lockfile
- [ ] 7.2 Run `pnpm exec nx run-many -t build` to verify all packages build
- [ ] 7.3 Run `pnpm exec nx run-many -t test` to verify tests pass
- [ ] 7.4 Run `pnpm exec nx run-many -t lint` to verify linting passes
