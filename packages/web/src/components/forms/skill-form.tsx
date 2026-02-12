'use client';

import { createSkillSchema, parseSkillMd } from '@emergent/shared';
import { useForm } from '@tanstack/react-form';
import { Archive, ChevronDown, ChevronRight, File, FolderOpen, Trash2, Upload } from 'lucide-react';
import { $path } from 'next-typesafe-url';
import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCreateSkill } from '@/lib/query/use-create-skill';
import { extractZipFiles, getZipRootName } from '@/lib/utils/zip';

import { FormField } from './form-field';

interface UploadedFile {
  content: string;
  path: string;
}

export function SkillForm() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState('');
  const [fileError, setFileError] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [guideOpen, setGuideOpen] = useState(false);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  const form = useForm({
    defaultValues: {
      description: '',
      name: '',
    },
    onSubmit: ({ value }) => {
      setErrorMsg('');
      const result = createSkillSchema.safeParse({
        ...value,
        files: uploadedFiles,
      });
      if (!result.success) {
        const firstError = result.error.issues[0];
        setErrorMsg(firstError?.message ?? 'Validation failed');
        return;
      }
      createMutation.mutate(result.data);
    },
  });

  const autoFillFromFiles = useCallback(
    (files: UploadedFile[], folderName?: string) => {
      setFileError('');

      // Auto-fill name from folder/zip name
      if (folderName) {
        const sanitized = sanitizeName(folderName);
        if (sanitized && !form.getFieldValue('name')) {
          form.setFieldValue('name', sanitized);
        }
      }

      // Validate and auto-fill from frontmatter
      const result = tryParseFrontmatter(files);
      if (result.error) {
        setFileError(result.error);
      } else {
        if (result.description && !form.getFieldValue('description')) {
          form.setFieldValue('description', result.description.slice(0, 500));
        }
      }
    },
    [form],
  );

  const handleFolderSelect = useCallback(
    async (fileList: FileList) => {
      const files = await Promise.all(
        Array.from(fileList).map(async (file) => {
          const base64 = await fileToBase64(file);
          // webkitRelativePath gives "folder-name/SKILL.md" — strip the root folder
          const parts = file.webkitRelativePath.split('/');
          const relativePath = parts.slice(1).join('/');
          return { content: base64, path: relativePath };
        }),
      );
      // Filter out empty paths (e.g. the folder itself)
      const filtered = files.filter((f) => f.path.length > 0);
      setUploadedFiles(filtered);

      // Extract folder name from first file's webkitRelativePath
      const firstFile = Array.from(fileList)[0];
      const folderName = firstFile?.webkitRelativePath.split('/')[0];
      autoFillFromFiles(filtered, folderName);
    },
    [autoFillFromFiles],
  );

  const handleZipSelect = useCallback(
    async (file: globalThis.File) => {
      try {
        const files = await extractZipFiles(file);
        setUploadedFiles(files);

        // Get root name for auto-fill
        const rootName = getZipRootName(
          file,
          files.map((f) => f.path),
        );
        autoFillFromFiles(files, rootName);
      } catch {
        setFileError('Failed to read zip file');
      }
    },
    [autoFillFromFiles],
  );

  const removeFile = useCallback((path: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.path !== path));
  }, []);

  const hasSkillMd = uploadedFiles.some((f) => f.path === 'SKILL.md');

  const createMutation = useCreateSkill({
    onError: (err) => {
      setErrorMsg(err.message);
    },
    onSuccess: (skill) => {
      router.push($path({ route: '/skills/[id]', routeParams: { id: skill.id } }));
    },
  });

  const filesError =
    fileError ||
    (uploadedFiles.length > 0 && !hasSkillMd ? 'A SKILL.md file is required' : undefined);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <Card className="space-y-5" padding="lg">
        {/* Collapsible Skill Format Guide */}
        <div className="rounded-lg border border-border bg-surface-secondary">
          <button
            className="
              flex w-full items-center gap-2 px-4 py-3 text-left text-sm
              font-medium text-text-secondary
            "
            onClick={() => setGuideOpen(!guideOpen)}
            type="button"
          >
            {guideOpen ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight
                className="
              size-4
            "
              />
            )}
            Skill Format Guide
          </button>
          {guideOpen && (
            <div
              className="
              border-t border-border px-4 pt-3 pb-4 text-sm text-text-secondary
            "
            >
              <p className="mb-2">
                A skill is a folder containing a{' '}
                <code
                  className="
                  rounded-sm bg-surface-tertiary px-1 py-0.5 text-xs
                "
                >
                  SKILL.md
                </code>{' '}
                file with YAML frontmatter:
              </p>
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
              <ul
                className="
                list-inside list-disc space-y-1 text-xs text-text-tertiary
              "
              >
                <li>
                  The{' '}
                  <code
                    className="
                  rounded-sm bg-surface-tertiary px-1 py-0.5
                "
                  >
                    name
                  </code>{' '}
                  and{' '}
                  <code
                    className="
                  rounded-sm bg-surface-tertiary px-1 py-0.5
                "
                  >
                    description
                  </code>{' '}
                  fields are required in the frontmatter
                </li>
                <li>
                  Additional files (templates, configs, etc.) can be included alongside SKILL.md
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

        <form.Field
          name="name"
          validators={{
            onBlur: createSkillSchema.shape.name,
            onChange: createSkillSchema.shape.name,
            onSubmit: createSkillSchema.shape.name,
          }}
        >
          {(field) => (
            <FormField
              error={field.state.meta.errors.join(', ') || undefined}
              hint="Lowercase letters, numbers, and hyphens only"
              htmlFor="skill-name"
              label="Skill Name"
              required
            >
              {({ ariaDescribedBy, ariaInvalid, ariaRequired }) => (
                <Input
                  aria-describedby={ariaDescribedBy}
                  aria-invalid={ariaInvalid}
                  aria-required={ariaRequired}
                  className="w-full"
                  error={field.state.meta.errors.length > 0}
                  id="skill-name"
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) =>
                    field.handleChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                  }
                  placeholder="my-awesome-skill"
                  type="text"
                  value={field.state.value}
                />
              )}
            </FormField>
          )}
        </form.Field>

        <form.Field
          name="description"
          validators={{
            onBlur: createSkillSchema.shape.description,
            onChange: createSkillSchema.shape.description,
            onSubmit: createSkillSchema.shape.description,
          }}
        >
          {(field) => (
            <FormField
              error={field.state.meta.errors.join(', ') || undefined}
              hint={`${field.state.value.length}/500`}
              htmlFor="skill-description"
              label="Description"
              required
            >
              {({ ariaDescribedBy, ariaInvalid, ariaRequired }) => (
                <Textarea
                  aria-describedby={ariaDescribedBy}
                  aria-invalid={ariaInvalid}
                  aria-required={ariaRequired}
                  className="w-full"
                  error={field.state.meta.errors.length > 0}
                  id="skill-description"
                  maxLength={500}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Describe what this skill does..."
                  rows={3}
                  value={field.state.value}
                />
              )}
            </FormField>
          )}
        </form.Field>

        <FormField error={filesError || undefined} label="Skill Files" required>
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
                <span className="text-xs">Select a skill folder</span>
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
            <div
              className="
              rounded-lg border border-border bg-surface-secondary p-3
            "
            >
              <div className="mb-2 flex items-center justify-between">
                <span
                  className="
                  flex items-center gap-1.5 text-sm font-medium
                  text-text-secondary
                "
                >
                  <FolderOpen className="size-4" />
                  {uploadedFiles.length} file{uploadedFiles.length !== 1 && 's'}
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
                </span>
              </div>
              <ul className="space-y-1">
                {uploadedFiles.map((file) => (
                  <li
                    className="
                      flex items-center justify-between rounded-sm px-2 py-1
                      text-sm text-text-secondary
                      hover:bg-surface-tertiary
                    "
                    key={file.path}
                  >
                    <span className="flex items-center gap-1.5">
                      <File className="size-3.5 text-text-quaternary" />
                      {file.path}
                    </span>
                    <button
                      className="
                        text-text-quaternary
                        hover:text-status-error
                      "
                      onClick={() => removeFile(file.path)}
                      type="button"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </FormField>

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

        <Button fullWidth loading={createMutation.isPending} type="submit">
          Create Skill
        </Button>
      </Card>
    </form>
  );
}

function fileToBase64(file: globalThis.File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // readAsDataURL returns "data:<mime>;base64,<data>" — strip the prefix
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1] ?? '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function sanitizeName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
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
