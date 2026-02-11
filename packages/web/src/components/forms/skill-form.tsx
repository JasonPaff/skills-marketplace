'use client';

import { createSkillSchema, SKILL_CATEGORIES, type SkillCategory } from '@emergent/shared';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { RadioGroup } from '@/components/ui/radio-group';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCreateSkill } from '@/lib/query/use-create-skill';
import { useProjects } from '@/lib/query/use-projects';

import { FormField } from './form-field';

export function SkillForm() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState('');
  const { data: projects } = useProjects();

  const createMutation = useCreateSkill({
    onError: (err) => {
      setErrorMsg(err.message);
    },
    onSuccess: (skill) => {
      router.push(`/skills/${skill.id}`);
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

        {errorMsg && (
          <div
            className="
            rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700
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
