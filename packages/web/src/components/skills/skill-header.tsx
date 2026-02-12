import type { Skill } from '@emergent/shared';

interface SkillHeaderProps {
  skill: Skill;
}

export function SkillHeader({ skill }: SkillHeaderProps) {
  return (
    <div className="mb-4 flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{skill.name}</h1>
        <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
          <span>v{skill.version}</span>
        </div>
      </div>
    </div>
  );
}
