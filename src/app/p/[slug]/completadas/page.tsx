"use client";

import { useParams } from "next/navigation";
import CompletadasPageLoader from "./CompletadasPageLoader";

export default function CompletadasPage() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? decodeURIComponent(params.slug) : "";
  if (!slug) {
    return (
      <main className="min-h-screen p-6 flex flex-col items-center justify-center">
        <p className="text-neutral-600 dark:text-neutral-400">Slug no encontrado.</p>
      </main>
    );
  }
  return <CompletadasPageLoader slug={slug} />;
}
