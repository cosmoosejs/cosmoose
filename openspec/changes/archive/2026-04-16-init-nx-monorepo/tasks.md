## 1. Initialize Nx Workspace

- [x] 1.1 Install Nx and core plugins (`nx`, `@nx/js`, `@nx/eslint`, `@nx/vite`, `@nx/workspace`) as devDependencies in root `package.json`
- [x] 1.2 Create `nx.json` with cacheable targets (`build`, `test`, `lint`) and default settings
- [x] 1.3 Create `pnpm-workspace.yaml` with `packages/*` glob
- [x] 1.4 Create `tsconfig.base.json` with strict mode, ES2022 target, and path aliases for `@cosmoose/core` and `@cosmoose/nestjs`
- [x] 1.5 Create root ESLint configuration with TypeScript support
- [x] 1.6 Update root `package.json` (set `private: true`, add Nx scripts, clean up placeholder fields)

## 2. Scaffold Cosmoose Core Library

- [x] 2.1 Create `packages/cosmoose/project.json` with `build` (`@nx/js:tsc`), `test` (vitest), and `lint` (eslint) targets
- [x] 2.2 Create `packages/cosmoose/package.json` with name `@cosmoose/core`, version `0.0.1`, and `main`/`module`/`types` fields
- [x] 2.3 Create `packages/cosmoose/tsconfig.json`, `tsconfig.lib.json`, and `tsconfig.spec.json` extending root base
- [x] 2.4 Create `packages/cosmoose/src/index.ts` placeholder entry point
- [x] 2.5 Create `packages/cosmoose/vite.config.ts` for Vitest
- [x] 2.6 Create `packages/cosmoose/eslint.config.js` extending root config

## 3. Scaffold Cosmoose NestJS Library

- [x] 3.1 Create `packages/cosmoose-nestjs/project.json` with `build` (`@nx/js:tsc`), `test` (vitest), and `lint` (eslint) targets
- [x] 3.2 Create `packages/cosmoose-nestjs/package.json` with name `@cosmoose/nestjs`, version `0.0.1`, `peerDependencies` on `@cosmoose/core`, `@nestjs/common`, and `@nestjs/core`
- [x] 3.3 Create `packages/cosmoose-nestjs/tsconfig.json`, `tsconfig.lib.json`, and `tsconfig.spec.json` extending root base
- [x] 3.4 Create `packages/cosmoose-nestjs/src/index.ts` placeholder entry point
- [x] 3.5 Create `packages/cosmoose-nestjs/vite.config.ts` for Vitest
- [x] 3.6 Create `packages/cosmoose-nestjs/eslint.config.js` extending root config

## 4. Set Up Husky and Git Hooks

- [x] 4.1 Install `husky` as a devDependency and add a `prepare` script (`husky`) to root `package.json`
- [x] 4.2 Create `.husky/pre-push` hook that runs `npx nx affected --target=lint` and `npx nx affected --target=test`

## 5. Set Up Commitizen

- [x] 5.1 Install `commitizen` and `cz-conventional-changelog` as devDependencies
- [x] 5.2 Add `config.commitizen` section to root `package.json` with `path` set to `cz-conventional-changelog`
- [x] 5.3 Add a `commit` script (`cz`) to root `package.json`

## 6. Validate Workspace

- [x] 6.1 Run `pnpm install` to verify workspace resolution and install all dependencies
- [x] 6.2 Run `nx build cosmoose` and verify output in `dist/packages/cosmoose`
- [x] 6.3 Run `nx build cosmoose-nestjs` and verify output in `dist/packages/cosmoose-nestjs`
- [x] 6.4 Run `nx lint cosmoose` and `nx lint cosmoose-nestjs` to verify lint targets
- [x] 6.5 Run `nx test cosmoose` and `nx test cosmoose-nestjs` to verify test targets
- [x] 6.6 Verify `.husky/pre-push` hook file exists and is executable
- [x] 6.7 Verify `pnpm commit` launches the Commitizen prompt
