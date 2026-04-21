import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/logo-typo.svg" alt="Cosmoose" className="h-5 dark:invert" />
      ),
    },
  };
}
