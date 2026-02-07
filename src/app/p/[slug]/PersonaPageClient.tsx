"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  verifyEditKeyClient,
  updatePersonaClient,
  createTareaClient,
  updateTareaClient,
  deleteTareaClient,
  addInteresadoClient,
  removeInteresadoClient,
  addTimelineEntryClient,
  updateTimelineEntryClient,
  addResponsableClient,
  removeResponsableClient,
  reorderTareasClient,
  markTareaCompletadaClient,
} from "@/lib/supabase-rpc";
import { getEditKeyForSlug, setStoredEditKey, clearEditKey } from "@/lib/edit-key-storage";
import { PRIORIDAD_LABELS } from "@/lib/labels";
import type { Persona as PersonaType } from "@/types/db";
import type { TareaConInteresados, TareaTimelineEntry, TareaResponsable } from "@/types/db";
import type { PrioridadTarea } from "@/types/db";

type Persona = Omit<PersonaType, "edit_key">;

const PRIORIDADES: PrioridadTarea[] = ["alta", "media", "baja"];

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

function EstadoActual({ estado }: { estado: string }) {
  return (
    <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200">
      {estado || "—"}
    </span>
  );
}

export function PersonaPageClient({
  persona,
  tareas: initialTareas,
  slug,
}: {
  persona: Persona;
  tareas: TareaConInteresados[];
  slug: string;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editKeyVerified, setEditKeyVerified] = useState<boolean | null>(null);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [keyError, setKeyError] = useState<string | null>(null);
  const [tareas, setTareas] = useState(initialTareas);
  const [nombre, setNombre] = useState(persona.nombre);
  const [newTareaOpen, setNewTareaOpen] = useState(false);
  const [editingTareaId, setEditingTareaId] = useState<string | null>(null);
  const [newInteresadoTareaId, setNewInteresadoTareaId] = useState<string | null>(null);
  const [newResponsableTareaId, setNewResponsableTareaId] = useState<string | null>(null);
  const [newTimelineTareaId, setNewTimelineTareaId] = useState<string | null>(null);
  const [editingTimelineEntryId, setEditingTimelineEntryId] = useState<string | null>(null);
  const [newTareaInteresados, setNewTareaInteresados] = useState<string[]>([]);
  const [newTareaResponsables, setNewTareaResponsables] = useState<string[]>([]);
  const [draggedTareaId, setDraggedTareaId] = useState<string | null>(null);
  const [draggedTareaPrioridad, setDraggedTareaPrioridad] = useState<PrioridadTarea | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  const prioridadOrden: Record<string, number> = useMemo(() => ({ alta: 0, media: 1, baja: 2 }), []);
  const tareasOrdenadas = useMemo(
    () =>
      [...tareas].sort(
        (a, b) =>
          (prioridadOrden[a.prioridad] ?? 1) - (prioridadOrden[b.prioridad] ?? 1) ||
          (a.orden ?? 0) - (b.orden ?? 0)
      ),
    [tareas, prioridadOrden]
  );

  useEffect(() => {
    const storedKey = getEditKeyForSlug(slug);
    if (!storedKey) {
      setEditKeyVerified(false);
      return;
    }
    verifyEditKeyClient(slug, storedKey).then((valid) => {
      setEditKeyVerified(valid);
      if (valid && searchParams.get("edit") === "1") setIsEditing(true);
    });
  }, [slug, searchParams]);

  async function handleSubmitKey(e: React.FormEvent) {
    e.preventDefault();
    setKeyError(null);
    const valid = await verifyEditKeyClient(slug, keyInput);
    if (!valid) {
      setKeyError("Clave incorrecta.");
      return;
    }
    setStoredEditKey(slug, keyInput);
    setShowKeyModal(false);
    setKeyInput("");
    setIsEditing(true);
  }

  function handleLeaveEdit() {
    clearEditKey(slug);
    setIsEditing(false);
    setEditKeyVerified(false);
  }

  async function handleSaveNombre() {
    const key = getEditKeyForSlug(slug);
    if (!key) return;
    await updatePersonaClient(slug, key, nombre);
  }

  async function handleCreateTarea(
    formData: FormData,
    interesados: string[],
    responsables: string[]
  ) {
    const key = getEditKeyForSlug(slug);
    if (!key) return;
    const titulo = (formData.get("titulo") as string)?.trim();
    const descripcion = (formData.get("descripcion") as string)?.trim() || undefined;
    const estado = (formData.get("estado") as string)?.trim() || "Por hacer";
    const prioridad = (formData.get("prioridad") as PrioridadTarea) || "media";
    const { data, error } = await createTareaClient(slug, key, {
      titulo,
      descripcion,
      estado,
      prioridad,
    });
    if (error) return;
    if (data) {
      const creada = { ...data, interesados: [] as TareaConInteresados["interesados"], responsables: [] as TareaConInteresados["responsables"] };
      for (const nombre of interesados.filter((n) => n.trim())) {
        const { data: i } = await addInteresadoClient(slug, key, data.id, nombre.trim());
        if (i) creada.interesados.push(i);
      }
      for (const nombre of responsables.filter((n) => n.trim())) {
        const { data: r } = await addResponsableClient(slug, key, data.id, nombre.trim());
        if (r) creada.responsables!.push(r);
      }
      setTareas((prev) => [...prev, creada]);
      setNewTareaOpen(false);
      setNewTareaInteresados([]);
      setNewTareaResponsables([]);
    }
  }

  async function handleUpdateTarea(
    tareaId: string,
    updates: Partial<{ titulo: string; descripcion: string; estado: string; prioridad: PrioridadTarea }>
  ) {
    const key = getEditKeyForSlug(slug);
    if (!key) return;
    const { data, error } = await updateTareaClient(slug, key, tareaId, updates);
    if (error) return;
    if (data) {
      setTareas((prev) =>
        prev.map((t) => (t.id === tareaId ? { ...t, ...data, interesados: t.interesados } : t))
      );
      setEditingTareaId(null);
    }
  }

  async function handleDeleteTarea(tareaId: string) {
    const key = getEditKeyForSlug(slug);
    if (!key) return;
    await deleteTareaClient(slug, key, tareaId);
    setTareas((prev) => prev.filter((t) => t.id !== tareaId));
    setEditingTareaId(null);
  }

  async function handleAddInteresado(tareaId: string, nombre: string) {
    const key = getEditKeyForSlug(slug);
    if (!key || !nombre.trim()) return;
    const { data, error } = await addInteresadoClient(slug, key, tareaId, nombre);
    if (error) return;
    if (data) {
      setTareas((prev) =>
        prev.map((t) =>
          t.id === tareaId ? { ...t, interesados: [...t.interesados, data] } : t
        )
      );
      setNewInteresadoTareaId(null);
    }
  }

  async function handleRemoveInteresado(interesadoId: string) {
    const key = getEditKeyForSlug(slug);
    if (!key) return;
    await removeInteresadoClient(slug, key, interesadoId);
    setTareas((prev) =>
      prev.map((t) => ({
        ...t,
        interesados: t.interesados.filter((i) => i.id !== interesadoId),
      }))
    );
  }

  async function handleAddTimelineEntry(tareaId: string, contenido: string) {
    const key = getEditKeyForSlug(slug);
    if (!key || !contenido.trim()) return;
    const { data, error } = await addTimelineEntryClient(slug, key, tareaId, contenido);
    if (error) return;
    if (data) {
      setTareas((prev) =>
        prev.map((t) =>
          t.id === tareaId
            ? {
                ...t,
                estado: contenido.trim(),
                timeline: [...(t.timeline ?? []), data as TareaTimelineEntry],
              }
            : t
        )
      );
      setNewTimelineTareaId(null);
    }
  }

  async function handleMarkCompletada(tareaId: string) {
    const key = getEditKeyForSlug(slug);
    if (!key) return;
    const { error } = await markTareaCompletadaClient(slug, key, tareaId);
    if (error) return;
    setTareas((prev) => prev.filter((t) => t.id !== tareaId));
    setEditingTareaId(null);
    router.push(`/p/${encodeURIComponent(slug)}/completadas`);
  }

  async function handleReorder(newOrderIds: string[]) {
    const key = getEditKeyForSlug(slug);
    if (!key || newOrderIds.length === 0) return;
    const { error } = await reorderTareasClient(slug, key, newOrderIds);
    if (error) return;
    setTareas((prev) => {
      const byId = new Map(prev.map((t) => [t.id, t]));
      return newOrderIds
        .map((id, orden) => {
          const t = byId.get(id);
          return t ? { ...t, orden } : null;
        })
        .filter((t): t is TareaConInteresados => t != null);
    });
    setDraggedTareaId(null);
    setDraggedTareaPrioridad(null);
    setDropTargetIndex(null);
  }

  async function handleUpdateTimelineEntry(tareaId: string, timelineEntryId: string, contenido: string) {
    const key = getEditKeyForSlug(slug);
    if (!key || !contenido.trim()) return;
    const { data, error } = await updateTimelineEntryClient(slug, key, timelineEntryId, contenido);
    if (error) return;
    if (data) {
      setTareas((prev) =>
        prev.map((t) => {
          if (t.id !== tareaId) return t;
          const timeline = (t.timeline ?? []).map((e) =>
            e.id === timelineEntryId ? { ...e, contenido: contenido.trim() } : e
          );
          const lastId = timeline[timeline.length - 1]?.id;
          return {
            ...t,
            timeline,
            estado: lastId === timelineEntryId ? contenido.trim() : t.estado,
          };
        })
      );
      setEditingTimelineEntryId(null);
    }
  }

  async function handleAddResponsable(tareaId: string, nombre: string) {
    const key = getEditKeyForSlug(slug);
    if (!key || !nombre.trim()) return;
    const { data, error } = await addResponsableClient(slug, key, tareaId, nombre);
    if (error) return;
    if (data) {
      setTareas((prev) =>
        prev.map((t) =>
          t.id === tareaId
            ? { ...t, responsables: [...(t.responsables ?? []), data as TareaResponsable] }
            : t
        )
      );
      setNewResponsableTareaId(null);
    }
  }

  async function handleRemoveResponsable(responsableId: string) {
    const key = getEditKeyForSlug(slug);
    if (!key) return;
    await removeResponsableClient(slug, key, responsableId);
    setTareas((prev) =>
      prev.map((t) => ({
        ...t,
        responsables: (t.responsables ?? []).filter((r) => r.id !== responsableId),
      }))
    );
  }

  return (
    <main className="min-h-screen max-w-5xl mx-auto px-6 py-10 md:px-10 md:py-12 lg:px-14">
      <div className="space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-2 pb-6 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-3">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="text-2xl font-semibold bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-600"
                />
                <button
                  type="button"
                  onClick={() => handleSaveNombre()}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Guardar
                </button>
              </div>
            ) : (
              <h1 className="text-2xl font-semibold text-neutral-800 dark:text-neutral-200">
                {persona.nombre}
              </h1>
            )}
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              /p/{slug}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                type="button"
                onClick={() => {
                  if (editKeyVerified === true) {
                    setIsEditing(true);
                  } else {
                    setShowKeyModal(true);
                  }
                }}
                className="text-sm px-3 py-1.5 rounded border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Editar esta página
              </button>
            )}
            {isEditing && (
              <button
                type="button"
                onClick={handleLeaveEdit}
                className="text-sm px-3 py-1.5 rounded border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Dejar de editar
              </button>
            )}
            <Link href={`/p/${encodeURIComponent(slug)}/completadas`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              Tareas completas
            </Link>
            <Link href="/" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              Inicio
            </Link>
          </div>
        </header>

        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Estado a la pasada: en qué estoy, qué tareas tengo, con quién está relacionado.
        </p>
        {!isEditing && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Para editar una tarea o marcarla como completada, hacé clic en «Editar esta página» e ingresá tu clave.
          </p>
        )}

        <section>
          <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200 mb-5">
            Tareas
          </h2>
          <ul className="space-y-6">
            {tareasOrdenadas.map((tarea, index) => {
              const borderL =
                tarea.prioridad === "alta"
                  ? "border-l-4 border-l-red-500"
                  : tarea.prioridad === "media"
                    ? "border-l-4 border-l-amber-500"
                    : "border-l-4 border-l-emerald-500";
              const isDragging = draggedTareaId === tarea.id;
              const isDropTarget = dropTargetIndex === index && draggedTareaId && tarea.prioridad === draggedTareaPrioridad;
              return (
              <li
                key={tarea.id}
                draggable={isEditing}
                onDragStart={(e) => {
                  setDraggedTareaId(tarea.id);
                  setDraggedTareaPrioridad(tarea.prioridad);
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", tarea.id);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!draggedTareaId || tarea.id === draggedTareaId) return;
                  if (tarea.prioridad !== draggedTareaPrioridad) return;
                  setDropTargetIndex(index);
                }}
                onDragLeave={() => setDropTargetIndex(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDropTargetIndex(null);
                  if (!draggedTareaId || !draggedTareaPrioridad || tarea.prioridad !== draggedTareaPrioridad) {
                    setDraggedTareaId(null);
                    setDraggedTareaPrioridad(null);
                    return;
                  }
                  const list = [...tareasOrdenadas];
                  const dragIndex = list.findIndex((t) => t.id === draggedTareaId);
                  if (dragIndex === -1) return;
                  const [removed] = list.splice(dragIndex, 1);
                  let insertIndex = index;
                  if (dragIndex < insertIndex) insertIndex -= 1;
                  list.splice(insertIndex, 0, removed);
                  handleReorder(list.map((t) => t.id));
                  setDraggedTareaId(null);
                  setDraggedTareaPrioridad(null);
                }}
                onDragEnd={() => {
                  setDraggedTareaId(null);
                  setDraggedTareaPrioridad(null);
                  setDropTargetIndex(null);
                }}
                className={`rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm p-5 md:p-6 bg-white dark:bg-neutral-900/50 focus-within:shadow ${borderL} ${isEditing ? "cursor-grab active:cursor-grabbing" : ""} ${isDragging ? "opacity-50" : ""} ${isDropTarget ? "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-neutral-900" : ""}`}
              >
                {editingTareaId === tarea.id && isEditing ? (
                  <TareaEditForm
                    tarea={tarea}
                    onSave={(updates) => handleUpdateTarea(tarea.id, updates)}
                    onCancel={() => setEditingTareaId(null)}
                    onDelete={() => handleDeleteTarea(tarea.id)}
                  />
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                        {tarea.titulo}
                      </span>
                      <PrioridadBadge prioridad={tarea.prioridad} />
                      <EstadoActual estado={tarea.estado} />
                      {isEditing && (
                        <>
                          <button
                            type="button"
                            onClick={() => setEditingTareaId(tarea.id)}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMarkCompletada(tarea.id)}
                            className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
                          >
                            Marcar como completada
                          </button>
                        </>
                      )}
                    </div>
                    {tarea.created_at && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
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
                    {tarea.descripcion && (
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                        {tarea.descripcion}
                      </p>
                    )}
                    <div className="space-y-3">
                    {(tarea.timeline?.length ?? 0) > 0 && (
                      <ul className="list-disc list-inside text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
                        {tarea.timeline!.map((e) => {
                          const esUltimo = e.id === tarea.timeline![tarea.timeline!.length - 1]?.id;
                          const editandoEste = editingTimelineEntryId === e.id;
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
                              {esUltimo && isEditing && editandoEste ? (
                                <form
                                  className="inline-flex flex-wrap items-center gap-2"
                                  onSubmit={(ev) => {
                                    ev.preventDefault();
                                    const input = ev.currentTarget.querySelector("input") as HTMLInputElement;
                                    handleUpdateTimelineEntry(tarea.id, e.id, input?.value ?? "");
                                  }}
                                >
                                  <input
                                    type="text"
                                    defaultValue={e.contenido}
                                    className="px-2 py-1 text-sm rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 min-w-[160px]"
                                    autoFocus
                                  />
                                  <button type="submit" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                                    Guardar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingTimelineEntryId(null)}
                                    className="text-xs text-neutral-500 hover:underline"
                                  >
                                    Cancelar
                                  </button>
                                </form>
                              ) : (
                                <>
                                  <span>{e.contenido}</span>
                                  {fecha && (
                                    <span className="ml-1.5 text-xs text-neutral-500">
                                      — {fecha}
                                    </span>
                                  )}
                                  {esUltimo && (
                                    <span className="ml-1 text-xs text-neutral-500">(actual)</span>
                                  )}
                                  {esUltimo && isEditing && !editandoEste && (
                                    <button
                                      type="button"
                                      onClick={() => setEditingTimelineEntryId(e.id)}
                                      className="ml-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                      Editar
                                    </button>
                                  )}
                                </>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    {isEditing && (
                      newTimelineTareaId === tarea.id ? (
                        <form
                          className="flex gap-2 mb-2"
                          onSubmit={(e) => {
                            e.preventDefault();
                            const input = e.currentTarget.querySelector("input") as HTMLInputElement;
                            handleAddTimelineEntry(tarea.id, input?.value ?? "");
                            input.value = "";
                          }}
                        >
                          <input
                            type="text"
                            placeholder="Nuevo status (ej. En revisión)"
                            className="flex-1 px-2 py-1 text-sm rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800"
                            autoFocus
                          />
                          <button type="submit" className="text-xs text-blue-600 hover:underline">
                            Añadir
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewTimelineTareaId(null)}
                            className="text-xs text-neutral-500 hover:underline"
                          >
                            Cancelar
                          </button>
                        </form>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setNewTimelineTareaId(tarea.id)}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          + Añadir status al timeline
                        </button>
                      )
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm text-neutral-500 dark:text-neutral-400">Interesados:</span>
                      {tarea.interesados.length === 0 ? (
                        <span className="text-sm text-neutral-400">—</span>
                      ) : (
                        tarea.interesados.map((i) => (
                          <span
                            key={i.id}
                            className="inline-flex items-center gap-1 rounded bg-neutral-100 dark:bg-neutral-700 px-2 py-0.5 text-sm"
                          >
                            {i.nombre}
                            {isEditing && (
                              <button
                                type="button"
                                onClick={() => handleRemoveInteresado(i.id)}
                                className="text-red-500 hover:text-red-700"
                                aria-label="Quitar"
                              >
                                ×
                              </button>
                            )}
                          </span>
                        ))
                      )}
                      {isEditing && (
                        newInteresadoTareaId === tarea.id ? (
                          <form
                            className="inline-flex gap-1"
                            onSubmit={(e) => {
                              e.preventDefault();
                              const input = e.currentTarget.querySelector("input") as HTMLInputElement;
                              handleAddInteresado(tarea.id, input?.value ?? "");
                              input.value = "";
                            }}
                          >
                            <input
                              type="text"
                              placeholder="Nombre"
                              className="w-24 px-2 py-0.5 text-sm rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800"
                              autoFocus
                            />
                            <button type="submit" className="text-xs text-blue-600 hover:underline">
                              Añadir
                            </button>
                            <button
                              type="button"
                              onClick={() => setNewInteresadoTareaId(null)}
                              className="text-xs text-neutral-500 hover:underline"
                            >
                              Cancelar
                            </button>
                          </form>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setNewInteresadoTareaId(tarea.id)}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            + Interesado
                          </button>
                        )
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm text-neutral-500 dark:text-neutral-400">Responsables:</span>
                      {(tarea.responsables?.length ?? 0) === 0 ? (
                        <span className="text-sm text-neutral-400">—</span>
                      ) : (
                        (tarea.responsables ?? []).map((r) => (
                          <span
                            key={r.id}
                            className="inline-flex items-center gap-1 rounded bg-neutral-100 dark:bg-neutral-700 px-2 py-0.5 text-sm"
                          >
                            {r.nombre}
                            {isEditing && (
                              <button
                                type="button"
                                onClick={() => handleRemoveResponsable(r.id)}
                                className="text-red-500 hover:text-red-700"
                                aria-label="Quitar"
                              >
                                ×
                              </button>
                            )}
                          </span>
                        ))
                      )}
                      {isEditing && (
                        newResponsableTareaId === tarea.id ? (
                          <form
                            className="inline-flex gap-1"
                            onSubmit={(e) => {
                              e.preventDefault();
                              const input = e.currentTarget.querySelector("input") as HTMLInputElement;
                              handleAddResponsable(tarea.id, input?.value ?? "");
                              input.value = "";
                            }}
                          >
                            <input
                              type="text"
                              placeholder="Nombre"
                              className="w-24 px-2 py-0.5 text-sm rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800"
                              autoFocus
                            />
                            <button type="submit" className="text-xs text-blue-600 hover:underline">
                              Añadir
                            </button>
                            <button
                              type="button"
                              onClick={() => setNewResponsableTareaId(null)}
                              className="text-xs text-neutral-500 hover:underline"
                            >
                              Cancelar
                            </button>
                          </form>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setNewResponsableTareaId(tarea.id)}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            + Responsable
                          </button>
                        )
                      )}
                    </div>
                    {isEditing && (
                      <div className="pt-3 mt-3 border-t border-neutral-200 dark:border-neutral-700">
                        <button
                          type="button"
                          onClick={() => handleMarkCompletada(tarea.id)}
                          className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600"
                        >
                          Completar tarea
                        </button>
                      </div>
                    )}
                    </div>
                  </>
                )}
              </li>
            );
            })}
          </ul>

          {isEditing && (
            <>
              {newTareaOpen ? (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await handleCreateTarea(
                      new FormData(e.currentTarget),
                      newTareaInteresados,
                      newTareaResponsables
                    );
                  }}
                  className="mt-6 p-5 md:p-6 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900/50 shadow-sm space-y-4"
                >
                  <input
                    name="titulo"
                    placeholder="Título"
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800"
                  />
                  <textarea
                    name="descripcion"
                    placeholder="Descripción (opcional)"
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800"
                  />
                  <div className="flex gap-2 flex-wrap">
                    <input
                      name="estado"
                      type="text"
                      placeholder="Estado (ej. Por hacer, En curso)"
                      defaultValue="Por hacer"
                      className="px-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 min-w-[140px]"
                    />
                    <select
                      name="prioridad"
                      defaultValue="media"
                      className="px-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800"
                    >
                      {PRIORIDADES.map((p) => (
                        <option key={p} value={p}>
                          {PRIORIDAD_LABELS[p]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">Interesados</span>
                    <div className="flex flex-wrap items-center gap-2">
                      {newTareaInteresados.map((nombre, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 rounded bg-neutral-100 dark:bg-neutral-700 px-2 py-0.5 text-sm"
                        >
                          {nombre}
                          <button
                            type="button"
                            onClick={() =>
                              setNewTareaInteresados((prev) => prev.filter((_, i) => i !== idx))
                            }
                            className="text-red-500 hover:text-red-700"
                            aria-label="Quitar"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      <div className="inline-flex gap-1">
                        <input
                          type="text"
                          placeholder="Nombre"
                          className="w-28 px-2 py-1 text-sm rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const v = (e.target as HTMLInputElement).value?.trim();
                              if (v) {
                                setNewTareaInteresados((prev) => [...prev, v]);
                                (e.target as HTMLInputElement).value = "";
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            const el = e.currentTarget.parentElement?.querySelector('input[type="text"]') as HTMLInputElement | undefined;
                            const v = el?.value?.trim();
                            if (v) {
                              setNewTareaInteresados((prev) => [...prev, v]);
                              if (el) el.value = "";
                            }
                          }}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Añadir
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">Responsables</span>
                    <div className="flex flex-wrap items-center gap-2">
                      {newTareaResponsables.map((nombre, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 rounded bg-neutral-100 dark:bg-neutral-700 px-2 py-0.5 text-sm"
                        >
                          {nombre}
                          <button
                            type="button"
                            onClick={() =>
                              setNewTareaResponsables((prev) => prev.filter((_, i) => i !== idx))
                            }
                            className="text-red-500 hover:text-red-700"
                            aria-label="Quitar"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      <div className="inline-flex gap-1">
                        <input
                          type="text"
                          placeholder="Nombre"
                          className="w-28 px-2 py-1 text-sm rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const v = (e.target as HTMLInputElement).value?.trim();
                              if (v) {
                                setNewTareaResponsables((prev) => [...prev, v]);
                                (e.target as HTMLInputElement).value = "";
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            const el = e.currentTarget.parentElement?.querySelector('input[type="text"]') as HTMLInputElement | undefined;
                            const v = el?.value?.trim();
                            if (v) {
                              setNewTareaResponsables((prev) => [...prev, v]);
                              if (el) el.value = "";
                            }
                          }}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Añadir
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2.5 rounded-lg bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900 text-sm font-medium"
                    >
                      Crear tarea
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNewTareaOpen(false);
                        setNewTareaInteresados([]);
                        setNewTareaResponsables([]);
                      }}
                      className="px-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-600 text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setNewTareaOpen(true);
                    setNewTareaInteresados([]);
                    setNewTareaResponsables([]);
                  }}
                  className="mt-6 px-5 py-3 rounded-xl border border-dashed border-neutral-400 dark:border-neutral-500 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 text-sm"
                >
                  + Nueva tarea
                </button>
              )}
            </>
          )}
        </section>
      </div>

      {showKeyModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-10 p-4"
          onClick={() => setShowKeyModal(false)}
        >
          <div
            className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-medium mb-2">Clave de edición</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              Ingresa la clave para poder editar esta página.
            </p>
            <form onSubmit={handleSubmitKey}>
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="Clave"
                className="w-full px-4 py-2 rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 mb-2"
                autoFocus
              />
              {keyError && (
                <p className="text-sm text-red-600 dark:text-red-400 mb-2">{keyError}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 rounded bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900 font-medium"
                >
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowKeyModal(false);
                    setKeyInput("");
                    setKeyError(null);
                  }}
                  className="py-2 px-4 rounded border border-neutral-300 dark:border-neutral-600"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

function TareaEditForm({
  tarea,
  onSave,
  onCancel,
  onDelete,
}: {
  tarea: TareaConInteresados;
  onSave: (u: Partial<{ titulo: string; descripcion: string; estado: string; prioridad: PrioridadTarea }>) => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const [titulo, setTitulo] = useState(tarea.titulo);
  const [descripcion, setDescripcion] = useState(tarea.descripcion ?? "");
  const [estado, setEstado] = useState(tarea.estado);
  const [prioridad, setPrioridad] = useState<PrioridadTarea>(tarea.prioridad);

  return (
    <div className="space-y-4">
      <input
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 font-medium"
      />
      <textarea
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        rows={2}
        className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm"
      />
      <div className="flex flex-wrap gap-2">
        <input
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          placeholder="Estado (ej. Por hacer, En curso)"
          className="px-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm min-w-[140px]"
        />
        <select
          value={prioridad}
          onChange={(e) => setPrioridad(e.target.value as PrioridadTarea)}
          className="px-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm"
        >
          {PRIORIDADES.map((p) => (
            <option key={p} value={p}>
              {PRIORIDAD_LABELS[p]}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onSave({ titulo, descripcion: descripcion || "", estado, prioridad })}
          className="text-sm px-4 py-2.5 rounded-lg bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900"
        >
          Guardar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm px-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-600"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="text-sm px-4 py-2.5 text-red-600 dark:text-red-400 hover:underline rounded-lg"
        >
          Eliminar tarea
        </button>
      </div>
    </div>
  );
}
