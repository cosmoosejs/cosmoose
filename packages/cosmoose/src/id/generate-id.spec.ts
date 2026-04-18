import { describe, expect, it } from 'vitest';

import { generateId } from './generate-id.js';

describe('generateId', () => {
  it('should return a 32-character lowercase hexadecimal string', () => {
    const id = generateId();
    expect(id).toMatch(/^[0-9a-f]{32}$/);
  });

  it('should not contain hyphens', () => {
    const id = generateId();
    expect(id).not.toContain('-');
  });

  it('should generate unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });

  it('should produce time-sortable IDs (T1 < T2 lexicographically)', async () => {
    const id1 = generateId();
    // Small delay to ensure different timestamp
    await new Promise((resolve) => setTimeout(resolve, 2));
    const id2 = generateId();
    expect(id1 < id2).toBe(true);
  });

  it('should have extractable timestamp from first 12 hex chars', () => {
    const before = Date.now();
    const id = generateId();
    const after = Date.now();

    const timestampHex = id.slice(0, 12);
    const timestamp = parseInt(timestampHex, 16);

    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });
});
