import { $path } from 'next-typesafe-url';

import { SkillForm } from '@/components/forms/skill-form';
import { BackLink } from '@/components/layout/back-link';

export default function NewSkillPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <BackLink href={$path({ route: '/' })} label="Back to skills" />
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Upload New Skill</h1>
      <SkillForm />
    </main>
  );
}
