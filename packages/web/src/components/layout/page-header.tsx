import Link from 'next/link';

interface PageHeaderProps {
  action?: { href: string; label: string; };
  description?: string;
  title: string;
}

export function PageHeader({ action, description, title }: PageHeaderProps) {
  return (
    <div className="mb-8 flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-2 text-gray-600">{description}</p>}
      </div>
      {action && (
        <Link
          className="
            rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white
            hover:bg-blue-700
          "
          href={action.href}
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
