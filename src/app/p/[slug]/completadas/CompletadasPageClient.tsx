"use client";

import { useMemo } from "react";
import Link from "next/link";
import { PRIORIDAD_LABELS } from "@/lib/labels";
import type { Persona as PersonaType } from "@/types/db";
import type { TareaConInteresados } from "@/types/db";
import type { PrioridadTarea } from "@/types/db";

type Persona = Omit<PersonaType, "edit_key">;

function PrioridadBadge({ prioridad }: { prioridad: PrioridadTarea }) {
  const styles = {
    alta: "bg-[var(--priority-high-bg)] text-[var(--priority-high)] border-[var(--priority-high)]",
    media: "bg-[var(--priority-medium-bg)] text-[var(--priority-medium)] border-[var(--priority-medium)]",
    baja: "bg-[var(--priority-low-bg)] text-[var(--priority-low)] border-[var(--priority-low)]",
  };
  const icons = {
    alta: (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
      </svg>
    ),
    media: (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <circle cx="10" cy="10" r="3" />
      </svg>
    ),
    baja: (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    ),
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border ${styles[prioridad]}`}>
      {icons[prioridad]}
      {PRIORIDAD_LABELS[prioridad]}
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
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="w-full border-b border-[var(--border)] glass sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-semibold text-xl tracking-tight">
            TaskFlow
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href={`/p/${encodeURIComponent(slug)}`}
              className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              Tareas pendientes
            </Link>
            <Link
              href="/"
              className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              Inicio
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-6 py-10">
        <div className="space-y-10">
          {/* Profile Header */}
          <section className="animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[var(--priority-low)] flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{persona.nombre}</h1>
                  <p className="text-[var(--muted-foreground)] text-sm">/p/{slug} - Tareas completadas</p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-3">
                <div className="px-5 py-3 rounded-xl bg-[var(--priority-low-bg)] text-center">
                  <p className="text-3xl font-bold text-[var(--priority-low)]">{tareasOrdenadas.length}</p>
                  <p className="text-xs text-[var(--priority-low)]">Completadas</p>
                </div>
              </div>
            </div>
          </section>

          {/* Completed Tasks */}
          <section className="space-y-6">
            <h2 className="text-xl font-bold">Tareas completadas</h2>

            {tareasOrdenadas.length === 0 ? (
              <div className="py-20 text-center animate-fade-in">
                <div className="w-20 h-20 rounded-2xl bg-[var(--muted)] mx-auto flex items-center justify-center mb-6">
                  <svg className="w-10 h-10 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">No hay tareas completadas</h3>
                <p className="text-[var(--muted-foreground)] mb-6">
                  Las tareas marcadas como completadas apareceran aqui
                </p>
                <Link
                  href={`/p/${encodeURIComponent(slug)}`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-medium hover:opacity-90 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Ver tareas pendientes
                </Link>
              </div>
            ) : (
              <ul className="space-y-4">
                {tareasOrdenadas.map((tarea, index) => {
                  const borderColors = {
                    alta: "border-l-[var(--priority-high)]",
                    media: "border-l-[var(--priority-medium)]",
                    baja: "border-l-[var(--priority-low)]",
                  };

                  return (
                    <li
                      key={tarea.id}
                      className={`rounded-2xl border border-[var(--border)] border-l-4 ${borderColors[tarea.prioridad]} shadow-sm bg-[var(--card)] overflow-hidden transition-all duration-200 animate-fade-in opacity-80 hover:opacity-100`}
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="p-5 md:p-6">
                        <div className="space-y-4">
                          {/* Header */}
                          <div className="flex flex-wrap items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-[var(--priority-low)] flex items-center justify-center flex-shrink-0">
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                                <h3 className="text-lg font-semibold line-through text-[var(--muted-foreground)]">{tarea.titulo}</h3>
                              </div>
                              {tarea.created_at && (
                                <p className="text-xs text-[var(--muted-foreground)] mt-1 ml-9">
                                  Creada el{" "}
                                  {new Date(tarea.created_at).toLocaleDateString("es", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </p>
                              )}
                              {(tarea as { completada_at?: string | null }).completada_at && (
                                <p className="text-xs text-[var(--priority-low)] mt-1 ml-9">
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
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <PrioridadBadge prioridad={tarea.prioridad} />
                              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-[var(--priority-low-bg)] text-[var(--priority-low)]">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Completada
                              </span>
                            </div>
                          </div>

                          {/* Description */}
                          {tarea.descripcion && (
                            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed ml-9">
                              {tarea.descripcion}
                            </p>
                          )}

                          {/* Timeline */}
                          {(tarea.timeline?.length ?? 0) > 0 && (
                            <div className="pt-3 border-t border-[var(--border)] ml-9">
                              <p className="text-xs font-medium text-[var(--muted-foreground)] mb-2">Timeline</p>
                              <ul className="space-y-2">
                                {tarea.timeline!.map((e) => {
                                  const esUltimo = e.id === tarea.timeline![tarea.timeline!.length - 1]?.id;
                                  const fecha = e.creado_en
                                    ? new Date(e.creado_en).toLocaleString("es", {
                                        day: "numeric",
                                        month: "short",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : "";

                                  return (
                                    <li key={e.id} className="flex items-start gap-3 text-sm">
                                      <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${esUltimo ? "bg-[var(--priority-low)]" : "bg-[var(--muted-foreground)]"}`}></span>
                                      <div className="flex-1 min-w-0">
                                        <span className={esUltimo ? "font-medium" : "text-[var(--muted-foreground)]"}>{e.contenido}</span>
                                        {fecha && (
                                          <span className="ml-2 text-xs text-[var(--muted-foreground)]">{fecha}</span>
                                        )}
                                        {esUltimo && <span className="ml-2 text-xs text-[var(--priority-low)]">(final)</span>}
                                      </div>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          )}

                          {/* People */}
                          <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-[var(--border)] ml-9">
                            {/* Interesados */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-[var(--muted-foreground)]">Interesados:</span>
                              <div className="flex flex-wrap gap-1">
                                {tarea.interesados.length === 0 ? (
                                  <span className="text-xs text-[var(--muted-foreground)]">-</span>
                                ) : (
                                  tarea.interesados.map((i) => (
                                    <span
                                      key={i.id}
                                      className="inline-flex items-center px-2 py-0.5 rounded-full bg-[var(--muted)] text-xs"
                                    >
                                      {i.nombre}
                                    </span>
                                  ))
                                )}
                              </div>
                            </div>

                            {/* Responsables */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-[var(--muted-foreground)]">Responsables:</span>
                              <div className="flex flex-wrap gap-1">
                                {(tarea.responsables?.length ?? 0) === 0 ? (
                                  <span className="text-xs text-[var(--muted-foreground)]">-</span>
                                ) : (
                                  (tarea.responsables ?? []).map((r) => (
                                    <span
                                      key={r.id}
                                      className="inline-flex items-center px-2 py-0.5 rounded-full bg-[var(--accent)] bg-opacity-20 text-[var(--accent)] text-xs"
                                    >
                                      {r.nombre}
                                    </span>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
