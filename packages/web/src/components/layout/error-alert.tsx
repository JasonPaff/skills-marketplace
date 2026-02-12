interface ErrorAlertProps {
  error?: Error;
  message: string;
}

export function ErrorAlert({ error, message }: ErrorAlertProps) {
  return (
    <div
      className="
      rounded-lg border border-status-error-border bg-status-error-bg p-4
      text-status-error
    "
    >
      {message}
      {error && <span>: {error.message}</span>}
    </div>
  );
}
