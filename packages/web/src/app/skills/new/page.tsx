'use client';

import { SKILL_CATEGORIES } from '@emergent/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { createSkill, fetchProjects } from '@/lib/api';

export default function NewSkillPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>(SKILL_CATEGORIES[0]);
  const [isGlobal, setIsGlobal] = useState(true);
  const [projectId, setProjectId] = useState<string>('');
  const [uploadedBy, setUploadedBy] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { data: projects } = useQuery({
    queryFn: () => fetchProjects(),
    queryKey: ['projects'],
  });

  const mutation = useMutation({
    mutationFn: () =>
      createSkill({
        category: category as (typeof SKILL_CATEGORIES)[number],
        description,
        isGlobal,
        name,
        projectId: isGlobal ? undefined : projectId || undefined,
        uploadedBy,
      }),
    onError: (err: Error) => {
      setErrorMsg(err.message);
    },
    onSuccess: (skill) => {
      router.push(`/skills/${skill.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name || !description || !uploadedBy) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }
    if (!isGlobal && !projectId) {
      setErrorMsg('Please select a project for project-specific skills.');
      return;
    }

    mutation.mutate();
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link
        className="
          mb-6 inline-flex items-center gap-1 text-sm text-gray-500
          hover:text-gray-700
        "
        href="/"
      >
        &larr; Back to skills
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-gray-900">Upload New Skill</h1>

      <form
        className="
          space-y-5 rounded-lg border border-gray-200 bg-white p-6 shadow-sm
        "
        onSubmit={handleSubmit}
      >
        {/* Name */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="name">
            Skill Name *
          </label>
          <input
            className="
              w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
              focus:border-blue-500 focus:ring-1 focus:ring-blue-500
              focus:outline-none
            "
            id="name"
            onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            placeholder="my-awesome-skill"
            type="text"
            value={name}
          />
          <p className="mt-1 text-xs text-gray-400">Lowercase letters, numbers, and hyphens only</p>
        </div>

        {/* Description */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="description">
            Description *
          </label>
          <textarea
            className="
              w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
              focus:border-blue-500 focus:ring-1 focus:ring-blue-500
              focus:outline-none
            "
            id="description"
            maxLength={500}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what this skill does..."
            rows={3}
            value={description}
          />
          <p className="mt-1 text-xs text-gray-400">{description.length}/500</p>
        </div>

        {/* Category */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="category">
            Category *
          </label>
          <select
            className="
              w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
              focus:border-blue-500 focus:ring-1 focus:ring-blue-500
              focus:outline-none
            "
            id="category"
            onChange={(e) => setCategory(e.target.value)}
            value={category}
          >
            {SKILL_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Scope */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Scope *</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                checked={isGlobal}
                className="text-blue-600"
                onChange={() => setIsGlobal(true)}
                type="radio"
              />
              Global (company-wide)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                checked={!isGlobal}
                className="text-blue-600"
                onChange={() => setIsGlobal(false)}
                type="radio"
              />
              Project-specific
            </label>
          </div>
        </div>

        {/* Project selector (if project-specific) */}
        {!isGlobal && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="project">
              Project *
            </label>
            <select
              className="
                w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                focus:outline-none
              "
              id="project"
              onChange={(e) => setProjectId(e.target.value)}
              value={projectId}
            >
              <option value="">Select a project...</option>
              {projects?.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name} ({project.clientName})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Uploaded By */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="uploadedBy">
            Your Email *
          </label>
          <input
            className="
              w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
              focus:border-blue-500 focus:ring-1 focus:ring-blue-500
              focus:outline-none
            "
            id="uploadedBy"
            onChange={(e) => setUploadedBy(e.target.value)}
            placeholder="your.name@emergent.com"
            type="text"
            value={uploadedBy}
          />
        </div>

        {/* Error */}
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

        {/* Submit */}
        <button
          className="
            w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium
            text-white
            hover:bg-blue-700
            disabled:cursor-not-allowed disabled:opacity-50
          "
          disabled={mutation.isPending}
          type="submit"
        >
          {mutation.isPending ? 'Creating...' : 'Create Skill'}
        </button>
      </form>
    </main>
  );
}
