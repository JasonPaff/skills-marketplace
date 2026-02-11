'use client';

import type { Skill } from '@emergent/shared';

import { $path } from 'next-typesafe-url';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { getCategoryColor } from '@/lib/utils/category-colors';

import { StarRating } from './star-rating';

interface SkillCardProps {
  skill: Skill;
}

export function SkillCard({ skill }: SkillCardProps) {
  return (
    <Link href={$path({ route: '/skills/[id]', routeParams: { id: skill.id } })}>
      <Card className="group" interactive padding="md">
        <div className="mb-2 flex items-start justify-between">
          <h3
            className="
              font-semibold text-gray-900
              group-hover:text-blue-600
            "
          >
            {skill.name}
          </h3>
          <span
            className={`
              rounded-full px-2 py-0.5 text-xs font-medium
              ${getCategoryColor(skill.category)}
            `}
          >
            {skill.category}
          </span>
        </div>
        <p className="mb-3 line-clamp-2 text-sm/relaxed text-gray-600">{skill.description}</p>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <StarRating rating={Number(skill.averageRating)} />
          <span>{skill.downloadCount} downloads</span>
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
          {skill.isGlobal ? (
            <Badge size="sm" variant="green-subtle">
              Global
            </Badge>
          ) : (
            <Badge size="sm" variant="amber">
              Project
            </Badge>
          )}
          <span>v{skill.version}</span>
        </div>
      </Card>
    </Link>
  );
}
