'use client';

import type { ComponentProps } from 'react';

import { Input as BaseInput } from '@base-ui/react/input';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils/cn';

const inputVariants = cva(
  `
    rounded-lg border bg-surface px-3 py-2 text-sm text-text-primary
    focus:ring-1 focus:outline-none
    disabled:cursor-not-allowed disabled:opacity-50
  `,
  {
    defaultVariants: {
      error: false,
    },
    variants: {
      error: {
        false: `
          border-border-strong
          focus:border-accent-ring focus:ring-accent-ring
        `,
        true: `
          border-status-error
          focus:border-status-error focus:ring-status-error
        `,
      },
    },
  },
);

type InputProps = ComponentProps<typeof BaseInput> & VariantProps<typeof inputVariants>;

export function Input({ className, error, ...props }: InputProps) {
  return <BaseInput className={cn(inputVariants({ error }), className)} {...props} />;
}
