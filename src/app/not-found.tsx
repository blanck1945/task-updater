import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--background)]">
      <div className="max-w-md text-center space-y-6 animate-fade-in">
        <div className="w-20 h-20 rounded-2xl bg-[var(--muted)] mx-auto flex items-center justify-center">
          <svg className="w-10 h-10 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-2">
            Pagina no encontrada
          </h1>
          <p className="text-[var(--muted-foreground)]">
            No existe una pagina con ese slug. Verifica la URL o crea una nueva.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver al inicio
          </Link>
          <Link
            href="/crear"
            className="px-6 py-3 rounded-xl border border-[var(--border)] hover:bg-[var(--muted)] transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Crear pagina
          </Link>
        </div>
      </div>
    </main>
  );
}
