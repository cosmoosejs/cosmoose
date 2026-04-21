import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { redirect, notFound } from 'next/navigation';
import { getSource, parseVersionedSlug, versions } from '@/lib/source';
import { baseOptions } from '@/lib/layout.shared';
import { VersionSelector } from '@/components/version-selector';

export default async function SlugLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const { version, isLatest } = parseVersionedSlug(slug);

  // If someone accesses /docs/v0.1/... and v0.1 is latest, redirect to /docs/...
  if (
    slug &&
    slug.length > 0 &&
    slug[0] === versions.latest
  ) {
    const rest = slug.slice(1).join('/');
    redirect(rest ? `/docs/${rest}` : '/docs');
  }

  const source = getSource(version);

  if (!source) notFound();

  return (
    <DocsLayout
      {...baseOptions()}
      tree={source.getPageTree()}
      sidebar={{
        banner: (
          <VersionSelector
            current={version}
            versions={versions.versions}
            latest={versions.latest}
          />
        ),
      }}
    >
      {children}
    </DocsLayout>
  );
}
