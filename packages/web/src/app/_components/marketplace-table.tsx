'use client';

import type { ItemType } from '@emergent/shared';
import type { ColumnDef } from '@tanstack/react-table';

import { Check, Copy, Download, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { parseAsString, useQueryState } from 'nuqs';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Tooltip } from '@/components/ui/tooltip';
import { downloadAgent, downloadBundle, downloadRule, downloadSkill } from '@/lib/api';
import { useAgents } from '@/lib/query/use-agents';
import { useBundles } from '@/lib/query/use-bundles';
import { useRules } from '@/lib/query/use-rules';
import { useSkills } from '@/lib/query/use-skills';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { formatDate, formatDownloads } from '@/lib/utils/format';

// ─── Types ───────────────────────────────────────────────────────

interface MarketplaceRow {
  description: string;
  downloadCount: number;
  id: string;
  name: string;
  type: ItemType;
  uploadedAt: string;
}

// ─── Badge Variant Map ───────────────────────────────────────────

const typeBadgeVariant: Record<ItemType, 'amber' | 'purple' | 'sky' | 'success'> = {
  agent: 'purple',
  bundle: 'success',
  rule: 'amber',
  skill: 'sky',
};

// ─── CLI Install Command ────────────────────────────────────────

function CopyCliButton({ row }: { row: MarketplaceRow }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(getInstallCommand(row));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Tooltip content={copied ? 'Copied!' : 'Copy CLI install command'}>
      <Button onClick={handleCopy} size="sm" variant="ghost">
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      </Button>
    </Tooltip>
  );
}

// ─── Copy Button ────────────────────────────────────────────────

function DownloadButton({ row }: { row: MarketplaceRow }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const downloadFns: Record<ItemType, (id: string) => Promise<unknown>> = {
        agent: downloadAgent,
        bundle: downloadBundle,
        rule: downloadRule,
        skill: downloadSkill,
      };
      await downloadFns[row.type](row.id);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Tooltip content="Download">
      <Button disabled={downloading} onClick={handleDownload} size="sm" variant="ghost">
        {downloading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Download className="size-4" />
        )}
      </Button>
    </Tooltip>
  );
}

// ─── Download Button ────────────────────────────────────────────

function getInstallCommand(row: MarketplaceRow): string {
  return `npx @detergent/skills install ${row.type} ${row.name}`;
}

// ─── Column Definitions ─────────────────────────────────────────

const columns: ColumnDef<MarketplaceRow, unknown>[] = [
  {
    accessorKey: 'type',
    cell: ({ row }) => {
      const type = row.original.type;
      return (
        <Badge variant={typeBadgeVariant[type]}>
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </Badge>
      );
    },
    header: 'Type',
  },
  {
    accessorKey: 'name',
    cell: ({ row }) => {
      const { id, name, type } = row.original;
      return (
        <Link
          className="
            font-medium text-accent
            hover:underline
          "
          href={`/${type}s/${id}`}
        >
          {name}
        </Link>
      );
    },
    header: 'Name',
  },
  {
    accessorKey: 'description',
    cell: ({ row }) => (
      <span className="line-clamp-1 max-w-xs text-text-secondary">
        {row.original.description}
      </span>
    ),
    header: 'Description',
  },
  {
    accessorKey: 'downloadCount',
    cell: ({ row }) => (
      <span className="tabular-nums">{formatDownloads(row.original.downloadCount)}</span>
    ),
    header: 'Downloads',
  },
  {
    accessorKey: 'uploadedAt',
    cell: ({ row }) => (
      <span className="text-text-secondary">{formatDate(row.original.uploadedAt)}</span>
    ),
    header: 'Uploaded',
  },
  {
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <CopyCliButton row={row.original} />
        <DownloadButton row={row.original} />
      </div>
    ),
    enableSorting: false,
    header: 'Actions',
    id: 'actions',
  },
];

// ─── MarketplaceTable Component ────────────────────────────────

export function MarketplaceTable() {
  const [search, setSearch] = useQueryState('search', parseAsString.withDefault(''));
  const [typeFilter, setTypeFilter] = useQueryState('type', parseAsString.withDefault(''));

  const debouncedSearch = useDebouncedValue(search, 300);

  const searchParam = debouncedSearch || undefined;
  const skillsQuery = useSkills({ search: searchParam });
  const agentsQuery = useAgents({ search: searchParam });
  const rulesQuery = useRules({ search: searchParam });
  const bundlesQuery = useBundles({ search: searchParam });

  const isLoading =
    skillsQuery.isLoading || agentsQuery.isLoading || rulesQuery.isLoading || bundlesQuery.isLoading;
  const isError =
    skillsQuery.isError || agentsQuery.isError || rulesQuery.isError || bundlesQuery.isError;

  const allRows = useMemo<MarketplaceRow[]>(() => {
    const rows: MarketplaceRow[] = [];

    for (const skill of skillsQuery.data ?? []) {
      rows.push({
        description: skill.description,
        downloadCount: skill.downloadCount,
        id: skill.id,
        name: skill.name,
        type: 'skill',
        uploadedAt: skill.uploadedAt,
      });
    }

    for (const agent of agentsQuery.data ?? []) {
      rows.push({
        description: agent.description,
        downloadCount: agent.downloadCount,
        id: agent.id,
        name: agent.name,
        type: 'agent',
        uploadedAt: agent.uploadedAt,
      });
    }

    for (const rule of rulesQuery.data ?? []) {
      rows.push({
        description: rule.description,
        downloadCount: rule.downloadCount,
        id: rule.id,
        name: rule.name,
        type: 'rule',
        uploadedAt: rule.uploadedAt,
      });
    }

    for (const bundle of bundlesQuery.data ?? []) {
      rows.push({
        description: bundle.description,
        downloadCount: bundle.downloadCount,
        id: bundle.id,
        name: bundle.name,
        type: 'bundle',
        uploadedAt: bundle.uploadedAt,
      });
    }

    return rows;
  }, [skillsQuery.data, agentsQuery.data, rulesQuery.data, bundlesQuery.data]);

  const filteredRows = useMemo(() => {
    if (!typeFilter) return allRows;
    return allRows.filter((row) => row.type === typeFilter);
  }, [allRows, typeFilter]);

  if (isError) {
    return (
      <div className="
        rounded-lg border border-status-error/30 bg-status-error/5 p-6
        text-center
      ">
        <p className="text-status-error">Failed to load marketplace data. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          className="w-64"
          onChange={(e) => setSearch(e.target.value || '')}
          placeholder="Search by name or description..."
          value={search}
        />
        <Select
          onChange={(e) => setTypeFilter(e.target.value)}
          value={typeFilter}
        >
          <option value="">All types</option>
          <option value="skill">Skills</option>
          <option value="agent">Agents</option>
          <option value="rule">Rules</option>
          <option value="bundle">Bundles</option>
        </Select>
        <span className="ml-auto text-sm text-text-tertiary">
          {isLoading ? 'Loading...' : `${filteredRows.length} items`}
        </span>
      </div>

      {/* Data Table */}
      {isLoading ? (
        <div className="
          flex items-center justify-center rounded-lg border border-border py-16
        ">
          <Loader2 className="size-6 animate-spin text-text-tertiary" />
          <span className="ml-2 text-text-tertiary">Loading marketplace...</span>
        </div>
      ) : (
        <DataTable columns={columns} data={filteredRows} />
      )}
    </div>
  );
}
