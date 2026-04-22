'use client';

import { useState } from 'react';

const commands = [
  { label: 'pnpm', command: 'pnpm add @cosmoose/core' },
  { label: 'yarn', command: 'yarn add @cosmoose/core' },
  { label: 'npm', command: 'npm install @cosmoose/core' },
];

export function InstallTabs() {
  const [active, setActive] = useState(0);

  return (
    <div className="w-full rounded-xl border border-fd-border bg-fd-card text-left overflow-hidden">
      <div className="flex items-center gap-1 px-4 py-2 border-b border-fd-border">
        {commands.map((c, i) => (
          <button
            key={c.label}
            onClick={() => setActive(i)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              active === i
                ? 'bg-fd-accent text-fd-accent-foreground'
                : 'text-fd-muted-foreground hover:text-fd-foreground'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
      <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
        <code>{commands[active].command}</code>
      </pre>
    </div>
  );
}
