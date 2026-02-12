import type { ComponentProps } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils/cn';

const textareaVariants = cva(
  `
    rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm
    text-text-primary
    focus:border-accent-ring focus:ring-1 focus:ring-accent-ring
    focus:outline-none
    disabled:cursor-not-allowed disabled:opacity-50
  `,
  {
    defaultVariants: {
      error: false,
    },
    variants: {
      error: {
        true: `
          border-status-error
          focus:border-status-error focus:ring-status-error
        `,
      },
    },
  },
);

type TextareaProps = ComponentProps<'textarea'> & VariantProps<typeof textareaVariants>;

export function Textarea({ className, error, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(textareaVariants({ error }), className)}
      {...props}
    />
  );
}
