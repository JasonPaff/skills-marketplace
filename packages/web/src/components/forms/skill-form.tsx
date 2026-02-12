'use client';

import type { CreateBatchUpload } from '@emergent/shared';

import { createSkillSchema, parseSkillMd } from '@emergent/shared';
import {
  AlertCircle,
  Archive,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  File,
  FolderOpen,
  Upload,
  XCircle,
} from 'lucide-react';
import { $path } from 'next-typesafe-url';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useBatchUpload } from '@/lib/query/use-batch-upload';
import { useCreateSkill } from '@/lib/query/use-create-skill';
import {
  type BatchStructure,
  type DetectedStructure,
  detectFolderStructure,
  type GroupedItem,
  type UploadedFile,
} from '@/lib/utils/folder-detection';
import { extractZipFiles } from '@/lib/utils/zip';

import { FormField } from './form-field';

// ─── Component ───────────────────────────────────────────────────

export function SkillForm() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState('');
  const [fileError, setFileError] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [detectedStructure, setDetectedStructure] = useState<DetectedStructure | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    agents: true,
    rules: true,
    skills: true,
  });
  const folderInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  const isBatchMode = detectedStructure?.type === 'batch';

  // ── Single-skill frontmatter extraction ─────────────────────────

  const singleSkillInfo = useMemo(() => {
    if (detectedStructure?.type !== 'single-skill') return null;
    return tryParseFrontmatter(detectedStructure.files);
  }, [detectedStructure]);

  // ── Batch mode validation ───────────────────────────────────────

  const batchHasErrors = useMemo(() => {
    if (detectedStructure?.type !== 'batch') return false;
    const allItems = [
      ...detectedStructure.skills,
      ...detectedStructure.agents,
      ...detectedStructure.rules,
    ];
    return allItems.some((item) => !item.frontmatter.valid);
  }, [detectedStructure]);

  const batchTotalCount = useMemo(() => {
    if (detectedStructure?.type !== 'batch') return 0;
    return (
      detectedStructure.skills.length +
      detectedStructure.agents.length +
      detectedStructure.rules.length
    );
  }, [detectedStructure]);

  // ── File selection handlers ─────────────────────────────────────

  const processFiles = useCallback((files: UploadedFile[]) => {
    setFileError('');
    setErrorMsg('');
    setUploadedFiles(files);

    const structure = detectFolderStructure(files);
    setDetectedStructure(structure);

    if (structure.type === 'single-skill') {
      const result = tryParseFrontmatter(structure.files);
      if (result.error) {
        setFileError(result.error);
      }
    }
  }, []);

  const handleFolderSelect = useCallback(
    async (fileList: FileList) => {
      const files = await Promise.all(
        Array.from(fileList).map(async (file) => {
          const base64 = await fileToBase64(file);
          const parts = file.webkitRelativePath.split('/');
          const relativePath = parts.slice(1).join('/');
          return { content: base64, path: relativePath };
        }),
      );
      const filtered = files.filter((f) => f.path.length > 0);
      processFiles(filtered);
    },
    [processFiles],
  );

  const handleZipSelect = useCallback(
    async (file: globalThis.File) => {
      try {
        const files = await extractZipFiles(file);
        processFiles(files);
      } catch {
        setFileError('Failed to read zip file');
      }
    },
    [processFiles],
  );

  const clearFiles = useCallback(() => {
    setUploadedFiles([]);
    setDetectedStructure(null);
    setFileError('');
    setErrorMsg('');
  }, []);

  // ── Section toggle ──────────────────────────────────────────────

  const toggleSection = useCallback((section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }, []);

  // ── Mutations ───────────────────────────────────────────────────

  const createMutation = useCreateSkill({
    onError: (err) => {
      setErrorMsg(err.message);
    },
    onSuccess: (skill) => {
      router.push($path({ route: '/skills/[id]', routeParams: { id: skill.id } }));
    },
  });

  const batchMutation = useBatchUpload({
    onError: (err) => {
      setErrorMsg(err.message);
    },
    onSuccess: () => {
      router.push($path({ route: '/' }));
    },
  });

  const isPending = createMutation.isPending || batchMutation.isPending;

  // ── Submit handler ──────────────────────────────────────────────

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMsg('');

      if (!detectedStructure) {
        setErrorMsg('Please select files to upload');
        return;
      }

      if (detectedStructure.type === 'batch') {
        // Build the batch upload payload
        const batch = detectedStructure as BatchStructure;
        const payload: CreateBatchUpload = {};

        if (batch.skills.length > 0) {
          payload.skills = batch.skills.map((item) => ({
            description: item.frontmatter.description ?? '',
            files: item.files,
            name: sanitizeName(item.frontmatter.name ?? item.name),
          }));
        }

        if (batch.agents.length > 0) {
          payload.agents = batch.agents.map((item) => ({
            description: item.frontmatter.description ?? '',
            files: item.files,
            name: sanitizeName(item.frontmatter.name ?? item.name),
          }));
        }

        if (batch.rules.length > 0) {
          payload.rules = batch.rules.map((item) => ({
            description: item.frontmatter.description ?? '',
            files: item.files,
            name: sanitizeName(item.frontmatter.name ?? item.name),
          }));
        }

        batchMutation.mutate(payload);
      } else {
        // Single-skill mode
        const info = tryParseFrontmatter(detectedStructure.files);
        if (info.error) {
          setErrorMsg(info.error);
          return;
        }

        const skillData = {
          description: info.description ?? '',
          files: detectedStructure.files,
          name: sanitizeName(info.name ?? ''),
        };

        const result = createSkillSchema.safeParse(skillData);
        if (!result.success) {
          const firstError = result.error.issues[0];
          setErrorMsg(firstError?.message ?? 'Validation failed');
          return;
        }

        createMutation.mutate(result.data);
      }
    },
    [detectedStructure, batchMutation, createMutation],
  );

  // ── Derived state ───────────────────────────────────────────────

  const hasSkillMd =
    detectedStructure?.type === 'single-skill' &&
    detectedStructure.files.some((f) => f.path === 'SKILL.md');

  const singleSkillFilesError =
    fileError ||
    (detectedStructure?.type === 'single-skill' &&
    detectedStructure.files.length > 0 &&
    !hasSkillMd
      ? 'A SKILL.md file is required'
      : undefined);

  const isSubmitDisabled =
    isPending ||
    uploadedFiles.length === 0 ||
    (isBatchMode && (batchHasErrors || batchTotalCount === 0)) ||
    (!isBatchMode && !!singleSkillFilesError);

  // ── Render ──────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit}>
      <Card className="space-y-5" padding="lg">
        {/* Collapsible Format Guide */}
        <FormatGuide guideOpen={guideOpen} onToggle={() => setGuideOpen(!guideOpen)} />

        {/* File Upload Area */}
        <FormField
          error={(!isBatchMode && singleSkillFilesError) || undefined}
          label="Upload Files"
          required
        >
          {/* Hidden folder input */}
          <input
            className="hidden"
            onChange={(e) => {
              if (e.target.files) {
                handleFolderSelect(e.target.files);
              }
            }}
            ref={folderInputRef}
            type="file"
            {...({ webkitdirectory: '' } as React.InputHTMLAttributes<HTMLInputElement>)}
          />
          {/* Hidden zip input */}
          <input
            accept=".zip"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleZipSelect(file);
            }}
            ref={zipInputRef}
            type="file"
          />

          {uploadedFiles.length === 0 ? (
            <div className="flex gap-3">
              <button
                className="
                  flex flex-1 flex-col items-center gap-2 rounded-lg border-2
                  border-dashed border-border-strong p-6 text-text-tertiary
                  transition
                  hover:border-accent-border hover:text-accent-text
                "
                onClick={() => folderInputRef.current?.click()}
                type="button"
              >
                <Upload className="size-8" />
                <span className="text-sm font-medium">Browse Folder</span>
                <span className="text-xs">Select a skill or .claude folder</span>
              </button>
              <button
                className="
                  flex flex-1 flex-col items-center gap-2 rounded-lg border-2
                  border-dashed border-border-strong p-6 text-text-tertiary
                  transition
                  hover:border-accent-border hover:text-accent-text
                "
                onClick={() => zipInputRef.current?.click()}
                type="button"
              >
                <Archive className="size-8" />
                <span className="text-sm font-medium">Upload Zip</span>
                <span className="text-xs">Upload a .zip file</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Re-select controls */}
              <div className="flex items-center justify-between">
                <span
                  className="
                    flex items-center gap-1.5 text-sm font-medium
                    text-text-secondary
                  "
                >
                  <FolderOpen className="size-4" />
                  {uploadedFiles.length} file{uploadedFiles.length !== 1 && 's'} selected
                </span>
                <span className="flex gap-2">
                  <button
                    className="
                      text-xs text-accent-text
                      hover:underline
                    "
                    onClick={() => folderInputRef.current?.click()}
                    type="button"
                  >
                    Re-select folder
                  </button>
                  <button
                    className="
                      text-xs text-accent-text
                      hover:underline
                    "
                    onClick={() => zipInputRef.current?.click()}
                    type="button"
                  >
                    Re-upload zip
                  </button>
                  <button
                    className="
                      text-xs text-status-error
                      hover:underline
                    "
                    onClick={clearFiles}
                    type="button"
                  >
                    Clear
                  </button>
                </span>
              </div>

              {/* Batch Mode Preview */}
              {detectedStructure?.type === 'batch' && (
                <BatchPreview
                  expandedSections={expandedSections}
                  structure={detectedStructure}
                  toggleSection={toggleSection}
                />
              )}

              {/* Single-Skill Mode File List */}
              {detectedStructure?.type === 'single-skill' && (
                <SingleSkillPreview
                  files={detectedStructure.files}
                  info={singleSkillInfo}
                />
              )}
            </div>
          )}
        </FormField>

        {/* Error Display */}
        {errorMsg && (
          <div
            className="
              rounded-lg border border-status-error-border bg-status-error-bg
              p-3 text-sm text-status-error
            "
          >
            {errorMsg}
          </div>
        )}

        {/* Submit Button */}
        <Button disabled={isSubmitDisabled} fullWidth loading={isPending} type="submit">
          {isBatchMode ? `Upload Batch (${batchTotalCount} items)` : 'Create Skill'}
        </Button>
      </Card>
    </form>
  );
}

