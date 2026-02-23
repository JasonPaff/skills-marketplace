'use client';

import type { ChangeEvent } from 'react';

import { parseSkillMd } from '@emergent/shared';
import {
  AlertCircle,
  CheckCircle2,
  FileArchive,
  FolderOpen,
  Upload,
  XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import type {
  BatchStructure,
  DetectedStructure,
  GroupedItem,
  SingleSkillStructure,
  UploadedFile,
} from '@/lib/utils/folder-detection';

import { ErrorAlert } from '@/components/layout/error-alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useBatchUpload } from '@/lib/query/use-batch-upload';
import { useCreateSkill } from '@/lib/query/use-create-skill';
import { detectFolderStructure } from '@/lib/utils/folder-detection';
import { extractZipFiles } from '@/lib/utils/zip';

// ─── Types ───────────────────────────────────────────────────────

interface BatchPreview {
  agents: GroupedItem[];
  rules: GroupedItem[];
  skills: GroupedItem[];
  type: 'batch';
}

type PreviewData = BatchPreview | SingleSkillPreview;

interface SingleSkillPreview {
  description: string;
  files: UploadedFile[];
  name: string;
  type: 'single-skill';
  valid: boolean;
  validationErrors: string[];
}

type UploadMode = 'folder' | 'zip';

// ─── Component ──────────────────────────────────────────────────

export function UploadForm() {
  const router = useRouter();
  const createSkill = useCreateSkill();
  const batchUpload = useBatchUpload();

  const [mode, setMode] = useState<UploadMode>('folder');
  const [preview, setPreview] = useState<null | PreviewData>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<null | string>(null);

  // ─── File Processing ────────────────────────────────────────

  const processFiles = useCallback(async (files: UploadedFile[], structure: DetectedStructure) => {
    if (structure.type === 'single-skill') {
      processSingleSkill(structure);
    } else {
      processBatch(structure);
    }
  }, []);

  function processSingleSkill(structure: SingleSkillStructure) {
    const skillMd = structure.files.find((f) => f.path === 'SKILL.md');
    const validationErrors: string[] = [];
    let name = '';
    let description = '';

    if (!skillMd) {
      validationErrors.push('Missing SKILL.md file');
    } else {
      try {
        const decoded = atob(skillMd.content);
        const parsed = parseSkillMd(decoded);
        name = parsed.frontmatter.name;
        description = parsed.frontmatter.description;
      } catch (err) {
        validationErrors.push(err instanceof Error ? err.message : 'Invalid SKILL.md frontmatter');
      }
    }

    setPreview({
      description,
      files: structure.files,
      name,
      type: 'single-skill',
      valid: validationErrors.length === 0,
      validationErrors,
    });
  }

  function processBatch(structure: BatchStructure) {
    setPreview({
      agents: structure.agents,
      rules: structure.rules,
      skills: structure.skills,
      type: 'batch',
    });
  }

  // ─── Folder Upload Handler ──────────────────────────────────

  async function handleFolderSelect(e: ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setProcessing(true);
    setError(null);
    setPreview(null);

    try {
      const uploadedFiles: UploadedFile[] = [];

      for (const file of Array.from(fileList)) {
        const content = await readFileAsBase64(file);
        // webkitRelativePath gives us the folder-relative path
        uploadedFiles.push({
          content,
          path: file.webkitRelativePath,
        });
      }

      const structure = detectFolderStructure(uploadedFiles);
      await processFiles(uploadedFiles, structure);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process folder');
    } finally {
      setProcessing(false);
    }
  }

  // ─── ZIP Upload Handler ─────────────────────────────────────

  async function handleZipSelect(e: ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setProcessing(true);
    setError(null);
    setPreview(null);

    try {
      const zipFile = fileList[0]!;
      const extracted = await extractZipFiles(zipFile);
      const structure = detectFolderStructure(extracted);
      await processFiles(extracted, structure);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process ZIP file');
    } finally {
      setProcessing(false);
    }
  }

  // ─── Submit Handlers ────────────────────────────────────────

  async function handleSingleSubmit(data: SingleSkillPreview) {
    setError(null);

    // Derive the skill name slug from the parsed name
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    createSkill.mutate(
      {
        description: data.description,
        files: data.files,
        name: slug,
      },
      {
        onError: (err) => {
          setError(err instanceof Error ? err.message : 'Failed to upload skill');
        },
        onSuccess: (result) => {
          router.push(`/skills/${result.id}`);
        },
      },
    );
  }

  async function handleBatchSubmit(data: BatchPreview) {
    setError(null);

    const skills = data.skills.map((item) => ({
      description: item.frontmatter.description ?? '',
      files: item.files,
      name: item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    }));

    const agents = data.agents.map((item) => ({
      description: item.frontmatter.description ?? '',
      files: item.files,
      name: item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    }));

    const rules = data.rules.map((item) => ({
      description: item.frontmatter.description ?? '',
      files: item.files,
      name: item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    }));

    batchUpload.mutate(
      {
        ...(agents.length > 0 ? { agents } : {}),
        ...(rules.length > 0 ? { rules } : {}),
        ...(skills.length > 0 ? { skills } : {}),
      },
      {
        onError: (err) => {
          setError(err instanceof Error ? err.message : 'Failed to upload batch');
        },
        onSuccess: () => {
          router.push('/');
        },
      },
    );
  }

  function handleSubmit() {
    if (!preview) return;

    if (preview.type === 'single-skill') {
      handleSingleSubmit(preview);
    } else {
      handleBatchSubmit(preview);
    }
  }

  // ─── Validation Checks ─────────────────────────────────────

  function canSubmit(): boolean {
    if (!preview) return false;

    if (preview.type === 'single-skill') {
      return preview.valid;
    }

    const totalItems =
      preview.skills.length + preview.agents.length + preview.rules.length;
    if (totalItems === 0) return false;

    // All items must have valid frontmatter
    const allValid = [
      ...preview.skills,
      ...preview.agents,
      ...preview.rules,
    ].every((item) => item.frontmatter.valid);

    return allValid;
  }

  const isSubmitting = createSkill.isPending || batchUpload.isPending;

  // ─── Render ─────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Mode Selector */}
      <Card>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-text-primary">Select Upload Method</h2>
          <div className="flex gap-3">
            <button
              className={`
                flex flex-1 items-center gap-3 rounded-lg border-2 p-4 text-left
                transition
                ${
                  mode === 'folder'
                    ? 'border-accent bg-accent-subtle'
                    : `
                      border-border
                      hover:border-border-strong
                    `
                }
              `}
              onClick={() => {
                setMode('folder');
                setPreview(null);
                setError(null);
              }}
              type="button"
            >
              <FolderOpen
                className={`
                  size-6
                  ${mode === 'folder' ? 'text-accent-text' : `
                    text-text-tertiary
                  `}
                `}
              />
              <div>
                <p
                  className={`
                    font-medium
                    ${mode === 'folder' ? `text-accent-text` : `
                      text-text-primary
                    `}
                  `}
                >
                  Folder Upload
                </p>
                <p className="text-sm text-text-tertiary">
                  Select a folder containing skills, agents, or rules
                </p>
              </div>
            </button>

            <button
              className={`
                flex flex-1 items-center gap-3 rounded-lg border-2 p-4 text-left
                transition
                ${
                  mode === 'zip'
                    ? 'border-accent bg-accent-subtle'
                    : `
                      border-border
                      hover:border-border-strong
                    `
                }
              `}
              onClick={() => {
                setMode('zip');
                setPreview(null);
                setError(null);
              }}
              type="button"
            >
              <FileArchive
                className={`
                  size-6
                  ${mode === 'zip' ? 'text-accent-text' : `text-text-tertiary`}
                `}
              />
              <div>
                <p
                  className={`
                    font-medium
                    ${mode === 'zip' ? 'text-accent-text' : `text-text-primary`}
                  `}
                >
                  ZIP Upload
                </p>
                <p className="text-sm text-text-tertiary">
                  Upload a .zip archive with your content
                </p>
              </div>
            </button>
          </div>
        </div>
      </Card>

      {/* File Input */}
      <Card>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-text-primary">
            {mode === 'folder' ? 'Select Folder' : 'Select ZIP File'}
          </h2>

          {mode === 'folder' ? (
            <div>
              <label className="block">
                <span className="
                  mb-1.5 block text-sm font-medium text-text-secondary
                ">
                  Choose a folder to upload
                </span>
                <input
                  accept="*"
                  className="
                    w-full cursor-pointer rounded-lg border border-border-strong
                    bg-surface px-3 py-2 text-sm text-text-primary
                    file:mr-3 file:rounded-md file:border-0
                    file:bg-accent-subtle file:px-3 file:py-1.5 file:text-sm
                    file:font-medium file:text-accent-text
                    focus:border-accent-ring focus:ring-1 focus:ring-accent-ring
                    focus:outline-none
                    disabled:cursor-not-allowed disabled:opacity-50
                  "
                  disabled={processing}
                  onChange={handleFolderSelect}
                  type="file"
                  {...{ webkitdirectory: '' } as Record<string, string>}
                />
              </label>
              <p className="mt-1.5 text-xs text-text-tertiary">
                Select a folder containing a SKILL.md file, or a .claude-style folder with
                skills/, agents/, and rules/ subfolders.
              </p>
            </div>
          ) : (
            <div>
              <label className="block">
                <span className="
                  mb-1.5 block text-sm font-medium text-text-secondary
                ">
                  Choose a ZIP file to upload
                </span>
                <Input
                  accept=".zip"
                  className="
                    w-full cursor-pointer
                    file:mr-3 file:rounded-md file:border-0
                    file:bg-accent-subtle file:px-3 file:py-1.5 file:text-sm
                    file:font-medium file:text-accent-text
                  "
                  disabled={processing}
                  onChange={handleZipSelect}
                  type="file"
                />
              </label>
              <p className="mt-1.5 text-xs text-text-tertiary">
                Upload a .zip archive containing skills, agents, and/or rules.
              </p>
            </div>
          )}

          {processing && (
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <div className="
                size-4 animate-spin rounded-full border-2 border-accent
                border-t-transparent
              " />
              Processing files...
            </div>
          )}
        </div>
      </Card>

      {/* Error Display */}
      {error && <ErrorAlert message={error} />}

      {/* Preview Section */}
      {preview && (
        <Card>
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-text-primary">Upload Preview</h2>

            {preview.type === 'single-skill' ? (
              <SingleSkillPreviewCard preview={preview} />
            ) : (
              <BatchPreviewCard preview={preview} />
            )}
          </div>
        </Card>
      )}

      {/* Submit Button */}
      {preview && (
        <div className="flex justify-end gap-3">
          <Button
            onClick={() => {
              setPreview(null);
              setError(null);
            }}
            variant="secondary"
          >
            Clear
          </Button>
          <Button
            disabled={!canSubmit()}
            loading={isSubmitting}
            onClick={handleSubmit}
          >
            <Upload className="size-4" />
            {preview.type === 'single-skill' ? 'Upload Skill' : 'Upload Batch'}
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Preview Sub-Components ─────────────────────────────────────

function BatchPreviewCard({ preview }: { preview: BatchPreview }) {
  const totalItems =
    preview.skills.length + preview.agents.length + preview.rules.length;

  const allItems = [
    ...preview.skills,
    ...preview.agents,
    ...preview.rules,
  ];
  const validCount = allItems.filter((item) => item.frontmatter.valid).length;
  const invalidCount = totalItems - validCount;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {invalidCount === 0 ? (
          <CheckCircle2 className="
            size-5 text-green-600
            dark:text-green-400
          " />
        ) : (
          <AlertCircle className="
            size-5 text-yellow-600
            dark:text-yellow-400
          " />
        )}
        <span className="font-medium text-text-primary">
          {totalItems} item{totalItems !== 1 ? 's' : ''} detected
        </span>
        <Badge variant="primary">Batch Upload</Badge>
      </div>

      {/* Summary counts */}
      <div className="flex gap-4">
        {preview.skills.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Badge variant="sky">{preview.skills.length}</Badge>
            <span className="text-sm text-text-secondary">
              skill{preview.skills.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
        {preview.agents.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Badge variant="purple">{preview.agents.length}</Badge>
            <span className="text-sm text-text-secondary">
              agent{preview.agents.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
        {preview.rules.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Badge variant="amber">{preview.rules.length}</Badge>
            <span className="text-sm text-text-secondary">
              rule{preview.rules.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {invalidCount > 0 && (
        <div className="flex items-center gap-2 text-sm text-status-error">
          <AlertCircle className="size-4 shrink-0" />
          {invalidCount} item{invalidCount !== 1 ? 's' : ''} failed validation
        </div>
      )}

      {/* Detailed item list */}
      <div className="space-y-3">
        <ItemGroupTable items={preview.skills} label="Skills" variant="sky" />
        <ItemGroupTable items={preview.agents} label="Agents" variant="purple" />
        <ItemGroupTable items={preview.rules} label="Rules" variant="amber" />
      </div>
    </div>
  );
}

function ItemGroupTable({
  items,
  label,
  variant,
}: {
  items: GroupedItem[];
  label: string;
  variant: 'amber' | 'purple' | 'sky';
}) {
  if (items.length === 0) return null;

  return (
    <div>
      <h3 className="mb-1.5 text-sm font-medium text-text-secondary">{label}</h3>
      <div className="rounded-md border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-secondary">
              <th className="
                px-3 py-1.5 text-left font-medium text-text-secondary
              ">Name</th>
              <th className="
                px-3 py-1.5 text-left font-medium text-text-secondary
              ">
                Description
              </th>
              <th className="
                px-3 py-1.5 text-left font-medium text-text-secondary
              ">Files</th>
              <th className="
                px-3 py-1.5 text-left font-medium text-text-secondary
              ">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr className="
                border-b border-border
                last:border-0
              " key={item.name}>
                <td className="px-3 py-1.5">
                  <div className="flex items-center gap-1.5">
                    <Badge size="sm" variant={variant}>
                      {label.slice(0, -1)}
                    </Badge>
                    <span className="font-mono text-text-primary">{item.name}</span>
                  </div>
                </td>
                <td className="max-w-48 truncate px-3 py-1.5 text-text-tertiary">
                  {item.frontmatter.description ?? '-'}
                </td>
                <td className="px-3 py-1.5 text-text-tertiary">{item.files.length}</td>
                <td className="px-3 py-1.5">
                  {item.frontmatter.valid ? (
                    <CheckCircle2 className="
                      size-4 text-green-600
                      dark:text-green-400
                    " />
                  ) : (
                    <div className="flex items-center gap-1">
                      <XCircle className="
                        size-4 text-red-600
                        dark:text-red-400
                      " />
                      {item.frontmatter.errors && (
                        <span className="text-xs text-status-error">
                          {item.frontmatter.errors[0]}
                        </span>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Strip the data URL prefix to get raw base64
        const base64 = reader.result.split(',')[1] ?? '';
        resolve(base64);
      } else {
        reject(new Error('Unexpected reader result type'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// ─── Helpers ────────────────────────────────────────────────────

function SingleSkillPreviewCard({ preview }: { preview: SingleSkillPreview }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {preview.valid ? (
          <CheckCircle2 className="
            size-5 text-green-600
            dark:text-green-400
          " />
        ) : (
          <XCircle className="
            size-5 text-red-600
            dark:text-red-400
          " />
        )}
        <span className="font-medium text-text-primary">
          {preview.valid ? 'Valid Skill Detected' : 'Validation Failed'}
        </span>
        <Badge variant="primary">Single Skill</Badge>
      </div>

      {preview.valid && (
        <div className="
          rounded-md border border-border bg-surface-secondary p-3
        ">
          <dl className="space-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="font-medium text-text-secondary">Name:</dt>
              <dd className="text-text-primary">{preview.name}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-text-secondary">Description:</dt>
              <dd className="text-text-primary">{preview.description}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-text-secondary">Files:</dt>
              <dd className="text-text-primary">{preview.files.length}</dd>
            </div>
          </dl>
        </div>
      )}

      {preview.validationErrors.length > 0 && (
        <div className="space-y-1.5">
          {preview.validationErrors.map((err) => (
            <div
              className="flex items-center gap-2 text-sm text-status-error"
              key={err}
            >
              <AlertCircle className="size-4 shrink-0" />
              {err}
            </div>
          ))}
        </div>
      )}

      {preview.files.length > 0 && (
        <div>
          <p className="mb-1.5 text-sm font-medium text-text-secondary">Files included:</p>
          <ul className="space-y-0.5 text-sm text-text-tertiary">
            {preview.files.map((file) => (
              <li className="font-mono" key={file.path}>
                {file.path}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
