import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center text-center px-4 py-16">
      <h1 className="text-4xl font-bold mb-4">Cosmoose</h1>
      <p className="text-lg text-fd-muted-foreground mb-8 max-w-lg">
        A type-safe ODM for Azure Cosmos DB. Define schemas, query with a fluent
        API, and sync containers automatically.
      </p>
      <Link
        href="/docs"
        className="inline-flex items-center rounded-lg bg-fd-primary px-6 py-3 text-fd-primary-foreground font-medium hover:bg-fd-primary/90 transition-colors"
      >
        Get Started →
      </Link>
    </main>
  );
}
