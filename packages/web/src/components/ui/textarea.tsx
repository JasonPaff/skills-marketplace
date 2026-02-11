import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils/cn';

type TextareaProps = ComponentProps<'textarea'>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
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
