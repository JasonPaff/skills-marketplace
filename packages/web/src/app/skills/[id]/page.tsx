'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { use, useState } from 'react';

import { fetchSkill, rateSkill } from '@/lib/api';

const categoryColors: Record<string, string> = {
  devops: 'bg-green-100 text-green-800',
  dotnet: 'bg-purple-100 text-purple-800',
  general: 'bg-gray-100 text-gray-800',
  react: 'bg-sky-100 text-sky-800',
  'react-native': 'bg-cyan-100 text-cyan-800',
  security: 'bg-red-100 text-red-800',
  sql: 'bg-orange-100 text-orange-800',
  testing: 'bg-yellow-100 text-yellow-800',
  typescript: 'bg-blue-100 text-blue-800',
};

export default function SkillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [email, setEmail] = useState('');
  const [ratingMessage, setRatingMessage] = useState('');

  const {
    data: skill,
    error,
    isLoading,
  } = useQuery({
    queryFn: () => fetchSkill(id),
    queryKey: ['skill', id],
  });

  const rateMutation = useMutation({
    mutationFn: () => rateSkill(id, { rating: selectedRating, userEmail: email }),
    onError: (err: Error) => {
      setRatingMessage(`Failed: ${err.message}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skill', id] });
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      setRatingMessage('Rating submitted!');
      setSelectedRating(0);
      setEmail('');
    },
  });

  if (isLoading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="py-12 text-center text-gray-500">Loading skill...</div>
      </main>
    );
  }

  if (error || !skill) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div
          className="
            rounded-lg border border-red-200 bg-red-50 p-4 text-red-700
          "
        >
          Skill not found or failed to load.
        </div>
        <Link
          className="
            mt-4 inline-block text-sm text-blue-600
            hover:underline
          "
          href="/"
        >
          Back to skills
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link
        className="
          mb-6 inline-flex items-center gap-1 text-sm text-gray-500
          hover:text-gray-700
        "
        href="/"
      >
        &larr; Back to skills
      </Link>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{skill.name}</h1>
            <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
              <span
                className={`
                  rounded-full px-2 py-0.5 text-xs font-medium
                  ${categoryColors[skill.category] ?? categoryColors.general}
                `}
              >
                {skill.category}
              </span>
              {skill.isGlobal ? (
                <span
                  className="
                    rounded-sm bg-green-50 px-1.5 py-0.5 text-xs text-green-700
                  "
                >
                  Global
                </span>
              ) : (
                <span
                  className="
                    rounded-sm bg-amber-50 px-1.5 py-0.5 text-xs text-amber-700
                  "
                >
                  Project-specific
                </span>
              )}
              <span>v{skill.version}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="mb-6 leading-relaxed text-gray-700">{skill.description}</p>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-3 gap-4 rounded-lg bg-gray-50 p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{skill.downloadCount}</div>
            <div className="text-xs text-gray-500">Downloads</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {Number(skill.averageRating).toFixed(1)}
            </div>
            <div className="text-xs text-gray-500">Avg Rating ({skill.ratingCount} reviews)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {skill.parentSkillId ? 'Fork' : 'Original'}
            </div>
            <div className="text-xs text-gray-500">Source</div>
          </div>
        </div>

        {/* Meta */}
        <div className="mb-6 space-y-1 text-sm text-gray-500">
          <p>Uploaded by: {skill.uploadedBy}</p>
          <p>GitHub path: {skill.githubPath}</p>
          <p>Uploaded: {new Date(skill.uploadedAt).toLocaleDateString()}</p>
        </div>

        {/* Rating Form */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="mb-3 font-semibold text-gray-900">Rate this skill</h3>
          <div className="mb-3 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                className={`
                  text-2xl transition
                  ${star <= (hoveredRating || selectedRating) ? 'text-amber-400' : `text-gray-300`}
                  hover:scale-110
                `}
                key={star}
                onClick={() => setSelectedRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                type="button"
              >
                &#9733;
              </button>
            ))}
            {selectedRating > 0 && (
              <span className="ml-2 text-sm text-gray-500">{selectedRating}/5</span>
            )}
          </div>
          <div className="flex gap-3">
            <input
              className="
                flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm
                focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                focus:outline-none
              "
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@emergent.com"
              type="email"
              value={email}
            />
            <button
              className="
                rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white
                hover:bg-blue-700
                disabled:cursor-not-allowed disabled:opacity-50
              "
              disabled={selectedRating === 0 || !email || rateMutation.isPending}
              onClick={() => rateMutation.mutate()}
            >
              {rateMutation.isPending ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
          {ratingMessage && (
            <p
              className={`
                mt-2 text-sm
                ${
                  ratingMessage.startsWith('Failed')
                    ? `text-red-600`
                    : `
                  text-green-600
                `
                }
              `}
            >
              {ratingMessage}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
