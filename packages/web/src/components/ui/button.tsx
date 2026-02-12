'use client';

import type { ComponentProps } from 'react';

import { Button as BaseButton } from '@base-ui/react/button';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils/cn';

const buttonVariants = cva(
  `
    inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium
    transition
    disabled:cursor-not-allowed disabled:opacity-50
  `,
  {
    defaultVariants: {
      size: 'md',
      variant: 'primary',
    },
    variants: {
      fullWidth: {
        true: 'w-full',
      },
      size: {
        lg: 'px-6 py-2.5 text-base',
        md: 'px-4 py-2',
        sm: 'px-3 py-1.5 text-xs',
      },
      variant: {
        destructive: `
          bg-status-error text-text-on-accent
          hover:opacity-90
        `,
        ghost: `
          text-text-secondary
          hover:bg-surface-tertiary hover:text-text-primary
        `,
        primary: `
          bg-accent text-text-on-accent
          hover:bg-accent-hover
        `,
        secondary: `
          border border-border-strong bg-surface text-text-secondary
          hover:bg-surface-secondary
        `,
      },
    },
  },
);

type ButtonProps = ComponentProps<typeof BaseButton> &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean;
  };

export function Button({
  children,
  className,
  disabled,
  fullWidth,
  loading,
  size,
  variant,
  ...props
}: ButtonProps) {
  return (
    <BaseButton
      className={cn(buttonVariants({ fullWidth, size, variant }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </BaseButton>
  );
}
