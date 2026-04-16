---
applyTo: "**"
---

# Cosmoose — Project Context

Cosmoose is a TypeScript ODM library published as two npm packages from an Nx monorepo.

## Packages

| Package | Path | Purpose |
|---------|------|---------|
| `cosmoose` | `packages/cosmoose` | Core ODM library |
| `cosmoose-nestjs` | `packages/cosmoose-nestjs` | NestJS integration (depends on `cosmoose`) |

## Stack

- **Monorepo**: Nx (integrated mode), `packages/` layout
- **Language**: TypeScript 6
- **Package manager**: pnpm 10
- **Build**: Vite (`@nx/vite`)
- **Test**: Vitest (`@nx/vitest`)
- **Lint**: ESLint 10 + `@typescript-eslint` + `@stylistic/eslint-plugin`
- **Git hooks**: Husky (pre-push: lint + test affected)
- **Commits**: Commitizen with `cz-conventional-changelog`

## Key Directories

- `openspec/` — Spec-driven change management (proposals, designs, tasks, specs)
- `wiki/` — Project knowledge base (architecture, conventions, how-tos — anything not in specs)
- `packages/` — Publishable npm libraries
