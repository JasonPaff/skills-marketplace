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
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <h2 className="mb-2 text-lg font-semibold text-red-800">Something went wrong</h2>
        <p className="mb-4 text-sm text-red-700">{error.message}</p>
        <button
          className="
            rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white
            hover:bg-red-700
          "
          onClick={reset}
        >
          Try again
        </button>
      </div>
    </main>
  );
}
