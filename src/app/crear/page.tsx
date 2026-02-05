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
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  async function runTest() {
    setTestResult(null);
    setTestLoading(true);
    try {
      const slug = `test-${Date.now()}`;
      const supabase = createClient();
      const { data, error: err } = await supabase
        .from("personas")
        .insert({ nombre: "Test", slug, edit_key: "test123" })
        .select()
        .single();
      if (err) {
        setTestResult({ ok: false, msg: `${err.message} (code: ${err.code ?? "—"})` });
        return;
      }
      setTestResult({ ok: true, msg: `Registro creado: id=${data?.id}, slug=${data?.slug}. Borralo desde Supabase si quieres.` });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setTestResult({ ok: false, msg });
    } finally {
      setTestLoading(false);
    }
  }

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
      setError("La clave y su confirmación no coinciden.");
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
      setError(err.message ?? "Error al crear la página.");
      return;
    }
    if (data) {
      setSuccess(`Página creada. Redirigiendo a /p/${data.slug}...`);
      setStoredEditKey(data.slug, edit_key);
      setTimeout(() => router.push(`/p/${encodeURIComponent(data.slug)}?edit=1`), 1200);
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  let supabaseHost = "(no configurada)";
  try {
    if (supabaseUrl) supabaseHost = new URL(supabaseUrl).hostname;
  } catch {
    supabaseHost = "(URL inválida)";
  }
  const isPlaceholderUrl = (host: string) => {
    const h = host.toLowerCase();
    return h.includes("your-project") || h.includes("tu-proyecto");
  };
  const hasEnv = typeof window !== "undefined" && supabaseUrl && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return (
    <main className="min-h-screen p-6 flex flex-col items-center">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
          Crear mi página
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Nombre, slug para la URL y clave para editar (guárdala).
        </p>

        {/* Prueba de conexión: solo en desarrollo */}
        {process.env.NODE_ENV === "development" && (
          <section className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 bg-neutral-50 dark:bg-neutral-800/50">
            <h2 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Probar conexión con Supabase
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2 font-mono">
              URL que usa el cliente: {supabaseHost}
            </p>
            {isPlaceholderUrl(supabaseHost) && (
              <p className="text-sm text-amber-600 dark:text-amber-400 mb-2">
                La URL parece de ejemplo. Configurá .env con NEXT_PUBLIC_SUPABASE_URL (tu URL real en Project Settings → API). Borrá la carpeta <code className="bg-neutral-200 dark:bg-neutral-700 px-1 rounded">.next</code>, reiniciá con <code className="bg-neutral-200 dark:bg-neutral-700 px-1 rounded">npm run dev</code> y recargá.
              </p>
            )}
            {typeof window !== "undefined" && !hasEnv && (
              <p className="text-sm text-amber-600 dark:text-amber-400 mb-2">
                En el navegador no se ven NEXT_PUBLIC_SUPABASE_URL ni ANON_KEY. Revisá .env y reiniciá el servidor.
              </p>
            )}
            <button
              type="button"
              onClick={runTest}
              disabled={testLoading}
              className="px-4 py-2 rounded-lg bg-neutral-700 dark:bg-neutral-600 text-white text-sm font-medium hover:bg-neutral-600 dark:hover:bg-neutral-500 disabled:opacity-50"
            >
              {testLoading ? "Probando…" : "Crear registro de prueba"}
            </button>
            {testResult && (
              <div
                className={`mt-3 p-3 rounded text-sm ${testResult.ok ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200" : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"}`}
              >
                {testResult.ok ? "✓ " : "✗ "}
                {testResult.msg}
              </div>
            )}
          </section>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Nombre
            </label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              placeholder="Juan Pérez"
              className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Slug (URL)
            </label>
            <input
              id="slug"
              name="slug"
              type="text"
              placeholder="juan-perez"
              className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
              required
              disabled={loading}
            />
            <p className="text-xs text-neutral-500 mt-1">Tu página: /p/tu-slug</p>
          </div>
          <div>
            <label htmlFor="edit_key" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Clave de edición
            </label>
            <input
              id="edit_key"
              name="edit_key"
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="edit_key_confirm" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Confirmar clave
            </label>
            <input
              id="edit_key_confirm"
              name="edit_key_confirm"
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-sm border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-sm border border-green-200 dark:border-green-800">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-lg bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900 font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creando… (esperá)" : "Crear página"}
          </button>
        </form>

        <p className="text-center">
          <Link href="/" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            Volver al inicio
          </Link>
        </p>
      </div>
    </main>
  );
}
