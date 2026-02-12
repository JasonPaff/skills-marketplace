import Link from 'next/link';

interface PageHeaderProps {
  action?: { href: string; label: string };
  description?: string;
  title: string;
}

export function PageHeader({ action, description, title }: PageHeaderProps) {
  return (
    <div className="mb-8 flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-2 text-text-secondary">{description}</p>}
      </div>
      {action && (
        <Link
          className="
            rounded-lg bg-accent px-4 py-2 text-sm font-medium text-text-on-accent
            hover:bg-accent-hover
          "
          href={action.href}
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
