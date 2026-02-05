"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
          Algo salió mal
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {error.message}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={reset}
            className="px-4 py-2 rounded-lg bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900 font-medium hover:opacity-90"
          >
            Reintentar
          </button>
          <Link
            href="/"
            className="px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
