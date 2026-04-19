import { PartitionKeyKind } from '@azure/cosmos';
import { describe, expect, it, vi } from 'vitest';

import { Schema } from '~/schema/schema.js';
import { Type } from '~/types/type.js';

import { syncContainer, syncContainers } from './sync-containers.js';

function createMockDatabase (existingContainers: Record<string, unknown> = {}) {
  const containers: Record<string, unknown> = {};

  const mockDatabase = {
    containers: {
      createIfNotExists: vi.fn().mockImplementation(async (def: { id: string }) => {
        const existing = existingContainers[def.id];
        const resource = existing ?? { ...def };
        const containerMock = {
          read: vi.fn().mockResolvedValue({ resource }),
          replace: vi.fn().mockImplementation(async (newDef: unknown) => ({ resource: newDef })),
        };
        containers[def.id] = containerMock;
        return { container: containerMock, resource };
      }),
    },
  };

  return { mockDatabase, containers };
}

describe('syncContainers', () => {
  it('should create a new container with partition key', async () => {
    const { mockDatabase } = createMockDatabase();
    const schema = new Schema(
      { name: { type: Type.STRING as const } },
      { container: { partitionKey: '/networkId' } },
    );
    const models = new Map([ [ 'users', { schema } ] ]);

    const report = await syncContainers(mockDatabase as never, models as never);

    expect(report).toHaveLength(1);
    expect(report[0].name).toBe('users');
    expect(mockDatabase.containers.createIfNotExists).toHaveBeenCalled();
    const callArg = mockDatabase.containers.createIfNotExists.mock.calls[0][0];
    expect(callArg.partitionKey).toEqual({ paths: [ '/networkId' ], kind: PartitionKeyKind.Hash });
  });

  it('should create a container with hierarchical partition key', async () => {
    const { mockDatabase } = createMockDatabase();
    const schema = new Schema(
      { name: { type: Type.STRING as const } },
      { container: { partitionKey: { paths: [ '/tenantId', '/userId' ], kind: 'MultiHash' } } },
    );
    const models = new Map([ [ 'users', { schema } ] ]);

    await syncContainers(mockDatabase as never, models as never);

    const callArg = mockDatabase.containers.createIfNotExists.mock.calls[0][0];
    expect(callArg.partitionKey).toEqual({ paths: [ '/tenantId', '/userId' ], kind: PartitionKeyKind.MultiHash });
  });

  it('should create container with unique key policy', async () => {
    const { mockDatabase } = createMockDatabase();
    const schema = new Schema(
      { name: { type: Type.STRING as const } },
      { container: { uniqueKeys: [ [ '/email', '/networkId' ] ] } },
    );
    const models = new Map([ [ 'users', { schema } ] ]);

    await syncContainers(mockDatabase as never, models as never);

    const callArg = mockDatabase.containers.createIfNotExists.mock.calls[0][0];
    expect(callArg.uniqueKeyPolicy).toEqual({
      uniqueKeys: [ { paths: [ '/email', '/networkId' ] } ],
    });
  });

  it('should create container with TTL', async () => {
    const { mockDatabase } = createMockDatabase();
    const schema = new Schema(
      { name: { type: Type.STRING as const } },
      { container: { ttl: 3600 } },
    );
    const models = new Map([ [ 'sessions', { schema } ] ]);

    await syncContainers(mockDatabase as never, models as never);

    const callArg = mockDatabase.containers.createIfNotExists.mock.calls[0][0];
    expect(callArg.defaultTtl).toBe(3600);
  });

  it('should create container with composite indexes', async () => {
    const { mockDatabase } = createMockDatabase();
    const schema = new Schema(
      { name: { type: Type.STRING as const } },
      { container: { compositeIndexes: [ { '/createdAt': 1, '/status': -1 } ] } },
    );
    const models = new Map([ [ 'items', { schema } ] ]);

    await syncContainers(mockDatabase as never, models as never);

    const callArg = mockDatabase.containers.createIfNotExists.mock.calls[0][0];
    expect(callArg.indexingPolicy.compositeIndexes).toEqual([
      [
        { path: '/createdAt', order: 'ascending' },
        { path: '/status', order: 'descending' },
      ],
    ]);
  });

  it('should detect immutable drift on partition key', async () => {
    const { mockDatabase } = createMockDatabase({
      users: {
        id: 'users',
        partitionKey: { paths: [ '/region' ] },
      },
    });
    const schema = new Schema(
      { name: { type: Type.STRING as const } },
      { container: { partitionKey: '/networkId' } },
    );
    const models = new Map([ [ 'users', { schema } ] ]);

    const report = await syncContainers(mockDatabase as never, models as never);

    expect(report[0].status).toBe('drift');
    expect(report[0].driftDetails).toContainEqual(
      expect.objectContaining({
        property: 'partitionKey',
        mutable: false,
      }),
    );
  });

  it('should detect immutable drift on unique key policy', async () => {
    const { mockDatabase } = createMockDatabase({
      users: {
        id: 'users',
        partitionKey: { paths: [ '/networkId' ] },
        uniqueKeyPolicy: { uniqueKeys: [ { paths: [ '/email' ] } ] },
      },
    });
    const schema = new Schema(
      { name: { type: Type.STRING as const } },
      {
        container: {
          partitionKey: '/networkId',
          uniqueKeys: [ [ '/email', '/networkId' ] ],
        },
      },
    );
    const models = new Map([ [ 'users', { schema } ] ]);

    const report = await syncContainers(mockDatabase as never, models as never);

    expect(report[0].status).toBe('drift');
    expect(report[0].driftDetails).toContainEqual(
      expect.objectContaining({
        property: 'uniqueKeyPolicy',
        mutable: false,
      }),
    );
  });

  it('should auto-apply mutable drift on TTL', async () => {
    const { mockDatabase } = createMockDatabase({
      sessions: {
        id: 'sessions',
        partitionKey: { paths: [ '/sessionId' ] },
        defaultTtl: 1800,
      },
    });
    const schema = new Schema(
      { name: { type: Type.STRING as const } },
      { container: { partitionKey: '/sessionId', ttl: 3600 } },
    );
    const models = new Map([ [ 'sessions', { schema } ] ]);

    const report = await syncContainers(mockDatabase as never, models as never);

    expect(report[0].status).toBe('updated');
    expect(report[0].updatedProperties).toContain('ttl');
  });

  it('should report unchanged when container matches schema', async () => {
    const { mockDatabase } = createMockDatabase({
      users: {
        id: 'users',
        partitionKey: { paths: [ '/networkId' ] },
      },
    });
    const schema = new Schema(
      { name: { type: Type.STRING as const } },
      { container: { partitionKey: '/networkId' } },
    );
    const models = new Map([ [ 'users', { schema } ] ]);

    const report = await syncContainers(mockDatabase as never, models as never);

    expect(report[0].status).toBe('unchanged');
  });
});

