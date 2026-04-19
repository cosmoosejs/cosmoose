import { Cosmoose, type CosmooseOptions } from '~/connection/index.js';

export function createCosmooseOptions (databaseName: string): CosmooseOptions {
  const endpoint = process.env['COSMOS_ENDPOINT'];
  const key = process.env['COSMOS_KEY'];

  if (!endpoint || !key) {
    throw new Error('COSMOS_ENDPOINT and COSMOS_KEY must be set. Is the emulator running via globalSetup?');
  }

  return { endpoint, key, databaseName };
}

export function uniqueDatabaseName (prefix: string): string {
  return `${prefix}-${Date.now()}`;
}

export async function createConnectedCosmoose (databaseName: string): Promise<Cosmoose> {
  const options = createCosmooseOptions(databaseName);
  const cosmoose = new Cosmoose(options);
  await cosmoose.connect();
  return cosmoose;
}

export async function cleanupDatabase (cosmoose: Cosmoose): Promise<void> {
  const db = cosmoose.getDatabase();
  if (db) {
    await db.delete();
  }
}
