import Link from "next/link";
import { redirect } from "next/navigation";

export default function HomePage() {
  async function goToPage(formData: FormData) {
    "use server";
    const slug = (formData.get("slug") as string)?.trim().toLowerCase().replace(/\s+/g, "-");
    if (slug) redirect(`/p/${encodeURIComponent(slug)}`);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <h1 className="text-2xl font-semibold text-center text-neutral-800 dark:text-neutral-200">
          Mi estado — Update status
        </h1>
        <p className="text-center text-neutral-600 dark:text-neutral-400 text-sm">
          Ver la página de estado de alguien o crear la tuya.
        </p>

        <form action={goToPage} className="space-y-4">
          <label htmlFor="slug" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Ingresar slug o nombre de página
          </label>
          <input
            id="slug"
            name="slug"
            type="text"
            placeholder="ej. juan-perez"
            className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500"
            required
          />
          <button
            type="submit"
            className="w-full py-2 px-4 rounded-lg bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900 font-medium hover:opacity-90"
          >
            Ver página
          </button>
        </form>

        <p className="text-center">
          <Link
            href="/crear"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Crear mi página
          </Link>
        </p>
      </div>
    </main>
  );
}
