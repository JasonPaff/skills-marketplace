'use client';

import { createSkillSchema, SKILL_CATEGORIES, type SkillCategory } from '@emergent/shared';
import { useForm } from '@tanstack/react-form';
import { File, FolderOpen, Trash2, Upload } from 'lucide-react';
import { $path } from 'next-typesafe-url';
import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { RadioGroup } from '@/components/ui/radio-group';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCreateSkill } from '@/lib/query/use-create-skill';
import { useProjects } from '@/lib/query/use-projects';

import { FormField } from './form-field';

interface UploadedFile {
  content: string;
  path: string;
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

export function SkillForm() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: projects } = useProjects();

  const handleFolderSelect = useCallback(async (fileList: FileList) => {
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
    setUploadedFiles(files.filter((f) => f.path.length > 0));
  }, []);

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

  const form = useForm({
    defaultValues: {
      category: SKILL_CATEGORIES[0] as string,
      description: '',
      isGlobal: true,
      name: '',
      projectId: '',
      uploadedBy: '',
    },
    onSubmit: ({ value }) => {
      setErrorMsg('');
      const result = createSkillSchema.safeParse({
        ...value,
        category: value.category as SkillCategory,
        files: uploadedFiles,
        projectId: value.isGlobal ? undefined : value.projectId || undefined,
      });
      if (!result.success) {
        const firstError = result.error.issues[0];
        setErrorMsg(firstError?.message ?? 'Validation failed');
        return;
      }
      createMutation.mutate(result.data);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <Card className="space-y-5" padding="lg">
        <form.Field name="name">
          {(field) => (
            <FormField
              hint="Lowercase letters, numbers, and hyphens only"
              htmlFor="name"
              label="Skill Name"
              required
            >
              <Input
                className="w-full"
                id="name"
                onChange={(e) =>
                  field.handleChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                }
                placeholder="my-awesome-skill"
                type="text"
                value={field.state.value}
              />
            </FormField>
          )}
        </form.Field>

        <form.Field name="description">
          {(field) => (
            <FormField
              hint={`${field.state.value.length}/500`}
              htmlFor="description"
              label="Description"
              required
            >
              <Textarea
                className="w-full"
                id="description"
                maxLength={500}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Describe what this skill does..."
                rows={3}
                value={field.state.value}
              />
            </FormField>
          )}
        </form.Field>

        <form.Field name="category">
          {(field) => (
            <FormField htmlFor="category" label="Category" required>
              <Select
                className="w-full"
                id="category"
                onChange={(e) => field.handleChange(e.target.value)}
                value={field.state.value}
              >
                {SKILL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </Select>
            </FormField>
          )}
        </form.Field>

        <form.Field name="isGlobal">
          {(field) => (
            <FormField label="Scope" required>
              <RadioGroup
                onValueChange={(val) => field.handleChange(val === 'global')}
                options={[
                  { label: 'Global (company-wide)', value: 'global' },
                  { label: 'Project-specific', value: 'project' },
                ]}
                value={field.state.value ? 'global' : 'project'}
              />
            </FormField>
          )}
        </form.Field>

        <form.Subscribe selector={(state) => state.values.isGlobal}>
          {(isGlobal) =>
            !isGlobal && (
              <form.Field name="projectId">
                {(field) => (
                  <FormField htmlFor="project" label="Project" required>
                    <Select
                      className="w-full"
                      id="project"
                      onChange={(e) => field.handleChange(e.target.value)}
                      value={field.state.value}
                    >
                      <option value="">Select a project...</option>
                      {projects?.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name} ({project.clientName})
                        </option>
                      ))}
                    </Select>
                  </FormField>
                )}
              </form.Field>
            )
          }
        </form.Subscribe>

        <form.Field name="uploadedBy">
          {(field) => (
            <FormField htmlFor="uploadedBy" label="Your Email" required>
              <Input
                className="w-full"
                id="uploadedBy"
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="your.name@emergent.com"
                type="text"
                value={field.state.value}
              />
            </FormField>
          )}
        </form.Field>

        <FormField
          error={uploadedFiles.length > 0 && !hasSkillMd ? 'A SKILL.md file is required' : undefined}
          label="Skill Files"
          required
        >
          <input
            className="hidden"
            onChange={(e) => {
              if (e.target.files) {
                handleFolderSelect(e.target.files);
              }
            }}
            ref={fileInputRef}
            type="file"
            {...({ webkitdirectory: '' } as React.InputHTMLAttributes<HTMLInputElement>)}
          />

          {uploadedFiles.length === 0 ? (
            <button
              className="
                flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed
                border-gray-300 p-6 text-gray-500 transition
                hover:border-blue-400 hover:text-blue-600
              "
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              <Upload className="size-8" />
              <span className="text-sm font-medium">Browse Folder</span>
              <span className="text-xs">Select a skill folder containing SKILL.md</span>
            </button>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                  <FolderOpen className="size-4" />
                  {uploadedFiles.length} file{uploadedFiles.length !== 1 && 's'}
                </span>
                <button
                  className="text-xs text-blue-600 hover:underline"
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                >
                  Re-select folder
                </button>
              </div>
              <ul className="space-y-1">
                {uploadedFiles.map((file) => (
                  <li
                    className="flex items-center justify-between rounded px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
                    key={file.path}
                  >
                    <span className="flex items-center gap-1.5">
                      <File className="size-3.5 text-gray-400" />
                      {file.path}
                    </span>
                    <button
                      className="text-gray-400 hover:text-red-500"
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
              rounded-lg border border-red-200 bg-red-50 p-3 text-sm
              text-red-700
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
