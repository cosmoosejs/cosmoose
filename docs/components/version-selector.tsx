'use client';

import { usePathname, useRouter } from 'next/navigation';

interface VersionSelectorProps {
  current: string;
  versions: string[];
  latest: string;
}

export function VersionSelector({ current, versions, latest }: VersionSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();

  if (versions.length <= 1) return null;

  const isLatest = current === latest;

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const selected = e.target.value;
    const selectedIsLatest = selected === latest;

    // Extract the slug from the current path
    let slug: string;
    if (isLatest) {
      // Current URL: /docs/guide/schema → slug = guide/schema
      slug = pathname.replace(/^\/docs\/?/, '');
    } else {
      // Current URL: /docs/v0.1/guide/schema → slug = guide/schema
      slug = pathname.replace(new RegExp(`^/docs/${current}/?`), '');
    }

    // Build target URL
    const targetPath = selectedIsLatest
      ? `/docs/${slug}`
      : `/docs/${selected}/${slug}`;

    router.push(targetPath);
  }

  return (
    <select
      value={current}
      onChange={handleChange}
      className="w-full rounded-md border border-fd-border bg-fd-background px-3 py-1.5 text-sm text-fd-foreground"
    >
      {versions.map((v) => (
        <option key={v} value={v}>
          {v === latest ? `Latest (${v})` : v}
        </option>
      ))}
    </select>
  );
}
