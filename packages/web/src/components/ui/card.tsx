import type { ComponentProps } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils/cn';

const cardVariants = cva('rounded-lg border border-gray-200 bg-white shadow-sm', {
  defaultVariants: {
    padding: 'md',
  },
  variants: {
    interactive: {
      true: `
        transition
        hover:border-blue-300 hover:shadow-md
      `,
    },
    padding: {
      lg: 'p-6',
      md: 'p-5',
      sm: 'p-4',
    },
  },
});

type CardProps = ComponentProps<'div'> & VariantProps<typeof cardVariants>;

export function Card({ className, interactive, padding, ...props }: CardProps) {
  return <div className={cn(cardVariants({ interactive, padding }), className)} {...props} />;
}