// ─── Batch Preview Component ─────────────────────────────────────

function BatchItem({ item }: { item: GroupedItem }) {
  const isValid = item.frontmatter.valid;

  return (
    <li
      className="
        flex items-start justify-between rounded-md px-3 py-2 text-sm
        hover:bg-surface-tertiary
      "
    >
      <div className="flex items-start gap-2">
        {isValid ? (
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-status-success" />
        ) : (
          <XCircle className="mt-0.5 size-4 shrink-0 text-status-error" />
        )}
        <div className="min-w-0">
          <div className="font-medium text-text-primary">
            {item.frontmatter.name ?? item.name}
          </div>
          {item.frontmatter.description && (
            <div className="mt-0.5 line-clamp-2 text-xs text-text-tertiary">
              {item.frontmatter.description}
            </div>
          )}
          {!isValid && item.frontmatter.errors && (
            <div className="mt-1 text-xs text-status-error">
              {item.frontmatter.errors.join('; ')}
            </div>
          )}
        </div>
      </div>
      <span className="ml-2 shrink-0 text-xs text-text-quaternary">
        {item.files.length} file{item.files.length !== 1 && 's'}
      </span>
    </li>
  );
}

// ─── Batch Item Component ────────────────────────────────────────

function BatchPreview({
  expandedSections,
  structure,
  toggleSection,
}: {
  expandedSections: Record<string, boolean>;
  structure: BatchStructure;
  toggleSection: (section: string) => void;
}) {
  const sections: Array<{ items: GroupedItem[]; key: string; label: string }> = [
    { items: structure.skills, key: 'skills', label: 'Skills' },
    { items: structure.agents, key: 'agents', label: 'Agents' },
    { items: structure.rules, key: 'rules', label: 'Rules' },
  ];

  const totalCount = structure.skills.length + structure.agents.length + structure.rules.length;
  const allItems = [...structure.skills, ...structure.agents, ...structure.rules];
  const errorCount = allItems.filter((item) => !item.frontmatter.valid).length;

  // Build summary parts
  const summaryParts: string[] = [];
  if (structure.skills.length > 0) {
    summaryParts.push(`${structure.skills.length} Skill${structure.skills.length !== 1 ? 's' : ''}`);
  }
  if (structure.agents.length > 0) {
    summaryParts.push(`${structure.agents.length} Agent${structure.agents.length !== 1 ? 's' : ''}`);
  }
  if (structure.rules.length > 0) {
    summaryParts.push(`${structure.rules.length} Rule${structure.rules.length !== 1 ? 's' : ''}`);
  }

  return (
    <div className="rounded-lg border border-border bg-surface-secondary">
      {/* Summary Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <span className="
          flex items-center gap-2 text-sm font-medium text-text-primary
        ">
          {errorCount > 0 ? (
            <AlertCircle className="size-4 text-status-error" />
          ) : (
            <CheckCircle2 className="size-4 text-status-success" />
          )}
          {summaryParts.join(', ')} detected
        </span>
        <span className="text-xs text-text-quaternary">
          {totalCount} total{errorCount > 0 && ` \u00B7 ${errorCount} with errors`}
        </span>
      </div>

      {/* Sections */}
      {sections
        .filter((s) => s.items.length > 0)
        .map((section) => (
          <div className="border-t border-border" key={section.key}>
            <button
              className="
                flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm
                font-medium text-text-secondary
                hover:bg-surface-tertiary
              "
              onClick={() => toggleSection(section.key)}
              type="button"
            >
              {expandedSections[section.key] ? (
                <ChevronDown className="size-3.5" />
              ) : (
                <ChevronRight className="size-3.5" />
              )}
              {section.label}
              <span className="text-xs text-text-quaternary">({section.items.length})</span>
            </button>
            {expandedSections[section.key] && (
              <ul className="space-y-0.5 px-4 pb-3">
                {section.items.map((item) => (
                  <BatchItem item={item} key={item.name} />
                ))}
              </ul>
            )}
          </div>
        ))}
    </div>
  );
}

