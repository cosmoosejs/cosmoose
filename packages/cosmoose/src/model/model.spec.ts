import { describe, expect, it, vi } from 'vitest';

import { SchemaValidationFailedException } from '../exceptions/schema-validation-failed.exception.js';
import { Schema } from '../schema/schema.js';
import { Type } from '../types/type.js';
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
});
