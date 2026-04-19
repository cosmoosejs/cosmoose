import type { Container, FeedOptions, JSONValue, SqlParameter, SqlQuerySpec } from '@azure/cosmos';

import type { Schema } from '~/schema/schema.js';
import type { Document } from '~/types/document.js';

export type QueryType = 'find' | 'findAll' | 'findOne' | 'count' | 'findAsCursor' | 'findAsTokenPagination';

export interface TokenPaginationResult<T> {
  data: Document<T>[];
  pagination: {
    next: string | undefined;
  };
}

export interface Cursor<T> {
  each(fn: (doc: Document<T>, index: number) => Promise<void> | void): Promise<void>;
}

interface SqlCondition {
  clause: string;
  parameters: SqlParameter[];
}

type QueryFilter = Record<string, unknown>;

export class QueryBuilder<T extends Record<string, unknown>, Q extends QueryType = 'find'> implements PromiseLike<
  Q extends 'count' ? number :
    Q extends 'findOne' ? Document<T> | undefined :
      Q extends 'findAsTokenPagination' ? TokenPaginationResult<T> :
        Q extends 'findAsCursor' ? Cursor<T> :
          Document<T>[]
> {
  private readonly container: Container;
  private readonly schema: Schema<T>;
  private readonly queryType: Q;
  private readonly filter: QueryFilter;

  private sortFields: Record<string, 1 | -1> | undefined;
  private limitValue: number | undefined;
  private offsetValue: number | undefined;
  private batchSizeValue: number;
  private paginationToken: string | undefined;

  constructor (
    container: Container,
    schema: Schema<T>,
    queryType: Q,
    filter: QueryFilter,
    options?: { limit?: number; batchSize?: number; paginationToken?: string },
  ) {
    this.container = container;
    this.schema = schema;
    this.queryType = queryType;
    this.filter = filter;
    this.batchSizeValue = options?.batchSize ?? 100;
    this.paginationToken = options?.paginationToken;

    if (queryType === 'find') {
      this.limitValue = options?.limit ?? 50;
      this.offsetValue = 0;
    } else if (queryType === 'findOne') {
      this.limitValue = 1;
      this.offsetValue = 0;
    } else if (queryType === 'findAsTokenPagination') {
      this.limitValue = options?.limit ?? 50;
    }
  }

  sort (fields: Record<string, 1 | -1>): this {
    this.sortFields = fields;
    return this;
  }

  limit (value: number): this {
    this.limitValue = value;
    return this;
  }

  offset (value: number): this {
    this.offsetValue = value;
    return this;
  }

  buildQuery (): SqlQuerySpec {
    const conditions = this.buildConditions(this.filter);

    let sql: string;
    if (this.queryType === 'count') {
      sql = 'SELECT VALUE COUNT(1) FROM root r';
    } else {
      sql = 'SELECT * FROM root r';
    }

    if (conditions.clause) {
      sql += ` WHERE ${conditions.clause}`;
    }

    if (this.sortFields && this.queryType !== 'count') {
      const orderParts = Object.entries(this.sortFields).map(
        ([ field, dir ]) => `r['${field}'] ${dir === 1 ? 'ASC' : 'DESC'}`,
      );
      sql += ` ORDER BY ${orderParts.join(', ')}`;
    }

    if (this.queryType !== 'count' && this.queryType !== 'findAll' && this.queryType !== 'findAsCursor' && this.queryType !== 'findAsTokenPagination') {
      const offset = this.offsetValue ?? 0;
      const limit = this.limitValue ?? 50;
      sql += ` OFFSET ${offset} LIMIT ${limit}`;
    }

    return {
      query: sql,
      parameters: conditions.parameters,
    };
  }

  async exec (): Promise<
    Q extends 'count' ? number :
      Q extends 'findOne' ? Document<T> | undefined :
        Q extends 'findAsTokenPagination' ? TokenPaginationResult<T> :
          Q extends 'findAsCursor' ? Cursor<T> :
            Document<T>[]
  > {
    const querySpec = this.buildQuery();
    const deserializeSchema = this.schema.getDeserializeSchema();

    if (this.queryType === 'count') {
      const { resources } = await this.container.items.query<number>(querySpec).fetchAll();
      return resources[0] as never;
    }

    if (this.queryType === 'findAsTokenPagination') {
      const feedOptions: FeedOptions = {
        maxItemCount: this.limitValue ?? 50,
        continuation: this.paginationToken
          ? Buffer.from(this.paginationToken, 'base64url').toString('utf-8')
          : undefined,
      };
      const response = await this.container.items.query(querySpec, feedOptions).fetchNext();
      const data = (response.resources ?? []).map((item: unknown) => deserializeSchema.parse(item)) as Document<T>[];
      const continuationToken = response.continuationToken;
      const next = continuationToken
        ? Buffer.from(continuationToken, 'utf-8').toString('base64url')
        : undefined;
      return { data, pagination: { next } } as never;
    }

    if (this.queryType === 'findAsCursor') {
      const cursor = this.createCursor(querySpec);
      return cursor as never;
    }

    if (this.queryType === 'findOne') {
      const { resources } = await this.container.items.query(querySpec).fetchAll();
      if (resources.length === 0) {
        return undefined as never;
      }
      return deserializeSchema.parse(resources[0]) as never;
    }

    // find, findAll
    if (this.queryType === 'findAll') {
      const allResults: Document<T>[] = [];
      const iterator = this.container.items.query(querySpec).getAsyncIterator();
      for await (const { resources } of iterator) {
        for (const item of resources) {
          allResults.push(deserializeSchema.parse(item) as Document<T>);
        }
      }
      return allResults as never;
    }

    // default: find with limit/offset
    const { resources } = await this.container.items.query(querySpec).fetchAll();
    return resources.map((item: unknown) => deserializeSchema.parse(item)) as never;
  }

  then<TResult1 = (
    Q extends 'count' ? number :
      Q extends 'findOne' ? Document<T> | undefined :
        Q extends 'findAsTokenPagination' ? TokenPaginationResult<T> :
          Q extends 'findAsCursor' ? Cursor<T> :
            Document<T>[]
  ), TResult2 = never>(
    onfulfilled?: ((value: (
      Q extends 'count' ? number :
        Q extends 'findOne' ? Document<T> | undefined :
          Q extends 'findAsTokenPagination' ? TokenPaginationResult<T> :
            Q extends 'findAsCursor' ? Cursor<T> :
              Document<T>[]
    )) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.exec().then(onfulfilled, onrejected);
  }

  private createCursor (querySpec: SqlQuerySpec): Cursor<T> {
    const container = this.container;
    const batchSize = this.batchSizeValue;
    const deserializeSchema = this.schema.getDeserializeSchema();

    return {
      async each (fn: (doc: Document<T>, index: number) => Promise<void> | void): Promise<void> {
        let globalIndex = 0;
        const feedOptions: FeedOptions = { maxItemCount: batchSize };
        const iterator = container.items.query(querySpec, feedOptions).getAsyncIterator();

        for await (const { resources } of iterator) {
          for (const item of resources) {
            const doc = deserializeSchema.parse(item) as Document<T>;
            await fn(doc, globalIndex);
            globalIndex++;
          }
        }
      },
    };
  }

  private buildConditions (filter: QueryFilter, paramPrefix = ''): SqlCondition {
    const clauses: string[] = [];
    const parameters: SqlParameter[] = [];

    for (const [ key, value ] of Object.entries(filter)) {
      if (key === '$or') {
        const orClauses = value as QueryFilter[];
        const orParts: string[] = [];
        for (let i = 0; i < orClauses.length; i++) {
          const sub = this.buildConditions(orClauses[i], `${paramPrefix}${i}`);
          if (sub.clause) {
            orParts.push(`(${sub.clause})`);
            parameters.push(...sub.parameters);
          }
        }
        if (orParts.length > 0) {
          clauses.push(`(${orParts.join(' OR ')})`);
        }
        continue;
      }

      if (key === '$and') {
        const andClauses = value as QueryFilter[];
        for (let i = 0; i < andClauses.length; i++) {
          const sub = this.buildConditions(andClauses[i], `${paramPrefix}${i}`);
          if (sub.clause) {
            clauses.push(sub.clause);
            parameters.push(...sub.parameters);
          }
        }
        continue;
      }

      const fieldPath = `r.${key}`;
      const paramBase = key.replace(/\./g, '_');

      if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        const operators = value as Record<string, unknown>;
        let opIndex = 0;
        for (const [ op, opValue ] of Object.entries(operators)) {
          const paramName = `@${paramBase}_${paramPrefix}${opIndex}`;
          switch (op) {
            case '$gt':
              clauses.push(`${fieldPath} > ${paramName}`);
              parameters.push({ name: paramName, value: opValue as JSONValue });
              break;
            case '$gte':
              clauses.push(`${fieldPath} >= ${paramName}`);
              parameters.push({ name: paramName, value: opValue as JSONValue });
              break;
            case '$lt':
              clauses.push(`${fieldPath} < ${paramName}`);
              parameters.push({ name: paramName, value: opValue as JSONValue });
              break;
            case '$lte':
              clauses.push(`${fieldPath} <= ${paramName}`);
              parameters.push({ name: paramName, value: opValue as JSONValue });
              break;
            case '$in': {
              const arr = opValue as unknown[];
              const inParams: string[] = [];
              for (let i = 0; i < arr.length; i++) {
                const inParam = `${paramName}_${i}`;
                inParams.push(inParam);
                parameters.push({ name: inParam, value: arr[i] as JSONValue });
              }
              clauses.push(`${fieldPath} IN (${inParams.join(', ')})`);
              break;
            }
          }
          opIndex++;
        }
      } else {
        const paramName = `@${paramBase}${paramPrefix}`;
        clauses.push(`${fieldPath} = ${paramName}`);
        parameters.push({ name: paramName, value: value as JSONValue });
      }
    }

    return {
      clause: clauses.join(' AND '),
      parameters,
    };
  }
}
