import type { ZodError } from 'zod';

export class SchemaValidationFailedException extends Error {
  public readonly errors: ZodError['errors'];

  constructor (zodError: ZodError) {
    super(`Schema validation failed: ${zodError.message}`);
    this.name = 'SchemaValidationFailedException';
    this.errors = zodError.errors;
  }
}
