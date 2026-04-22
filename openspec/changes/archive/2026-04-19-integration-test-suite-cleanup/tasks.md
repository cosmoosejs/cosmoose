## 1. Remove spike integration test

- [x] 1.1 Delete `packages/cosmoose/integration/spike.integration.spec.ts`

## 2. Update integration-testing spec

- [x] 2.1 Remove the "Spike verification of emulator limitations" requirement and its two scenarios from `openspec/specs/integration-testing/spec.md`

## 3. Verify

- [x] 3.1 Run integration tests (`nx run cosmoose:test:integration`) to confirm remaining suites pass without the spike
- [x] 3.2 Run linting (`nx lint cosmoose`) to confirm no broken imports or references to the deleted file