describe('syncContainer', () => {
  it('should sync a single named container', async () => {
    const { mockDatabase } = createMockDatabase();
    const schema = new Schema(
      { name: { type: Type.STRING as const } },
      { container: { partitionKey: '/networkId' } },
    );
    const models = new Map([ [ 'users', { schema } ] ]);

    const result = await syncContainer(mockDatabase as never, models as never, 'users');

    expect(result.name).toBe('users');
  });

  it('should throw on unregistered container name', async () => {
    const { mockDatabase } = createMockDatabase();
    const models = new Map();

    await expect(
      syncContainer(mockDatabase as never, models as never, 'unknown'),
    ).rejects.toThrow('not registered');
  });
});

describe('syncContainers edge cases', () => {
  it('should return created when existing resource is null', async () => {
    const mockDatabase = {
      containers: {
        createIfNotExists: vi.fn().mockResolvedValue({
          container: {
            read: vi.fn().mockResolvedValue({ resource: null }),
            replace: vi.fn(),
          },
        }),
      },
    };
    const schema = new Schema(
      { name: { type: Type.STRING as const } },
      { container: { partitionKey: '/id' } },
    );
    const models = new Map([ [ 'items', { schema } ] ]);

    const report = await syncContainers(mockDatabase as never, models as never);
    expect(report[0].status).toBe('created');
  });

  it('should report drift when TTL update fails', async () => {
    const mockDatabase = {
      containers: {
        createIfNotExists: vi.fn().mockResolvedValue({
          container: {
            read: vi.fn().mockResolvedValue({
              resource: {
                id: 'sessions',
                partitionKey: { paths: [ '/sessionId' ] },
                defaultTtl: 1800,
              },
            }),
            replace: vi.fn().mockRejectedValue(new Error('replace failed')),
          },
        }),
      },
    };
    const schema = new Schema(
      { name: { type: Type.STRING as const } },
      { container: { partitionKey: '/sessionId', ttl: 3600 } },
    );
    const models = new Map([ [ 'sessions', { schema } ] ]);

    const report = await syncContainers(mockDatabase as never, models as never);
    expect(report[0].status).toBe('drift');
    expect(report[0].driftDetails).toContainEqual(
      expect.objectContaining({
        property: 'ttl',
        mutable: true,
      }),
    );
  });

  it('should report drift when composite index update fails', async () => {
    const mockDatabase = {
      containers: {
        createIfNotExists: vi.fn().mockResolvedValue({
          container: {
            read: vi.fn().mockResolvedValue({
              resource: {
                id: 'items',
                partitionKey: { paths: [ '/id' ] },
                indexingPolicy: {
                  compositeIndexes: [
                    [ { path: '/old', order: 'ascending' } ],
                  ],
                },
              },
            }),
            replace: vi.fn().mockRejectedValue(new Error('replace failed')),
          },
        }),
      },
    };
    const schema = new Schema(
      { name: { type: Type.STRING as const } },
      { container: { compositeIndexes: [ { '/createdAt': 1, '/status': -1 } ] } },
    );
    const models = new Map([ [ 'items', { schema } ] ]);

    const report = await syncContainers(mockDatabase as never, models as never);
    expect(report[0].status).toBe('drift');
    expect(report[0].driftDetails).toContainEqual(
      expect.objectContaining({
        property: 'compositeIndexes',
        mutable: true,
      }),
    );
  });

  it('should auto-apply mutable drift on composite indexes', async () => {
    const { mockDatabase } = createMockDatabase({
      items: {
        id: 'items',
        partitionKey: { paths: [ '/id' ] },
        indexingPolicy: {
          compositeIndexes: [
            [ { path: '/old', order: 'ascending' } ],
          ],
        },
      },
    });
    const schema = new Schema(
      { name: { type: Type.STRING as const } },
      { container: { compositeIndexes: [ { '/createdAt': 1, '/status': -1 } ] } },
    );
    const models = new Map([ [ 'items', { schema } ] ]);

    const report = await syncContainers(mockDatabase as never, models as never);
    expect(report[0].status).toBe('updated');
    expect(report[0].updatedProperties).toContain('compositeIndexes');
  });

  it('should sync container without partition key', async () => {
    const { mockDatabase } = createMockDatabase();
    const schema = new Schema(
      { name: { type: Type.STRING as const } },
      { container: {} },
    );
    const models = new Map([ [ 'items', { schema } ] ]);

    const report = await syncContainers(mockDatabase as never, models as never);
    expect(report[0].name).toBe('items');
  });

  it('should report unchanged when partition key, unique keys, TTL, and composites all match', async () => {
    const { mockDatabase } = createMockDatabase({
      users: {
        id: 'users',
        partitionKey: { paths: [ '/networkId' ] },
        uniqueKeyPolicy: { uniqueKeys: [ { paths: [ '/email' ] } ] },
        defaultTtl: 3600,
        indexingPolicy: {
          compositeIndexes: [
            [
              { path: '/createdAt', order: 'ascending' },
              { path: '/status', order: 'descending' },
            ],
          ],
        },
      },
    });
    const schema = new Schema(
      { name: { type: Type.STRING as const } },
      {
        container: {
          partitionKey: '/networkId',
          uniqueKeys: [ [ '/email' ] ],
          ttl: 3600,
          compositeIndexes: [ { '/createdAt': 1, '/status': -1 } ],
        },
      },
    );
    const models = new Map([ [ 'users', { schema } ] ]);

    const report = await syncContainers(mockDatabase as never, models as never);
    expect(report[0].status).toBe('unchanged');
  });

  it('should detect drift when existing container has no partitionKey property', async () => {
    const { mockDatabase } = createMockDatabase({
      users: { id: 'users' },
    });
    const schema = new Schema(
      { name: { type: Type.STRING as const } },
      { container: { partitionKey: '/networkId' } },
    );
    const models = new Map([ [ 'users', { schema } ] ]);

    const report = await syncContainers(mockDatabase as never, models as never);
    expect(report[0].status).toBe('drift');
    expect(report[0].driftDetails).toContainEqual(
      expect.objectContaining({ property: 'partitionKey', mutable: false }),
    );
  });

  it('should detect drift when existing container has no uniqueKeyPolicy property', async () => {
    const { mockDatabase } = createMockDatabase({
      users: { id: 'users', partitionKey: { paths: [ '/networkId' ] } },
    });
    const schema = new Schema(
      { name: { type: Type.STRING as const } },
      { container: { partitionKey: '/networkId', uniqueKeys: [ [ '/email' ] ] } },
    );
    const models = new Map([ [ 'users', { schema } ] ]);

    const report = await syncContainers(mockDatabase as never, models as never);
    expect(report[0].status).toBe('drift');
    expect(report[0].driftDetails).toContainEqual(
      expect.objectContaining({ property: 'uniqueKeyPolicy', mutable: false }),
    );
  });

  it('should update composites when existing container has no indexingPolicy', async () => {
    const { mockDatabase } = createMockDatabase({
      items: { id: 'items', partitionKey: { paths: [ '/id' ] } },
    });
    const schema = new Schema(
      { name: { type: Type.STRING as const } },
      { container: { partitionKey: '/id', compositeIndexes: [ { '/createdAt': 1, '/status': -1 } ] } },
    );
    const models = new Map([ [ 'items', { schema } ] ]);

    const report = await syncContainers(mockDatabase as never, models as never);
    expect(report[0].status).toBe('updated');
    expect(report[0].updatedProperties).toContain('compositeIndexes');
  });

  it('should handle object partition key with Hash kind', async () => {
    const { mockDatabase } = createMockDatabase({
      users: {
        id: 'users',
        partitionKey: { paths: [ '/tenantId' ] },
      },
    });
    const schema = new Schema(
      { name: { type: Type.STRING as const } },
      { container: { partitionKey: { paths: [ '/tenantId' ], kind: 'Hash' } } },
    );
    const models = new Map([ [ 'users', { schema } ] ]);

    const report = await syncContainers(mockDatabase as never, models as never);

    const callArg = mockDatabase.containers.createIfNotExists.mock.calls[0][0];
    expect(callArg.partitionKey.kind).toBe(PartitionKeyKind.Hash);
    expect(report[0].status).toBe('unchanged');
  });

  it('should report updated with drift details when TTL update succeeds but composites fail', async () => {
    const replaceCallCount = { count: 0 };
    const mockDatabase = {
      containers: {
        createIfNotExists: vi.fn().mockResolvedValue({
          container: {
            read: vi.fn().mockResolvedValue({
              resource: {
                id: 'items',
                partitionKey: { paths: [ '/id' ] },
                defaultTtl: 1800,
                indexingPolicy: {
                  compositeIndexes: [
                    [ { path: '/old', order: 'ascending' } ],
                  ],
                },
              },
            }),
            replace: vi.fn().mockImplementation(async () => {
              replaceCallCount.count++;
              if (replaceCallCount.count === 1) {
                // TTL update succeeds
                return { resource: {} };
              }
              // Composites update fails
              throw new Error('replace failed');
            }),
          },
        }),
      },
    };
    const schema = new Schema(
      { name: { type: Type.STRING as const } },
      {
        container: {
          partitionKey: '/id',
          ttl: 3600,
          compositeIndexes: [ { '/createdAt': 1, '/status': -1 } ],
        },
      },
    );
    const models = new Map([ [ 'items', { schema } ] ]);

    const report = await syncContainers(mockDatabase as never, models as never);
    expect(report[0].status).toBe('updated');
    expect(report[0].updatedProperties).toContain('ttl');
    expect(report[0].driftDetails).toContainEqual(
      expect.objectContaining({ property: 'compositeIndexes', mutable: true }),
    );
  });
});
