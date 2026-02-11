import { $path } from 'next-typesafe-url';
import { Suspense } from 'react';

import { PageHeader } from '@/components/layout/page-header';
import { SkillsList } from '@/components/skills/skills-list';

export default function Home() {
  return (
    <main
      className="
        mx-auto max-w-7xl px-4 py-8
        sm:px-6
        lg:px-8
      "
    >
      <PageHeader
        action={{ href: $path({ route: '/skills/new' }), label: 'Upload Skill' }}
        description="Discover, share, and install Claude Code &amp; Copilot skills across the organization."
        title="Detergent Skills Marketplace"
      />
      <Suspense fallback={<div className="py-12 text-center text-gray-500">Loading skills...</div>}>
        <SkillsList />
      </Suspense>
    </main>
  );
}
