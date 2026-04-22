import { EventEmitter } from 'node:events';
import { type Container, CosmosClient, type Database } from '@azure/cosmos';

import {
  type ContainerSyncResult,
  syncContainer as syncContainerFn,
  syncContainers as syncContainersFn,
  type SyncReport,
} from '~/migration/sync-containers.js';
import { Model } from '~/model/model.js';
import type { Schema } from '~/schema/schema.js';

export interface CosmooseOptions {
  endpoint: string;
  key: string;
  databaseName: string;
}

interface RegisteredModel<T extends Record<string, unknown> = Record<string, unknown>> {
  schema: Schema<T>;
  model: Model<T>;
  container: Container;
}

export class Cosmoose extends EventEmitter {
  private readonly client: CosmosClient;
  private readonly databaseName: string;
  private database: Database | undefined;
  private connected = false;
  private readonly models = new Map<string, RegisteredModel>();

  constructor (options: CosmooseOptions) {
    super();

    this.client = new CosmosClient({ endpoint: options.endpoint, key: options.key });
    this.databaseName = options.databaseName;
  }

  async connect (): Promise<void> {
    if (this.connected) {
      return;
    }

    this.emit('initiate');

    const { database } = await this.client.databases.createIfNotExists({ id: this.databaseName });

    this.database = database;
    this.connected = true;
    this.emit('initiated', this.databaseName);
  }

  model<T extends Record<string, unknown>>(name: string, schema: Schema<T>): Model<T> {
    if (!this.connected || !this.database) {
      throw new Error('Database is not connected. Call connect() first.');
    }

    if (this.models.has(name)) {
      throw new Error(`Model "${name}" is already registered.`);
    }

    const container = this.database.container(name);
    const model = new Model<T>(container, schema);

    this.models.set(name, { schema, model, container });

    return model;
  }

  getDatabase (): Database | undefined {
    return this.database;
  }

  getRegisteredModels (): Map<string, RegisteredModel> {
    return this.models;
  }

  isConnected (): boolean {
    return this.connected;
  }

  async syncContainers (): Promise<SyncReport> {
    if (!this.database) {
      throw new Error('Database is not connected. Call connect() first.');
    }

    return syncContainersFn(this.database, this.models);
  }

  async syncContainer (name: string): Promise<ContainerSyncResult> {
    if (!this.database) {
      throw new Error('Database is not connected. Call connect() first.');
    }

    return syncContainerFn(this.database, this.models, name);
  }
}
