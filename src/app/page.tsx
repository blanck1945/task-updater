import Link from "next/link";
import { redirect } from "next/navigation";

export default function HomePage() {
  async function goToPage(formData: FormData) {
    "use server";
    const slug = (formData.get("slug") as string)?.trim().toLowerCase().replace(/\s+/g, "-");
    if (slug) redirect(`/p/${encodeURIComponent(slug)}`);
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="w-full border-b border-[var(--border)] glass sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-semibold text-xl tracking-tight">
            TaskFlow
          </Link>
          <nav className="flex items-center gap-6">
            <Link 
              href="/crear" 
              className="text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              Crear pagina
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <div className="max-w-2xl mx-auto text-center space-y-8 animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--muted)] text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse-soft"></span>
            Gestiona tu estado en tiempo real
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-balance leading-tight">
            Tu espacio personal para{" "}
            <span className="text-[var(--accent)]">organizar tareas</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-[var(--muted-foreground)] max-w-lg mx-auto text-pretty">
            Comparte tu estado, organiza prioridades y mantiene a tu equipo informado.
          </p>

          {/* Search Form */}
          <form action={goToPage} className="w-full max-w-md mx-auto space-y-4 pt-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-[var(--accent)] rounded-2xl blur-xl opacity-0 group-focus-within:opacity-20 transition-opacity duration-500"></div>
              <div className="relative flex items-center gap-2 p-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-lg">
                <svg 
                  className="w-5 h-5 ml-3 text-[var(--muted-foreground)]" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  id="slug"
                  name="slug"
                  type="text"
                  placeholder="Buscar pagina (ej: juan-perez)"
                  className="flex-1 px-2 py-3 bg-transparent text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none text-base"
                  required
                />
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-medium hover:opacity-90 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Buscar
                </button>
              </div>
            </div>
          </form>

          {/* Quick Links */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/crear"
              className="group flex items-center gap-2 px-6 py-3 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)] hover:shadow-lg transition-all duration-300"
            >
              <svg 
                className="w-5 h-5 text-[var(--accent)]" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="font-medium">Crear mi pagina</span>
              <svg 
                className="w-4 h-4 text-[var(--muted-foreground)] group-hover:translate-x-1 transition-transform" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full border-t border-[var(--border)] bg-[var(--muted)]">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] hover:border-[var(--accent)] hover:shadow-xl transition-all duration-300 animate-fade-in stagger-1">
              <div className="w-12 h-12 rounded-xl bg-[var(--priority-high-bg)] flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[var(--priority-high)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Prioridades claras</h3>
              <p className="text-[var(--muted-foreground)] text-sm leading-relaxed">
                Organiza tus tareas por prioridad alta, media o baja. Visualiza rapidamente lo mas importante.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] hover:border-[var(--accent)] hover:shadow-xl transition-all duration-300 animate-fade-in stagger-2">
              <div className="w-12 h-12 rounded-xl bg-[var(--priority-medium-bg)] flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[var(--priority-medium)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Timeline de estado</h3>
              <p className="text-[var(--muted-foreground)] text-sm leading-relaxed">
                Mantene un historial de actualizaciones. Tu equipo siempre sabra en que estas trabajando.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] hover:border-[var(--accent)] hover:shadow-xl transition-all duration-300 animate-fade-in stagger-3">
              <div className="w-12 h-12 rounded-xl bg-[var(--priority-low-bg)] flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[var(--priority-low)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Colaboracion</h3>
              <p className="text-[var(--muted-foreground)] text-sm leading-relaxed">
                Asigna responsables e interesados. Todos estan sincronizados y al tanto del progreso.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[var(--muted-foreground)]">
            TaskFlow - Tu estado, siempre actualizado
          </p>
          <div className="flex items-center gap-6">
            <Link href="/crear" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
              Crear pagina
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
