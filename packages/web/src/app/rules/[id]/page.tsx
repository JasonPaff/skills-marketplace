import { BackLink } from '@/components/layout/back-link';

import { RuleDetailContent } from './_components/rule-detail-content';

export default async function RuleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main
      className="
        mx-auto max-w-4xl px-4 py-8
        sm:px-6
        lg:px-8
      "
    >
      <BackLink href="/" label="Back to Marketplace" />
      <RuleDetailContent id={id} />
    </main>
  );
}
