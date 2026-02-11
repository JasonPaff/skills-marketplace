import type { Skill } from '@emergent/shared';

import { formatRating } from '@/lib/utils/format';

interface SkillStatsProps {
  skill: Skill;
}

export function SkillStats({ skill }: SkillStatsProps) {
  return (
    <div className="mb-6 grid grid-cols-3 gap-4 rounded-lg bg-gray-50 p-4">
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900">{skill.downloadCount}</div>
        <div className="text-xs text-gray-500">Downloads</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900">
          {formatRating(skill.averageRating)}
        </div>
        <div className="text-xs text-gray-500">Avg Rating ({skill.ratingCount} reviews)</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900">
          {skill.parentSkillId ? 'Fork' : 'Original'}
        </div>
        <div className="text-xs text-gray-500">Source</div>
      </div>
    </div>
  );
}
