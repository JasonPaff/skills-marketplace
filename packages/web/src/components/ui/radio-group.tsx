'use client';

import type { ComponentProps } from 'react';

import { Radio } from '@base-ui/react/radio';
import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group';

import { cn } from '@/lib/utils/cn';

type RadioGroupProps = Omit<ComponentProps<typeof BaseRadioGroup>, 'children'> & {
  options: { label: string; value: string }[];
};

export function RadioGroup({ className, options, ...props }: RadioGroupProps) {
  return (
    <BaseRadioGroup className={cn('flex gap-4', className)} {...props}>
      {options.map((option) => (
        <label className="flex items-center gap-2 text-sm" key={option.value}>
          <Radio.Root
            className="
              flex size-4 items-center justify-center rounded-full border
              border-border-strong
              data-checked:border-accent
            "
            value={option.value}
          >
            <Radio.Indicator className="size-2 rounded-full bg-accent" />
          </Radio.Root>
          {option.label}
        </label>
      ))}
    </BaseRadioGroup>
  );
}
