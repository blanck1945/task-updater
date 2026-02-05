"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { PersonaPageClient } from "./PersonaPageClient";
import type { TareaConInteresados } from "@/types/db";

type PersonaSafe = {
  id: string;
  slug: string;
  nombre: string;
  created_at: string;
  updated_at: string;
};

export default function PersonaPageLoader({ slug }: { slug: string }) {
  const [persona, setPersona] = useState<PersonaSafe | null>(null);
  const [tareas, setTareas] = useState<TareaConInteresados[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    (async () => {
      try {
        const { data: p, error: errP } = await supabase
          .from("personas")
          .select("id, slug, nombre, created_at, updated_at")
          .eq("slug", slug)
          .single();
        if (cancelled) return;
        if (errP || !p) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setPersona(p as PersonaSafe);
        const { data: tareasData, error: errT } = await supabase
          .from("tareas")
          .select("*")
          .eq("persona_id", p.id)
          .order("orden", { ascending: true });
        if (cancelled) return;
        if (errT || !tareasData?.length) {
          setTareas([]);
          setLoading(false);
          return;
        }
        const tareaIds = tareasData.map((t) => t.id);
        const [interesadosRes, responsablesRes, timelineRes] = await Promise.all([
          supabase.from("tareas_interesados").select("*").in("tarea_id", tareaIds),
          supabase.from("tareas_responsables").select("*").in("tarea_id", tareaIds),
          supabase.from("tarea_timeline").select("*").in("tarea_id", tareaIds).order("creado_en", { ascending: true }),
        ]);
        if (cancelled) return;
        const byTarea = (arr: { tarea_id: string }[]) =>
          (arr ?? []).reduce<Record<string, typeof arr>>((acc, i) => {
            if (!acc[i.tarea_id]) acc[i.tarea_id] = [];
            acc[i.tarea_id].push(i);
            return acc;
          }, {});
        const byInt = byTarea(interesadosRes.data ?? []);
        const byResp = byTarea(responsablesRes.data ?? []);
        const byTimeline = byTarea(timelineRes.data ?? []);
        const prioridadOrden: Record<string, number> = { alta: 0, media: 1, baja: 2 };
        const merged = tareasData
          .map((t) => ({
            ...t,
            interesados: byInt[t.id] ?? [],
            responsables: byResp[t.id] ?? [],
            timeline: (byTimeline[t.id] ?? []).sort(
              (a, b) =>
                new Date((a as unknown as { creado_en: string }).creado_en).getTime() -
                new Date((b as unknown as { creado_en: string }).creado_en).getTime()
            ),
          }))
          .sort((a, b) => (prioridadOrden[a.prioridad] ?? 1) - (prioridadOrden[b.prioridad] ?? 1));
        setTareas(merged);
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <main className="min-h-screen p-6 flex flex-col items-center justify-center">
        <p className="text-neutral-600 dark:text-neutral-400">Cargando…</p>
      </main>
    );
  }
  if (notFound || !persona) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6">
        <h1 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
          Página no encontrada
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
          No existe una página de estado con ese slug.
        </p>
        <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
          Volver al inicio
        </Link>
      </main>
    );
  }
  return <PersonaPageClient persona={persona} tareas={tareas} slug={slug} />;
}
