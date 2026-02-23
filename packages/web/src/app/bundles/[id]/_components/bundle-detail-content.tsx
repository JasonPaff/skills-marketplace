'use client';

import {
  Calendar,
  Check,
  Copy,
  Download,
  FolderGit2,
  Loader2,
  Package,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { ErrorAlert } from '@/components/layout/error-alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tooltip } from '@/components/ui/tooltip';
import { downloadBundle } from '@/lib/api';
import { useBundle } from '@/lib/query/use-bundles';
import { formatDate, formatDownloads } from '@/lib/utils/format';

export function BundleDetailContent({ id }: { id: string }) {
  const { data: bundle, error, isError, isLoading } = useBundle(id);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-text-tertiary" />
        <span className="ml-2 text-text-tertiary">Loading bundle...</span>
      </div>
    );
  }

  if (isError || !bundle) {
    return (
      <ErrorAlert
        error={error ?? undefined}
        message="Failed to load bundle"
      />
    );
  }

  const cliCommand = `npx @detergent/skills install bundle ${bundle.name}`;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadBundle(id);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(cliCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const skills = bundle.skills ?? [];
  const agents = bundle.agents ?? [];
  const rules = bundle.rules ?? [];
  const totalItems = skills.length + agents.length + rules.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-text-primary">{bundle.name}</h1>
            <Badge variant="success">Bundle</Badge>
          </div>
          <p className="max-w-2xl text-text-secondary">{bundle.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip content={copied ? 'Copied!' : 'Copy CLI install command'}>
            <Button onClick={handleCopy} size="sm" variant="secondary">
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              <span>{copied ? 'Copied' : 'Copy CLI'}</span>
            </Button>
          </Tooltip>
          <Button disabled={downloading} onClick={handleDownload} size="sm">
            {downloading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            <span>Download</span>
          </Button>
        </div>
      </div>

      {/* Metadata Card */}
      <Card>
        <div className="
          grid gap-4
          sm:grid-cols-2
        ">
          <MetadataField
            icon={<Package className="size-4" />}
            label="Total Items"
            value={`${totalItems} item${totalItems !== 1 ? 's' : ''}`}
          />
          <MetadataField
            icon={<Download className="size-4" />}
            label="Downloads"
            value={formatDownloads(bundle.downloadCount)}
          />
          <MetadataField
            icon={<Calendar className="size-4" />}
            label="Uploaded"
            value={formatDate(bundle.uploadedAt)}
          />
          <MetadataField
            icon={<FolderGit2 className="size-4" />}
            label="GitHub Path"
            value={bundle.githubPath}
          />
        </div>
      </Card>

      {/* Contained Items */}
      {skills.length > 0 && (
        <Card>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge size="sm" variant="sky">Skills</Badge>
              <span className="text-xs text-text-tertiary">({skills.length})</span>
            </div>
            <ul className="space-y-2">
              {skills.map((skill) => (
                <li key={skill.id}>
                  <Link
                    className="
                      group flex items-center justify-between rounded-md px-3
                      py-2 transition
                      hover:bg-surface-secondary
                    "
                    href={`/skills/${skill.id}`}
                  >
                    <div>
                      <span
                        className="
                          font-medium text-accent
                          group-hover:underline
                        "
                      >
                        {skill.name}
                      </span>
                      <p className="text-xs text-text-tertiary">{skill.description}</p>
                    </div>
                    <span className="text-xs text-text-tertiary">v{skill.version}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}

      {agents.length > 0 && (
        <Card>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge size="sm" variant="purple">Agents</Badge>
              <span className="text-xs text-text-tertiary">({agents.length})</span>
            </div>
            <ul className="space-y-2">
              {agents.map((agent) => (
                <li key={agent.id}>
                  <Link
                    className="
                      group flex items-center justify-between rounded-md px-3
                      py-2 transition
                      hover:bg-surface-secondary
                    "
                    href={`/agents/${agent.id}`}
                  >
                    <div>
                      <span
                        className="
                          font-medium text-accent
                          group-hover:underline
                        "
                      >
                        {agent.name}
                      </span>
                      <p className="text-xs text-text-tertiary">{agent.description}</p>
                    </div>
                    {agent.model && (
                      <span className="text-xs text-text-tertiary">{agent.model}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}

      {rules.length > 0 && (
        <Card>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge size="sm" variant="amber">Rules</Badge>
              <span className="text-xs text-text-tertiary">({rules.length})</span>
            </div>
            <ul className="space-y-2">
              {rules.map((rule) => (
                <li key={rule.id}>
                  <Link
                    className="
                      group flex items-center justify-between rounded-md px-3
                      py-2 transition
                      hover:bg-surface-secondary
                    "
                    href={`/rules/${rule.id}`}
                  >
                    <div>
                      <span
                        className="
                          font-medium text-accent
                          group-hover:underline
                        "
                      >
                        {rule.name}
                      </span>
                      <p className="text-xs text-text-tertiary">{rule.description}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}

      {/* CLI Command */}
      <Card padding="sm">
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-text-tertiary">CLI Install Command</span>
          <code
            className="
              block rounded-md bg-surface-secondary px-3 py-2 text-sm
              text-text-primary
            "
          >
            {cliCommand}
          </code>
        </div>
      </Card>
    </div>
  );
}

function MetadataField({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-text-tertiary">{icon}</span>
      <div>
        <span className="block text-xs font-medium text-text-tertiary">{label}</span>
        <span className="text-sm text-text-primary">{value}</span>
      </div>
    </div>
  );
}
