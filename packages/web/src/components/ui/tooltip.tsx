'use client';

import type { ComponentProps, ReactNode } from 'react';

import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils/cn';

const tooltipPopupVariants = cva(
  `rounded-lg px-3 py-1.5 text-sm/normal shadow-lg`,
  {
    defaultVariants: {
      size: 'md',
      variant: 'dark',
    },
    variants: {
      size: {
        lg: 'max-w-sm px-4 py-2 text-sm',
        md: 'max-w-xs px-3 py-1.5 text-xs',
        sm: 'max-w-[200px] px-2 py-1 text-xs',
      },
      variant: {
        dark: 'bg-gray-900 text-white',
        light: 'border border-gray-200 bg-white text-gray-900',
      },
    },
  },
);

const tooltipArrowVariants = cva('', {
  defaultVariants: {
    variant: 'dark',
  },
  variants: {
    variant: {
      dark: '[&>path]:fill-gray-900',
      light: '[&>path]:fill-white [&>path]:stroke-gray-200',
    },
  },
});

type TooltipProps = Omit<ComponentProps<typeof BaseTooltip.Root>, 'children'> &
  VariantProps<typeof tooltipPopupVariants> & {
    /** The trigger element to wrap */
    children: ReactNode;
    /** Additional class names for the popup element */
    className?: string;
    /** The tooltip content to display */
    content: ReactNode;
    /** How long to wait before opening the tooltip in milliseconds */
    delay?: number;
    /** Which side of the trigger to position the tooltip */
    side?: 'bottom' | 'left' | 'right' | 'top';
    /** Distance between the anchor and the tooltip in pixels */
    sideOffset?: number;
  };

export function Tooltip({
  children,
  className,
  content,
  delay = 200,
  side = 'top',
  sideOffset = 8,
  size,
  variant,
  ...props
}: TooltipProps) {
  return (
    <BaseTooltip.Provider>
      <BaseTooltip.Root {...props}>
        <BaseTooltip.Trigger delay={delay} render={<span />}>
          {children}
        </BaseTooltip.Trigger>
        <BaseTooltip.Portal>
          <BaseTooltip.Positioner side={side} sideOffset={sideOffset}>
            <BaseTooltip.Popup
              className={cn(tooltipPopupVariants({ size, variant }), className)}
            >
              <BaseTooltip.Arrow
                className={cn(tooltipArrowVariants({ variant }))}
              />
              {content}
            </BaseTooltip.Popup>
          </BaseTooltip.Positioner>
        </BaseTooltip.Portal>
      </BaseTooltip.Root>
    </BaseTooltip.Provider>
  );
}
