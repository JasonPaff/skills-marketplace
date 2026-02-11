'use client';

import Link from 'next/link';

import { ErrorAlert } from '@/components/layout/error-alert';
import { useSkills } from '@/lib/query/use-skills';
import { useSkillsSearchParams } from '@/lib/search-params';

import { SkillCard } from './skill-card';
import { SkillFilters } from './skill-filters';

export function SkillsList() {
  const [{ category, search }] = useSkillsSearchParams();
  const { data: skills, error, isLoading } = useSkills({ category, search });

  return (
    <>
      <SkillFilters />

      {isLoading && <div className="py-12 text-center text-gray-500">Loading skills...</div>}

      {error && <ErrorAlert error={error as Error} message="Failed to load skills" />}

      {skills && skills.length === 0 && (
        <div className="
          rounded-lg border border-dashed border-gray-300 p-12 text-center
        ">
          <p className="text-gray-500">No skills found.</p>
          <Link className="
            mt-2 inline-block text-sm text-blue-600
            hover:underline
          " href="/skills/new">
            Upload the first skill
          </Link>
        </div>
      )}

      {skills && skills.length > 0 && (
        <div className="
          grid gap-4
          sm:grid-cols-2
          lg:grid-cols-3
        ">
          {skills.map((skill) => (
            <SkillCard key={skill.id} skill={skill} />
          ))}
        </div>
      )}
    </>
  );
}
