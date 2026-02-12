import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils/cn';

type SelectProps = ComponentProps<'select'>;

export function Select({ className, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        `
          rounded-lg border border-border-strong bg-surface px-4 py-2 text-sm
          text-text-primary
          focus:border-accent-ring focus:ring-1 focus:ring-accent-ring
          focus:outline-none
          disabled:cursor-not-allowed disabled:opacity-50
        `,
        className,
      )}
      {...props}
    />
  );
}
