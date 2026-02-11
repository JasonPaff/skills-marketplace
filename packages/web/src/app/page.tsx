"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchSkills } from "@/lib/api";
import { SKILL_CATEGORIES } from "@emergent/shared";
import { useState } from "react";
import Link from "next/link";

const categoryColors: Record<string, string> = {
  dotnet: "bg-purple-100 text-purple-800",
  react: "bg-sky-100 text-sky-800",
  "react-native": "bg-cyan-100 text-cyan-800",
  sql: "bg-orange-100 text-orange-800",
  typescript: "bg-blue-100 text-blue-800",
  devops: "bg-green-100 text-green-800",
  testing: "bg-yellow-100 text-yellow-800",
  security: "bg-red-100 text-red-800",
  general: "bg-gray-100 text-gray-800",
};

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-sm">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={star <= Math.round(rating) ? "text-amber-400" : "text-gray-300"}
        >
          &#9733;
        </span>
      ))}
      <span className="ml-1 text-gray-500">({rating.toFixed(1)})</span>
    </span>
  );
}

export default function Home() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("");

  const { data: skills, isLoading, error } = useQuery({
    queryKey: ["skills", search, category],
    queryFn: () =>
      fetchSkills({
        search: search || undefined,
        category: category || undefined,
      }),
  });

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Skills Marketplace</h1>
          <p className="mt-2 text-gray-600">
            Discover, share, and install Claude Code &amp; Copilot skills across
            the organization.
          </p>
        </div>
        <Link
          href="/skills/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Upload Skill
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search skills..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        >
          <option value="">All Categories</option>
          {SKILL_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      {isLoading && (
        <div className="py-12 text-center text-gray-500">Loading skills...</div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          Failed to load skills: {(error as Error).message}
        </div>
      )}

      {skills && skills.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500">No skills found.</p>
          <Link
            href="/skills/new"
            className="mt-2 inline-block text-sm text-blue-600 hover:underline"
          >
            Upload the first skill
          </Link>
        </div>
      )}

      {skills && skills.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {skills.map((skill) => (
            <Link
              key={skill.id}
              href={`/skills/${skill.id}`}
              className="group rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
            >
              <div className="mb-2 flex items-start justify-between">
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                  {skill.name}
                </h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${categoryColors[skill.category] ?? categoryColors.general}`}
                >
                  {skill.category}
                </span>
              </div>
              <p className="mb-3 text-sm leading-relaxed text-gray-600 line-clamp-2">
                {skill.description}
              </p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <StarRating rating={Number(skill.averageRating)} />
                <span>{skill.downloadCount} downloads</span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                {skill.isGlobal ? (
                  <span className="rounded bg-green-50 px-1.5 py-0.5 text-green-700">
                    Global
                  </span>
                ) : (
                  <span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-700">
                    Project
                  </span>
                )}
                <span>v{skill.version}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
