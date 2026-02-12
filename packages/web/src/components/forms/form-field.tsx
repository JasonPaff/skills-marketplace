import type { ReactNode } from 'react';

interface AriaProps {
  ariaDescribedBy?: string;
  ariaInvalid?: boolean;
  ariaRequired?: boolean;
}

interface FormFieldProps {
  children: ((props: AriaProps) => ReactNode) | ReactNode;
  error?: string;
  hint?: string;
  htmlFor?: string;
  label: string;
  required?: boolean;
}

export function FormField({ children, error, hint, htmlFor, label, required }: FormFieldProps) {
  const errorId = htmlFor ? `${htmlFor}-error` : undefined;
  const hintId = htmlFor ? `${htmlFor}-hint` : undefined;

  const describedByIds: string[] = [];
  if (error && errorId) describedByIds.push(errorId);
  if (hint && !error && hintId) describedByIds.push(hintId);
  const ariaDescribedBy = describedByIds.length > 0 ? describedByIds.join(' ') : undefined;

  const ariaProps: AriaProps = {
    ariaDescribedBy,
    ariaInvalid: !!error,
    ariaRequired: required,
  };

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor={htmlFor}>
        {label}
        {required && ' *'}
      </label>
      {typeof children === 'function' ? children(ariaProps) : children}
      {hint && !error && (
        <p className="mt-1 text-xs text-gray-400" id={hintId}>
          {hint}
        </p>
      )}
      {error && (
        <p className="mt-1 text-xs text-red-600" id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
