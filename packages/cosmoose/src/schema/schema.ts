import { z, type ZodTypeAny } from 'zod';

import type {
  ContainerConfig,
  FieldDescriptor,
  SchemaDefinition,
} from '~/types/index.js';
import { Type } from '~/types/type.js';

export interface SchemaOptions {
  timestamps?: boolean;
  container?: ContainerConfig;
}

export class Schema<T extends Record<string, unknown>> {
  private readonly definition: SchemaDefinition<T>;
  private readonly options: SchemaOptions;

  private cachedCreateSchema: ZodTypeAny | undefined;
  private cachedPatchSchema: ZodTypeAny | undefined;
  private cachedDeserializeSchema: ZodTypeAny | undefined;
  private cachedNestedDeserializeSchema: ZodTypeAny | undefined;

  constructor (definition: SchemaDefinition<T>, options: SchemaOptions = {}) {
    this.definition = definition;
    this.options = options;
  }

  getDefinition (): SchemaDefinition<T> {
    return this.definition;
  }

  getContainerConfig (): ContainerConfig {
    return this.options.container ?? {};
  }

  getOptions (): SchemaOptions {
    return this.options;
  }

  getCreateSchema (): ZodTypeAny {
    if (!this.cachedCreateSchema) {
      this.cachedCreateSchema = this.buildCreateSchema();
    }

    return this.cachedCreateSchema;
  }

  getPatchSchema (): ZodTypeAny {
    if (!this.cachedPatchSchema) {
      this.cachedPatchSchema = this.buildPatchSchema();
    }

    return this.cachedPatchSchema;
  }

  getDeserializeSchema (): ZodTypeAny {
    if (!this.cachedDeserializeSchema) {
      this.cachedDeserializeSchema = this.buildDeserializeSchema();
    }

    return this.cachedDeserializeSchema;
  }

  private buildCreateSchema (): ZodTypeAny {
    const shape: Record<string, ZodTypeAny> = {};
    shape['id'] = z.string().optional();

    for (const [ key, descriptor ] of Object.entries(this.definition) as [string, FieldDescriptor][]) {
      let fieldSchema = this.compileFieldToZod(descriptor);

      if (descriptor.default !== undefined) {
        fieldSchema = fieldSchema.default(descriptor.default);
      } else if (descriptor.optional) {
        fieldSchema = fieldSchema.optional();
      }

      shape[key] = fieldSchema;
    }

    if (this.options.timestamps) {
      shape['createdAt'] = z.date().optional();
      shape['updatedAt'] = z.date().optional();
    }

    return z.object(shape);
  }

  private buildPatchSchema (): ZodTypeAny {
    const shape: Record<string, ZodTypeAny> = {};

    for (const [ key, descriptor ] of Object.entries(this.definition) as [string, FieldDescriptor][]) {
      const fieldSchema = this.compileFieldToZod(descriptor);
      shape[key] = fieldSchema.nullable().optional();
    }

    if (this.options.timestamps) {
      shape['updatedAt'] = z.date().optional();
    }

    return z.object(shape).partial();
  }

  private buildDeserializeSchema (): ZodTypeAny {
    const shape: Record<string, ZodTypeAny> = {};
    shape['id'] = z.string();
    shape['_etag'] = z.string().optional();
    shape['_ts'] = z.number().optional();
    shape['_rid'] = z.string().optional();
    shape['_self'] = z.string().optional();
    shape['_attachments'] = z.string().optional();

    for (const [ key, descriptor ] of Object.entries(this.definition) as [string, FieldDescriptor][]) {
      let fieldSchema = this.compileFieldToZodForDeserialize(descriptor);
      fieldSchema = fieldSchema.nullable();

      if (descriptor.optional || descriptor.default !== undefined) {
        fieldSchema = fieldSchema.optional();
      }

      shape[key] = fieldSchema;
    }

    if (this.options.timestamps) {
      shape['createdAt'] = z.string().transform((v) => new Date(v)).optional();
      shape['updatedAt'] = z.string().transform((v) => new Date(v)).optional();
    }

    return z.object(shape);
  }

  private buildNestedDeserializeSchema (): ZodTypeAny {
    const shape: Record<string, ZodTypeAny> = {};

    for (const [ key, descriptor ] of Object.entries(this.definition) as [string, FieldDescriptor][]) {
      let fieldSchema = this.compileFieldToZodForDeserialize(descriptor);
      fieldSchema = fieldSchema.nullable();

      if (descriptor.optional || descriptor.default !== undefined) {
        fieldSchema = fieldSchema.optional();
      }

      shape[key] = fieldSchema;
    }

    return z.object(shape);
  }

  getNestedDeserializeSchema (): ZodTypeAny {
    if (!this.cachedNestedDeserializeSchema) {
      this.cachedNestedDeserializeSchema = this.buildNestedDeserializeSchema();
    }
    return this.cachedNestedDeserializeSchema;
  }

  private compileFieldToZod (descriptor: FieldDescriptor): ZodTypeAny {
    switch (descriptor.type) {
      case Type.STRING: {
        let s = z.string();

        if (descriptor.trim) {
          s = s.trim();
        }

        if (descriptor.lowercase) {
          return s.transform((v) => v.toLowerCase());
        }

        if (descriptor.uppercase) {
          return s.transform((v) => v.toUpperCase());
        }

        return s;
      }

      case Type.NUMBER: {
        return z.number();
      }

      case Type.BOOLEAN: {
        return z.boolean();
      }

      case Type.DATE: {
        return z.date();
      }

      case Type.EMAIL: {
        return z.string().trim().toLowerCase().email();
      }

      case Type.OBJECT: {
        return descriptor.schema.getCreateSchema();
      }

      case Type.ARRAY: {
        return z.array(this.compileFieldToZod(descriptor.items));
      }

      case Type.MAP: {
        return z.record(z.string(), this.compileFieldToZodPrimitive(descriptor.of));
      }

      case Type.ANY: {
        return z.any();
      }
    }
  }

  private compileFieldToZodForDeserialize (descriptor: FieldDescriptor): ZodTypeAny {
    switch (descriptor.type) {
      case Type.STRING:
        return z.string();
      case Type.NUMBER:
        return z.number();
      case Type.BOOLEAN:
        return z.boolean();
      case Type.DATE:
        return z.string().transform((v) => new Date(v));
      case Type.EMAIL:
        return z.string();
      case Type.OBJECT:
        return descriptor.schema.getNestedDeserializeSchema();
      case Type.ARRAY:
        return z.array(this.compileFieldToZodForDeserialize(descriptor.items));
      case Type.MAP:
        return z.record(z.string(), this.compileFieldToZodPrimitive(descriptor.of));
      case Type.ANY:
        return z.any();
    }
  }

  private compileFieldToZodPrimitive (type: Type): ZodTypeAny {
    switch (type) {
      case Type.STRING:
        return z.string();
      case Type.NUMBER:
        return z.number();
      case Type.BOOLEAN:
        return z.boolean();
      case Type.DATE:
        return z.date();
      case Type.EMAIL:
        return z.string().email();
      case Type.ANY:
        return z.any();
      default:
        throw new Error(`Unsupported primitive type: ${type as string}`);
    }
  }
}
