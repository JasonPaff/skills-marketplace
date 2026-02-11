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
          bg-red-600 text-white
          hover:bg-red-700
        `,
        ghost: `
          text-gray-600
          hover:bg-gray-100 hover:text-gray-900
        `,
        primary: `
          bg-blue-600 text-white
          hover:bg-blue-700
        `,
        secondary: `
          border border-gray-300 bg-white text-gray-700
          hover:bg-gray-50
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
