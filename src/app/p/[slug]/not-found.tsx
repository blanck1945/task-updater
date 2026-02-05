import Link from "next/link";

export default function PersonaNotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--background)]">
      <div className="max-w-md text-center space-y-6 animate-fade-in">
        <div className="w-20 h-20 rounded-2xl bg-[var(--muted)] mx-auto flex items-center justify-center">
          <svg className="w-10 h-10 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-2">
            Pagina no encontrada
          </h1>
          <p className="text-[var(--muted-foreground)]">
            No existe una pagina de estado con ese slug. Puede que haya sido eliminada o el enlace sea incorrecto.
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
            Crear mi pagina
          </Link>
        </div>
      </div>
    </main>
  );
}
