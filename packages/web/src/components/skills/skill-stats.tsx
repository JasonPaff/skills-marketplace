import type { Skill } from '@emergent/shared';

interface SkillStatsProps {
  skill: Skill;
}

export function SkillStats({ skill }: SkillStatsProps) {
  return (
    <div
      className="
      mb-6 grid grid-cols-2 gap-4 rounded-lg bg-surface-secondary p-4
    "
    >
      <div className="text-center">
        <div className="text-2xl font-bold text-text-primary">{skill.downloadCount}</div>
        <div className="text-xs text-text-tertiary">Downloads</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-text-primary">
          {skill.parentSkillId ? 'Fork' : 'Original'}
        </div>
        <div className="text-xs text-text-tertiary">Source</div>
      </div>
    </div>
  );
}
