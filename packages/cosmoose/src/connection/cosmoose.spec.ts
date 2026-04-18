import { describe, expect, it, vi } from 'vitest';

import { Schema } from '../schema/schema.js';
import { Type } from '../types/type.js';
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
});
