import { CosmosClient } from '@azure/cosmos';
import { afterAll,beforeAll, describe, expect, it } from 'vitest';

import { Cosmoose } from '~/connection/cosmoose.js';
import { Schema } from '~/schema/schema.js';
import { Type } from '~/types/type.js';

import { cleanupDatabase, createConnectedCosmoose, uniqueDatabaseName } from './helpers.js';

describe('syncContainers Integration', () => {
  let cosmoose: Cosmoose;
  let client: CosmosClient;
  const dbName = uniqueDatabaseName('sync');

  beforeAll(async () => {
    cosmoose = await createConnectedCosmoose(dbName);
    client = new CosmosClient({
      endpoint: process.env['COSMOS_ENDPOINT']!,
      key: process.env['COSMOS_KEY']!,
    });
  });

  afterAll(async () => {
    await cleanupDatabase(cosmoose);
  });

  describe('partition key', () => {
    it('should create a container with the specified partition key', async () => {
      const schema = new Schema({
        tenantId: { type: Type.STRING },
        data: { type: Type.STRING },
      }, {
        container: { partitionKey: '/tenantId' },
      });

      cosmoose.model('PartitionTest', schema);
      const report = await cosmoose.syncContainers();

      const result = report.find(r => r.name === 'PartitionTest');
      expect(result).toBeDefined();

      const { resource } = await client.database(dbName).container('PartitionTest').read();
      expect(resource!.partitionKey!.paths).toContain('/tenantId');
    });
  });

  describe('hierarchical partition key', () => {
    it('should create a container with a hierarchical (MultiHash) partition key', async () => {
      const schema = new Schema({
        tenantId: { type: Type.STRING },
        userId: { type: Type.STRING },
        data: { type: Type.STRING },
      }, {
        container: {
          partitionKey: { paths: [ '/tenantId', '/userId' ], kind: 'MultiHash' },
        },
      });

      cosmoose.model('HierarchicalPKTest', schema);
      const report = await cosmoose.syncContainers();

      const result = report.find(r => r.name === 'HierarchicalPKTest');
      expect(result).toBeDefined();

      const { resource } = await client.database(dbName).container('HierarchicalPKTest').read();
      expect(resource!.partitionKey!.paths).toEqual([ '/tenantId', '/userId' ]);
      expect(resource!.partitionKey!.kind).toBe('MultiHash');
    });
  });

  describe('unique keys', () => {
    it('should create a container with unique key constraints', async () => {
      const schema = new Schema({
        email: { type: Type.STRING },
        region: { type: Type.STRING },
      }, {
        container: {
          partitionKey: '/region',
          uniqueKeys: [ [ '/email' ] ],
        },
      });

      cosmoose.model('UniqueKeyTest', schema);
      const report = await cosmoose.syncContainers();

      const result = report.find(r => r.name === 'UniqueKeyTest');
      expect(result).toBeDefined();

      // The emulator may not expose uniqueKeyPolicy via container.read(),
      // but it does enforce the constraint (verified in the enforcement test below)
      const { resource } = await client.database(dbName).container('UniqueKeyTest').read();
      expect(resource).toBeDefined();
    });

    it('should enforce unique key constraint', async () => {
      const model = cosmoose.getRegisteredModels().get('UniqueKeyTest')!.model;

      await model.create({ email: 'unique@test.com', region: 'us' });
      await expect(
        model.create({ email: 'unique@test.com', region: 'us' }),
      ).rejects.toThrow();
    });
  });

  describe('TTL', () => {
    it('should create a container with default TTL', async () => {
      const schema = new Schema({
        value: { type: Type.STRING },
      }, {
        container: {
          partitionKey: '/value',
          ttl: 3600,
        },
      });

      cosmoose.model('TTLTest', schema);
      await cosmoose.syncContainers();

      const { resource } = await client.database(dbName).container('TTLTest').read();
      expect(resource!.defaultTtl).toBe(3600);
    });
  });

  describe('composite indexes', () => {
    it('should create a container with composite indexes', async () => {
      const schema = new Schema({
        firstName: { type: Type.STRING },
        lastName: { type: Type.STRING },
        score: { type: Type.NUMBER },
      }, {
        container: {
          partitionKey: '/lastName',
          compositeIndexes: [
            { '/firstName': 1, '/score': -1 },
          ],
        },
      });

      cosmoose.model('CompositeTest', schema);
      await cosmoose.syncContainers();

      const { resource } = await client.database(dbName).container('CompositeTest').read();
      const composites = resource!.indexingPolicy!.compositeIndexes!;
      expect(composites).toHaveLength(1);
      expect(composites[0]).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: '/firstName', order: 'ascending' }),
          expect.objectContaining({ path: '/score', order: 'descending' }),
        ]),
      );
    });
  });

  describe('TTL update via container replace', () => {
    it('should update TTL on an existing container', async () => {
      // First verify current TTL is 3600
      const { resource: before } = await client.database(dbName).container('TTLTest').read();
      expect(before!.defaultTtl).toBe(3600);

      // Create a new Cosmoose instance with updated TTL schema
      const cosmoose2 = await createConnectedCosmoose(dbName);
      const schema2 = new Schema({
        value: { type: Type.STRING },
      }, {
        container: {
          partitionKey: '/value',
          ttl: 7200,
        },
      });

      cosmoose2.model('TTLTest', schema2);
      const report = await cosmoose2.syncContainers();

      const ttlResult = report.find(r => r.name === 'TTLTest');
      expect(ttlResult!.status).toBe('updated');
      expect(ttlResult!.updatedProperties).toContain('ttl');

      const { resource: after } = await client.database(dbName).container('TTLTest').read();
      expect(after!.defaultTtl).toBe(7200);
    });
  });

  describe('idempotent sync', () => {
    it('should report unchanged when syncing same schema twice', async () => {
      const cosmoose3 = await createConnectedCosmoose(dbName);
      const schema = new Schema({
        tenantId: { type: Type.STRING },
        data: { type: Type.STRING },
      }, {
        container: { partitionKey: '/tenantId' },
      });

      cosmoose3.model('PartitionTest', schema);
      const report = await cosmoose3.syncContainers();

      const result = report.find(r => r.name === 'PartitionTest');
      expect(result!.status).toBe('unchanged');
    });
  });

  describe('drift detection', () => {
    it('should detect immutable partition key drift', async () => {
      // PartitionTest was created with partitionKey '/tenantId'
      // Sync with a different partition key — should report drift
      const cosmoose4 = await createConnectedCosmoose(dbName);
      const schema = new Schema({
        tenantId: { type: Type.STRING },
        data: { type: Type.STRING },
      }, {
        container: { partitionKey: '/data' },
      });

      cosmoose4.model('PartitionTest', schema);
      const report = await cosmoose4.syncContainers();

      const result = report.find(r => r.name === 'PartitionTest');
      expect(result!.status).toBe('drift');
      expect(result!.driftDetails).toBeDefined();
      expect(result!.driftDetails!.some(d => d.property === 'partitionKey' && !d.mutable)).toBe(true);
    });
  });
});
