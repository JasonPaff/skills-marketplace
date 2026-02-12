import type { Skill } from '@emergent/shared';

import { formatDate } from '@/lib/utils/format';

interface SkillMetadataProps {
  skill: Skill;
}

export function SkillMetadata({ skill }: SkillMetadataProps) {
  return (
    <div className="mb-6 space-y-1 text-sm text-text-tertiary">
      <p>GitHub path: {skill.githubPath}</p>
      <p>Uploaded: {formatDate(skill.uploadedAt)}</p>
    </div>
  );
}
