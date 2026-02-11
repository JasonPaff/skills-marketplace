"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { createSkill, fetchProjects } from "@/lib/api";
import { SKILL_CATEGORIES } from "@emergent/shared";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewSkillPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(SKILL_CATEGORIES[0]);
  const [isGlobal, setIsGlobal] = useState(true);
  const [projectId, setProjectId] = useState<string>("");
  const [uploadedBy, setUploadedBy] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: () => fetchProjects(),
  });

  const mutation = useMutation({
    mutationFn: () =>
      createSkill({
        name,
        description,
        category: category as typeof SKILL_CATEGORIES[number],
        isGlobal,
        projectId: isGlobal ? undefined : projectId || undefined,
        uploadedBy,
      }),
    onSuccess: (skill) => {
      router.push(`/skills/${skill.id}`);
    },
    onError: (err: Error) => {
      setErrorMsg(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name || !description || !uploadedBy) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }
    if (!isGlobal && !projectId) {
      setErrorMsg("Please select a project for project-specific skills.");
      return;
    }

    mutation.mutate();
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        &larr; Back to skills
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-gray-900">Upload New Skill</h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
      >
        {/* Name */}
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
            Skill Name *
          </label>
          <input
            id="name"
            type="text"
            placeholder="my-awesome-skill"
            value={name}
            onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-gray-400">Lowercase letters, numbers, and hyphens only</p>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">
            Description *
          </label>
          <textarea
            id="description"
            rows={3}
            placeholder="Describe what this skill does..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-gray-400">{description.length}/500</p>
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="mb-1 block text-sm font-medium text-gray-700">
            Category *
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
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
                type="radio"
                checked={isGlobal}
                onChange={() => setIsGlobal(true)}
                className="text-blue-600"
              />
              Global (company-wide)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={!isGlobal}
                onChange={() => setIsGlobal(false)}
                className="text-blue-600"
              />
              Project-specific
            </label>
          </div>
        </div>

        {/* Project selector (if project-specific) */}
        {!isGlobal && (
          <div>
            <label htmlFor="project" className="mb-1 block text-sm font-medium text-gray-700">
              Project *
            </label>
            <select
              id="project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
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
          <label htmlFor="uploadedBy" className="mb-1 block text-sm font-medium text-gray-700">
            Your Email *
          </label>
          <input
            id="uploadedBy"
            type="text"
            placeholder="your.name@emergent.com"
            value={uploadedBy}
            onChange={(e) => setUploadedBy(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Error */}
        {errorMsg && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {mutation.isPending ? "Creating..." : "Create Skill"}
        </button>
      </form>
    </main>
  );
}
