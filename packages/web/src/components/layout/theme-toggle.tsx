'use client';

import { Popover } from '@base-ui/react/popover';
import { Moon, Palette, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useEffectEvent, useState } from 'react';

import { useAccentColor } from '@/lib/theme/accent-color-provider';
import { cn } from '@/lib/utils/cn';

const COLOR_SWATCHES: { color: string; label: string; value: string }[] = [
  { color: 'bg-blue-500', label: 'Blue', value: 'blue' },
  { color: 'bg-purple-500', label: 'Purple', value: 'purple' },
  { color: 'bg-green-500', label: 'Green', value: 'green' },
  { color: 'bg-rose-500', label: 'Rose', value: 'rose' },
  { color: 'bg-orange-500', label: 'Orange', value: 'orange' },
  { color: 'bg-teal-500', label: 'Teal', value: 'teal' },
];

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { setTheme, theme } = useTheme();
  const { accentColor, setAccentColor } = useAccentColor();

  const updateTheme = useEffectEvent(() => setMounted(true));

  useEffect(() => updateTheme(), []);

  if (!mounted) return null;

  const isDark = theme === 'dark';

  return (
    <Popover.Root>
      <Popover.Trigger
        className="
          fixed top-4 right-4 z-50 rounded-full border border-border bg-surface
          p-2.5 shadow-md transition
          hover:bg-surface-secondary
        "
      >
        <Palette className="size-5 text-text-secondary" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner align="end" side="bottom" sideOffset={8}>
          <Popover.Popup
            className="
              w-56 rounded-xl border border-border bg-surface p-4 shadow-xl
            "
          >
            <p
              className="
                mb-3 text-xs font-semibold tracking-wider text-text-tertiary
                uppercase
              "
            >
              Appearance
            </p>

            {/* Light / Dark toggle */}
            <div className="mb-4 flex rounded-lg bg-surface-secondary p-1">
              <button
                className={cn(
                  `
                    flex flex-1 items-center justify-center gap-1.5 rounded-md
                    px-3 py-1.5 text-xs font-medium transition
                  `,
                  !isDark
                    ? 'bg-surface text-text-primary shadow-sm'
                    : `
                      text-text-tertiary
                      hover:text-text-secondary
                    `,
                )}
                onClick={() => setTheme('light')}
              >
                <Sun className="size-3.5" />
                Light
              </button>
              <button
                className={cn(
                  `
                    flex flex-1 items-center justify-center gap-1.5 rounded-md
                    px-3 py-1.5 text-xs font-medium transition
                  `,
                  isDark
                    ? 'bg-surface text-text-primary shadow-sm'
                    : `
                      text-text-tertiary
                      hover:text-text-secondary
                    `,
                )}
                onClick={() => setTheme('dark')}
              >
                <Moon className="size-3.5" />
                Dark
              </button>
            </div>

            {/* Accent color swatches */}
            <p
              className="
                mb-2 text-xs font-semibold tracking-wider text-text-tertiary
                uppercase
              "
            >
              Accent Color
            </p>
            <div className="grid grid-cols-6 gap-2">
              {COLOR_SWATCHES.map((swatch) => (
                <button
                  aria-label={swatch.label}
                  className={cn(
                    `
                      size-7 rounded-full transition
                      hover:scale-110
                    `,
                    swatch.color,
                    accentColor === swatch.value
                      ? `
                        ring-2 ring-text-primary ring-offset-2
                        ring-offset-surface
                      `
                      : '',
                  )}
                  key={swatch.value}
                  onClick={() => setAccentColor(swatch.value as typeof accentColor)}
                />
              ))}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
