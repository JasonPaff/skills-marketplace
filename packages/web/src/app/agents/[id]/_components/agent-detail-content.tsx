'use client';

import {
  Calendar,
  Check,
  Copy,
  Cpu,
  Download,
  FolderGit2,
  Loader2,
  Palette,
  Wrench,
} from 'lucide-react';
import { useState } from 'react';

import { ErrorAlert } from '@/components/layout/error-alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tooltip } from '@/components/ui/tooltip';
import { downloadAgent } from '@/lib/api';
import { useAgent } from '@/lib/query/use-agents';
import { formatDate, formatDownloads } from '@/lib/utils/format';

export function AgentDetailContent({ id }: { id: string }) {
  const { data: agent, error, isError, isLoading } = useAgent(id);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-text-tertiary" />
        <span className="ml-2 text-text-tertiary">Loading agent...</span>
      </div>
    );
  }

  if (isError || !agent) {
    return (
      <ErrorAlert
        error={error ?? undefined}
        message="Failed to load agent"
      />
    );
  }

  const cliCommand = `npx @detergent/skills install agent ${agent.name}`;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadAgent(id);
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
            <h1 className="text-2xl font-bold text-text-primary">{agent.name}</h1>
            <Badge variant="purple">Agent</Badge>
          </div>
          <p className="max-w-2xl text-text-secondary">{agent.description}</p>
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
          {agent.model && (
            <MetadataField
              icon={<Cpu className="size-4" />}
              label="Model"
              value={agent.model}
            />
          )}
          {agent.color && (
            <MetadataField
              icon={<Palette className="size-4" />}
              label="Color"
              value={agent.color}
            />
          )}
          <MetadataField
            icon={<Download className="size-4" />}
            label="Downloads"
            value={formatDownloads(agent.downloadCount)}
          />
          <MetadataField
            icon={<Calendar className="size-4" />}
            label="Uploaded"
            value={formatDate(agent.uploadedAt)}
          />
          <MetadataField
            icon={<FolderGit2 className="size-4" />}
            label="GitHub Path"
            value={agent.githubPath}
          />
        </div>
      </Card>

      {/* Tools List */}
      {agent.tools && agent.tools.length > 0 && (
        <Card>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-text-tertiary">
              <Wrench className="size-4" />
              <span className="text-xs font-medium">Tools</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {agent.tools.map((tool) => (
                <Badge key={tool} variant="neutral">
                  {tool}
                </Badge>
              ))}
            </div>
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
