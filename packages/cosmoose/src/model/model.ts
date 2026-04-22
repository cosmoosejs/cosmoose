import { BulkOperationType, type Container, type JSONObject, type PartitionKey, type PatchOperation, type SqlQuerySpec } from '@azure/cosmos';
import type { ZodError } from 'zod';

import { SchemaValidationFailedException } from '~/exceptions/schema-validation-failed.exception.js';
import { generateId } from '~/id/generate-id.js';
import { QueryBuilder } from '~/query/query-builder.js';
import { Schema } from '~/schema/schema.js';
import type { Document } from '~/types/document.js';
import type { PatchExpression } from '~/types/patch-expression.js';

type QueryFilter = Record<string, unknown>;

interface PartitionKeyOption {
  partitionKeyValue?: PartitionKey;
}

interface BatchResult<T> {
  succeed: Document<T>[];
  failed: { item: unknown; error: unknown }[];
}

export class Model<T extends Record<string, unknown>> {
  private readonly container: Container;
  private readonly schema: Schema<T>;

  constructor (container: Container, schema: Schema<T>) {
    this.container = container;
    this.schema = schema;
  }

  async create (data: Partial<T> & Record<string, unknown>): Promise<Document<T>> {
    const createSchema = this.schema.getCreateSchema();
    const result = createSchema.safeParse(data);

    if (!result.success) {
      throw new SchemaValidationFailedException(result.error as ZodError);
    }

    const validated = result.data as Record<string, unknown>;

    if (!validated['id']) {
      validated['id'] = generateId();
    }

    if (this.schema.getOptions().timestamps) {
      const now = new Date();

      validated['createdAt'] = now.toISOString();
      validated['updatedAt'] = now.toISOString();
    }

    // Serialize Date fields to ISO strings for storage
    this.serializeDates(validated);

    const { resource } = await this.container.items.create(validated);

    return this.schema.getDeserializeSchema().parse(resource) as Document<T>;
  }

  async getById (id: string, options?: PartitionKeyOption): Promise<Document<T> | undefined> {
    try {
      const partitionKey = options?.partitionKeyValue;
      const { resource } = await this.container.item(id, partitionKey).read();

      if (!resource) {
        return undefined;
      }

      return this.schema.getDeserializeSchema().parse(resource) as Document<T>;
    } catch (err: unknown) {
      if (isNotFoundError(err)) {
        return undefined;
      }

      throw err;
    }
  }

  async updateById (id: string, data: Partial<T> & Record<string, unknown>, options?: PartitionKeyOption): Promise<Document<T> | undefined> {
    try {
      const existing = await this.getById(id, options);

      if (!existing) {
        return undefined;
      }

      const merged = { ...existing, ...data, id };

      if (this.schema.getOptions().timestamps) {
        (merged as Record<string, unknown>)['updatedAt'] = new Date().toISOString();
      }

      // Serialize Date fields
      this.serializeDates(merged as Record<string, unknown>);

      const partitionKey = options?.partitionKeyValue;
      const { resource } = await this.container.item(id, partitionKey).replace(merged);

      return this.schema.getDeserializeSchema().parse(resource) as Document<T>;
    } catch (err: unknown) {
      if (isNotFoundError(err)) {
        return undefined;
      }

      throw err;
    }
  }

  async patchById (id: string, expression: PatchExpression<T> | Partial<T>, options?: PartitionKeyOption): Promise<Document<T> | undefined> {
    try {
      const operations = this.buildPatchOperations(expression as Record<string, unknown>);

      if (this.schema.getOptions().timestamps) {
        operations.push({
          op: 'set',
          path: '/updatedAt',
          value: new Date().toISOString(),
        } as PatchOperation);
      }

      const partitionKey = options?.partitionKeyValue;

      // Batch operations if > 10
      if (operations.length <= 10) {
        const { resource } = await this.container.item(id, partitionKey).patch(operations);

        return this.schema.getDeserializeSchema().parse(resource) as Document<T>;
      }

      let lastResource: unknown;
      for (let i = 0; i < operations.length; i += 10) {
        const batch = operations.slice(i, i + 10);
        const { resource } = await this.container.item(id, partitionKey).patch(batch);
        lastResource = resource;
      }

      return this.schema.getDeserializeSchema().parse(lastResource) as Document<T>;
    } catch (err: unknown) {
      if (isNotFoundError(err)) {
        return undefined;
      }

      throw err;
    }
  }

  async deleteById (id: string, options?: PartitionKeyOption): Promise<boolean | undefined> {
    try {
      const partitionKey = options?.partitionKeyValue;
      await this.container.item(id, partitionKey).delete();

      return true;
    } catch (err: unknown) {
      if (isNotFoundError(err)) {
        return undefined;
      }

      throw err;
    }
  }

