import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
        Página no encontrada
      </h1>
      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
        No existe una página con ese slug.
      </p>
      <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
        Volver al inicio
      </Link>
    </main>
  );
}