// ─── Single-Skill Preview Component ─────────────────────────────

function fileToBase64(file: globalThis.File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1] ?? '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Format Guide Component ──────────────────────────────────────

function FormatGuide({
  guideOpen,
  onToggle,
}: {
  guideOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface-secondary">
      <button
        className="
          flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium
          text-text-secondary
        "
        onClick={onToggle}
        type="button"
      >
        {guideOpen ? (
          <ChevronDown className="size-4" />
        ) : (
          <ChevronRight className="size-4" />
        )}
        Upload Format Guide
      </button>
      {guideOpen && (
        <div
          className="
            border-t border-border px-4 pt-3 pb-4 text-sm text-text-secondary
          "
        >
          <p className="mb-3">
            Upload a single skill folder or a{' '}
            <code className="rounded-sm bg-surface-tertiary px-1 py-0.5 text-xs">.claude</code>
            {' '}folder containing{' '}
            <code className="rounded-sm bg-surface-tertiary px-1 py-0.5 text-xs">skills/</code>,{' '}
            <code className="rounded-sm bg-surface-tertiary px-1 py-0.5 text-xs">agents/</code>,
            {' '}and/or{' '}
            <code className="rounded-sm bg-surface-tertiary px-1 py-0.5 text-xs">rules/</code>
            {' '}subfolders for batch upload.
          </p>

          {/* Skills */}
          <h4 className="
            mb-1 text-xs font-semibold text-text-quaternary uppercase
          ">
            Skills (SKILL.md)
          </h4>
          <pre
            className="
              mb-3 overflow-x-auto rounded-md bg-gray-800 p-3 text-xs
              text-gray-100
              dark:bg-gray-950
            "
          >
            {`---
name: my-skill-name
description: A short description of what this skill does
---

# My Skill

Instructions for the AI agent...`}
          </pre>

          {/* Agents */}
          <h4 className="
            mb-1 text-xs font-semibold text-text-quaternary uppercase
          ">
            Agents (.md files)
          </h4>
          <pre
            className="
              mb-3 overflow-x-auto rounded-md bg-gray-800 p-3 text-xs
              text-gray-100
              dark:bg-gray-950
            "
          >
            {`---
name: my-agent
description: What this agent does
model: claude-sonnet-4-20250514
tools:
  - Read
  - Edit
---

Agent instructions...`}
          </pre>

          {/* Rules */}
          <h4 className="
            mb-1 text-xs font-semibold text-text-quaternary uppercase
          ">
            Rules (.md files)
          </h4>
          <pre
            className="
              mb-3 overflow-x-auto rounded-md bg-gray-800 p-3 text-xs
              text-gray-100
              dark:bg-gray-950
            "
          >
            {`---
name: my-rule
description: What this rule enforces
paths:
  - "src/**/*.ts"
---

Rule content...`}
          </pre>

          <ul
            className="
              list-inside list-disc space-y-1 text-xs text-text-tertiary
            "
          >
            <li>
              All item types require{' '}
              <code className="rounded-sm bg-surface-tertiary px-1 py-0.5">name</code> and{' '}
              <code className="rounded-sm bg-surface-tertiary px-1 py-0.5">description</code>
              {' '}in their frontmatter
            </li>
            <li>
              Skills must have a{' '}
              <code className="rounded-sm bg-surface-tertiary px-1 py-0.5">SKILL.md</code>
              {' '}file in each subfolder
            </li>
            <li>
              Agents and rules are individual{' '}
              <code className="rounded-sm bg-surface-tertiary px-1 py-0.5">.md</code>
              {' '}files with frontmatter
            </li>
            <li>
              See the full standard at{' '}
              <a
                className="text-accent-text underline"
                href="https://agentskills.io"
                rel="noopener noreferrer"
                target="_blank"
              >
                AgentSkills.io
              </a>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Utility Functions ───────────────────────────────────────────

function sanitizeName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function SingleSkillPreview({
  files,
  info,
}: {
  files: UploadedFile[];
  info: null | { description?: string; error?: string; name?: string };
}) {
  return (
    <div className="rounded-lg border border-border bg-surface-secondary p-3">
      {/* Auto-detected info from frontmatter */}
      {info && !info.error && (info.name || info.description) && (
        <div className="mb-3 rounded-md bg-surface-tertiary px-3 py-2">
          <div className="
            flex items-center gap-1.5 text-xs text-text-quaternary
          ">
            <CheckCircle2 className="size-3.5 text-status-success" />
            Detected from SKILL.md frontmatter
          </div>
          {info.name && (
            <div className="mt-1 text-sm font-medium text-text-primary">{info.name}</div>
          )}
          {info.description && (
            <div className="mt-0.5 line-clamp-2 text-xs text-text-tertiary">
              {info.description}
            </div>
          )}
        </div>
      )}

      {/* File list */}
      <ul className="space-y-1">
        {files.map((file) => (
          <li
            className="
              flex items-center justify-between rounded-sm px-2 py-1 text-sm
              text-text-secondary
              hover:bg-surface-tertiary
            "
            key={file.path}
          >
            <span className="flex items-center gap-1.5">
              <File className="size-3.5 text-text-quaternary" />
              {file.path}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function tryParseFrontmatter(files: UploadedFile[]): {
  description?: string;
  error?: string;
  name?: string;
} {
  const skillMd = files.find((f) => f.path === 'SKILL.md');
  if (!skillMd) return { error: 'A SKILL.md file is required' };

  try {
    const decoded = atob(skillMd.content);
    const { frontmatter } = parseSkillMd(decoded);
    return { description: frontmatter.description, name: frontmatter.name };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Invalid SKILL.md' };
  }
}
