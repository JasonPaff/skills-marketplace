import { BackLink } from '@/components/layout/back-link';
import { SkillDetailContent } from '@/components/skills/skill-detail-content';

export default async function SkillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <BackLink href="/" label="Back to skills" />
      <SkillDetailContent id={id} />
    </main>
  );
}