  async createBatch (items: (Partial<T> & Record<string, unknown>)[], options?: { retryOnError?: boolean }): Promise<BatchResult<T>> {
    const createSchema = this.schema.getCreateSchema();
    const hasTimestamps = this.schema.getOptions().timestamps;
    const succeed: Document<T>[] = [];
    const failed: { item: unknown; error: unknown }[] = [];

    const prepared: Record<string, unknown>[] = [];

    for (const item of items) {
      const result = createSchema.safeParse(item);

      if (!result.success) {
        failed.push({ item, error: result.error });
        continue;
      }

      const validated = result.data as Record<string, unknown>;

      if (!validated['id']) {
        validated['id'] = generateId();
      }

      if (hasTimestamps) {
        const now = new Date().toISOString();
        validated['createdAt'] = now;
        validated['updatedAt'] = now;
      }

      this.serializeDates(validated);
      prepared.push(validated);
    }

    const bulkOps = prepared.map((doc) => ({
      operationType: BulkOperationType.Create,
      resourceBody: doc as JSONObject,
    }));

    let pendingOps = bulkOps;
    let retryCount = 0;
    const maxRetries = options?.retryOnError ? 5 : 0;

    while (pendingOps.length > 0) {
      const response = await this.container.items.bulk(pendingOps);
      const toRetry: typeof pendingOps = [];

      for (let i = 0; i < response.length; i++) {
        const result = response[i];

        if (result.statusCode >= 200 && result.statusCode < 300) {
          succeed.push(this.schema.getDeserializeSchema().parse(result.resourceBody) as Document<T>);
        } else if (result.statusCode === 429 && retryCount < maxRetries) {
          toRetry.push(pendingOps[i]);
        } else {
          failed.push({
            item: pendingOps[i].resourceBody,
            error: { statusCode: result.statusCode },
          });
        }
      }

      if (toRetry.length === 0 || retryCount >= maxRetries) {
        break;
      }

      retryCount++;
      const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
      await new Promise((resolve) => setTimeout(resolve, delay));

      pendingOps = toRetry;
    }

    return { succeed, failed };
  }

  async upsertBatch (items: (Partial<T> & Record<string, unknown>)[]): Promise<BatchResult<T>> {
    const createSchema = this.schema.getCreateSchema();
    const hasTimestamps = this.schema.getOptions().timestamps;
    const succeed: Document<T>[] = [];
    const failed: { item: unknown; error: unknown }[] = [];

    const prepared: Record<string, unknown>[] = [];
    for (const item of items) {
      const result = createSchema.safeParse(item);

      if (!result.success) {
        failed.push({ item, error: result.error });
        continue;
      }

      const validated = result.data as Record<string, unknown>;

      if (!validated['id']) {
        validated['id'] = generateId();
      }

      if (hasTimestamps) {
        const now = new Date().toISOString();
        validated['createdAt'] = now;
        validated['updatedAt'] = now;
      }

      this.serializeDates(validated);
      prepared.push(validated);
    }

    const bulkOps = prepared.map((doc) => ({
      operationType: BulkOperationType.Upsert,
      resourceBody: doc as JSONObject,
    }));

    const response = await this.container.items.bulk(bulkOps);

    for (let i = 0; i < response.length; i++) {
      const result = response[i];

      if (result.statusCode >= 200 && result.statusCode < 300) {
        succeed.push(
          this.schema.getDeserializeSchema().parse(result.resourceBody) as Document<T>,
        );
      } else {
        failed.push({
          item: bulkOps[i].resourceBody,
          error: { statusCode: result.statusCode },
        });
      }
    }

    return { succeed, failed };
  }

  async deleteMany (filter: QueryFilter): Promise<void> {
    const cursor = this.findAsCursor(filter, { batchSize: 100 });
    const partitionKeyPaths = this.getPartitionKeyPaths();
    const idsToDelete: { id: string; partitionKey: unknown[] }[] = [];

    await (await cursor).each((doc) => {
      const record = doc as Record<string, unknown>;
      idsToDelete.push({
        id: record['id'] as string,
        partitionKey: partitionKeyPaths.map((path) => record[path]),
      });
    });

    for (let i = 0; i < idsToDelete.length; i += 100) {
      const batch = idsToDelete.slice(i, i + 100);
      const bulkOps = batch.map((item) => ({
        operationType: BulkOperationType.Delete,
        id: item.id,
        partitionKey: item.partitionKey.length === 1 ? item.partitionKey[0] : item.partitionKey,
      }));
      await this.container.items.bulk(bulkOps);
    }
  }

