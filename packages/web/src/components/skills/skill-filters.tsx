'use client';

import { SKILL_CATEGORIES } from '@emergent/shared';

import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useSkillsSearchParams } from '@/lib/search-params';

export function SkillFilters() {
  const [{ category, search }, setParams] = useSkillsSearchParams();

  return (
    <div className="mb-6 flex flex-wrap gap-4">
      <Input
        onChange={(e) => setParams({ search: e.target.value || null })}
        placeholder="Search skills..."
        type="text"
        value={search}
      />
      <Select onChange={(e) => setParams({ category: e.target.value || null })} value={category}>
        <option value="">All Categories</option>
        {SKILL_CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </Select>
    </div>
  );
}
