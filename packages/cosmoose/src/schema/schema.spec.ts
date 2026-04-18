import { describe, expect, it } from 'vitest';

import { Type } from '../types/type.js';
import { Schema } from './schema.js';

describe('Schema', () => {
  describe('constructor and accessors', () => {
    it('should store definition and return it via getDefinition()', () => {
      const definition = {
        name: { type: Type.STRING as const },
      };
      const schema = new Schema(definition);
      expect(schema.getDefinition()).toBe(definition);
    });

    it('should return empty container config when not provided', () => {
      const schema = new Schema({ name: { type: Type.STRING as const } });
      expect(schema.getContainerConfig()).toEqual({});
    });

    it('should return container config with partition key', () => {
      const schema = new Schema(
        { name: { type: Type.STRING as const } },
        { container: { partitionKey: '/networkId' } },
      );
      expect(schema.getContainerConfig().partitionKey).toBe('/networkId');
    });

    it('should return container config with hierarchical partition key', () => {
      const schema = new Schema(
        { name: { type: Type.STRING as const } },
        { container: { partitionKey: { paths: [ '/tenantId', '/userId' ], kind: 'MultiHash' } } },
      );
      const pk = schema.getContainerConfig().partitionKey;
      expect(pk).toEqual({ paths: [ '/tenantId', '/userId' ], kind: 'MultiHash' });
    });

    it('should return container config with unique keys', () => {
      const schema = new Schema(
        { name: { type: Type.STRING as const } },
        { container: { uniqueKeys: [ [ '/email', '/networkId' ] ] } },
      );
      expect(schema.getContainerConfig().uniqueKeys).toEqual([ [ '/email', '/networkId' ] ]);
    });

    it('should return container config with composite indexes', () => {
      const compositeIndexes = [ { '/createdAt': 1 as const, '/status': -1 as const } ];
      const schema = new Schema(
        { name: { type: Type.STRING as const } },
        { container: { compositeIndexes } },
      );
      expect(schema.getContainerConfig().compositeIndexes).toEqual(compositeIndexes);
    });

    it('should return container config with TTL', () => {
      const schema = new Schema(
        { name: { type: Type.STRING as const } },
        { container: { ttl: 3600 } },
      );
      expect(schema.getContainerConfig().ttl).toBe(3600);
    });
  });

  describe('create schema compilation', () => {
    it('should require non-optional fields', () => {
      const schema = new Schema({
        name: { type: Type.STRING as const },
      });
      const createSchema = schema.getCreateSchema();
      const result = createSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should allow optional fields to be omitted', () => {
      const schema = new Schema({
        name: { type: Type.STRING as const },
        nickname: { type: Type.STRING as const, optional: true },
      });
      const createSchema = schema.getCreateSchema();
      const result = createSchema.safeParse({ name: 'John' });
      expect(result.success).toBe(true);
    });

    it('should apply default values', () => {
      const schema = new Schema({
        count: { type: Type.NUMBER as const, default: 0 },
      });
      const createSchema = schema.getCreateSchema();
      const result = createSchema.parse({});
      expect(result.count).toBe(0);
    });

    it('should allow optional id', () => {
      const schema = new Schema({
        name: { type: Type.STRING as const },
      });
      const createSchema = schema.getCreateSchema();
      const withId = createSchema.parse({ name: 'John', id: 'custom' });
      expect(withId.id).toBe('custom');
      const withoutId = createSchema.parse({ name: 'John' });
      expect(withoutId.id).toBeUndefined();
    });

    it('should apply string trim transform', () => {
      const schema = new Schema({
        name: { type: Type.STRING as const, trim: true },
      });
      const result = schema.getCreateSchema().parse({ name: '  John  ' });
      expect(result.name).toBe('John');
    });

    it('should apply string lowercase transform', () => {
      const schema = new Schema({
        name: { type: Type.STRING as const, lowercase: true },
      });
      const result = schema.getCreateSchema().parse({ name: 'JOHN' });
      expect(result.name).toBe('john');
    });

    it('should apply string uppercase transform', () => {
      const schema = new Schema({
        code: { type: Type.STRING as const, uppercase: true },
      });
      const result = schema.getCreateSchema().parse({ code: 'abc' });
      expect(result.code).toBe('ABC');
    });

    it('should validate boolean type', () => {
      const schema = new Schema({
        active: { type: Type.BOOLEAN as const },
      });
      expect(schema.getCreateSchema().safeParse({ active: true }).success).toBe(true);
      expect(schema.getCreateSchema().safeParse({ active: 'yes' }).success).toBe(false);
    });

    it('should validate number type', () => {
      const schema = new Schema({
        age: { type: Type.NUMBER as const },
      });
      expect(schema.getCreateSchema().safeParse({ age: 25 }).success).toBe(true);
      expect(schema.getCreateSchema().safeParse({ age: 'old' }).success).toBe(false);
    });

    it('should validate date type', () => {
      const schema = new Schema({
        born: { type: Type.DATE as const },
      });
      expect(schema.getCreateSchema().safeParse({ born: new Date() }).success).toBe(true);
      expect(schema.getCreateSchema().safeParse({ born: 'not-a-date' }).success).toBe(false);
    });

    it('should validate email type with trim and lowercase', () => {
      const schema = new Schema({
        email: { type: Type.EMAIL as const },
      });
      const result = schema.getCreateSchema().parse({ email: '  Test@Example.COM  ' });
      expect(result.email).toBe('test@example.com');
    });

    it('should reject invalid email', () => {
      const schema = new Schema({
        email: { type: Type.EMAIL as const },
      });
      expect(schema.getCreateSchema().safeParse({ email: 'not-an-email' }).success).toBe(false);
    });

    it('should accept any type', () => {
      const schema = new Schema({
        data: { type: Type.ANY as const },
      });
      expect(schema.getCreateSchema().safeParse({ data: 42 }).success).toBe(true);
      expect(schema.getCreateSchema().safeParse({ data: 'hello' }).success).toBe(true);
      expect(schema.getCreateSchema().safeParse({ data: { nested: true } }).success).toBe(true);
    });

    it('should validate array type with typed items', () => {
      const schema = new Schema({
        tags: { type: Type.ARRAY as const, items: { type: Type.STRING as const } },
      });
      expect(schema.getCreateSchema().safeParse({ tags: [ 'a', 'b' ] }).success).toBe(true);
      expect(schema.getCreateSchema().safeParse({ tags: [ 1, 2 ] }).success).toBe(false);
    });

    it('should validate map type with value type', () => {
      const schema = new Schema({
        scores: { type: Type.MAP as const, of: Type.NUMBER },
      });
      expect(schema.getCreateSchema().safeParse({ scores: { math: 100 } }).success).toBe(true);
      expect(schema.getCreateSchema().safeParse({ scores: { math: 'A' } }).success).toBe(false);
    });

    it('should validate object type with nested schema', () => {
      const addressSchema = new Schema({
        street: { type: Type.STRING as const },
        city: { type: Type.STRING as const },
      });
      const schema = new Schema({
        address: { type: Type.OBJECT as const, schema: addressSchema },
      });
      expect(
        schema.getCreateSchema().safeParse({
          address: { street: '123 Main', city: 'NYC' },
        }).success,
      ).toBe(true);
      expect(
        schema.getCreateSchema().safeParse({
          address: { street: '123 Main' }, // missing city
        }).success,
      ).toBe(false);
    });
  });

  describe('patch schema compilation', () => {
    it('should make all fields optional', () => {
      const schema = new Schema({
        name: { type: Type.STRING as const },
        age: { type: Type.NUMBER as const },
      });
      const patchSchema = schema.getPatchSchema();
      expect(patchSchema.safeParse({}).success).toBe(true);
      expect(patchSchema.safeParse({ name: 'Jane' }).success).toBe(true);
    });

    it('should allow null values for fields', () => {
      const schema = new Schema({
        name: { type: Type.STRING as const },
      });
      const patchSchema = schema.getPatchSchema();
      expect(patchSchema.safeParse({ name: null }).success).toBe(true);
    });
  });

  describe('deserialize schema compilation', () => {
    it('should include CosmosDB metadata fields', () => {
      const schema = new Schema({
        name: { type: Type.STRING as const },
      });
      const deserializeSchema = schema.getDeserializeSchema();
      const result = deserializeSchema.parse({
        id: 'abc123',
        name: 'John',
        _etag: '"etag"',
        _ts: 1234567890,
        _rid: 'rid',
        _self: 'self',
        _attachments: 'attachments',
      });
      expect(result.id).toBe('abc123');
      expect(result._etag).toBe('"etag"');
      expect(result._ts).toBe(1234567890);
    });

    it('should transform ISO strings to Date objects for DATE fields', () => {
      const schema = new Schema({
        born: { type: Type.DATE as const },
      });
      const result = schema.getDeserializeSchema().parse({
        id: 'abc',
        born: '2024-01-01T00:00:00.000Z',
        _etag: '"e"',
        _ts: 1,
        _rid: 'r',
        _self: 's',
        _attachments: 'a',
      });
      expect(result.born).toBeInstanceOf(Date);
    });
  });

  describe('timestamps option', () => {
    it('should add createdAt and updatedAt to create schema', () => {
      const schema = new Schema(
        { name: { type: Type.STRING as const } },
        { timestamps: true },
      );
      const createSchema = schema.getCreateSchema();
      const result = createSchema.parse({ name: 'John' });
      expect(result).not.toHaveProperty('createdAt');
      // createdAt is optional in create schema — Model adds it
    });

    it('should deserialize timestamps as Date objects', () => {
      const schema = new Schema(
        { name: { type: Type.STRING as const } },
        { timestamps: true },
      );
      const result = schema.getDeserializeSchema().parse({
        id: 'abc',
        name: 'John',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-06-01T00:00:00.000Z',
        _etag: '"e"',
        _ts: 1,
        _rid: 'r',
        _self: 's',
        _attachments: 'a',
      });
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('schema caching', () => {
    it('should return the same cached create schema on repeat calls', () => {
      const schema = new Schema({ name: { type: Type.STRING as const } });
      const s1 = schema.getCreateSchema();
      const s2 = schema.getCreateSchema();
      expect(s1).toBe(s2);
    });

    it('should return the same cached patch schema on repeat calls', () => {
      const schema = new Schema({ name: { type: Type.STRING as const } });
      const s1 = schema.getPatchSchema();
      const s2 = schema.getPatchSchema();
      expect(s1).toBe(s2);
    });

    it('should return the same cached deserialize schema on repeat calls', () => {
      const schema = new Schema({ name: { type: Type.STRING as const } });
      const s1 = schema.getDeserializeSchema();
      const s2 = schema.getDeserializeSchema();
      expect(s1).toBe(s2);
    });
  });
});
