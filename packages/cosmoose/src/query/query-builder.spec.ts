import { describe, expect, it } from 'vitest';

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
});
