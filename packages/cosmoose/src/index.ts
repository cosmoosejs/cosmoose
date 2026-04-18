// Connection
export { Cosmoose, type CosmooseOptions } from './connection/index.js';

// Schema
export { Schema, type SchemaOptions } from './schema/index.js';

// Model
export { Model } from './model/index.js';

// Query
export { type Cursor, QueryBuilder, type QueryType, type TokenPaginationResult } from './query/index.js';

// Types
export type {
  CompositeIndexEntry,
  ContainerConfig,
  Document,
  FieldDescriptor,
  PartitionKeyDefinition,
  PatchExpression,
  SchemaDefinition,
} from './types/index.js';
export { Type } from './types/index.js';

// Migration
export {
  type ContainerSyncResult,
  type ContainerSyncStatus,
  type DriftDetail,   syncContainer,
  syncContainers,
  type SyncReport,
} from './migration/index.js';

// Exceptions
export {
  InvalidIndexKeyException,
  InvalidUniqueKeyException,
  SchemaValidationFailedException,
} from './exceptions/index.js';

// ID generation
export { generateId } from './id/index.js';
