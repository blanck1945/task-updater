"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { setStoredEditKey } from "@/lib/edit-key-storage";

export default function CrearPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    const form = e.currentTarget;
    const nombre = (form.nombre as HTMLInputElement).value.trim();
    const slugRaw = (form.slug as HTMLInputElement).value.trim().toLowerCase().replace(/\s+/g, "-");
    const edit_key = (form.edit_key as HTMLInputElement).value;
    const edit_key_confirm = (form.edit_key_confirm as HTMLInputElement).value;
    if (!nombre || !slugRaw || !edit_key) {
      setError("Completa nombre, slug y clave.");
      setLoading(false);
      return;
    }
    if (edit_key !== edit_key_confirm) {
      setError("La clave y su confirmacion no coinciden.");
      setLoading(false);
      return;
    }
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("personas")
      .insert({ nombre, slug: slugRaw, edit_key })
      .select()
      .single();
    setLoading(false);
    if (err) {
      setError(err.message ?? "Error al crear la pagina.");
      return;
    }
    if (data) {
      setSuccess(`Pagina creada. Redirigiendo...`);
      setStoredEditKey(data.slug, edit_key);
      setTimeout(() => router.push(`/p/${encodeURIComponent(data.slug)}?edit=1`), 1200);
    }
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
              href="/" 
              className="text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              Inicio
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <section className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--accent)] bg-opacity-10 mb-4">
              <svg className="w-8 h-8 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              Crear mi pagina
            </h1>
            <p className="text-[var(--muted-foreground)]">
              Configura tu espacio personal de estado
            </p>
          </div>

          {/* Form Card */}
          <div className="p-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-xl">
            <form onSubmit={submit} className="space-y-6">
              {/* Nombre */}
              <div className="space-y-2">
                <label htmlFor="nombre" className="block text-sm font-medium">
                  Nombre
                </label>
                <input
                  id="nombre"
                  name="nombre"
                  type="text"
                  placeholder="Juan Perez"
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all"
                  required
                  disabled={loading}
                />
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <label htmlFor="slug" className="block text-sm font-medium">
                  Slug (URL)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] text-sm">
                    /p/
                  </span>
                  <input
                    id="slug"
                    name="slug"
                    type="text"
                    placeholder="juan-perez"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all"
                    required
                    disabled={loading}
                  />
                </div>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Esta sera la URL de tu pagina
                </p>
              </div>

              {/* Clave */}
              <div className="space-y-2">
                <label htmlFor="edit_key" className="block text-sm font-medium">
                  Clave de edicion
                </label>
                <input
                  id="edit_key"
                  name="edit_key"
                  type="password"
                  placeholder="Tu clave secreta"
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all"
                  required
                  disabled={loading}
                />
              </div>

              {/* Confirmar clave */}
              <div className="space-y-2">
                <label htmlFor="edit_key_confirm" className="block text-sm font-medium">
                  Confirmar clave
                </label>
                <input
                  id="edit_key_confirm"
                  name="edit_key_confirm"
                  type="password"
                  placeholder="Repite la clave"
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all"
                  required
                  disabled={loading}
                />
              </div>

              {/* Messages */}
              {error && (
                <div className="p-4 rounded-xl bg-[var(--priority-high-bg)] border border-[var(--priority-high)] text-[var(--priority-high)] text-sm flex items-center gap-3 animate-scale-in">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}
              {success && (
                <div className="p-4 rounded-xl bg-[var(--priority-low-bg)] border border-[var(--priority-low)] text-[var(--priority-low)] text-sm flex items-center gap-3 animate-scale-in">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {success}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creando...
                  </>
                ) : (
                  <>
                    Crear pagina
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Back Link */}
          <p className="text-center">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver al inicio
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
