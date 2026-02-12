'use client';

import type { Skill } from '@emergent/shared';
import type { ColumnDef, Row } from '@tanstack/react-table';

import { Check, ChevronRight, Copy, Download } from 'lucide-react';
import { $path } from 'next-typesafe-url';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { ErrorAlert } from '@/components/layout/error-alert';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Tooltip } from '@/components/ui/tooltip';
import { downloadSkill } from '@/lib/api';
import { useSkills } from '@/lib/query/use-skills';
import { useSkillsSearchParams } from '@/lib/search-params';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { formatDate, formatDownloads } from '@/lib/utils/format';

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
          className="
            size-4 text-text-tertiary transition-transform duration-200
          "
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
    <div className="space-y-3 bg-surface-secondary px-8 py-5">
      <p className="text-sm text-text-secondary">{skill.description}</p>

      <div
        className="
          grid gap-2 text-sm
          sm:grid-cols-2
        "
      >
        <div>
          <span className="font-medium text-text-tertiary">Upload Date:</span>{' '}
          <span className="text-text-secondary">{formatDate(skill.uploadedAt)}</span>
        </div>
        <div>
          <span className="font-medium text-text-tertiary">Version:</span>{' '}
          <span className="text-text-secondary">v{skill.version}</span>
        </div>
        <div>
          <span className="font-medium text-text-tertiary">GitHub Path:</span>{' '}
          <span className="text-text-secondary">{skill.githubPath}</span>
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
  const [{ downloads, search }, setParams] = useSkillsSearchParams();
  const [localSearch, setLocalSearch] = useState(search ?? '');
  const debouncedSearch = useDebouncedValue(localSearch, 300);
  const { data: skills, error, isLoading } = useSkills({ search: debouncedSearch || undefined });

  // Sync debounced value → URL params
  useEffect(() => {
    setParams({ search: debouncedSearch || null });
  }, [debouncedSearch, setParams]);

  const filteredSkills = useMemo(() => {
    if (!skills) return [];
    return skills.filter((skill) => {
      if (downloads && skill.downloadCount < downloads) return false;
      return true;
    });
  }, [skills, downloads]);

  if (isLoading) {
    return <div className="py-12 text-center text-text-tertiary">Loading skills...</div>;
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
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Search skills..."
          type="text"
          value={localSearch}
        />
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
        renderSubComponent={SkillDetailPanel}
      />

      {/* Empty state with link to upload */}
      {filteredSkills.length === 0 && !localSearch && (
        <div
          className="
            rounded-lg border border-dashed border-border-strong p-12
            text-center
          "
        >
          <p className="text-text-tertiary">No skills found.</p>
          <Link
            className="
              mt-2 inline-block text-sm text-accent-text
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
