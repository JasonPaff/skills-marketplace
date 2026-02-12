'use client';

import type { ComponentProps } from 'react';

import { Input as BaseInput } from '@base-ui/react/input';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils/cn';

const inputVariants = cva(
  `
    rounded-lg border px-3 py-2 text-sm
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
          border-gray-300
          focus:border-blue-500 focus:ring-blue-500
        `,
        true: `
          border-red-500
          focus:border-red-500 focus:ring-red-500
        `,
      },
    },
  },
);

type InputProps = ComponentProps<typeof BaseInput> &
  VariantProps<typeof inputVariants>;

export function Input({ className, error, ...props }: InputProps) {
  return (
    <BaseInput
      className={cn(inputVariants({ error }), className)}
      {...props}
    />
  );
}
