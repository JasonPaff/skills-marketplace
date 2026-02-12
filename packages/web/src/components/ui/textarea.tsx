import type { ComponentProps } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils/cn';

const textareaVariants = cva(
  `
    rounded-lg border border-gray-300 px-3 py-2 text-sm
    focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none
    disabled:cursor-not-allowed disabled:opacity-50
  `,
  {
    defaultVariants: {
      error: false,
    },
    variants: {
      error: {
        true: `
          border-red-500
          focus:border-red-500 focus:ring-red-500
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
