import Link from 'next/link';

const installCommand = 'npm install @cosmoose/core';

const quickStart = `import { Cosmoose, Schema, Type } from '@cosmoose/core';

// Connect
const cosmoose = new Cosmoose({
  endpoint: process.env.COSMOS_ENDPOINT!,
  key: process.env.COSMOS_KEY!,
  databaseName: 'my-app',
});
await cosmoose.connect();

// Define a schema
const userSchema = new Schema({
  name: { type: Type.STRING },
  email: { type: Type.EMAIL },
  age: { type: Type.NUMBER },
}, { timestamps: true, container: { partitionKey: '/email' } });

// Register a model & sync containers
const User = cosmoose.model('users', userSchema);
await cosmoose.syncContainers();

// Create a document
const user = await User.create({
  name: 'Alice',
  email: 'alice@example.com',
  age: 30,
});`;

const features = [
  {
    title: 'Type-safe schemas',
    description: 'Define document shapes with rich field types and full TypeScript inference.',
  },
  {
    title: 'Fluent query builder',
    description: 'Filter, sort, paginate, and iterate with a chainable API.',
  },
  {
    title: 'Container sync',
    description: 'Auto-create and update Cosmos DB containers from your schemas.',
  },
  {
    title: 'Batch operations',
    description: 'Bulk create and upsert with automatic retry support.',
  },
  {
    title: 'Patch operators',
    description: '$set, $incr, $unset, $add for efficient partial updates.',
  },
  {
    title: 'UUID v7 IDs',
    description: 'Sortable, unique identifiers generated automatically.',
  },
];

function CodeBlock({ code, label }: { code: string; label?: string }) {
  return (
    <div className="w-full rounded-xl border border-fd-border bg-fd-card text-left overflow-hidden">
      {label && (
        <div className="px-4 py-2 border-b border-fd-border text-xs text-fd-muted-foreground font-medium">
          {label}
        </div>
      )}
      <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function FullLogo({ className }: { className?: string }) {
  return (
    <img src="/logo-typo.svg" alt="cosmoose" className={`dark:invert ${className ?? ''}`} />
  );
}

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center px-4 py-20">
      {/* Hero */}
      <div className="text-center max-w-2xl mb-12">
        <div className="flex items-center justify-center mb-4">
          <img src="/logo-typo.svg" alt="cosmoose" className={`dark:invert h-16`} />
        </div>
        <p className="text-xl text-fd-muted-foreground mb-8">
          A type-safe ODM for Azure Cosmos DB.
          <br />
          Define schemas, query with a fluent API, and sync containers
          automatically.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/docs/getting-started/quick-start"
            className="inline-flex items-center rounded-lg bg-fd-primary px-6 py-3 text-fd-primary-foreground font-medium hover:bg-fd-primary/90 transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="/docs/api/cosmoose"
            className="inline-flex items-center rounded-lg border border-fd-border px-6 py-3 font-medium hover:bg-fd-accent transition-colors"
          >
            API Reference
          </Link>
          <a
            href="https://github.com/cosmoosejs/cosmoose"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-lg border border-fd-border px-6 py-3 font-medium hover:bg-fd-accent transition-colors"
          >
            <svg viewBox="0 0 16 16" className="size-5 mr-2 fill-current" aria-hidden="true">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
            </svg>
            GitHub
          </a>
        </div>
      </div>

      {/* Install + Quick Start */}
      <div className="w-full max-w-2xl flex flex-col gap-4 mb-20">
        <CodeBlock label="Install" code={installCommand} />
        <CodeBlock label="Quick start" code={quickStart} />
      </div>

      {/* Features */}
      <div className="w-full max-w-4xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-fd-border bg-fd-card p-6"
            >
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-fd-muted-foreground">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
