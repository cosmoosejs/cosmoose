import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { Cosmoose } from '~/connection/cosmoose.js';
import { Model } from '~/model/model.js';
import { Schema } from '~/schema/schema.js';
import { Type } from '~/types/type.js';

import { cleanupDatabase, createConnectedCosmoose, uniqueDatabaseName } from './helpers.js';

interface Item {
  name: string;
  category: string;
  quantity: number;
}

describe('Bulk Operations Integration', () => {
  let cosmoose: Cosmoose;
  let itemModel: Model<Item>;
  const dbName = uniqueDatabaseName('bulk');

  const itemSchema = new Schema<Item>({
    name: { type: Type.STRING },
    category: { type: Type.STRING },
    quantity: { type: Type.NUMBER },
  }, {
    timestamps: true,
    container: { partitionKey: '/category' },
  });

  beforeAll(async () => {
    cosmoose = await createConnectedCosmoose(dbName);
    itemModel = cosmoose.model('Items', itemSchema);
    await cosmoose.syncContainers();
  });

  afterAll(async () => {
    await cleanupDatabase(cosmoose);
  });

  describe('createBatch', () => {
    it('should create multiple documents in a single batch', async () => {
      const items = [
        { name: 'Item 1', category: 'tools', quantity: 5 },
        { name: 'Item 2', category: 'tools', quantity: 10 },
        { name: 'Item 3', category: 'tools', quantity: 15 },
      ];

      const result = await itemModel.createBatch(items);

      expect(result.succeed).toHaveLength(3);
      expect(result.failed).toHaveLength(0);
      expect(result.succeed.every(d => d.id)).toBe(true);
      expect(result.succeed.every(d => d.createdAt instanceof Date)).toBe(true);
    });

    it('should be individually retrievable after batch create', async () => {
      const items = [
        { name: 'Retrievable A', category: 'parts', quantity: 1 },
        { name: 'Retrievable B', category: 'parts', quantity: 2 },
      ];

      const result = await itemModel.createBatch(items);

      for (const created of result.succeed) {
        const found = await itemModel.getById(created.id, { partitionKeyValue: created.category });
        expect(found).toBeDefined();
        expect(found!.name).toBe(created.name);
        expect(found!.quantity).toBe(created.quantity);
      }
    });

    it('should handle validation failures in batch', async () => {
      const items = [
        { name: 'Valid', category: 'stuff', quantity: 1 },
        { name: 123 as unknown as string, category: 'stuff', quantity: 2 }, // invalid — name should be string
      ];

      const result = await itemModel.createBatch(items);

      expect(result.succeed).toHaveLength(1);
      expect(result.failed).toHaveLength(1);
    });
  });

  describe('upsertBatch', () => {
    it('should upsert multiple documents', async () => {
      const items = [
        { name: 'Upsert 1', category: 'electronics', quantity: 100 },
        { name: 'Upsert 2', category: 'electronics', quantity: 200 },
      ];

      const result = await itemModel.upsertBatch(items);

      expect(result.succeed).toHaveLength(2);
      expect(result.failed).toHaveLength(0);
    });
  });

  describe('deleteMany', () => {
    it('should delete all documents matching a filter', async () => {
      // Create some documents to delete
      await itemModel.createBatch([
        { name: 'Delete Me 1', category: 'disposable', quantity: 1 },
        { name: 'Delete Me 2', category: 'disposable', quantity: 2 },
        { name: 'Delete Me 3', category: 'disposable', quantity: 3 },
      ]);

      // Verify they exist
      const beforeCount = await itemModel.count({ category: 'disposable' });
      expect(beforeCount).toBe(3);

      // Delete all in category
      await itemModel.deleteMany({ category: 'disposable' });

      // Verify they're gone
      const afterCount = await itemModel.count({ category: 'disposable' });
      expect(afterCount).toBe(0);
    });
  });
});
