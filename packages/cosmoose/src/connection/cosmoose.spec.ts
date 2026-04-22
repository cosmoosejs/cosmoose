import { describe, expect, it, vi } from 'vitest';

import { Schema } from '~/schema/schema.js';
import { Type } from '~/types/type.js';

import { Cosmoose } from './cosmoose.js';

// Mock @azure/cosmos
const mockContainer = {
  items: {},
  item: vi.fn(),
};
const mockDatabase = {
  container: vi.fn().mockReturnValue(mockContainer),
};
vi.mock('@azure/cosmos', () => {
  return {
    CosmosClient: class {
      databases = {
        createIfNotExists: vi.fn().mockResolvedValue({ database: mockDatabase }),
      };
    },
  };
});

describe('Cosmoose', () => {
  const options = { endpoint: 'https://test.cosmos.azure.com', key: 'test-key', databaseName: 'test-db' };

  describe('connect()', () => {
    it('should connect to the database', async () => {
      const cosmoose = new Cosmoose(options);
      await cosmoose.connect();
      expect(cosmoose.isConnected()).toBe(true);
    });

    it('should be idempotent — second connect is a no-op', async () => {
      const cosmoose = new Cosmoose(options);
      await cosmoose.connect();
      await cosmoose.connect(); // should not throw
      expect(cosmoose.isConnected()).toBe(true);
    });

    it('should emit initiate and initiated events', async () => {
      const cosmoose = new Cosmoose(options);
      const initiate = vi.fn();
      const initiated = vi.fn();
      cosmoose.on('initiate', initiate);
      cosmoose.on('initiated', initiated);

      await cosmoose.connect();

      expect(initiate).toHaveBeenCalled();
      expect(initiated).toHaveBeenCalledWith('test-db');
    });
  });

  describe('model()', () => {
    it('should register and return a Model', async () => {
      const cosmoose = new Cosmoose(options);
      await cosmoose.connect();

      const schema = new Schema({ name: { type: Type.STRING as const } });
      const model = cosmoose.model('users', schema);
      expect(model).toBeDefined();
    });

    it('should throw when called before connect()', () => {
      const cosmoose = new Cosmoose(options);
      const schema = new Schema({ name: { type: Type.STRING as const } });

      expect(() => cosmoose.model('users', schema)).toThrow('Database is not connected');
    });

    it('should throw on duplicate model name', async () => {
      const cosmoose = new Cosmoose(options);
      await cosmoose.connect();

      const schema = new Schema({ name: { type: Type.STRING as const } });
      cosmoose.model('users', schema);

      expect(() => cosmoose.model('users', schema)).toThrow('already registered');
    });

    it('should not create or verify the container', async () => {
      const cosmoose = new Cosmoose(options);
      await cosmoose.connect();

      const schema = new Schema({ name: { type: Type.STRING as const } });
      cosmoose.model('users', schema);

      // The database.container() is called to get a reference, but no
      // createIfNotExists or similar should be called on the container itself.
      const db = cosmoose.getDatabase()!;
      expect(db.container).toHaveBeenCalledWith('users');
    });
  });

  describe('getDatabase()', () => {
    it('should return undefined before connect', () => {
      const cosmoose = new Cosmoose(options);
      expect(cosmoose.getDatabase()).toBeUndefined();
    });

    it('should return database after connect', async () => {
      const cosmoose = new Cosmoose(options);
      await cosmoose.connect();
      expect(cosmoose.getDatabase()).toBeDefined();
    });
  });

  describe('getRegisteredModels()', () => {
    it('should return empty map initially', async () => {
      const cosmoose = new Cosmoose(options);
      await cosmoose.connect();
      expect(cosmoose.getRegisteredModels().size).toBe(0);
    });

    it('should return registered models', async () => {
      const cosmoose = new Cosmoose(options);
      await cosmoose.connect();

      const schema = new Schema({ name: { type: Type.STRING as const } });
      cosmoose.model('users', schema);

      expect(cosmoose.getRegisteredModels().size).toBe(1);
      expect(cosmoose.getRegisteredModels().has('users')).toBe(true);
    });
  });

  describe('syncContainers()', () => {
    it('should throw when not connected', async () => {
      const cosmoose = new Cosmoose(options);
      await expect(cosmoose.syncContainers()).rejects.toThrow('Database is not connected');
    });

    it('should call syncContainers when connected', async () => {
      const cosmoose = new Cosmoose(options);
      await cosmoose.connect();

      // Add containers.createIfNotExists to the mock database so sync can work
      const db = cosmoose.getDatabase() as Record<string, unknown>;
      (db as Record<string, unknown>)['containers'] = {
        createIfNotExists: vi.fn().mockResolvedValue({
          container: {
            read: vi.fn().mockResolvedValue({ resource: null }),
          },
        }),
      };

      const schema = new Schema({ name: { type: Type.STRING as const } });
      cosmoose.model('users', schema);

      const report = await cosmoose.syncContainers();
      expect(report).toHaveLength(1);
      expect(report[0].name).toBe('users');
    });
  });

  describe('syncContainer()', () => {
    it('should throw when not connected', async () => {
      const cosmoose = new Cosmoose(options);
      await expect(cosmoose.syncContainer('users')).rejects.toThrow('Database is not connected');
    });

    it('should call syncContainer for a specific model', async () => {
      const cosmoose = new Cosmoose(options);
      await cosmoose.connect();

      const db = cosmoose.getDatabase() as Record<string, unknown>;
      (db as Record<string, unknown>)['containers'] = {
        createIfNotExists: vi.fn().mockResolvedValue({
          container: {
            read: vi.fn().mockResolvedValue({ resource: null }),
          },
        }),
      };

      const schema = new Schema({ name: { type: Type.STRING as const } });
      cosmoose.model('users', schema);

      const result = await cosmoose.syncContainer('users');
      expect(result.name).toBe('users');
    });
  });
});
