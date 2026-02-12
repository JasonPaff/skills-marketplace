'use client';

import type { ComponentProps } from 'react';

import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';
import { Check } from 'lucide-react';

import { cn } from '@/lib/utils/cn';

type CheckboxProps = ComponentProps<typeof BaseCheckbox.Root> & {
  label?: string;
};

export function Checkbox({ className, id, label, ...props }: CheckboxProps) {
  return (
    <label className="inline-flex items-center gap-2 text-sm" htmlFor={id}>
      <BaseCheckbox.Root
        className={cn(
          `
            flex size-4 items-center justify-center rounded-sm border
            border-border-strong text-text-on-accent transition
            data-checked:border-accent data-checked:bg-accent
          `,
          className,
        )}
        id={id}
        {...props}
      >
        <BaseCheckbox.Indicator>
          <Check className="size-3" />
        </BaseCheckbox.Indicator>
      </BaseCheckbox.Root>
      {label && <span>{label}</span>}
    </label>
  );
}
