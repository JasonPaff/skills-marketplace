'use client';

import { ErrorBoundary } from 'react-error-boundary';

import { RatingForm } from '@/components/forms/rating-form';
import { ErrorAlert } from '@/components/layout/error-alert';
import { useSkill } from '@/lib/query/use-skill';

import { SkillHeader } from './skill-header';
import { SkillMetadata } from './skill-metadata';
import { SkillStats } from './skill-stats';

interface SkillDetailContentProps {
  id: string;
}

export function SkillDetailContent({ id }: SkillDetailContentProps) {
  return (
    <ErrorBoundary fallback={<ErrorAlert message="Something went wrong loading this skill." />}>
      <SkillDetailInner id={id} />
    </ErrorBoundary>
  );
}

function SkillDetailInner({ id }: SkillDetailContentProps) {
  const { data: skill, error, isLoading } = useSkill(id);

  if (isLoading) {
    return <div className="py-12 text-center text-text-tertiary">Loading skill...</div>;
  }

  if (error || !skill) {
    return <ErrorAlert message="Skill not found or failed to load." />;
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-6 shadow-sm">
      <SkillHeader skill={skill} />
      <p className="mb-6 leading-relaxed text-text-secondary">{skill.description}</p>
      <SkillStats skill={skill} />
      <SkillMetadata skill={skill} />
      <RatingForm skillId={id} />
    </div>
  );
}
