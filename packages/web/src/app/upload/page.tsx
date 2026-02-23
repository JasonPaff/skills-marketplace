import { BackLink } from '@/components/layout/back-link';
import { PageHeader } from '@/components/layout/page-header';

import { UploadForm } from './_components/upload-form';

export default function UploadPage() {
  return (
    <main
      className="
        mx-auto max-w-4xl px-4 py-8
        sm:px-6
        lg:px-8
      "
    >
      <BackLink href="/" label="Back to Marketplace" />
      <PageHeader
        description="Upload a skill folder, batch archive, or ZIP file containing skills, agents, and rules."
        title="Upload"
      />
      <UploadForm />
    </main>
  );
}
