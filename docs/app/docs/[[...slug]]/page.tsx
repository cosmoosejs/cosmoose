import { getSource, parseVersionedSlug, versions } from '@/lib/source';
import {
  DocsPage,
  DocsBody,
} from 'fumadocs-ui/page';
import { notFound, redirect } from 'next/navigation';
import { getMDXComponents } from '@/components/mdx';
import { VersionNotFound } from '@/components/version-not-found';

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const { version, isLatest, pageSlug } = parseVersionedSlug(params.slug);

  if (!pageSlug || pageSlug.length === 0) {
    const prefix = isLatest ? '/docs' : `/docs/${version}`;
    redirect(`${prefix}/getting-started/quick-start`);
  }

  const source = getSource(version);

  if (!source) notFound();

  const page = source.getPage(pageSlug);

  if (!page) {
    if (!isLatest) {
      return <VersionNotFound version={version} slug={pageSlug} />;
    }
    notFound();
  }

  const Mdx = page.data.body;
  const toc = page.data.toc;

  return (
    <DocsPage toc={toc}>
      <h1 className="text-[1.75em] font-semibold">{page.data.title}</h1>
      {page.data.description && (
        <p className="text-lg text-fd-muted-foreground mb-4">
          {page.data.description}
        </p>
      )}
      <DocsBody>
        <Mdx components={getMDXComponents()} />
      </DocsBody>
    </DocsPage>
  );
}

export function generateStaticParams() {
  const allParams: { slug?: string[] }[] = [];

  // Latest version pages (no version prefix)
  const latestSource = getSource()!;
  for (const param of latestSource.generateParams()) {
    allParams.push(param);
  }

  // Non-latest version pages (with version prefix)
  for (const version of versions.versions) {
    if (version === versions.latest) continue;
    const source = getSource(version);
    if (!source) continue;
    for (const param of source.generateParams()) {
      allParams.push({ slug: [version, ...(param.slug ?? [])] });
    }
  }

  return allParams;
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const { version, pageSlug } = parseVersionedSlug(params.slug);
  const source = getSource(version);

  if (!source) return {};

  const page = source.getPage(pageSlug);

  if (!page) return {};

  return {
    title: page.data.title,
    description: page.data.description,
  };
}
