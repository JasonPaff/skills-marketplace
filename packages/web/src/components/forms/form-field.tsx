import type { ReactNode } from 'react';

interface FormFieldProps {
  children: ReactNode;
  error?: string;
  hint?: string;
  htmlFor?: string;
  label: string;
  required?: boolean;
}

export function FormField({ children, error, hint, htmlFor, label, required }: FormFieldProps) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor={htmlFor}>
        {label}
        {required && ' *'}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
