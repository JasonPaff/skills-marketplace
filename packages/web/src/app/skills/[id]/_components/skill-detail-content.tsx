'use client';

import { Calendar, Check, Copy, Download, FolderGit2, Hash, Loader2 } from 'lucide-react';
import { useState } from 'react';

import { ErrorAlert } from '@/components/layout/error-alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tooltip } from '@/components/ui/tooltip';
import { downloadSkill } from '@/lib/api';
import { useSkill } from '@/lib/query/use-skill';
import { formatDate, formatDownloads } from '@/lib/utils/format';

export function SkillDetailContent({ id }: { id: string }) {
  const { data: skill, error, isError, isLoading } = useSkill(id);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-text-tertiary" />
        <span className="ml-2 text-text-tertiary">Loading skill...</span>
      </div>
    );
  }

  if (isError || !skill) {
    return (
      <ErrorAlert
        error={error ?? undefined}
        message="Failed to load skill"
      />
    );
  }

  const cliCommand = `npx @detergent/skills install skill ${skill.name}`;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadSkill(id);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(cliCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-text-primary">{skill.name}</h1>
            <Badge variant="sky">Skill</Badge>
          </div>
          <p className="max-w-2xl text-text-secondary">{skill.description}</p>
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
            icon={<Hash className="size-4" />}
            label="Version"
            value={skill.version}
          />
          <MetadataField
            icon={<Download className="size-4" />}
            label="Downloads"
            value={formatDownloads(skill.downloadCount)}
          />
          <MetadataField
            icon={<Calendar className="size-4" />}
            label="Uploaded"
            value={formatDate(skill.uploadedAt)}
          />
          <MetadataField
            icon={<FolderGit2 className="size-4" />}
            label="GitHub Path"
            value={skill.githubPath}
          />
        </div>
      </Card>

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
