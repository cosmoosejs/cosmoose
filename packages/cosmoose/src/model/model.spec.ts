import { describe, expect, it, vi } from 'vitest';

import { SchemaValidationFailedException } from '~/exceptions/schema-validation-failed.exception.js';
import { Schema } from '~/schema/schema.js';
import { Type } from '~/types/type.js';

import { Model } from './model.js';

function createMockContainer () {
  const mockItem = {
    read: vi.fn(),
    replace: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };

  const mockItems = {
    create: vi.fn(),
    query: vi.fn(),
    bulk: vi.fn(),
  };

  const container = {
    item: vi.fn().mockReturnValue(mockItem),
    items: mockItems,
  };

  return { container, mockItem, mockItems };
}

function createTestSchema (options?: { timestamps?: boolean }) {
  return new Schema(
    {
      name: { type: Type.STRING as const },
      email: { type: Type.EMAIL as const },
      age: { type: Type.NUMBER as const, optional: true },
    },
    options,
  );
}

const cosmosMetadata = {
  _etag: '"etag"',
  _ts: 1234567890,
  _rid: 'rid',
  _self: 'self',
  _attachments: 'attachments',
};

describe('Model', () => {
  describe('create()', () => {
    it('should create a document with auto-generated ID', async () => {
      const { container, mockItems } = createMockContainer();
      const schema = createTestSchema();
      const model = new Model(container as never, schema);

      mockItems.create.mockImplementation(async (doc: Record<string, unknown>) => ({
        resource: { ...doc, ...cosmosMetadata },
      }));

      const result = await model.create({ name: 'John', email: 'John@Example.com' });
      expect(result.name).toBe('John');
      expect(result.email).toBe('john@example.com');
      expect(result.id).toMatch(/^[0-9a-f]{32}$/);
    });

    it('should use explicit id when provided', async () => {
      const { container, mockItems } = createMockContainer();
      const schema = createTestSchema();
      const model = new Model(container as never, schema);

      mockItems.create.mockResolvedValue({
        resource: { id: 'custom-id', name: 'John', email: 'john@example.com', ...cosmosMetadata },
      });

      const result = await model.create({ id: 'custom-id', name: 'John', email: 'john@example.com' } as never);
      expect(result.id).toBe('custom-id');
    });

    it('should throw SchemaValidationFailedException on invalid data', async () => {
      const { container } = createMockContainer();
      const schema = createTestSchema();
      const model = new Model(container as never, schema);

      await expect(model.create({} as never)).rejects.toThrow(SchemaValidationFailedException);
    });

    it('should set timestamps when enabled', async () => {
      const { container, mockItems } = createMockContainer();
      const schema = createTestSchema({ timestamps: true });
      const model = new Model(container as never, schema);

      mockItems.create.mockImplementation(async (doc: Record<string, unknown>) => ({
        resource: { ...doc, ...cosmosMetadata },
      }));

      await model.create({ name: 'John', email: 'john@example.com' });
      const createArg = mockItems.create.mock.calls[0][0] as Record<string, unknown>;
      expect(createArg['createdAt']).toBeDefined();
      expect(createArg['updatedAt']).toBeDefined();
      expect(typeof createArg['createdAt']).toBe('string'); // ISO string
    });
  });

  describe('getById()', () => {
    it('should return document when found', async () => {
      const { container, mockItem } = createMockContainer();
      const schema = createTestSchema();
      const model = new Model(container as never, schema);

      mockItem.read.mockResolvedValue({
        resource: { id: 'abc', name: 'John', email: 'john@example.com', ...cosmosMetadata },
      });

      const result = await model.getById('abc');
      expect(result?.name).toBe('John');
    });

    it('should return undefined when not found', async () => {
      const { container, mockItem } = createMockContainer();
      const schema = createTestSchema();
      const model = new Model(container as never, schema);

      mockItem.read.mockRejectedValue({ code: 404 });

      const result = await model.getById('nonexistent');
      expect(result).toBeUndefined();
    });

    it('should use partition key when provided', async () => {
      const { container, mockItem } = createMockContainer();
      const schema = createTestSchema();
      const model = new Model(container as never, schema);

      mockItem.read.mockResolvedValue({
        resource: { id: 'abc', name: 'John', email: 'john@example.com', ...cosmosMetadata },
      });

      await model.getById('abc', { partitionKeyValue: 'pk-value' });
      expect(container.item).toHaveBeenCalledWith('abc', 'pk-value');
    });
  });

  describe('updateById()', () => {
    it('should replace document and return updated', async () => {
      const { container, mockItem } = createMockContainer();
      const schema = createTestSchema();
      const model = new Model(container as never, schema);

      const existing = { id: 'abc', name: 'John', email: 'john@example.com', ...cosmosMetadata };
      mockItem.read.mockResolvedValue({ resource: existing });
      mockItem.replace.mockResolvedValue({
        resource: { ...existing, name: 'Jane' },
      });

      const result = await model.updateById('abc', { name: 'Jane' } as never);
      expect(result?.name).toBe('Jane');
    });

    it('should return undefined when document not found', async () => {
      const { container, mockItem } = createMockContainer();
      const schema = createTestSchema();
      const model = new Model(container as never, schema);

      mockItem.read.mockRejectedValue({ code: 404 });

      const result = await model.updateById('nonexistent', { name: 'Jane' } as never);
      expect(result).toBeUndefined();
    });
  });

  describe('patchById()', () => {
    it('should apply $set operations', async () => {
      const { container, mockItem } = createMockContainer();
      const schema = createTestSchema();
      const model = new Model(container as never, schema);

      mockItem.patch.mockResolvedValue({
        resource: { id: 'abc', name: 'Jane', email: 'jane@example.com', ...cosmosMetadata },
      });

      const result = await model.patchById('abc', { $set: { name: 'Jane' } } as never);
      expect(result?.name).toBe('Jane');

      const patchOps = mockItem.patch.mock.calls[0][0];
      expect(patchOps).toContainEqual({ op: 'set', path: '/name', value: 'Jane' });
    });

    it('should apply implicit $set when no operators', async () => {
      const { container, mockItem } = createMockContainer();
      const schema = createTestSchema();
      const model = new Model(container as never, schema);

      mockItem.patch.mockResolvedValue({
        resource: { id: 'abc', name: 'Jane', email: 'jane@example.com', ...cosmosMetadata },
      });

      await model.patchById('abc', { name: 'Jane' } as never);
      const patchOps = mockItem.patch.mock.calls[0][0];
      expect(patchOps).toContainEqual({ op: 'set', path: '/name', value: 'Jane' });
    });

    it('should apply $incr operations', async () => {
      const { container, mockItem } = createMockContainer();
      const schema = createTestSchema();
      const model = new Model(container as never, schema);

      mockItem.patch.mockResolvedValue({
        resource: { id: 'abc', name: 'John', email: 'john@example.com', age: 26, ...cosmosMetadata },
      });

      await model.patchById('abc', { $incr: { age: 1 } } as never);
      const patchOps = mockItem.patch.mock.calls[0][0];
      expect(patchOps).toContainEqual({ op: 'incr', path: '/age', value: 1 });
    });

    it('should apply $unset operations as remove', async () => {
      const { container, mockItem } = createMockContainer();
      const schema = createTestSchema();
      const model = new Model(container as never, schema);

      mockItem.patch.mockResolvedValue({
        resource: { id: 'abc', name: 'John', email: 'john@example.com', ...cosmosMetadata },
      });

      await model.patchById('abc', { $unset: { age: true } } as never);
      const patchOps = mockItem.patch.mock.calls[0][0];
      expect(patchOps).toContainEqual({ op: 'remove', path: '/age' });
    });

    it('should set null via $set, not remove', async () => {
      const { container, mockItem } = createMockContainer();
      const schema = createTestSchema();
      const model = new Model(container as never, schema);

      mockItem.patch.mockResolvedValue({
        resource: { id: 'abc', name: null, email: 'john@example.com', ...cosmosMetadata },
      });

      await model.patchById('abc', { name: null } as never);
      const patchOps = mockItem.patch.mock.calls[0][0];
      expect(patchOps).toContainEqual({ op: 'set', path: '/name', value: null });
    });

    it('should flatten nested objects to patch paths', async () => {
      const { container, mockItem } = createMockContainer();
      const schema = new Schema({
        settings: { type: Type.ANY as const },
      });
      const model = new Model(container as never, schema);

      mockItem.patch.mockResolvedValue({
        resource: { id: 'abc', settings: { theme: 'dark' }, ...cosmosMetadata },
      });

      await model.patchById('abc', { $set: { settings: { theme: 'dark' } } } as never);
      const patchOps = mockItem.patch.mock.calls[0][0];
      expect(patchOps).toContainEqual({ op: 'set', path: '/settings/theme', value: 'dark' });
    });

    it('should return undefined for non-existing document', async () => {
      const { container, mockItem } = createMockContainer();
      const schema = createTestSchema();
      const model = new Model(container as never, schema);

      mockItem.patch.mockRejectedValue({ code: 404 });

      const result = await model.patchById('nonexistent', { name: 'Jane' } as never);
      expect(result).toBeUndefined();
    });

    it('should add updatedAt when timestamps enabled', async () => {
      const { container, mockItem } = createMockContainer();
      const schema = createTestSchema({ timestamps: true });
      const model = new Model(container as never, schema);

      mockItem.patch.mockResolvedValue({
        resource: {
          id: 'abc',
          name: 'Jane',
          email: 'jane@example.com',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-06-01T00:00:00.000Z',
          ...cosmosMetadata,
        },
      });

      await model.patchById('abc', { name: 'Jane' } as never);
      const patchOps = mockItem.patch.mock.calls[0][0];
      const updatedAtOp = patchOps.find((op: { path: string }) => op.path === '/updatedAt');
      expect(updatedAtOp).toBeDefined();
      expect(updatedAtOp.op).toBe('set');
    });
  });

  describe('deleteById()', () => {
    it('should return true when deleted', async () => {
      const { container, mockItem } = createMockContainer();
      const schema = createTestSchema();
      const model = new Model(container as never, schema);

      mockItem.delete.mockResolvedValue({});

      const result = await model.deleteById('abc');
      expect(result).toBe(true);
    });

    it('should return undefined when not found', async () => {
      const { container, mockItem } = createMockContainer();
      const schema = createTestSchema();
      const model = new Model(container as never, schema);

      mockItem.delete.mockRejectedValue({ code: 404 });

      const result = await model.deleteById('nonexistent');
      expect(result).toBeUndefined();
    });
  });

  describe('query entry points', () => {
    it('find() should return a QueryBuilder', () => {
      const { container } = createMockContainer();
      const schema = createTestSchema();
      const model = new Model(container as never, schema);

      const qb = model.find({ status: 'active' });
      expect(qb).toBeDefined();
      const query = qb.buildQuery();
      expect(query.query).toContain('SELECT * FROM root r');
    });

    it('findOne() should return QueryBuilder with limit 1', () => {
      const { container } = createMockContainer();
      const schema = createTestSchema();
      const model = new Model(container as never, schema);

      const qb = model.findOne({ name: 'John' });
      const query = qb.buildQuery();
      expect(query.query).toContain('LIMIT 1');
    });

    it('count() should return QueryBuilder for count', () => {
      const { container } = createMockContainer();
      const schema = createTestSchema();
      const model = new Model(container as never, schema);

      const qb = model.count({ status: 'active' });
      const query = qb.buildQuery();
      expect(query.query).toContain('SELECT VALUE COUNT(1)');
    });

    it('findAll() should return QueryBuilder without limit', () => {
      const { container } = createMockContainer();
      const schema = createTestSchema();
      const model = new Model(container as never, schema);

      const qb = model.findAll({});
      const query = qb.buildQuery();
      expect(query.query).not.toContain('LIMIT');
    });
  });

  describe('findByIds()', () => {
    it('should query with IN clause', async () => {
      const { container, mockItems } = createMockContainer();
      const schema = createTestSchema();
      const model = new Model(container as never, schema);

      const fetchAll = vi.fn().mockResolvedValue({
        resources: [
          { id: 'a', name: 'Alice', email: 'alice@example.com', ...cosmosMetadata },
          { id: 'b', name: 'Bob', email: 'bob@example.com', ...cosmosMetadata },
        ],
      });
      mockItems.query.mockReturnValue({ fetchAll });

      const results = await model.findByIds([ 'a', 'b' ]);
      expect(results).toHaveLength(2);

      const queryArg = mockItems.query.mock.calls[0][0];
      expect(queryArg.query).toContain('r.id IN (@id0, @id1)');
    });
  });

  describe('rawQuery()', () => {
    it('should execute raw SQL query', async () => {
      const { container, mockItems } = createMockContainer();
      const schema = createTestSchema();
      const model = new Model(container as never, schema);

      const fetchAll = vi.fn().mockResolvedValue({
        resources: [
          { id: 'a', name: 'Alice', email: 'alice@example.com', ...cosmosMetadata },
        ],
      });
      mockItems.query.mockReturnValue({ fetchAll });

      const results = await model.rawQuery({
        query: 'SELECT * FROM c WHERE c.status = @s',
        parameters: [ { name: '@s', value: 'active' } ],
      });
      expect(results).toHaveLength(1);
    });
  });

  describe('getById() edge cases', () => {
    it('should return undefined when resource is undefined', async () => {
      const { container, mockItem } = createMockContainer();
      const schema = createTestSchema();
      const model = new Model(container as never, schema);

      mockItem.read.mockResolvedValue({ resource: undefined });

      const result = await model.getById('abc');
      expect(result).toBeUndefined();
    });

    it('should rethrow non-404 errors', async () => {
      const { container, mockItem } = createMockContainer();
      const schema = createTestSchema();
      const model = new Model(container as never, schema);

      mockItem.read.mockRejectedValue(new Error('connection error'));

      await expect(model.getById('abc')).rejects.toThrow('connection error');
    });
  });

  describe('updateById() edge cases', () => {
    it('should set updatedAt when timestamps enabled', async () => {
      const { container, mockItem } = createMockContainer();
      const schema = createTestSchema({ timestamps: true });
      const model = new Model(container as never, schema);

      const existing = {
        id: 'abc', name: 'John', email: 'john@example.com',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        ...cosmosMetadata,
      };
      mockItem.read.mockResolvedValue({ resource: existing });
      mockItem.replace.mockImplementation(async (doc: Record<string, unknown>) => ({
        resource: { ...doc, ...cosmosMetadata },
      }));

      const result = await model.updateById('abc', { name: 'Jane' } as never);
      expect(result).toBeDefined();

      const replaceArg = mockItem.replace.mock.calls[0][0] as Record<string, unknown>;
      expect(replaceArg['updatedAt']).toBeDefined();
      expect(typeof replaceArg['updatedAt']).toBe('string');
    });

    it('should rethrow non-404 errors from replace', async () => {
      const { container, mockItem } = createMockContainer();
      const schema = createTestSchema();
      const model = new Model(container as never, schema);

      mockItem.read.mockResolvedValue({
        resource: { id: 'abc', name: 'John', email: 'john@example.com', ...cosmosMetadata },
      });
      mockItem.replace.mockRejectedValue(new Error('conflict'));

      await expect(model.updateById('abc', { name: 'Jane' } as never)).rejects.toThrow('conflict');
    });

    it('should return undefined when replace throws 404', async () => {
      const { container, mockItem } = createMockContainer();
      const schema = createTestSchema();
      const model = new Model(container as never, schema);

      mockItem.read.mockResolvedValue({
        resource: { id: 'abc', name: 'John', email: 'john@example.com', ...cosmosMetadata },
      });
      mockItem.replace.mockRejectedValue({ code: 404 });

      const result = await model.updateById('abc', { name: 'Jane' } as never);
      expect(result).toBeUndefined();
    });

    it('should serialize Date fields in merged data', async () => {
      const { container, mockItem } = createMockContainer();
      const schema = new Schema({
        name: { type: Type.STRING as const },
        born: { type: Type.DATE as const, optional: true },
      });
      const model = new Model(container as never, schema);

      const existing = { id: 'abc', name: 'John', ...cosmosMetadata };
      mockItem.read.mockResolvedValue({ resource: existing });
      mockItem.replace.mockImplementation(async (doc: Record<string, unknown>) => ({
        resource: { ...doc, ...cosmosMetadata },
      }));

      const date = new Date('2000-01-01');
      await model.updateById('abc', { born: date } as never);
      const replaceArg = mockItem.replace.mock.calls[0][0] as Record<string, unknown>;
      expect(replaceArg['born']).toBe(date.toISOString());
    });
  });

  describe('patchById() edge cases', () => {
    it('should batch operations when more than 10', async () => {
      const { container, mockItem } = createMockContainer();
      const schema = createTestSchema();
      const model = new Model(container as never, schema);

      mockItem.patch.mockResolvedValue({
        resource: { id: 'abc', name: 'John', email: 'john@example.com', ...cosmosMetadata },
      });

      // Create an expression with 12 fields to exceed the 10-op limit
      const setFields: Record<string, string> = {};
      for (let i = 0; i < 12; i++) {
        setFields[`field${i}`] = `value${i}`;
      }

      await model.patchById('abc', { $set: setFields } as never);
      // Should have called patch multiple times (batches of 10)
      expect(mockItem.patch.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    it('should apply $add operations', async () => {
      const { container, mockItem } = createMockContainer();
      const schema = createTestSchema();
      const model = new Model(container as never, schema);

      mockItem.patch.mockResolvedValue({
        resource: { id: 'abc', name: 'John', email: 'john@example.com', ...cosmosMetadata },
      });

      await model.patchById('abc', { $add: { tags: [ 'new' ] } } as never);
      const patchOps = mockItem.patch.mock.calls[0][0];
      expect(patchOps).toContainEqual({ op: 'add', path: '/tags', value: [ 'new' ] });
    });

    it('should rethrow non-404 errors', async () => {
      const { container, mockItem } = createMockContainer();
      const schema = createTestSchema();
      const model = new Model(container as never, schema);

      mockItem.patch.mockRejectedValue(new Error('server error'));

      await expect(model.patchById('abc', { name: 'Jane' } as never)).rejects.toThrow('server error');
    });

    it('should serialize Date values in patch', async () => {
      const { container, mockItem } = createMockContainer();
      const schema = createTestSchema();
      const model = new Model(container as never, schema);

      mockItem.patch.mockResolvedValue({
        resource: { id: 'abc', name: 'John', email: 'john@example.com', ...cosmosMetadata },
      });

      const date = new Date('2024-06-01');
      await model.patchById('abc', { $set: { born: date } } as never);
      const patchOps = mockItem.patch.mock.calls[0][0];
      expect(patchOps).toContainEqual({ op: 'set', path: '/born', value: date.toISOString() });
    });
  });

  describe('deleteById() edge cases', () => {
    it('should use partition key when provided', async () => {
      const { container, mockItem } = createMockContainer();
      const schema = createTestSchema();
      const model = new Model(container as never, schema);

      mockItem.delete.mockResolvedValue({});

      await model.deleteById('abc', { partitionKeyValue: 'pk' });
      expect(container.item).toHaveBeenCalledWith('abc', 'pk');
    });

    it('should rethrow non-404 errors', async () => {
      const { container, mockItem } = createMockContainer();
      const schema = createTestSchema();
      const model = new Model(container as never, schema);

      mockItem.delete.mockRejectedValue(new Error('server error'));

      await expect(model.deleteById('abc')).rejects.toThrow('server error');
    });
  });

  describe('createBatch()', () => {
    it('should create multiple documents in bulk', async () => {
      const { container, mockItems } = createMockContainer();
      const schema = createTestSchema();
      const model = new Model(container as never, schema);

      mockItems.bulk.mockResolvedValue([
        { statusCode: 201, resourceBody: { id: '1', name: 'Alice', email: 'alice@example.com', ...cosmosMetadata } },
        { statusCode: 201, resourceBody: { id: '2', name: 'Bob', email: 'bob@example.com', ...cosmosMetadata } },
      ]);

      const result = await model.createBatch([
        { name: 'Alice', email: 'alice@example.com' },
        { name: 'Bob', email: 'bob@example.com' },
      ]);

      expect(result.succeed).toHaveLength(2);
      expect(result.failed).toHaveLength(0);
    });

    it('should collect validation failures', async () => {
      const { container, mockItems } = createMockContainer();
      const schema = createTestSchema();
      const model = new Model(container as never, schema);

      mockItems.bulk.mockResolvedValue([
        { statusCode: 201, resourceBody: { id: '1', name: 'Alice', email: 'alice@example.com', ...cosmosMetadata } },
      ]);

      const result = await model.createBatch([
        { name: 'Alice', email: 'alice@example.com' },
        {} as never, // invalid — missing required fields
      ]);

      expect(result.succeed).toHaveLength(1);
      expect(result.failed).toHaveLength(1);
    });

    it('should add timestamps in batch', async () => {
      const { container, mockItems } = createMockContainer();
      const schema = createTestSchema({ timestamps: true });
      const model = new Model(container as never, schema);

      mockItems.bulk.mockImplementation(async (ops: { resourceBody: Record<string, unknown> }[]) =>
        ops.map((op) => ({ statusCode: 201, resourceBody: { ...op.resourceBody, ...cosmosMetadata } })),
      );

      const result = await model.createBatch([
        { name: 'Alice', email: 'alice@example.com' },
      ]);

      expect(result.succeed).toHaveLength(1);
      const bulkArg = mockItems.bulk.mock.calls[0][0];
      expect(bulkArg[0].resourceBody.createdAt).toBeDefined();
      expect(bulkArg[0].resourceBody.updatedAt).toBeDefined();
    });

    it('should use explicit id in batch', async () => {
      const { container, mockItems } = createMockContainer();
      const schema = createTestSchema();
      const model = new Model(container as never, schema);

      mockItems.bulk.mockImplementation(async (ops: { resourceBody: Record<string, unknown> }[]) =>
        ops.map((op) => ({ statusCode: 201, resourceBody: { ...op.resourceBody, ...cosmosMetadata } })),
      );

      const result = await model.createBatch([
        { id: 'custom-id', name: 'Alice', email: 'alice@example.com' } as never,
      ]);

      expect(result.succeed).toHaveLength(1);
      const bulkArg = mockItems.bulk.mock.calls[0][0];
      expect(bulkArg[0].resourceBody.id).toBe('custom-id');
    });

    it('should handle bulk failures with statusCode >= 300', async () => {
      const { container, mockItems } = createMockContainer();
      const schema = createTestSchema();
      const model = new Model(container as never, schema);

      mockItems.bulk.mockResolvedValue([
        { statusCode: 409, resourceBody: { id: '1', name: 'Alice', email: 'alice@example.com' } },
      ]);

      const result = await model.createBatch([
        { name: 'Alice', email: 'alice@example.com' },
      ]);

      expect(result.succeed).toHaveLength(0);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].error).toEqual({ statusCode: 409 });
    });

    it('should retry on 429 when retryOnError is true', async () => {
      const { container, mockItems } = createMockContainer();
      const schema = createTestSchema();
      const model = new Model(container as never, schema);

      let callCount = 0;
      mockItems.bulk.mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return [
            { statusCode: 429, resourceBody: { id: '1', name: 'Alice', email: 'alice@example.com' } },
          ];
        }
        return [
          { statusCode: 201, resourceBody: { id: '1', name: 'Alice', email: 'alice@example.com', ...cosmosMetadata } },
        ];
      });

      const result = await model.createBatch(
        [ { name: 'Alice', email: 'alice@example.com' } ],
        { retryOnError: true },
      );

      expect(callCount).toBe(2);
      expect(result.succeed).toHaveLength(1);
    });
  });

  describe('upsertBatch()', () => {
    it('should upsert multiple documents in bulk', async () => {
      const { container, mockItems } = createMockContainer();
      const schema = createTestSchema();
      const model = new Model(container as never, schema);

      mockItems.bulk.mockResolvedValue([
        { statusCode: 200, resourceBody: { id: '1', name: 'Alice', email: 'alice@example.com', ...cosmosMetadata } },
        { statusCode: 201, resourceBody: { id: '2', name: 'Bob', email: 'bob@example.com', ...cosmosMetadata } },
      ]);

      const result = await model.upsertBatch([
        { name: 'Alice', email: 'alice@example.com' },
        { name: 'Bob', email: 'bob@example.com' },
      ]);

      expect(result.succeed).toHaveLength(2);
      expect(result.failed).toHaveLength(0);
    });

    it('should collect validation failures', async () => {
      const { container, mockItems } = createMockContainer();
      const schema = createTestSchema();
      const model = new Model(container as never, schema);

      mockItems.bulk.mockResolvedValue([
        { statusCode: 200, resourceBody: { id: '1', name: 'Alice', email: 'alice@example.com', ...cosmosMetadata } },
      ]);

      const result = await model.upsertBatch([
        { name: 'Alice', email: 'alice@example.com' },
        {} as never,
      ]);

      expect(result.succeed).toHaveLength(1);
      expect(result.failed).toHaveLength(1);
    });

    it('should handle bulk failures', async () => {
      const { container, mockItems } = createMockContainer();
      const schema = createTestSchema();
      const model = new Model(container as never, schema);

      mockItems.bulk.mockResolvedValue([
        { statusCode: 500, resourceBody: { id: '1' } },
      ]);

      const result = await model.upsertBatch([
        { name: 'Alice', email: 'alice@example.com' },
      ]);

      expect(result.succeed).toHaveLength(0);
      expect(result.failed).toHaveLength(1);
    });

    it('should add timestamps when enabled', async () => {
      const { container, mockItems } = createMockContainer();
      const schema = createTestSchema({ timestamps: true });
      const model = new Model(container as never, schema);

      mockItems.bulk.mockImplementation(async (ops: { resourceBody: Record<string, unknown> }[]) =>
        ops.map((op) => ({ statusCode: 200, resourceBody: { ...op.resourceBody, ...cosmosMetadata } })),
      );

      await model.upsertBatch([ { name: 'Alice', email: 'alice@example.com' } ]);
      const bulkArg = mockItems.bulk.mock.calls[0][0];
      expect(bulkArg[0].resourceBody.createdAt).toBeDefined();
    });

    it('should use explicit id in upsert batch', async () => {
      const { container, mockItems } = createMockContainer();
      const schema = createTestSchema();
      const model = new Model(container as never, schema);

      mockItems.bulk.mockImplementation(async (ops: { resourceBody: Record<string, unknown> }[]) =>
        ops.map((op) => ({ statusCode: 200, resourceBody: { ...op.resourceBody, ...cosmosMetadata } })),
      );

      const result = await model.upsertBatch([
        { id: 'upsert-id', name: 'Alice', email: 'alice@example.com' } as never,
      ]);

      expect(result.succeed).toHaveLength(1);
      const bulkArg = mockItems.bulk.mock.calls[0][0];
      expect(bulkArg[0].resourceBody.id).toBe('upsert-id');
    });
  });

  describe('deleteMany()', () => {
    it('should delete documents matching filter', async () => {
      const { container, mockItems } = createMockContainer();
      const schema = new Schema(
        {
          name: { type: Type.STRING as const },
          email: { type: Type.EMAIL as const },
        },
        { container: { partitionKey: '/name' } },
      );
      const model = new Model(container as never, schema);

      // Mock the cursor (findAsCursor → exec → cursor.each)
      const docs = [
        { id: 'a', name: 'Alice', email: 'alice@example.com', ...cosmosMetadata },
        { id: 'b', name: 'Bob', email: 'bob@example.com', ...cosmosMetadata },
      ];

      const asyncIterator = (async function* () {
        yield { resources: docs };
      })();

      mockItems.query.mockReturnValue({
        getAsyncIterator: () => asyncIterator,
      });

      mockItems.bulk.mockResolvedValue(
        docs.map(() => ({ statusCode: 204 })),
      );

      await model.deleteMany({ status: 'inactive' });

      expect(mockItems.bulk).toHaveBeenCalled();
      const bulkOps = mockItems.bulk.mock.calls[0][0];
      expect(bulkOps).toHaveLength(2);
      expect(bulkOps[0].operationType).toBe('Delete');
    });

    it('should use hierarchical partition key paths', async () => {
      const { container, mockItems } = createMockContainer();
      const schema = new Schema(
        {
          name: { type: Type.STRING as const },
          tenant: { type: Type.STRING as const },
        },
        { container: { partitionKey: { paths: [ '/tenant', '/name' ], kind: 'MultiHash' } } },
      );
      const model = new Model(container as never, schema);

      const docs = [
        { id: 'a', tenant: 't1', name: 'Alice', ...cosmosMetadata },
      ];

      const asyncIterator = (async function* () {
        yield { resources: docs };
      })();

      mockItems.query.mockReturnValue({
        getAsyncIterator: () => asyncIterator,
      });
      mockItems.bulk.mockResolvedValue([ { statusCode: 204 } ]);

      await model.deleteMany({});

      const bulkOps = mockItems.bulk.mock.calls[0][0];
      expect(bulkOps[0].partitionKey).toEqual([ 't1', 'Alice' ]);
    });

    it('should handle schema with no partition key', async () => {
      const { container, mockItems } = createMockContainer();
      const schema = new Schema({
        name: { type: Type.STRING as const },
        email: { type: Type.EMAIL as const },
      });
      const model = new Model(container as never, schema);

      const docs = [
        { id: 'a', name: 'Alice', email: 'alice@example.com', ...cosmosMetadata },
      ];

      const asyncIterator = (async function* () {
        yield { resources: docs };
      })();

      mockItems.query.mockReturnValue({
        getAsyncIterator: () => asyncIterator,
      });
      mockItems.bulk.mockResolvedValue([ { statusCode: 204 } ]);

      await model.deleteMany({});

      const bulkOps = mockItems.bulk.mock.calls[0][0];
      expect(bulkOps[0].partitionKey).toEqual([]);
    });
  });

  describe('create() with Date serialization', () => {
    it('should serialize nested Date fields to ISO strings', async () => {
      const { container, mockItems } = createMockContainer();
      const schema = new Schema({
        name: { type: Type.STRING as const },
        born: { type: Type.DATE as const },
      });
      const model = new Model(container as never, schema);

      const date = new Date('2000-01-01');
      mockItems.create.mockImplementation(async (doc: Record<string, unknown>) => ({
        resource: { ...doc, ...cosmosMetadata },
      }));

      await model.create({ name: 'John', born: date } as never);
      const createArg = mockItems.create.mock.calls[0][0] as Record<string, unknown>;
      expect(createArg['born']).toBe(date.toISOString());
    });

    it('should serialize Date inside nested object', async () => {
      const { container, mockItems } = createMockContainer();
      const addressSchema = new Schema({
        city: { type: Type.STRING as const },
        movedIn: { type: Type.DATE as const },
      });
      const schema = new Schema({
        name: { type: Type.STRING as const },
        address: { type: Type.OBJECT as const, schema: addressSchema },
      });
      const model = new Model(container as never, schema);

      const date = new Date('2024-06-01');
      mockItems.create.mockImplementation(async (doc: Record<string, unknown>) => ({
        resource: { ...doc, ...cosmosMetadata },
      }));

      await model.create({ name: 'John', address: { city: 'NYC', movedIn: date } } as never);
      const createArg = mockItems.create.mock.calls[0][0] as Record<string, unknown>;
      const addr = createArg['address'] as Record<string, unknown>;
      expect(addr['movedIn']).toBe(date.toISOString());
    });
  });

  describe('findAsCursor()', () => {
    it('should return a QueryBuilder for cursor mode', () => {
      const { container } = createMockContainer();
      const schema = createTestSchema();
      const model = new Model(container as never, schema);

      const qb = model.findAsCursor({ status: 'active' }, { batchSize: 50 });
      expect(qb).toBeDefined();
    });
  });

  describe('findAsTokenPagination()', () => {
    it('should return a QueryBuilder for token pagination', () => {
      const { container } = createMockContainer();
      const schema = createTestSchema();
      const model = new Model(container as never, schema);

      const qb = model.findAsTokenPagination({ status: 'active' }, { limit: 10, paginationToken: 'abc' });
      expect(qb).toBeDefined();
    });
  });
});
