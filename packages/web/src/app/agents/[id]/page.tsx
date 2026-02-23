import { BackLink } from '@/components/layout/back-link';

import { AgentDetailContent } from './_components/agent-detail-content';

export default async function AgentDetailPage({
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
      <AgentDetailContent id={id} />
    </main>
  );
}
