import { describe, expect, it, vi } from 'vitest';

import { Schema } from '~/schema/schema.js';
import { Type } from '~/types/type.js';

import { QueryBuilder } from './query-builder.js';

// Minimal mock container — we only test SQL generation via buildQuery()
const mockContainer = {} as never;

function createTestSchema () {
  return new Schema({
    status: { type: Type.STRING as const },
    networkId: { type: Type.STRING as const },
    age: { type: Type.NUMBER as const },
    name: { type: Type.STRING as const },
    createdAt: { type: Type.DATE as const },
  });
}

describe('QueryBuilder', () => {
  describe('SQL generation — equality filters', () => {
    it('should generate SQL for simple equality filter', () => {
      const schema = createTestSchema();
      const qb = new QueryBuilder(mockContainer, schema, 'find', { status: 'active' });
      const query = qb.buildQuery();
      expect(query.query).toContain('WHERE r.status = @status');
      expect(query.parameters).toContainEqual({ name: '@status', value: 'active' });
    });

    it('should join multiple equality filters with AND', () => {
      const schema = createTestSchema();
      const qb = new QueryBuilder(mockContainer, schema, 'find', {
        status: 'active',
        networkId: 'net1',
      });
      const query = qb.buildQuery();
      expect(query.query).toContain('r.status = @status');
      expect(query.query).toContain('AND');
      expect(query.query).toContain('r.networkId = @networkId');
    });

    it('should handle nested field access with dot notation', () => {
      const schema = createTestSchema();
      const qb = new QueryBuilder(mockContainer, schema, 'find', { 'settings.theme': 'dark' });
      const query = qb.buildQuery();
      expect(query.query).toContain('r.settings.theme = @settings_theme');
    });
  });

  describe('SQL generation — comparison operators', () => {
    it('should generate $gt operator', () => {
      const schema = createTestSchema();
      const qb = new QueryBuilder(mockContainer, schema, 'find', { age: { $gt: 18 } });
      const query = qb.buildQuery();
      expect(query.query).toContain('r.age > @age_0');
      expect(query.parameters).toContainEqual({ name: '@age_0', value: 18 });
    });

    it('should generate $gte operator', () => {
      const schema = createTestSchema();
      const qb = new QueryBuilder(mockContainer, schema, 'find', { age: { $gte: 18 } });
      const query = qb.buildQuery();
      expect(query.query).toContain('r.age >= @age_0');
    });

    it('should generate $lt operator', () => {
      const schema = createTestSchema();
      const qb = new QueryBuilder(mockContainer, schema, 'find', { age: { $lt: 65 } });
      const query = qb.buildQuery();
      expect(query.query).toContain('r.age < @age_0');
    });

    it('should generate $lte operator', () => {
      const schema = createTestSchema();
      const qb = new QueryBuilder(mockContainer, schema, 'find', { age: { $lte: 65 } });
      const query = qb.buildQuery();
      expect(query.query).toContain('r.age <= @age_0');
    });

    it('should generate $in operator', () => {
      const schema = createTestSchema();
      const qb = new QueryBuilder(mockContainer, schema, 'find', {
        status: { $in: [ 'active', 'pending' ] },
      });
      const query = qb.buildQuery();
      expect(query.query).toContain('r.status IN (@status_0_0, @status_0_1)');
      expect(query.parameters).toContainEqual({ name: '@status_0_0', value: 'active' });
      expect(query.parameters).toContainEqual({ name: '@status_0_1', value: 'pending' });
    });

    it('should combine multiple comparison operators with AND', () => {
      const schema = createTestSchema();
      const qb = new QueryBuilder(mockContainer, schema, 'find', { age: { $gte: 18, $lt: 65 } });
      const query = qb.buildQuery();
      expect(query.query).toContain('r.age >= @age_0');
      expect(query.query).toContain('AND');
      expect(query.query).toContain('r.age < @age_1');
    });
  });

  describe('SQL generation — logical operators', () => {
    it('should generate $or operator', () => {
      const schema = createTestSchema();
      const qb = new QueryBuilder(mockContainer, schema, 'find', {
        $or: [ { status: 'active' }, { status: 'pending' } ],
      });
      const query = qb.buildQuery();
      expect(query.query).toContain('((r.status = @status0) OR (r.status = @status1))');
    });

    it('should handle $or with multiple fields per clause', () => {
      const schema = createTestSchema();
      const qb = new QueryBuilder(mockContainer, schema, 'find', {
        $or: [
          { status: 'active', age: { $gt: 18 } },
          { networkId: 'net1' },
        ],
      });
      const query = qb.buildQuery();
      expect(query.query).toContain('OR');
      expect(query.query).toContain('r.status');
      expect(query.query).toContain('r.networkId');
    });
  });

  describe('SQL generation — sorting', () => {
    it('should generate ascending sort', () => {
      const schema = createTestSchema();
      const qb = new QueryBuilder(mockContainer, schema, 'find', {});
      qb.sort({ createdAt: 1 });
      const query = qb.buildQuery();
      expect(query.query).toContain('ORDER BY r[\'createdAt\'] ASC');
    });

    it('should generate descending sort', () => {
      const schema = createTestSchema();
      const qb = new QueryBuilder(mockContainer, schema, 'find', {});
      qb.sort({ createdAt: -1 });
      const query = qb.buildQuery();
      expect(query.query).toContain('ORDER BY r[\'createdAt\'] DESC');
    });

    it('should generate multiple sort fields', () => {
      const schema = createTestSchema();
      const qb = new QueryBuilder(mockContainer, schema, 'find', {});
      qb.sort({ status: 1, createdAt: -1 });
      const query = qb.buildQuery();
      expect(query.query).toContain('ORDER BY r[\'status\'] ASC, r[\'createdAt\'] DESC');
    });
  });

  describe('SQL generation — pagination', () => {
    it('should use default offset 0 and limit 50 for find', () => {
      const schema = createTestSchema();
      const qb = new QueryBuilder(mockContainer, schema, 'find', {});
      const query = qb.buildQuery();
      expect(query.query).toContain('OFFSET 0 LIMIT 50');
    });

    it('should apply custom limit and offset', () => {
      const schema = createTestSchema();
      const qb = new QueryBuilder(mockContainer, schema, 'find', {});
      qb.limit(20).offset(40);
      const query = qb.buildQuery();
      expect(query.query).toContain('OFFSET 40 LIMIT 20');
    });

    it('should use LIMIT 1 for findOne', () => {
      const schema = createTestSchema();
      const qb = new QueryBuilder(mockContainer, schema, 'findOne', {});
      const query = qb.buildQuery();
      expect(query.query).toContain('OFFSET 0 LIMIT 1');
    });
  });

  describe('SQL generation — count', () => {
    it('should generate SELECT VALUE COUNT(1) for count query', () => {
      const schema = createTestSchema();
      const qb = new QueryBuilder(mockContainer, schema, 'count', { status: 'active' });
      const query = qb.buildQuery();
      expect(query.query).toContain('SELECT VALUE COUNT(1) FROM root r');
      expect(query.query).toContain('WHERE r.status = @status');
      expect(query.query).not.toContain('OFFSET');
      expect(query.query).not.toContain('ORDER BY');
    });
  });

  describe('SQL generation — findAll', () => {
    it('should not apply OFFSET/LIMIT for findAll', () => {
      const schema = createTestSchema();
      const qb = new QueryBuilder(mockContainer, schema, 'findAll', {});
      const query = qb.buildQuery();
      expect(query.query).not.toContain('OFFSET');
      expect(query.query).not.toContain('LIMIT');
    });
  });

  describe('parameterization', () => {
    it('should never interpolate values into SQL string', () => {
      const schema = createTestSchema();
      const qb = new QueryBuilder(mockContainer, schema, 'find', {
        status: '\'; DROP TABLE users; --',
      });
      const query = qb.buildQuery();
      expect(query.query).not.toContain('\'; DROP TABLE');
      expect(query.query).toContain('@status');
      expect(query.parameters).toContainEqual({
        name: '@status',
        value: '\'; DROP TABLE users; --',
      });
    });
  });

  describe('chaining', () => {
    it('should support method chaining returning this', () => {
      const schema = createTestSchema();
      const qb = new QueryBuilder(mockContainer, schema, 'find', {});
      const result = qb.sort({ name: 1 }).limit(10).offset(5);
      expect(result).toBe(qb);
    });
  });

  describe('exec()', () => {
    function createMockContainer () {
      const mockItems = {
        query: vi.fn(),
      };
      return { items: mockItems } as never;
    }

    function createMockContainerWith (queryResult: unknown) {
      const container = {
        items: {
          query: vi.fn().mockReturnValue({
            fetchAll: vi.fn().mockResolvedValue(queryResult),
          }),
        },
      };
      return container as never;
    }

    it('should execute count query and return number', async () => {
      const container = createMockContainerWith({ resources: [ 42 ] });
      const schema = createTestSchema();
      const qb = new QueryBuilder(container, schema, 'count', { status: 'active' });

      const result = await qb.exec();
      expect(result).toBe(42);
    });

    it('should execute find query and return documents', async () => {
      const container = createMockContainerWith({
        resources: [
          { id: 'a', status: 'active', networkId: 'n1', age: 25, name: 'Alice', createdAt: '2024-01-01T00:00:00.000Z' },
        ],
      });
      const schema = createTestSchema();
      const qb = new QueryBuilder(container, schema, 'find', {});

      const result = await qb.exec();
      expect(result).toHaveLength(1);
    });

    it('should execute findOne and return single document', async () => {
      const container = createMockContainerWith({
        resources: [
          { id: 'a', status: 'active', networkId: 'n1', age: 25, name: 'Alice', createdAt: '2024-01-01T00:00:00.000Z' },
        ],
      });
      const schema = createTestSchema();
      const qb = new QueryBuilder(container, schema, 'findOne', {});

      const result = await qb.exec();
      expect(result).toBeDefined();
      expect((result as Record<string, unknown>).id).toBe('a');
    });

    it('should return undefined for findOne when no results', async () => {
      const container = createMockContainerWith({ resources: [] });
      const schema = createTestSchema();
      const qb = new QueryBuilder(container, schema, 'findOne', {});

      const result = await qb.exec();
      expect(result).toBeUndefined();
    });

    it('should execute findAll using async iterator', async () => {
      const asyncIterator = (async function* () {
        yield { resources: [ { id: 'a', status: 'active', networkId: 'n1', age: 25, name: 'Alice', createdAt: '2024-01-01T00:00:00.000Z' } ] };
        yield { resources: [ { id: 'b', status: 'active', networkId: 'n1', age: 30, name: 'Bob', createdAt: '2024-01-01T00:00:00.000Z' } ] };
      })();
      const container = {
        items: {
          query: vi.fn().mockReturnValue({
            getAsyncIterator: () => asyncIterator,
          }),
        },
      } as never;
      const schema = createTestSchema();
      const qb = new QueryBuilder(container, schema, 'findAll', {});

      const result = await qb.exec();
      expect(result).toHaveLength(2);
    });

    it('should execute findAsCursor and return cursor', async () => {
      const asyncIterator = (async function* () {
        yield { resources: [ { id: 'a', status: 'active', networkId: 'n1', age: 25, name: 'Alice', createdAt: '2024-01-01T00:00:00.000Z' } ] };
      })();
      const container = {
        items: {
          query: vi.fn().mockReturnValue({
            getAsyncIterator: () => asyncIterator,
          }),
        },
      } as never;
      const schema = createTestSchema();
      const qb = new QueryBuilder(container, schema, 'findAsCursor', {});

      const cursor = await qb.exec();
      const docs: unknown[] = [];
      await (cursor as { each: (fn: (doc: unknown) => void) => Promise<void> }).each((doc) => { docs.push(doc); });
      expect(docs).toHaveLength(1);
    });

    it('should execute findAsTokenPagination and return paginated result', async () => {
      const container = {
        items: {
          query: vi.fn().mockReturnValue({
            fetchNext: vi.fn().mockResolvedValue({
              resources: [ { id: 'a', status: 'active', networkId: 'n1', age: 25, name: 'Alice', createdAt: '2024-01-01T00:00:00.000Z' } ],
              continuationToken: '{"token":"abc"}',
            }),
          }),
        },
      } as never;
      const schema = createTestSchema();
      const qb = new QueryBuilder(container, schema, 'findAsTokenPagination', {});

      const result = await qb.exec() as { data: unknown[]; pagination: { next: string | undefined } };
      expect(result.data).toHaveLength(1);
      expect(result.pagination.next).toBeDefined();
    });

    it('should handle findAsTokenPagination with no continuation', async () => {
      const container = {
        items: {
          query: vi.fn().mockReturnValue({
            fetchNext: vi.fn().mockResolvedValue({
              resources: [ { id: 'a', status: 'active', networkId: 'n1', age: 25, name: 'Alice', createdAt: '2024-01-01T00:00:00.000Z' } ],
              continuationToken: undefined,
            }),
          }),
        },
      } as never;
      const schema = createTestSchema();
      const qb = new QueryBuilder(container, schema, 'findAsTokenPagination', {});

      const result = await qb.exec() as { data: unknown[]; pagination: { next: string | undefined } };
      expect(result.pagination.next).toBeUndefined();
    });

    it('should handle findAsTokenPagination with null resources', async () => {
      const container = {
        items: {
          query: vi.fn().mockReturnValue({
            fetchNext: vi.fn().mockResolvedValue({
              resources: null,
              continuationToken: undefined,
            }),
          }),
        },
      } as never;
      const schema = createTestSchema();
      const qb = new QueryBuilder(container, schema, 'findAsTokenPagination', {});

      const result = await qb.exec() as { data: unknown[]; pagination: { next: string | undefined } };
      expect(result.data).toHaveLength(0);
    });

    it('should decode paginationToken when provided', async () => {
      const continuationValue = '{"token":"abc"}';
      const token = Buffer.from(continuationValue, 'utf-8').toString('base64url');
      const fetchNextFn = vi.fn().mockResolvedValue({
        resources: [],
        continuationToken: undefined,
      });
      const container = {
        items: {
          query: vi.fn().mockReturnValue({
            fetchNext: fetchNextFn,
          }),
        },
      } as never;
      const schema = createTestSchema();
      const qb = new QueryBuilder(container, schema, 'findAsTokenPagination', {}, { paginationToken: token });

      await qb.exec();
      const queryCallOptions = (container as { items: { query: ReturnType<typeof vi.fn> } }).items.query.mock.calls[0][1];
      expect(queryCallOptions.continuation).toBe(continuationValue);
    });
  });

  describe('then()', () => {
    it('should be thenable (await/then support)', async () => {
      const container = createMockContainerWith({ resources: [ 5 ] });
      const schema = createTestSchema();
      const qb = new QueryBuilder(container, schema, 'count', {});

      const result = await qb;
      expect(result).toBe(5);

      function createMockContainerWith (queryResult: unknown) {
        return {
          items: {
            query: vi.fn().mockReturnValue({
              fetchAll: vi.fn().mockResolvedValue(queryResult),
            }),
          },
        } as never;
      }
    });
  });

  describe('$and operator', () => {
    it('should generate $and conditions', () => {
      const schema = createTestSchema();
      const qb = new QueryBuilder(mockContainer, schema, 'find', {
        $and: [
          { status: 'active' },
          { age: { $gt: 18 } },
        ],
      });
      const query = qb.buildQuery();
      expect(query.query).toContain('r.status = @status0');
      expect(query.query).toContain('r.age > @age_10');
    });

    it('should handle empty $and array', () => {
      const schema = createTestSchema();
      const qb = new QueryBuilder(mockContainer, schema, 'find', {
        $and: [],
      });
      const query = qb.buildQuery();
      expect(query.query).not.toContain('WHERE');
    });

    it('should skip empty clauses in $and', () => {
      const schema = createTestSchema();
      const qb = new QueryBuilder(mockContainer, schema, 'find', {
        $and: [ {}, { status: 'active' } ],
      });
      const query = qb.buildQuery();
      expect(query.query).toContain('r.status = @status1');
    });
  });

  describe('$or edge cases', () => {
    it('should handle empty $or array', () => {
      const schema = createTestSchema();
      const qb = new QueryBuilder(mockContainer, schema, 'find', {
        $or: [],
      });
      const query = qb.buildQuery();
      expect(query.query).not.toContain('WHERE');
    });

    it('should handle $or with empty clause', () => {
      const schema = createTestSchema();
      const qb = new QueryBuilder(mockContainer, schema, 'find', {
        $or: [ {}, { status: 'active' } ],
      });
      const query = qb.buildQuery();
      expect(query.query).toContain('r.status');
    });
  });

  describe('filter with Date value', () => {
    it('should treat Date as simple equality value', () => {
      const schema = createTestSchema();
      const date = new Date('2024-01-01');
      const qb = new QueryBuilder(mockContainer, schema, 'find', {
        createdAt: date,
      });
      const query = qb.buildQuery();
      expect(query.query).toContain('r.createdAt = @createdAt');
      expect(query.parameters).toContainEqual({ name: '@createdAt', value: date });
    });
  });

  describe('filter with array value', () => {
    it('should treat array as simple equality value', () => {
      const schema = createTestSchema();
      const qb = new QueryBuilder(mockContainer, schema, 'find', {
        status: [ 'a', 'b' ],
      });
      const query = qb.buildQuery();
      expect(query.query).toContain('r.status = @status');
    });
  });

  describe('SQL generation — findAsCursor query', () => {
    it('should not include OFFSET/LIMIT for findAsCursor', () => {
      const schema = createTestSchema();
      const qb = new QueryBuilder(mockContainer, schema, 'findAsCursor', {});
      const query = qb.buildQuery();
      expect(query.query).not.toContain('OFFSET');
      expect(query.query).not.toContain('LIMIT');
    });
  });

  describe('SQL generation — findAsTokenPagination query', () => {
    it('should not include OFFSET/LIMIT for findAsTokenPagination', () => {
      const schema = createTestSchema();
      const qb = new QueryBuilder(mockContainer, schema, 'findAsTokenPagination', {});
      const query = qb.buildQuery();
      expect(query.query).not.toContain('OFFSET');
      expect(query.query).not.toContain('LIMIT');
    });
  });

  describe('sort is ignored for count', () => {
    it('should not include ORDER BY for count queries', () => {
      const schema = createTestSchema();
      const qb = new QueryBuilder(mockContainer, schema, 'count', {});
      qb.sort({ name: 1 });
      const query = qb.buildQuery();
      expect(query.query).not.toContain('ORDER BY');
    });
  });
});
