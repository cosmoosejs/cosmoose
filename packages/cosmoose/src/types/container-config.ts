export interface SimplePartitionKey {
  paths: string[];
  kind?: 'Hash';
}

export interface HierarchicalPartitionKey {
  paths: string[];
  kind: 'MultiHash';
}

export type PartitionKeyDefinition = string | SimplePartitionKey | HierarchicalPartitionKey;

export interface CompositeIndexEntry {
  [path: string]: 1 | -1;
}

export interface ContainerConfig {
  partitionKey?: PartitionKeyDefinition;
  uniqueKeys?: string[][];
  compositeIndexes?: CompositeIndexEntry[];
  ttl?: number;
}
