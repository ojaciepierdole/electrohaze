'use client';

import * as React from 'react';
import { Command } from 'cmdk';

interface CommandMenuItem {
  id: string;
  label: string;
  description?: string;
  onSelect: () => void;
}

interface CommandMenuProps {
  items: CommandMenuItem[];
}

export function CommandMenu({ items }: CommandMenuProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Command>
      <Command.Input placeholder="Szukaj..." />
      <Command.List>
        <Command.Empty>Nie znaleziono wyników.</Command.Empty>
        {items.map((item) => (
          <Command.Item key={item.id} onSelect={item.onSelect}>
            <div>
              <div>{item.label}</div>
              {item.description && (
                <div className="text-sm text-gray-500">{item.description}</div>
              )}
            </div>
          </Command.Item>
        ))}
      </Command.List>
    </Command>
  );
} 