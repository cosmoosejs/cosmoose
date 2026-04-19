import { describe, expect, it } from 'vitest';

import { InvalidIndexKeyException } from './invalid-index-key.exception.js';
import { InvalidUniqueKeyException } from './invalid-unique-key.exception.js';

describe('InvalidIndexKeyException', () => {
  it('should set name and message', () => {
    const err = new InvalidIndexKeyException('bad index');
    expect(err.name).toBe('InvalidIndexKeyException');
    expect(err.message).toBe('bad index');
    expect(err).toBeInstanceOf(Error);
  });
});

describe('InvalidUniqueKeyException', () => {
  it('should set name and message', () => {
    const err = new InvalidUniqueKeyException('duplicate key');
    expect(err.name).toBe('InvalidUniqueKeyException');
    expect(err.message).toBe('duplicate key');
    expect(err).toBeInstanceOf(Error);
  });
});
