'use client';

import { rateSkillSchema } from '@emergent/shared';
import { useForm } from '@tanstack/react-form';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRateSkill } from '@/lib/query/use-rate-skill';

import { InteractiveStarRating } from './interactive-star-rating';

interface RatingFormProps {
  skillId: string;
}

export function RatingForm({ skillId }: RatingFormProps) {
  const [message, setMessage] = useState('');

  const rateMutation = useRateSkill(skillId, {
    onError: (err) => {
      setMessage(`Failed: ${err.message}`);
    },
    onSuccess: () => {
      setMessage('Rating submitted!');
      form.reset();
    },
  });

  const form = useForm({
    defaultValues: {
      rating: 0,
      userEmail: '',
    },
    onSubmit: ({ value }) => {
      const result = rateSkillSchema.safeParse(value);
      if (!result.success) {
        setMessage('Please provide a valid rating and email.');
        return;
      }
      setMessage('');
      rateMutation.mutate(result.data);
    },
  });

  return (
    <div className="border-t border-border pt-6">
      <h3 className="mb-3 font-semibold text-text-primary">Rate this skill</h3>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <form.Field name="rating">
          {(field) => (
            <div className="mb-3">
              <InteractiveStarRating
                onChange={(val) => field.handleChange(val)}
                value={field.state.value}
              />
            </div>
          )}
        </form.Field>
        <div className="flex gap-3">
          <form.Field name="userEmail">
            {(field) => (
              <Input
                className="flex-1"
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="your.email@emergent.com"
                type="email"
                value={field.state.value}
              />
            )}
          </form.Field>
          <Button loading={rateMutation.isPending} type="submit">
            Submit Rating
          </Button>
        </div>
      </form>
      {message && (
        <p
          className={`
            mt-2 text-sm
            ${message.startsWith('Failed') ? `text-status-error` : `text-status-success`}
          `}
        >
          {message}
        </p>
      )}
    </div>
  );
}
