'use client';

import type { Skill } from '@emergent/shared';
import type { ColumnDef, FilterFn, Row } from '@tanstack/react-table';

import { Check, ChevronRight, Copy, Download } from 'lucide-react';
import { $path } from 'next-typesafe-url';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { ErrorAlert } from '@/components/layout/error-alert';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Tooltip } from '@/components/ui/tooltip';
import { downloadSkill } from '@/lib/api';
import { useSkills } from '@/lib/query/use-skills';
import { useSkillsSearchParams } from '@/lib/search-params';
import { formatDate, formatDownloads } from '@/lib/utils/format';

import { StarRating } from './star-rating';

// ─── Global Filter ───────────────────────────────────────────────

const globalFilterFn: FilterFn<Skill> = (row, _columnId, filterValue: string) => {
  const query = filterValue.toLowerCase();
  const name = row.original.name.toLowerCase();
  const description = row.original.description.toLowerCase();
  return name.includes(query) || description.includes(query);
};

// ─── Column Definitions ──────────────────────────────────────────

const columns: ColumnDef<Skill, unknown>[] = [
  {
    cell: ({ row }) => (
      <button
        aria-label={row.getIsExpanded() ? 'Collapse row' : 'Expand row'}
        className="p-1"
        onClick={row.getToggleExpandedHandler()}
      >
        <ChevronRight
          className="size-4 text-gray-500 transition-transform duration-200"
          style={{ transform: row.getIsExpanded() ? 'rotate(90deg)' : undefined }}
        />
      </button>
    ),
    enableSorting: false,
    header: '',
    id: 'expand',
  },
  {
    accessorKey: 'name',
    cell: ({ getValue }) => <span className="font-semibold">{getValue<string>()}</span>,
    header: 'Name',
  },
  {
    accessorKey: 'description',
    cell: ({ getValue }) => {
      const description = getValue<string>();
      return (
        <Tooltip content={description} side="bottom" size="lg">
          <span className="line-clamp-1">{description}</span>
        </Tooltip>
      );
    },
    header: 'Description',
  },
  {
    accessorKey: 'version',
    cell: ({ getValue }) => `v${getValue<string>()}`,
    header: 'Version',
  },
  {
    accessorKey: 'averageRating',
    cell: ({ getValue }) => <StarRating rating={Number(getValue<number>())} />,
    header: 'Rating',
  },
  {
    accessorKey: 'downloadCount',
    cell: ({ getValue }) => formatDownloads(getValue<number>()),
    header: 'Downloads',
  },
];

// ─── Expanded Detail Panel ───────────────────────────────────────

function SkillDetailPanel({ row }: { row: Row<Skill> }) {
  const skill = row.original;
  const [copied, setCopied] = useState(false);

  const handleDownload = () => {
    void downloadSkill(skill.id);
  };

  const handleCopyInstall = () => {
    void navigator.clipboard.writeText(`npx @detergent/skills install ${skill.name}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-3 bg-gray-50 px-8 py-5">
      <p className="text-sm text-gray-700">{skill.description}</p>

      <div className="
        grid gap-2 text-sm
        sm:grid-cols-2
      ">
        <div>
          <span className="font-medium text-gray-500">Upload Date:</span>{' '}
          <span className="text-gray-700">{formatDate(skill.uploadedAt)}</span>
        </div>
        <div>
          <span className="font-medium text-gray-500">Version:</span>{' '}
          <span className="text-gray-700">v{skill.version}</span>
        </div>
        <div>
          <span className="font-medium text-gray-500">GitHub Path:</span>{' '}
          <span className="text-gray-700">{skill.githubPath}</span>
        </div>
        <div>
          <span className="font-medium text-gray-500">Rating:</span>{' '}
          <StarRating rating={Number(skill.averageRating)} />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button onClick={handleDownload} size="sm" variant="primary">
          <Download className="size-4" />
          Download
        </Button>
        <Button onClick={handleCopyInstall} size="sm" variant="secondary">
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? 'Copied!' : 'CLI Install'}
        </Button>
        <Link href={$path({ route: '/skills/[id]', routeParams: { id: skill.id } })}>
          <Button size="sm" variant="ghost">
            View Details
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ─── Min Downloads Options ───────────────────────────────────────

const downloadThresholds = [
  { label: 'Any', value: 0 },
  { label: '10+', value: 10 },
  { label: '50+', value: 50 },
  { label: '100+', value: 100 },
  { label: '500+', value: 500 },
  { label: '1,000+', value: 1000 },
];

// ─── SkillsTable Component ───────────────────────────────────────

export function SkillsTable() {
  const [{ downloads, rating, search }, setParams] = useSkillsSearchParams();
  const { data: skills, error, isLoading } = useSkills({ search });

  const filteredSkills = useMemo(() => {
    if (!skills) return [];
    return skills.filter((skill) => {
      if (rating && Number(skill.averageRating) < rating) return false;
      if (downloads && skill.downloadCount < downloads) return false;
      return true;
    });
  }, [skills, rating, downloads]);

  if (isLoading) {
    return <div className="py-12 text-center text-gray-500">Loading skills...</div>;
  }

  if (error) {
    return <ErrorAlert error={error as Error} message="Failed to load skills" />;
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-wrap gap-4">
        <Input
          className="w-64"
          onChange={(e) => setParams({ search: e.target.value || null })}
          placeholder="Search skills..."
          type="text"
          value={search}
        />
        <Select
          onChange={(e) => setParams({ rating: Number(e.target.value) || null })}
          value={rating ?? ''}
        >
          <option value="">Min Rating</option>
          {[1, 2, 3, 4, 5].map((r) => (
            <option key={r} value={r}>
              {r}+ Stars
            </option>
          ))}
        </Select>
        <Select
          onChange={(e) => setParams({ downloads: Number(e.target.value) || null })}
          value={downloads ?? ''}
        >
          <option value="">Min Downloads</option>
          {downloadThresholds
            .filter((t) => t.value > 0)
            .map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
        </Select>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredSkills}
        getRowCanExpand={() => true}
        globalFilter={search}
        globalFilterFn={globalFilterFn}
        onGlobalFilterChange={(value) => setParams({ search: value || null })}
        renderSubComponent={SkillDetailPanel}
      />

      {/* Empty state with link to upload */}
      {filteredSkills.length === 0 && !search && (
        <div className="
          rounded-lg border border-dashed border-gray-300 p-12 text-center
        ">
          <p className="text-gray-500">No skills found.</p>
          <Link
            className="
              mt-2 inline-block text-sm text-blue-600
              hover:underline
            "
            href={$path({ route: '/skills/new' })}
          >
            Upload the first skill
          </Link>
        </div>
      )}
    </div>
  );
}
