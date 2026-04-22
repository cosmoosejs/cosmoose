## ADDED Requirements

### Requirement: Docs site project structure

The docs site SHALL be a Fumadocs (Next.js) application located at `docs/` in the repository root. It SHALL contain a `package.json`, `project.json` (Nx), `next.config.mjs`, `source.config.ts`, `tsconfig.json`, and an `app/` directory with Next.js app router layout.

#### Scenario: Project exists and is recognized by Nx

- **WHEN** a developer runs `pnpm exec nx show project docs`
- **THEN** the project is found and its configuration is displayed

#### Scenario: Project has correct type

- **WHEN** the `project.json` is inspected
- **THEN** `projectType` SHALL be `"application"`

### Requirement: Local development server

The docs site SHALL be servable locally for development preview via an Nx target.

#### Scenario: Developer starts local docs preview

- **WHEN** a developer runs `pnpm exec nx serve docs`
- **THEN** a Next.js development server starts and the docs site is accessible at `http://localhost:3000`

### Requirement: Production build

The docs site SHALL be buildable for production deployment via an Nx target.

#### Scenario: Developer builds docs for production

- **WHEN** a developer runs `pnpm exec nx build docs`
- **THEN** Next.js produces a production build in `docs/.next/`

### Requirement: Content structure

The docs site SHALL organize content under `docs/content/docs/` using MDX files with the following sections: getting-started, guide, and api.

#### Scenario: Getting-started section exists

- **WHEN** a user navigates to the docs site
- **THEN** a "Getting Started" section SHALL be available containing installation, quick-start, and configuration pages

#### Scenario: Guide section exists

- **WHEN** a user navigates to the docs site
- **THEN** a "Guide" section SHALL be available containing pages for schema, model, querying, patching, batch-operations, and migrations

#### Scenario: API reference section exists

- **WHEN** a user navigates to the docs site
- **THEN** an "API Reference" section SHALL be available containing hand-written reference pages for Cosmoose, Schema, Model, QueryBuilder, and Types

### Requirement: Sidebar navigation

The docs site SHALL automatically generate sidebar navigation from the file structure using Fumadocs source configuration.

#### Scenario: Sidebar reflects content structure

- **WHEN** a user views any docs page
- **THEN** a sidebar SHALL display navigation organized by section (Getting Started, Guide, API Reference)

### Requirement: Landing page

The docs site SHALL have a landing page at the root URL that introduces cosmoose and links to the getting-started section.

#### Scenario: User visits docs root

- **WHEN** a user navigates to the docs site root URL
- **THEN** a landing page is displayed with the library name, a brief description, and a link to get started

### Requirement: Vercel deployment configuration

The docs site SHALL be deployable to Vercel at `cosmoose.vercel.app`.

#### Scenario: Vercel builds successfully

- **WHEN** Vercel runs the build command `pnpm exec nx build docs`
- **THEN** the build completes successfully and the site is deployed
- **AND** the output directory is `docs/.next`

### Requirement: Code examples in docs

All guide and getting-started pages SHALL include runnable TypeScript code examples demonstrating the documented concepts.

#### Scenario: Quick-start page has a complete example

- **WHEN** a user reads the quick-start page
- **THEN** it SHALL contain a complete, copy-pasteable code example covering connect, schema definition, model creation, CRUD operations, querying, and migration sync
