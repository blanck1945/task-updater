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
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--background)]">
      <div className="max-w-md text-center space-y-6 animate-fade-in">
        <div className="w-20 h-20 rounded-2xl bg-[var(--priority-high-bg)] mx-auto flex items-center justify-center">
          <svg className="w-10 h-10 text-[var(--priority-high)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-2">
            Algo salio mal
          </h1>
          <p className="text-[var(--muted-foreground)]">
            {error.message || "Ocurrio un error inesperado"}
          </p>
        </div>
        <div className="flex gap-3 justify-center pt-2">
          <button
            type="button"
            onClick={reset}
            className="px-6 py-3 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-medium hover:opacity-90 transition-all"
          >
            Reintentar
          </button>
          <Link
            href="/"
            className="px-6 py-3 rounded-xl border border-[var(--border)] hover:bg-[var(--muted)] transition-all"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
