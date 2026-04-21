### Requirement: Version configuration file

The docs site SHALL have a `versions.json` file at `docs/versions.json` that declares all available documentation versions and which version is the latest.

#### Scenario: Config file structure

- **WHEN** the `versions.json` file is inspected
- **THEN** it SHALL contain a `versions` array of version strings and a `latest` string matching one entry in the array

#### Scenario: Single version configured

- **WHEN** only one version exists
- **THEN** `versions` SHALL contain one entry and `latest` SHALL equal that entry

### Requirement: Per-version content directories

Each documentation version SHALL have its own self-contained content directory at `docs/content/<version>/` containing all docs pages for that version.

#### Scenario: Version directory contains full content

- **WHEN** a version directory `content/v0.1/` is inspected
- **THEN** it SHALL contain `getting-started/`, `guide/`, `api/` subdirectories and a `meta.json` file

#### Scenario: Versions are independent

- **WHEN** content is modified in one version's directory
- **THEN** no other version's content SHALL be affected

### Requirement: Per-version Fumadocs collections

Each version SHALL have its own `defineDocs()` collection in `source.config.ts` pointing to its content directory.

#### Scenario: Collection per version

- **WHEN** `source.config.ts` is inspected
- **THEN** there SHALL be one `defineDocs()` call per version listed in `versions.json`, each with `dir` set to `content/<version>`

### Requirement: Per-version source loaders

Each version SHALL have its own `loader()` instance in `lib/source.ts` with the correct base URL.

#### Scenario: Latest version loader

- **WHEN** the loader for the latest version is created
- **THEN** its `baseUrl` SHALL be `/docs`

#### Scenario: Non-latest version loader

- **WHEN** the loader for a non-latest version is created
- **THEN** its `baseUrl` SHALL be `/docs/<version>`

### Requirement: Version source resolution

The docs site SHALL provide a `getSource(version?)` function that resolves a version string to the corresponding source loader.

#### Scenario: Resolve latest by default

- **WHEN** `getSource()` is called without arguments
- **THEN** it SHALL return the source loader for the latest version

#### Scenario: Resolve specific version

- **WHEN** `getSource('v0.1')` is called
- **THEN** it SHALL return the source loader for version v0.1

#### Scenario: Unknown version

- **WHEN** `getSource('v99')` is called with a version not in `versions.json`
- **THEN** it SHALL return `undefined`

### Requirement: Latest version routing

The latest version of docs SHALL be served at `/docs/*` without a version prefix in the URL.

#### Scenario: Latest page accessible without prefix

- **WHEN** a user navigates to `/docs/guide/schema`
- **THEN** the page from the latest version's content SHALL be rendered

#### Scenario: Latest index redirect

- **WHEN** a user navigates to `/docs`
- **THEN** they SHALL be redirected to `/docs/getting-started/quick-start`

### Requirement: Versioned routing

Non-latest versions SHALL be served at `/docs/<version>/*`.

#### Scenario: Old version page accessible

- **WHEN** a user navigates to `/docs/v0.1/guide/schema` and v0.1 is not the latest
- **THEN** the page from v0.1's content SHALL be rendered

#### Scenario: Invalid version segment

- **WHEN** a user navigates to `/docs/v99/guide/schema` where v99 is not a known version
- **THEN** a 404 page SHALL be shown

### Requirement: Latest version URL canonicalization

If a user accesses the latest version via its explicit version prefix, the site SHALL redirect to the unprefixed URL.

#### Scenario: Redirect explicit latest to canonical URL

- **WHEN** a user navigates to `/docs/v0.1/guide/schema` and v0.1 is the current latest
- **THEN** they SHALL be redirected to `/docs/guide/schema`

### Requirement: Version selector in sidebar

The docs site SHALL display a version selector dropdown at the top of the sidebar navigation.

#### Scenario: Selector shows current version

- **WHEN** a user views any docs page
- **THEN** the sidebar SHALL display a dropdown showing the current version label (e.g., "v0.1" or "Latest (v0.1)")

#### Scenario: Selector lists all versions

- **WHEN** a user opens the version dropdown
- **THEN** all versions from `versions.json` SHALL be listed, with the latest version marked

#### Scenario: Version switch navigates to equivalent page

- **WHEN** a user selects a different version from the dropdown while on `/docs/guide/schema`
- **THEN** the browser SHALL navigate to `/docs/<selected-version>/guide/schema`

#### Scenario: Selector hidden with single version

- **WHEN** only one version is configured in `versions.json`
- **THEN** the version selector SHALL NOT be displayed

### Requirement: Inline version not-found

When a user navigates to a page that does not exist in the selected version, the site SHALL display an inline "not available" message within the docs layout.

#### Scenario: Page missing in old version

- **WHEN** a user navigates to `/docs/v0.1/guide/new-feature` and that page does not exist in v0.1
- **THEN** the docs layout (with sidebar) SHALL remain visible
- **AND** the main content area SHALL display a message stating the page is not available in this version
- **AND** a button/link SHALL be shown to navigate to the same page in the latest version

### Requirement: Adding a new version

Adding a new documentation version SHALL require only copying a content directory and updating configuration — no routing or layout code changes.

#### Scenario: New version workflow

- **WHEN** a developer wants to add version v1.0
- **THEN** they SHALL copy an existing content directory to `content/v1.0/`
- **AND** update `versions.json` to add `v1.0` and set it as latest
- **AND** add a new `defineDocs()` call in `source.config.ts`
- **AND** add a new `loader()` entry in `lib/source.ts`
- **AND** no changes SHALL be required in route files or layout components
