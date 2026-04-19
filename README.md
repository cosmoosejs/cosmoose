# Cosmoose

A type-safe ODM for Azure Cosmos DB, built with TypeScript.

## Features

- **Type-safe schemas** — Define document shapes with rich field types, validation, and transforms
- **CRUD operations** — Create, read, update, patch, and delete with full type safety
- **Fluent query builder** — Filter, sort, paginate, and iterate with a chainable API
- **Patch operators** — `$set`, `$incr`, `$unset`, `$add` for efficient partial updates
- **Batch operations** — Bulk create and upsert with retry support
- **Container sync** — Auto-create and update Cosmos DB containers from schemas
- **Drift detection** — Identify mismatches between schema and container configuration
- **UUID v7 IDs** — Sortable, unique identifiers generated automatically
- **Timestamps** — Optional `createdAt` / `updatedAt` management

## Install

```bash
pnpm add @cosmoose/core
```

## Quick Start

```ts
import { Cosmoose, Schema, Type } from '@cosmoose/core';

// 1. Connect
const cosmoose = new Cosmoose({
  endpoint: process.env.COSMOS_ENDPOINT!,
  key: process.env.COSMOS_KEY!,
  databaseName: 'my-app',
});
await cosmoose.connect();

// 2. Define a schema
interface User {
  name: string;
  email: string;
  age: number;
  role: string;
}

const userSchema = new Schema<User>(
  {
    name: { type: Type.STRING, trim: true },
    email: { type: Type.EMAIL },
    age: { type: Type.NUMBER },
    role: { type: Type.STRING, default: 'member' },
  },
  {
    timestamps: true,
    container: { partitionKey: '/email' },
  },
);

// 3. Register a model
const User = cosmoose.model('users', userSchema);

// 4. Sync containers
await cosmoose.syncContainers();

// 5. Create a document
const user = await User.create({
  name: 'Alice',
  email: 'alice@example.com',
  age: 30,
});

// 6. Query
const admins = await User.find({ role: 'admin' })
  .sort({ name: 1 })
  .limit(10);

const count = await User.count({ age: { $gte: 18 } });
```

## Documentation

📖 **[Full documentation →](https://cosmoose.vercel.app)**

- [Installation](https://cosmoose.vercel.app/docs/getting-started/installation)
- [Quick Start](https://cosmoose.vercel.app/docs/getting-started/quick-start)
- [Schema Guide](https://cosmoose.vercel.app/docs/guide/schema)
- [Query Guide](https://cosmoose.vercel.app/docs/guide/querying)
- [API Reference](https://cosmoose.vercel.app/docs/api/cosmoose)

## License

ISC
