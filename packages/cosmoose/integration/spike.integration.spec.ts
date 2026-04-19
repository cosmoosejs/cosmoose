import { CosmosClient, PartitionKeyKind } from '@azure/cosmos';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { cleanupDatabase, createConnectedCosmoose, uniqueDatabaseName } from './helpers.js';
import { Cosmoose } from '~/connection/cosmoose.js';
import { Schema } from '~/schema/schema.js';
import { Type } from '~/types/type.js';

describe('Spike: Emulator Capability Verification', () => {
  let cosmoose: Cosmoose;
  const dbName = uniqueDatabaseName('spike');

  beforeAll(async () => {
    cosmoose = await createConnectedCosmoose(dbName);
  });

  afterAll(async () => {
    await cleanupDatabase(cosmoose);
  });

  describe('Basic CRUD', () => {
    it('should create and read a document', async () => {
      const schema = new Schema({
        name: { type: Type.STRING },
        age: { type: Type.NUMBER },
      }, {
        container: { partitionKey: '/name' },
      });

      const model = cosmoose.model('SpikeUsers', schema);
      await cosmoose.syncContainers();

      const created = await model.create({ name: 'Alice', age: 30 });
      expect(created.id).toBeDefined();
      expect(created.name).toBe('Alice');
      expect(created.age).toBe(30);

      const found = await model.getById(created.id, { partitionKeyValue: 'Alice' });
      expect(found).toBeDefined();
      expect(found!.name).toBe('Alice');
      expect(found!.age).toBe(30);
    });
  });

  describe('Partition key', () => {
    it('should create a container with a partition key', async () => {
      const endpoint = process.env['COSMOS_ENDPOINT']!;
      const key = process.env['COSMOS_KEY']!;
      const client = new CosmosClient({ endpoint, key });

      const db = client.database(dbName);
      const { resource } = await db.container('SpikeUsers').read();

      expect(resource).toBeDefined();
      expect(resource!.partitionKey?.paths).toContain('/name');
    });
  });

  describe('Unique keys', () => {
    it('should create a container with unique keys', async () => {
      const schema = new Schema({
        email: { type: Type.STRING },
        tenantId: { type: Type.STRING },
      }, {
        container: {
          partitionKey: '/tenantId',
          uniqueKeys: [ [ '/email' ] ],
        },
      });

      cosmoose.model('SpikeUniqueUsers', schema);
      const report = await cosmoose.syncContainers();

      const spikeResult = report.find(r => r.name === 'SpikeUniqueUsers');
      expect(spikeResult).toBeDefined();

      // Verify unique key enforcement: insert two docs with same email + partition
      const model = cosmoose.getRegisteredModels().get('SpikeUniqueUsers')!.model;
      await model.create({ email: 'test@test.com', tenantId: 'tenant1' });

      await expect(
        model.create({ email: 'test@test.com', tenantId: 'tenant1' }),
      ).rejects.toThrow();
    });
  });

  describe('TTL', () => {
    it('should create a container with TTL enabled', async () => {
      const schema = new Schema({
        data: { type: Type.STRING },
      }, {
        container: {
          partitionKey: '/data',
          ttl: 3600,
        },
      });

      cosmoose.model('SpikeTTL', schema);
      await cosmoose.syncContainers();

      const endpoint = process.env['COSMOS_ENDPOINT']!;
      const key = process.env['COSMOS_KEY']!;
      const client = new CosmosClient({ endpoint, key });

      const { resource } = await client.database(dbName).container('SpikeTTL').read();
      expect(resource).toBeDefined();
      expect(resource!.defaultTtl).toBe(3600);
    });
  });

  describe('Custom indexing policy (composite indexes)', () => {
    it('should attempt to create a container with composite indexes', async () => {
      const schema = new Schema({
        firstName: { type: Type.STRING },
        lastName: { type: Type.STRING },
        age: { type: Type.NUMBER },
      }, {
        container: {
          partitionKey: '/lastName',
          compositeIndexes: [
            { '/firstName': 1, '/age': -1 },
          ],
        },
      });

      // This may fail or silently ignore composite indexes on the vnext emulator
      let error: unknown;
      try {
        cosmoose.model('SpikeCompositeIndex', schema);
        await cosmoose.syncContainers();
      } catch (e) {
        error = e;
      }

      if (error) {
        console.warn('[SPIKE] Composite indexes REJECTED by emulator:', error);
      } else {
        console.info('[SPIKE] Composite indexes ACCEPTED by emulator');

        // Check if the indexing policy was actually applied
        const endpoint = process.env['COSMOS_ENDPOINT']!;
        const key = process.env['COSMOS_KEY']!;
        const client = new CosmosClient({ endpoint, key });

        const { resource } = await client.database(dbName).container('SpikeCompositeIndex').read();
        const composites = resource?.indexingPolicy?.compositeIndexes;

        if (composites && composites.length > 0) {
          console.info('[SPIKE] Composite indexes APPLIED:', JSON.stringify(composites));
        } else {
          console.warn('[SPIKE] Composite indexes ACCEPTED but NOT applied (silently ignored)');
        }
      }

      // This test always passes — it's a spike to gather information
      expect(true).toBe(true);
    });
  });

  describe('Container replace (update)', () => {
    it('should attempt to update TTL on an existing container', async () => {
      const endpoint = process.env['COSMOS_ENDPOINT']!;
      const key = process.env['COSMOS_KEY']!;
      const client = new CosmosClient({ endpoint, key });

      const container = client.database(dbName).container('SpikeTTL');
      const { resource } = await container.read();

      let error: unknown;
      let result: unknown;
      try {
        const updated = await container.replace({
          ...resource!,
          defaultTtl: 7200,
        });
        result = updated.resource;
      } catch (e) {
        error = e;
      }

      if (error) {
        console.warn('[SPIKE] container.replace() REJECTED by emulator:', error);
      } else {
        console.info('[SPIKE] container.replace() ACCEPTED. New TTL:', (result as Record<string, unknown>)?.['defaultTtl']);
      }

      // Always passes — spike test
      expect(true).toBe(true);
    });
  });

  describe('Bulk operations', () => {
    it('should perform bulk create', async () => {
      const schema = new Schema({
        value: { type: Type.NUMBER },
        category: { type: Type.STRING },
      }, {
        container: { partitionKey: '/category' },
      });

      cosmoose.model('SpikeBulk', schema);
      await cosmoose.syncContainers();

      const model = cosmoose.getRegisteredModels().get('SpikeBulk')!.model;

      const items = Array.from({ length: 5 }, (_, i) => ({
        value: i,
        category: 'test',
      }));

      const result = await model.createBatch(items);
      expect(result.succeed).toHaveLength(5);
      expect(result.failed).toHaveLength(0);
    });
  });

  describe('Query execution', () => {
    it('should execute a SQL query with filter', async () => {
      const model = cosmoose.getRegisteredModels().get('SpikeBulk')!.model;

      const results = await model.find({ category: 'test' }).limit(10);
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((d: Record<string, unknown>) => d['category'] === 'test')).toBe(true);
    });

    it('should execute a query with ordering', async () => {
      const model = cosmoose.getRegisteredModels().get('SpikeBulk')!.model;

      const results = await model.find({ category: 'test' }).sort({ value: 1 }).limit(10);
      expect(results.length).toBeGreaterThan(0);

      for (let i = 1; i < results.length; i++) {
        expect((results[i] as Record<string, unknown>)['value']).toBeGreaterThanOrEqual(
          (results[i - 1] as Record<string, unknown>)['value'] as number,
        );
      }
    });

    it('should execute a count query', async () => {
      const model = cosmoose.getRegisteredModels().get('SpikeBulk')!.model;

      const count = await model.count({ category: 'test' });
      expect(count).toBe(5);
    });
  });
});
