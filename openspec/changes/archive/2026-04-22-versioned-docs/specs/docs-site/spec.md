## MODIFIED Requirements

### Requirement: Content structure

The docs site SHALL organize content under version-specific directories at `docs/content/<version>/` using MDX files with the following sections: getting-started, guide, and api.

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

The docs site SHALL automatically generate sidebar navigation from the file structure using Fumadocs source configuration, including a version selector dropdown at the top of the sidebar.

#### Scenario: Sidebar reflects content structure

- **WHEN** a user views any docs page
- **THEN** a sidebar SHALL display navigation organized by section (Getting Started, Guide, API Reference)
- **AND** a version selector dropdown SHALL appear above the navigation
