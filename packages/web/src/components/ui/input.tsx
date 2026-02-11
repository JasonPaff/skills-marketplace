'use client';

import type { ComponentProps } from 'react';

import { Input as BaseInput } from '@base-ui/react/input';

import { cn } from '@/lib/utils/cn';

type InputProps = ComponentProps<typeof BaseInput>;

export function Input({ className, ...props }: InputProps) {
  return (
    <BaseInput
      className={cn(
        `
          rounded-lg border border-gray-300 px-3 py-2 text-sm
          focus:border-blue-500 focus:ring-1 focus:ring-blue-500
          focus:outline-none
          disabled:cursor-not-allowed disabled:opacity-50
        `,
        className,
      )}
      {...props}
    />
  );
}
