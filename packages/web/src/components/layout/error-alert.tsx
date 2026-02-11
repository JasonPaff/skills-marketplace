interface ErrorAlertProps {
  error?: Error;
  message: string;
}

export function ErrorAlert({ error, message }: ErrorAlertProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
      {message}
      {error && <span>: {error.message}</span>}
    </div>
  );
}
