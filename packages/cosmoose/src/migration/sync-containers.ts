import { type ContainerDefinition, type Database, type IndexingPolicy,PartitionKeyKind } from '@azure/cosmos';

import type { Schema } from '~/schema/schema.js';
import type { CompositeIndexEntry, ContainerConfig, PartitionKeyDefinition } from '~/types/index.js';

export type ContainerSyncStatus = 'created' | 'updated' | 'drift' | 'unchanged';

export interface DriftDetail {
  property: string;
  expected: unknown;
  actual: unknown;
  mutable: boolean;
  reason?: string;
}

export interface ContainerSyncResult {
  name: string;
  status: ContainerSyncStatus;
  driftDetails?: DriftDetail[];
  updatedProperties?: string[];
}

export type SyncReport = ContainerSyncResult[];

interface RegisteredModel {
  schema: Schema<Record<string, unknown>>;
}

export async function syncContainers (database: Database, models: Map<string, RegisteredModel>): Promise<SyncReport> {
  const report: SyncReport = [];

  for (const [ name, { schema } ] of models) {
    const result = await syncSingleContainer(database, name, schema.getContainerConfig());

    report.push(result);
  }

  return report;
}

export async function syncContainer (database: Database, models: Map<string, RegisteredModel>, name: string): Promise<ContainerSyncResult> {
  const registered = models.get(name);

  if (!registered) {
    throw new Error(`Model "${name}" is not registered.`);
  }

  return syncSingleContainer(database, name, registered.schema.getContainerConfig());
}

async function syncSingleContainer (database: Database, name: string, config: ContainerConfig): Promise<ContainerSyncResult> {
  const partitionKey = resolvePartitionKey(config.partitionKey);
  const uniqueKeyPolicy = config.uniqueKeys
    ? { uniqueKeys: config.uniqueKeys.map((paths) => ({ paths })) }
    : undefined;

  const indexingPolicy = buildIndexingPolicy(config.compositeIndexes);

  const containerDefinition: ContainerDefinition = {
    id: name,
    partitionKey,
    ...(uniqueKeyPolicy ? { uniqueKeyPolicy } : {}),
    ...(indexingPolicy ? { indexingPolicy } : {}),
    ...(config.ttl !== undefined ? { defaultTtl: config.ttl } : {}),
  };

  const { container } = await database.containers.createIfNotExists(containerDefinition);

  // Determine if this was a new creation or existing
  // If the container already exists, check for drift
  const existingDef = await container.read();
  const existingResource = existingDef.resource;

  if (!existingResource) {
    return { name, status: 'created' };
  }

  // Check drift
  const driftDetails: DriftDetail[] = [];
  const updatedProperties: string[] = [];

  // Check partition key drift (immutable)
  if (config.partitionKey) {
    const expectedPaths = getPartitionKeyPaths(config.partitionKey);
    const actualPaths = existingResource.partitionKey?.paths ?? [];

    if (JSON.stringify(expectedPaths) !== JSON.stringify(actualPaths)) {
      driftDetails.push({
        property: 'partitionKey',
        expected: expectedPaths,
        actual: actualPaths,
        mutable: false,
        reason: 'Partition key cannot be changed after container creation. The container must be recreated.',
      });
    }
  }

  // Check unique key policy drift (immutable)
  if (config.uniqueKeys) {
    const expectedUK = config.uniqueKeys.map((paths) => ({ paths }));
    const actualUK = existingResource.uniqueKeyPolicy?.uniqueKeys ?? [];

    if (JSON.stringify(expectedUK) !== JSON.stringify(actualUK)) {
      driftDetails.push({
        property: 'uniqueKeyPolicy',
        expected: expectedUK,
        actual: actualUK,
        mutable: false,
        reason: 'Unique key policy cannot be changed after container creation. The container must be recreated.',
      });
    }
  }

  // Check TTL drift (mutable)
  if (config.ttl !== undefined) {
    const actualTtl = existingResource.defaultTtl;
    if (actualTtl !== config.ttl) {
      try {
        await container.replace({
          ...existingResource,
          defaultTtl: config.ttl,
        });
        updatedProperties.push('ttl');
      } catch {
        driftDetails.push({
          property: 'ttl',
          expected: config.ttl,
          actual: actualTtl,
          mutable: true,
          reason: 'Failed to update TTL.',
        });
      }
    }
  }

  // Check composite index drift (mutable)
  if (config.compositeIndexes) {
    const expectedIndexPolicy = buildIndexingPolicy(config.compositeIndexes);
    const actualComposites = existingResource.indexingPolicy?.compositeIndexes;
    const expectedComposites = expectedIndexPolicy?.compositeIndexes;

    if (JSON.stringify(expectedComposites) !== JSON.stringify(actualComposites)) {
      try {
        const currentIndexingPolicy = existingResource.indexingPolicy ?? {};

        await container.replace({
          ...existingResource,
          indexingPolicy: {
            ...currentIndexingPolicy,
            compositeIndexes: expectedComposites,
          },
        });

        updatedProperties.push('compositeIndexes');
      } catch {
        driftDetails.push({
          property: 'compositeIndexes',
          expected: expectedComposites,
          actual: actualComposites,
          mutable: true,
          reason: 'Failed to update composite indexes.',
        });
      }
    }
  }

  const hasImmutableDrift = driftDetails.some((d) => !d.mutable);
  const hasUpdates = updatedProperties.length > 0;

  if (hasImmutableDrift) {
    return { name, status: 'drift', driftDetails };
  }

  if (hasUpdates) {
    return { name, status: 'updated', updatedProperties, driftDetails: driftDetails.length > 0 ? driftDetails : undefined };
  }

  if (driftDetails.length > 0) {
    return { name, status: 'drift', driftDetails };
  }

  return { name, status: 'unchanged' };
}

function resolvePartitionKey (pk?: PartitionKeyDefinition) {
  if (!pk) {
    return undefined;
  }

  if (typeof pk === 'string') {
    return { paths: [ pk ], kind: PartitionKeyKind.Hash };
  }

  return {
    paths: pk.paths,
    kind: pk.kind === 'MultiHash' ? PartitionKeyKind.MultiHash : PartitionKeyKind.Hash,
  };
}

function getPartitionKeyPaths (pk: PartitionKeyDefinition): string[] {
  if (typeof pk === 'string') {
    return [ pk ];
  }

  return pk.paths;
}

function buildIndexingPolicy (compositeIndexes?: CompositeIndexEntry[]): IndexingPolicy | undefined {
  if (!compositeIndexes || compositeIndexes.length === 0) {
    return undefined;
  }

  return {
    compositeIndexes: compositeIndexes.map((index) =>
      Object.entries(index).map(([ path, order ]) => ({
        path,
        order: order === 1 ? 'ascending' as const : 'descending' as const,
      })),
    ),
  };
}
