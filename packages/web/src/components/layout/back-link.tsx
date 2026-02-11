import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface BackLinkProps {
  href: string;
  label: string;
}

export function BackLink({ href, label }: BackLinkProps) {
  return (
    <Link
      className="
        mb-6 inline-flex items-center gap-1 text-sm text-gray-500
        hover:text-gray-700
      "
      href={href}
    >
      <ArrowLeft className="size-4" />
      {label}
    </Link>
  );
}
