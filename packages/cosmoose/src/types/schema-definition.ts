import type { Schema } from '~/schema/schema.js';

import { Type } from './type.js';

export interface BaseFieldDescriptor {
  optional?: boolean;
  default?: unknown;
}

export interface StringFieldDescriptor extends BaseFieldDescriptor {
  type: Type.STRING;
  trim?: boolean;
  lowercase?: boolean;
  uppercase?: boolean;
  default?: string;
}

export interface NumberFieldDescriptor extends BaseFieldDescriptor {
  type: Type.NUMBER;
  default?: number;
}

export interface BooleanFieldDescriptor extends BaseFieldDescriptor {
  type: Type.BOOLEAN;
  default?: boolean;
}

export interface DateFieldDescriptor extends BaseFieldDescriptor {
  type: Type.DATE;
  default?: Date;
}

export interface EmailFieldDescriptor extends BaseFieldDescriptor {
  type: Type.EMAIL;
  trim?: boolean;
  lowercase?: boolean;
  default?: string;
}

export interface AnyFieldDescriptor extends BaseFieldDescriptor {
  type: Type.ANY;
}

export interface ObjectFieldDescriptor extends BaseFieldDescriptor {
  type: Type.OBJECT;
  schema: Schema<Record<string, unknown>>;
}

export interface ArrayFieldDescriptor extends BaseFieldDescriptor {
  type: Type.ARRAY;
  items: FieldDescriptor;
}

export interface MapFieldDescriptor extends BaseFieldDescriptor {
  type: Type.MAP;
  of: Type;
}

export type FieldDescriptor =
  | StringFieldDescriptor
  | NumberFieldDescriptor
  | BooleanFieldDescriptor
  | DateFieldDescriptor
  | EmailFieldDescriptor
  | AnyFieldDescriptor
  | ObjectFieldDescriptor
  | ArrayFieldDescriptor
  | MapFieldDescriptor;

export type SchemaDefinition<T> = {
  [K in keyof T]: FieldDescriptor;
};
