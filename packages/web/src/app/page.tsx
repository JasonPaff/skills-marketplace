import { PageHeader } from '@/components/layout/page-header';

import { MarketplaceTable } from './_components/marketplace-table';

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
        action={{ href: '/upload', label: 'Upload' }}
        description="Discover, share, and install AI coding assistant skills, agents, and rules."
        title="Marketplace"
      />
      <MarketplaceTable />
    </main>
  );
}
