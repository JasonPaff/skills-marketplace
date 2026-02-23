import { BackLink } from '@/components/layout/back-link';

import { BundleDetailContent } from './_components/bundle-detail-content';

export default async function BundleDetailPage({
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
      <BundleDetailContent id={id} />
    </main>
  );
}
