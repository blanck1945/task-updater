"use client";

import { useMemo } from "react";
import Link from "next/link";
import { PRIORIDAD_LABELS } from "@/lib/labels";
import type { Persona as PersonaType } from "@/types/db";
import type { TareaConInteresados } from "@/types/db";
import type { PrioridadTarea } from "@/types/db";

type Persona = Omit<PersonaType, "edit_key">;

function PrioridadBadge({ prioridad }: { prioridad: PrioridadTarea }) {
  const colors =
    prioridad === "alta"
      ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      : prioridad === "media"
        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
        : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${colors}`}
      title={PRIORIDAD_LABELS[prioridad]}
    >
      {prioridad === "alta" && "▲"}
      {prioridad === "media" && "◆"}
      {prioridad === "baja" && "▽"}
      <span className="ml-1">{PRIORIDAD_LABELS[prioridad]}</span>
    </span>
  );
}

export function CompletadasPageClient({
  persona,
  tareas,
  slug,
}: {
  persona: Persona;
  tareas: TareaConInteresados[];
  slug: string;
}) {
  const prioridadOrden: Record<string, number> = useMemo(
    () => ({ alta: 0, media: 1, baja: 2 }),
    []
  );
  const tareasOrdenadas = useMemo(
    () =>
      [...tareas].sort(
        (a, b) =>
          (prioridadOrden[a.prioridad] ?? 1) - (prioridadOrden[b.prioridad] ?? 1) ||
          (a.orden ?? 0) - (b.orden ?? 0)
      ),
    [tareas, prioridadOrden]
  );

  return (
    <main className="min-h-screen max-w-5xl mx-auto px-6 py-10 md:px-10 md:py-12 lg:px-14">
      <div className="space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-2 pb-6 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-neutral-800 dark:text-neutral-200">
              {persona.nombre}
            </h1>
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              /p/{slug} · Tareas completas
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/p/${encodeURIComponent(slug)}`}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Tareas pendientes
            </Link>
            <Link href="/" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              Inicio
            </Link>
          </div>
        </header>

        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Tareas marcadas como completadas. No son editables.
        </p>

        <section>
          <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200 mb-5">
            Tareas completadas
          </h2>
          {tareasOrdenadas.length === 0 ? (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              No hay tareas completadas. Marcá tareas como completadas desde la página principal.
            </p>
          ) : (
            <ul className="space-y-6">
              {tareasOrdenadas.map((tarea) => {
                const borderL =
                  tarea.prioridad === "alta"
                    ? "border-l-4 border-l-red-500"
                    : tarea.prioridad === "media"
                      ? "border-l-4 border-l-amber-500"
                      : "border-l-4 border-l-emerald-500";
                return (
                  <li
                    key={tarea.id}
                    className={`rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm p-5 md:p-6 bg-white dark:bg-neutral-900/50 ${borderL}`}
                  >
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                        {tarea.titulo}
                      </span>
                      <PrioridadBadge prioridad={tarea.prioridad} />
                      <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200">
                        {tarea.estado || "—"}
                      </span>
                    </div>
                    {tarea.created_at && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
                        Creada el{" "}
                        {new Date(tarea.created_at).toLocaleString("es", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                    {(tarea as { completada_at?: string | null }).completada_at && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-3">
                        Completada el{" "}
                        {new Date(
                          (tarea as { completada_at: string }).completada_at
                        ).toLocaleDateString("es", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                    {tarea.descripcion && (
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                        {tarea.descripcion}
                      </p>
                    )}
                    <div className="space-y-3">
                      {(tarea.timeline?.length ?? 0) > 0 && (
                        <ul className="list-disc list-inside text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
                          {tarea.timeline!.map((e) => {
                            const fecha = e.creado_en
                              ? new Date(e.creado_en).toLocaleString("es", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "";
                            return (
                              <li key={e.id}>
                                <span>{e.contenido}</span>
                                {fecha && (
                                  <span className="ml-1.5 text-xs text-neutral-500">
                                    — {fecha}
                                  </span>
                                )}
                                {e.id === tarea.timeline![tarea.timeline!.length - 1]?.id && (
                                  <span className="ml-1 text-xs text-neutral-500">(actual)</span>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-neutral-500 dark:text-neutral-400">
                          Interesados:
                        </span>
                        {tarea.interesados.length === 0 ? (
                          <span className="text-sm text-neutral-400">—</span>
                        ) : (
                          tarea.interesados.map((i) => (
                            <span
                              key={i.id}
                              className="inline-flex items-center rounded bg-neutral-100 dark:bg-neutral-700 px-2 py-0.5 text-sm"
                            >
                              {i.nombre}
                            </span>
                          ))
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-neutral-500 dark:text-neutral-400">
                          Responsables:
                        </span>
                        {(tarea.responsables?.length ?? 0) === 0 ? (
                          <span className="text-sm text-neutral-400">—</span>
                        ) : (
                          (tarea.responsables ?? []).map((r) => (
                            <span
                              key={r.id}
                              className="inline-flex items-center rounded bg-neutral-100 dark:bg-neutral-700 px-2 py-0.5 text-sm"
                            >
                              {r.nombre}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
