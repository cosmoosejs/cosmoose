import { v0_1 } from 'collections/server';
import { loader } from 'fumadocs-core/source';
import { icons } from 'lucide-react';
import versions from '../versions.json';

function iconLoader(icon: string | undefined) {
  if (icon && icon in icons) {
    const Icon = icons[icon as keyof typeof icons];
    return <Icon />;
  }
}

const sources = {
  'v0.1': loader({
    baseUrl: '/docs',
    source: v0_1.toFumadocsSource(),
    icon: iconLoader,
  }),
};

type Source = (typeof sources)[keyof typeof sources];

export function getSource(version?: string): Source | undefined {
  const v = version ?? versions.latest;
  return sources[v as keyof typeof sources];
}

export function parseVersionedSlug(slug?: string[]): {
  version: string;
  isLatest: boolean;
  pageSlug: string[] | undefined;
} {
  if (slug && slug.length > 0 && versions.versions.includes(slug[0])) {
    if (slug[0] === versions.latest) {
      // Explicit latest version in URL — should redirect to canonical
      return { version: slug[0], isLatest: true, pageSlug: slug.slice(1) };
    }
    return {
      version: slug[0],
      isLatest: false,
      pageSlug: slug.length > 1 ? slug.slice(1) : undefined,
    };
  }

  return { version: versions.latest, isLatest: true, pageSlug: slug };
}

export { versions };
