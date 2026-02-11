import type { ComponentProps } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils/cn';

const badgeVariants = cva('inline-flex items-center rounded-full font-medium', {
  defaultVariants: {
    size: 'md',
    variant: 'neutral',
  },
  variants: {
    size: {
      md: 'px-2 py-0.5 text-xs',
      sm: 'px-1.5 py-0.5 text-xs',
    },
    variant: {
      amber: 'bg-amber-50 text-amber-700',
      cyan: 'bg-cyan-100 text-cyan-800',
      danger: 'bg-red-100 text-red-800',
      'green-subtle': 'bg-green-50 text-green-700',
      neutral: 'bg-gray-100 text-gray-800',
      orange: 'bg-orange-100 text-orange-800',
      primary: 'bg-blue-100 text-blue-800',
      purple: 'bg-purple-100 text-purple-800',
      sky: 'bg-sky-100 text-sky-800',
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
    },
  },
});

type BadgeProps = ComponentProps<'span'> & VariantProps<typeof badgeVariants>;

export function Badge({ className, size, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ size, variant }), className)} {...props} />;
}
