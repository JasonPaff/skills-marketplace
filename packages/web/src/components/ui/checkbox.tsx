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
            border-gray-300 text-white transition
            data-checked:border-blue-600 data-checked:bg-blue-600
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
