import { afterAll,beforeAll, describe, expect, it } from 'vitest';

import { Cosmoose } from '~/connection/cosmoose.js';
import { Model } from '~/model/model.js';
import { Schema } from '~/schema/schema.js';
import { Type } from '~/types/type.js';

import { cleanupDatabase, createConnectedCosmoose, uniqueDatabaseName } from './helpers.js';

interface Product {
  name: string;
  category: string;
  price: number;
}

describe('Query Integration', () => {
  let cosmoose: Cosmoose;
  let productModel: Model<Product>;
  const dbName = uniqueDatabaseName('query');

  const productSchema = new Schema<Product>({
    name: { type: Type.STRING },
    category: { type: Type.STRING },
    price: { type: Type.NUMBER },
  }, {
    container: { partitionKey: '/category' },
  });

  beforeAll(async () => {
    cosmoose = await createConnectedCosmoose(dbName);
    productModel = cosmoose.model('Products', productSchema);
    await cosmoose.syncContainers();

    // Seed test data
    await productModel.createBatch([
      { name: 'Widget A', category: 'widgets', price: 10 },
      { name: 'Widget B', category: 'widgets', price: 20 },
      { name: 'Widget C', category: 'widgets', price: 30 },
      { name: 'Gadget X', category: 'gadgets', price: 50 },
      { name: 'Gadget Y', category: 'gadgets', price: 100 },
    ]);
  });

  afterAll(async () => {
    await cleanupDatabase(cosmoose);
  });

  describe('equality filter', () => {
    it('should return only matching documents', async () => {
      const results = await productModel.find({ category: 'widgets' }).limit(10);

      expect(results).toHaveLength(3);
      expect(results.every(p => p.category === 'widgets')).toBe(true);
    });

    it('should return empty array for no matches', async () => {
      const results = await productModel.find({ category: 'nonexistent' }).limit(10);

      expect(results).toHaveLength(0);
    });
  });

  describe('ordering', () => {
    it('should sort ascending', async () => {
      const results = await productModel.find({ category: 'widgets' }).sort({ price: 1 }).limit(10);

      expect(results).toHaveLength(3);
      expect(results[0].price).toBe(10);
      expect(results[1].price).toBe(20);
      expect(results[2].price).toBe(30);
    });

    it('should sort descending', async () => {
      const results = await productModel.find({ category: 'widgets' }).sort({ price: -1 }).limit(10);

      expect(results).toHaveLength(3);
      expect(results[0].price).toBe(30);
      expect(results[1].price).toBe(20);
      expect(results[2].price).toBe(10);
    });
  });

  describe('limit and offset', () => {
    it('should respect limit', async () => {
      const results = await productModel.find({ category: 'widgets' }).sort({ price: 1 }).limit(2);

      expect(results).toHaveLength(2);
    });

    it('should respect offset', async () => {
      const results = await productModel.find({ category: 'widgets' }).sort({ price: 1 }).limit(2).offset(1);

      expect(results).toHaveLength(2);
      expect(results[0].price).toBe(20);
      expect(results[1].price).toBe(30);
    });
  });

  describe('findOne', () => {
    it('should return a single document', async () => {
      const result = await productModel.findOne({ name: 'Gadget X' });

      expect(result).toBeDefined();
      expect(result!.name).toBe('Gadget X');
      expect(result!.price).toBe(50);
    });

    it('should return undefined for no match', async () => {
      const result = await productModel.findOne({ name: 'Nonexistent' });
      expect(result).toBeUndefined();
    });
  });

  describe('findAll', () => {
    it('should return all matching documents without limit', async () => {
      const results = await productModel.findAll({ category: 'gadgets' });

      expect(results).toHaveLength(2);
    });
  });

  describe('count', () => {
    it('should count matching documents', async () => {
      const count = await productModel.count({ category: 'widgets' });
      expect(count).toBe(3);
    });

    it('should return 0 for no matches', async () => {
      const count = await productModel.count({ category: 'nonexistent' });
      expect(count).toBe(0);
    });
  });

  describe('comparison operators', () => {
    it('should filter with $gt', async () => {
      const results = await productModel.find({ price: { $gt: 20 } }).limit(10);

      expect(results.length).toBeGreaterThan(0);
      expect(results.every(p => p.price > 20)).toBe(true);
    });

    it('should filter with $lte', async () => {
      const results = await productModel.find({ price: { $lte: 20 } }).limit(10);

      expect(results.length).toBeGreaterThan(0);
      expect(results.every(p => p.price <= 20)).toBe(true);
    });

    it('should filter with $in', async () => {
      const results = await productModel.find({ price: { $in: [ 10, 50 ] } }).limit(10);

      expect(results).toHaveLength(2);
      expect(results.every(p => [ 10, 50 ].includes(p.price))).toBe(true);
    });
  });

  describe('findByIds', () => {
    it('should return documents by multiple ids', async () => {
      const all = await productModel.findAll({});
      const ids = all.slice(0, 2).map(p => p.id);

      const results = await productModel.findByIds(ids);

      expect(results).toHaveLength(2);
      expect(results.map(r => r.id).sort()).toEqual(ids.sort());
    });
  });

  describe('logical operators', () => {
    it('should filter with $or', async () => {
      const results = await productModel.find({
        $or: [
          { category: 'widgets' },
          { price: 100 },
        ],
      }).limit(10);

      // All 3 widgets + Gadget Y (price 100)
      expect(results).toHaveLength(4);
    });

    it('should filter with $and', async () => {
      const results = await productModel.find({
        $and: [
          { category: 'widgets' },
          { price: { $gt: 10 } },
        ],
      }).limit(10);

      // Widget B (20) and Widget C (30)
      expect(results).toHaveLength(2);
      expect(results.every(p => p.category === 'widgets' && p.price > 10)).toBe(true);
    });

    it('should combine $or with equality', async () => {
      const results = await productModel.find({
        category: 'gadgets',
        $or: [
          { price: 50 },
          { price: 100 },
        ],
      }).limit(10);

      expect(results).toHaveLength(2);
      expect(results.every(p => p.category === 'gadgets')).toBe(true);
    });
  });

  describe('findAsCursor', () => {
    it('should iterate over all matching documents via cursor', async () => {
      const collected: Product[] = [];
      const cursor = await productModel.findAsCursor({ category: 'widgets' }, { batchSize: 2 });

      await cursor.each((doc) => {
        collected.push(doc as unknown as Product);
      });

      expect(collected).toHaveLength(3);
      expect(collected.every(p => p.category === 'widgets')).toBe(true);
    });
  });

  describe('findAsTokenPagination', () => {
    it('should paginate with continuation tokens', async () => {
      // First page
      const page1 = await productModel.findAsTokenPagination({}, { limit: 2 });

      expect(page1.data).toHaveLength(2);
      expect(page1.pagination.next).toBeDefined();

      // Second page using the continuation token
      const page2 = await productModel.findAsTokenPagination({}, {
        limit: 2,
        paginationToken: page1.pagination.next,
      });

      expect(page2.data).toHaveLength(2);

      // Ensure no overlap between pages
      const page1Ids = page1.data.map(d => d.id);
      const page2Ids = page2.data.map(d => d.id);
      expect(page1Ids.every(id => !page2Ids.includes(id))).toBe(true);
    });
  });
});
