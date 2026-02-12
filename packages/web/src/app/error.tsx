'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-lg px-4 py-16 text-center">
      <div
        className="
          rounded-lg border border-status-error-border bg-status-error-bg p-6
        "
      >
        <h2 className="mb-2 text-lg font-semibold text-status-error">Something went wrong</h2>
        <p className="mb-4 text-sm text-status-error">{error.message}</p>
        <button
          className="
            rounded-lg bg-status-error px-4 py-2 text-sm font-medium
            text-text-on-accent
            hover:opacity-90
          "
          onClick={reset}
        >
          Try again
        </button>
      </div>
    </main>
  );
}
