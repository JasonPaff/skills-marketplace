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
      amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
      cyan: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-400',
      danger: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400',
      'green-subtle': 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400',
      neutral: 'bg-surface-tertiary text-text-primary',
      orange: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-400',
      primary: 'bg-accent-subtle text-accent-text',
      purple: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-400',
      sky: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-400',
      success: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400',
      warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-400',
    },
  },
});

type BadgeProps = ComponentProps<'span'> & VariantProps<typeof badgeVariants>;

export function Badge({ className, size, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ size, variant }), className)} {...props} />;
}
