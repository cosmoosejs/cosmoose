import Link from 'next/link';

export function VersionNotFound({
  version,
  slug,
}: {
  version: string;
  slug: string[];
}) {
  const latestPath = `/docs/${slug.join('/')}`;

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="rounded-lg border border-fd-border bg-fd-card p-6">
        <h2 className="text-lg font-semibold text-fd-foreground">
          Page not available in {version}
        </h2>
        <p className="mt-2 text-sm text-fd-muted-foreground">
          This page does not exist in version {version} of the documentation.
        </p>
        <Link
          href={latestPath}
          className="mt-4 inline-block rounded-md bg-fd-primary px-4 py-2 text-sm font-medium text-fd-primary-foreground hover:bg-fd-primary/90"
        >
          View in latest version
        </Link>
      </div>
    </div>
  );
}
