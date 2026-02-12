'use client';

import { Input } from '@/components/ui/input';
import { useSkillsSearchParams } from '@/lib/search-params';

export function SkillFilters() {
  const [{ search }, setParams] = useSkillsSearchParams();

  return (
    <div className="mb-6 flex flex-wrap gap-4">
      <Input
        onChange={(e) => setParams({ search: e.target.value || null })}
        placeholder="Search skills..."
        type="text"
        value={search}
      />
    </div>
  );
}
