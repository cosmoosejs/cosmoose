import { afterAll,beforeAll, describe, expect, it } from 'vitest';

import { Cosmoose } from '~/connection/cosmoose.js';
import { Model } from '~/model/model.js';
import { Schema } from '~/schema/schema.js';
import { Type } from '~/types/type.js';

import { cleanupDatabase, createConnectedCosmoose, uniqueDatabaseName } from './helpers.js';

interface User {
  name: string;
  email: string;
  age: number;
}

describe('Model CRUD Integration', () => {
  let cosmoose: Cosmoose;
  let userModel: Model<User>;
  const dbName = uniqueDatabaseName('model');

  const userSchema = new Schema<User>({
    name: { type: Type.STRING },
    email: { type: Type.EMAIL },
    age: { type: Type.NUMBER },
  }, {
    timestamps: true,
    container: { partitionKey: '/name' },
  });

  beforeAll(async () => {
    cosmoose = await createConnectedCosmoose(dbName);
    userModel = cosmoose.model('Users', userSchema);
    await cosmoose.syncContainers();
  });

  afterAll(async () => {
    await cleanupDatabase(cosmoose);
  });

  describe('create', () => {
    it('should create a document and return it with id and timestamps', async () => {
      const user = await userModel.create({ name: 'Alice', email: 'alice@test.com', age: 30 });

      expect(user.id).toBeDefined();
      expect(user.name).toBe('Alice');
      expect(user.email).toBe('alice@test.com');
      expect(user.age).toBe(30);
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should validate input and reject invalid data', async () => {
      await expect(
        userModel.create({ name: 'Bad', email: 'not-an-email', age: 25 }),
      ).rejects.toThrow();
    });
  });

  describe('getById', () => {
    it('should retrieve a document by id', async () => {
      const created = await userModel.create({ name: 'Bob', email: 'bob@test.com', age: 25 });
      const found = await userModel.getById(created.id, { partitionKeyValue: 'Bob' });

      expect(found).toBeDefined();
      expect(found!.id).toBe(created.id);
      expect(found!.name).toBe('Bob');
      expect(found!.email).toBe('bob@test.com');
    });

    it('should return undefined for non-existent id', async () => {
      const found = await userModel.getById('non-existent-id', { partitionKeyValue: 'Nobody' });
      expect(found).toBeUndefined();
    });
  });

  describe('updateById', () => {
    it('should replace a document with updated fields', async () => {
      const created = await userModel.create({ name: 'Charlie', email: 'charlie@test.com', age: 35 });
      const updated = await userModel.updateById(created.id, { age: 36 }, { partitionKeyValue: 'Charlie' });

      expect(updated).toBeDefined();
      expect(updated!.age).toBe(36);
      expect(updated!.name).toBe('Charlie');
      expect(updated!.updatedAt!.getTime()).toBeGreaterThanOrEqual(created.updatedAt!.getTime());
    });

    it('should return undefined when updating non-existent document', async () => {
      const result = await userModel.updateById('non-existent', { age: 99 }, { partitionKeyValue: 'Nobody' });
      expect(result).toBeUndefined();
    });
  });

  describe('patchById', () => {
    it('should patch specific fields using $set', async () => {
      const created = await userModel.create({ name: 'Diana', email: 'diana@test.com', age: 28 });
      const patched = await userModel.patchById(created.id, { $set: { age: 29 } }, { partitionKeyValue: 'Diana' });

      expect(patched).toBeDefined();
      expect(patched!.age).toBe(29);
      expect(patched!.name).toBe('Diana');
    });

    it('should patch using implicit $set (plain object)', async () => {
      const created = await userModel.create({ name: 'Eve', email: 'eve@test.com', age: 22 });
      const patched = await userModel.patchById(created.id, { age: 23 }, { partitionKeyValue: 'Eve' });

      expect(patched).toBeDefined();
      expect(patched!.age).toBe(23);
    });

    it('should return undefined when patching non-existent document', async () => {
      const result = await userModel.patchById('non-existent', { age: 99 }, { partitionKeyValue: 'Nobody' });
      expect(result).toBeUndefined();
    });

    it('should increment a numeric field using $incr', async () => {
      const created = await userModel.create({ name: 'IncrTest', email: 'incr@test.com', age: 10 });
      const patched = await userModel.patchById(created.id, { $incr: { age: 5 } }, { partitionKeyValue: 'IncrTest' });

      expect(patched).toBeDefined();
      expect(patched!.age).toBe(15);
    });

    it('should remove an optional field using $unset', async () => {
      interface UserWithNickname {
        name: string;
        email: string;
        nickname: string;
      }

      const nicknameSchema = new Schema<UserWithNickname>({
        name: { type: Type.STRING },
        email: { type: Type.EMAIL },
        nickname: { type: Type.STRING, optional: true },
      }, {
        timestamps: true,
        container: { partitionKey: '/name' },
      });

      cosmoose.model('UsersWithNickname', nicknameSchema);
      await cosmoose.syncContainers();

      const nicknameModel = cosmoose.getRegisteredModels().get('UsersWithNickname')!.model as Model<UserWithNickname>;
      const created = await nicknameModel.create({ name: 'UnsetTest', email: 'unset@test.com', nickname: 'Testy' });
      expect(created.nickname).toBe('Testy');

      const patched = await nicknameModel.patchById(created.id, { $unset: { nickname: true } }, { partitionKeyValue: 'UnsetTest' });
      expect(patched).toBeDefined();
      expect(patched!.nickname).toBeUndefined();
    });
  });

  describe('deleteById', () => {
    it('should delete a document and confirm it is gone', async () => {
      const created = await userModel.create({ name: 'Frank', email: 'frank@test.com', age: 40 });
      const deleted = await userModel.deleteById(created.id, { partitionKeyValue: 'Frank' });

      expect(deleted).toBe(true);

      const found = await userModel.getById(created.id, { partitionKeyValue: 'Frank' });
      expect(found).toBeUndefined();
    });

    it('should return undefined when deleting non-existent document', async () => {
      const result = await userModel.deleteById('non-existent', { partitionKeyValue: 'Nobody' });
      expect(result).toBeUndefined();
    });
  });

  describe('Type.DATE roundtrip', () => {
    it('should store Dates as ISO strings and deserialize back to Date objects', async () => {
      interface Event {
        title: string;
        scheduledAt: Date;
        category: string;
      }

      const eventSchema = new Schema<Event>({
        title: { type: Type.STRING },
        scheduledAt: { type: Type.DATE },
        category: { type: Type.STRING },
      }, {
        container: { partitionKey: '/category' },
      });

      cosmoose.model('Events', eventSchema);
      await cosmoose.syncContainers();

      const eventModel = cosmoose.getRegisteredModels().get('Events')!.model as Model<Event>;
      const targetDate = new Date('2026-06-15T10:30:00.000Z');

      const created = await eventModel.create({ title: 'Launch', scheduledAt: targetDate, category: 'releases' });
      expect(created.scheduledAt).toBeInstanceOf(Date);
      expect(created.scheduledAt.toISOString()).toBe(targetDate.toISOString());

      const found = await eventModel.getById(created.id, { partitionKeyValue: 'releases' });
      expect(found!.scheduledAt).toBeInstanceOf(Date);
      expect(found!.scheduledAt.toISOString()).toBe(targetDate.toISOString());
    });
  });

  describe('Type.OBJECT nested schema', () => {
    it('should store and retrieve nested objects', async () => {
      interface Address {
        street: string;
        city: string;
      }

      interface Person {
        name: string;
        address: Address;
      }

      const addressSchema = new Schema<Address>({
        street: { type: Type.STRING },
        city: { type: Type.STRING },
      });

      const personSchema = new Schema<Person>({
        name: { type: Type.STRING },
        address: { type: Type.OBJECT, schema: addressSchema },
      }, {
        container: { partitionKey: '/name' },
      });

      cosmoose.model('People', personSchema);
      await cosmoose.syncContainers();

      const personModel = cosmoose.getRegisteredModels().get('People')!.model as Model<Person>;

      const created = await personModel.create({
        name: 'Nested',
        address: { street: '123 Main St', city: 'Springfield' },
      });

      expect(created.address).toEqual({ street: '123 Main St', city: 'Springfield' });

      const found = await personModel.getById(created.id, { partitionKeyValue: 'Nested' });
      expect(found!.address.street).toBe('123 Main St');
      expect(found!.address.city).toBe('Springfield');
    });
  });

  describe('hierarchical partition key CRUD', () => {
    interface TenantDoc {
      tenantId: string;
      userId: string;
      value: string;
    }

    let tenantModel: Model<TenantDoc>;

    beforeAll(async () => {
      const tenantSchema = new Schema<TenantDoc>({
        tenantId: { type: Type.STRING },
        userId: { type: Type.STRING },
        value: { type: Type.STRING },
      }, {
        timestamps: true,
        container: {
          partitionKey: { paths: ['/tenantId', '/userId'], kind: 'MultiHash' },
        },
      });

      cosmoose.model('TenantDocs', tenantSchema);
      await cosmoose.syncContainers();
      tenantModel = cosmoose.getRegisteredModels().get('TenantDocs')!.model as Model<TenantDoc>;
    });

    it('should create and retrieve a document with hierarchical partition key', async () => {
      const created = await tenantModel.create({ tenantId: 't1', userId: 'u1', value: 'hello' });

      expect(created.id).toBeDefined();
      expect(created.tenantId).toBe('t1');
      expect(created.userId).toBe('u1');

      const found = await tenantModel.getById(created.id, { partitionKeyValue: ['t1', 'u1'] });
      expect(found).toBeDefined();
      expect(found!.value).toBe('hello');
    });

    it('should return undefined when retrieving by id without partition key', async () => {
      const created = await tenantModel.create({ tenantId: 't1', userId: 'u-nopk', value: 'test' });

      const found = await tenantModel.getById(created.id);
      expect(found).toBeUndefined();
    });

    it('should update a document with hierarchical partition key', async () => {
      const created = await tenantModel.create({ tenantId: 't1', userId: 'u2', value: 'original' });
      const updated = await tenantModel.updateById(created.id, { value: 'updated' }, { partitionKeyValue: ['t1', 'u2'] });

      expect(updated).toBeDefined();
      expect(updated!.value).toBe('updated');
    });

    it('should patch a document with hierarchical partition key', async () => {
      const created = await tenantModel.create({ tenantId: 't1', userId: 'u3', value: 'before' });
      const patched = await tenantModel.patchById(created.id, { $set: { value: 'after' } }, { partitionKeyValue: ['t1', 'u3'] });

      expect(patched).toBeDefined();
      expect(patched!.value).toBe('after');
    });

    it('should delete a document with hierarchical partition key', async () => {
      const created = await tenantModel.create({ tenantId: 't1', userId: 'u4', value: 'deleteme' });
      const deleted = await tenantModel.deleteById(created.id, { partitionKeyValue: ['t1', 'u4'] });

      expect(deleted).toBe(true);

      const found = await tenantModel.getById(created.id, { partitionKeyValue: ['t1', 'u4'] });
      expect(found).toBeUndefined();
    });

    it('should deleteMany with hierarchical partition key', async () => {
      await tenantModel.createBatch([
        { tenantId: 'bulk-t', userId: 'bu1', value: 'a' },
        { tenantId: 'bulk-t', userId: 'bu2', value: 'b' },
        { tenantId: 'bulk-t', userId: 'bu3', value: 'c' },
      ]);

      const beforeCount = await tenantModel.count({ tenantId: 'bulk-t' });
      expect(beforeCount).toBe(3);

      await tenantModel.deleteMany({ tenantId: 'bulk-t' });

      const afterCount = await tenantModel.count({ tenantId: 'bulk-t' });
      expect(afterCount).toBe(0);
    });

    it('should query across hierarchical partition key', async () => {
      await tenantModel.createBatch([
        { tenantId: 'qt', userId: 'qa', value: 'x' },
        { tenantId: 'qt', userId: 'qb', value: 'y' },
      ]);

      const results = await tenantModel.findAll({ tenantId: 'qt' });
      expect(results).toHaveLength(2);
    });
  });
});
