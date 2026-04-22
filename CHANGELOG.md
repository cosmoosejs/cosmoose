## 0.1.0-rc.0 (2026-04-22)

### 🚀 Features

- initialize Nx monorepo with core and NestJS libraries, add Husky and Commitizen support ([0ac8fc6](https://github.com/cosmoosejs/cosmoose/commit/0ac8fc6))
- add initial project context and wiki structure documentation ([bee55a4](https://github.com/cosmoosejs/cosmoose/commit/bee55a4))
- add .nvmrc file to specify Node.js version ([95273ad](https://github.com/cosmoosejs/cosmoose/commit/95273ad))
- update project context with runtime and rules for documentation maintenance ([25a1227](https://github.com/cosmoosejs/cosmoose/commit/25a1227))
- enhance ODM design and schema capabilities with drift detection and container configuration ([7d9daa0](https://github.com/cosmoosejs/cosmoose/commit/7d9daa0))
- add eslint-plugin-simple-import-sort and update dependencies for improved import organization ([a05a2cd](https://github.com/cosmoosejs/cosmoose/commit/a05a2cd))
- implement QueryBuilder for SQL generation and schema management ([09580df](https://github.com/cosmoosejs/cosmoose/commit/09580df))
- enhance deleteMany method to handle partition keys and improve bulk delete operations ([44a9ce5](https://github.com/cosmoosejs/cosmoose/commit/44a9ce5))
- add SVG icons and enhance layout with metadata and quick start guide ([411c0df](https://github.com/cosmoosejs/cosmoose/commit/411c0df))
- update package versions to 0.1.0 across all packages ([76f079d](https://github.com/cosmoosejs/cosmoose/commit/76f079d))
- implement automated npm publishing and docs deployment workflows ([3ca8a98](https://github.com/cosmoosejs/cosmoose/commit/3ca8a98))
- update GitHub Actions workflow for docs deployment and add .gitignore file ([8b19c81](https://github.com/cosmoosejs/cosmoose/commit/8b19c81))
- configure git identity for GitHub Actions in publish workflow ([e709b3e](https://github.com/cosmoosejs/cosmoose/commit/e709b3e))
- update versioning steps to include changelog generation in publish workflow ([922b165](https://github.com/cosmoosejs/cosmoose/commit/922b165))
- enable automatic changelog generation from reference in nx.json ([522132d](https://github.com/cosmoosejs/cosmoose/commit/522132d))
- add repository field to package.json for both core and nestjs packages ([3e9b309](https://github.com/cosmoosejs/cosmoose/commit/3e9b309))
- add tests for hierarchical partition key CRUD operations and container creation ([4268a1d](https://github.com/cosmoosejs/cosmoose/commit/4268a1d))
- add step to push version commit and tags in publish workflow ([ec5dd6c](https://github.com/cosmoosejs/cosmoose/commit/ec5dd6c))
- **cosmoose-core-odm:** implement initial ODM library for Azure CosmosDB (proposal) ([10ecdbb](https://github.com/cosmoosejs/cosmoose/commit/10ecdbb))
- **docs:** implement versioned documentation structure ([a2f01a1](https://github.com/cosmoosejs/cosmoose/commit/a2f01a1))

### 🩹 Fixes

- revert package versions to 0.0.0 for consistency across all packages ([0c76584](https://github.com/cosmoosejs/cosmoose/commit/0c76584))
- remove NODE_AUTH_TOKEN from publish step in workflow ([038f61c](https://github.com/cosmoosejs/cosmoose/commit/038f61c))
- add --no-verify option to git push in publish workflow to skip Husky pre-push hook ([6679ad1](https://github.com/cosmoosejs/cosmoose/commit/6679ad1))

### ❤️ Thank You

- pr/t3 @pr1te
- pr1t3