  private getPartitionKeyPaths (): string[] {
    const pk = this.schema.getContainerConfig().partitionKey;

    if (!pk) {
      return [];
    }

    if (typeof pk === 'string') {
      return [ pk.replace(/^\//, '') ];
    }

    return pk.paths.map((p) => p.replace(/^\//, ''));
  }

  find (filter: QueryFilter = {}): QueryBuilder<T, 'find'> {
    return new QueryBuilder(this.container, this.schema, 'find', filter);
  }

  findOne (filter: QueryFilter = {}): QueryBuilder<T, 'findOne'> {
    return new QueryBuilder(this.container, this.schema, 'findOne', filter);
  }

  findAll (filter: QueryFilter = {}): QueryBuilder<T, 'findAll'> {
    return new QueryBuilder(this.container, this.schema, 'findAll', filter);
  }

  count (filter: QueryFilter = {}): QueryBuilder<T, 'count'> {
    return new QueryBuilder(this.container, this.schema, 'count', filter);
  }

  findAsCursor (filter: QueryFilter = {}, options?: { batchSize?: number }): QueryBuilder<T, 'findAsCursor'> {
    return new QueryBuilder(this.container, this.schema, 'findAsCursor', filter, {
      batchSize: options?.batchSize,
    });
  }

  findAsTokenPagination (filter: QueryFilter = {}, options?: { limit?: number; paginationToken?: string }): QueryBuilder<T, 'findAsTokenPagination'> {
    return new QueryBuilder(this.container, this.schema, 'findAsTokenPagination', filter, {
      limit: options?.limit,
      paginationToken: options?.paginationToken,
    });
  }

  async findByIds (ids: string[]): Promise<Document<T>[]> {
    const querySpec: SqlQuerySpec = {
      query: `SELECT * FROM root r WHERE r.id IN (${ids.map((_, i) => `@id${i}`).join(', ')})`,
      parameters: ids.map((id, i) => ({ name: `@id${i}`, value: id })),
    };

    const { resources } = await this.container.items.query(querySpec).fetchAll();

    return resources.map((item: unknown) => this.schema.getDeserializeSchema().parse(item) as Document<T>);
  }

  async rawQuery (querySpec: SqlQuerySpec): Promise<Document<T>[]> {
    const { resources } = await this.container.items.query(querySpec).fetchAll();

    return resources.map((item: unknown) => this.schema.getDeserializeSchema().parse(item) as Document<T>);
  }

  private buildPatchOperations (expression: Record<string, unknown>): PatchOperation[] {
    const operations: PatchOperation[] = [];

    const setFields = (expression['$set'] as Record<string, unknown> | undefined);
    const addFields = (expression['$add'] as Record<string, unknown> | undefined);
    const incrFields = (expression['$incr'] as Record<string, number> | undefined);
    const unsetFields = (expression['$unset'] as Record<string, boolean> | undefined);

    const hasOperators = setFields || addFields || incrFields || unsetFields;

    if (!hasOperators) {
      // Treat all fields as implicit $set
      for (const [ key, value ] of Object.entries(expression)) {
        this.flattenSetOperations(operations, `/${key}`, value);
      }

      return operations;
    }

    if (setFields) {
      for (const [ key, value ] of Object.entries(setFields)) {
        this.flattenSetOperations(operations, `/${key}`, value);
      }
    }

    if (addFields) {
      for (const [ key, value ] of Object.entries(addFields)) {
        operations.push({ op: 'add', path: `/${key}`, value } as PatchOperation);
      }
    }

    if (incrFields) {
      for (const [ key, value ] of Object.entries(incrFields)) {
        operations.push({ op: 'incr', path: `/${key}`, value } as PatchOperation);
      }
    }

    if (unsetFields) {
      for (const key of Object.keys(unsetFields)) {
        operations.push({ op: 'remove', path: `/${key}` } as PatchOperation);
      }
    }

    return operations;
  }

  private flattenSetOperations (operations: PatchOperation[], path: string, value: unknown): void {
    if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      for (const [ key, nested ] of Object.entries(value as Record<string, unknown>)) {
        this.flattenSetOperations(operations, `${path}/${key}`, nested);
      }
    } else {
      if (value instanceof Date) {
        operations.push({ op: 'set', path, value: value.toISOString() } as PatchOperation);
      } else {
        operations.push({ op: 'set', path, value } as PatchOperation);
      }
    }
  }

  private serializeDates (obj: Record<string, unknown>): void {
    for (const [ key, value ] of Object.entries(obj)) {
      if (value instanceof Date) {
        obj[key] = value.toISOString();
      } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        this.serializeDates(value as Record<string, unknown>);
      }
    }
  }
}

function isNotFoundError (err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: number }).code === 404
  );
}
