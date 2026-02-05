"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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

function EstadoActual({ estado }: { estado: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-[var(--muted)] text-[var(--muted-foreground)]">
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse-soft"></span>
      {estado || "Sin estado"}
    </span>
  );
}

function TareaEditForm({
  tarea,
  onSave,
  onCancel,
  onDelete,
}: {
  tarea: TareaConInteresados;
  onSave: (updates: Partial<{ titulo: string; descripcion: string; estado: string; prioridad: PrioridadTarea }>) => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const [titulo, setTitulo] = useState(tarea.titulo);
  const [descripcion, setDescripcion] = useState(tarea.descripcion ?? "");
  const [prioridad, setPrioridad] = useState(tarea.prioridad);

  return (
    <div className="space-y-4 animate-scale-in">
      <input
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        className="w-full text-lg font-semibold px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        placeholder="Titulo de la tarea"
      />
      <textarea
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        rows={3}
        className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none"
        placeholder="Descripcion (opcional)"
      />
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-[var(--muted-foreground)]">Prioridad:</span>
        {PRIORIDADES.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPrioridad(p)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              prioridad === p
                ? p === "alta"
                  ? "bg-[var(--priority-high)] text-white"
                  : p === "media"
                    ? "bg-[var(--priority-medium)] text-white"
                    : "bg-[var(--priority-low)] text-white"
                : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--border)]"
            }`}
          >
            {PRIORIDAD_LABELS[p]}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => onSave({ titulo, descripcion, prioridad })}
          className="px-5 py-2.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-medium hover:opacity-90 transition-all"
        >
          Guardar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 rounded-xl border border-[var(--border)] hover:bg-[var(--muted)] transition-all"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="px-5 py-2.5 rounded-xl text-[var(--priority-high)] hover:bg-[var(--priority-high-bg)] transition-all ml-auto"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}

function NewTareaForm({
  onSubmit,
  onCancel,
  interesados,
  setInteresados,
  responsables,
  setResponsables,
}: {
  onSubmit: (formData: FormData, interesados: string[], responsables: string[]) => void;
  onCancel: () => void;
  interesados: string[];
  setInteresados: (v: string[]) => void;
  responsables: string[];
  setResponsables: (v: string[]) => void;
}) {
  const [newInteresado, setNewInteresado] = useState("");
  const [newResponsable, setNewResponsable] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(new FormData(e.currentTarget), interesados, responsables);
      }}
      className="p-6 rounded-2xl border-2 border-dashed border-[var(--accent)] bg-[var(--card)] space-y-5 animate-scale-in"
    >
      <div className="space-y-2">
        <label className="block text-sm font-medium">Titulo</label>
        <input
          name="titulo"
          required
          className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          placeholder="Que hay que hacer?"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Descripcion</label>
        <textarea
          name="descripcion"
          rows={2}
          className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none"
          placeholder="Detalles adicionales (opcional)"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Estado inicial</label>
          <input
            name="estado"
            defaultValue="Por hacer"
            className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Prioridad</label>
          <select
            name="prioridad"
            defaultValue="media"
            className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          >
            {PRIORIDADES.map((p) => (
              <option key={p} value={p}>{PRIORIDAD_LABELS[p]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Interesados */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Interesados</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {interesados.map((name, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--muted)] text-sm">
              {name}
              <button type="button" onClick={() => setInteresados(interesados.filter((_, idx) => idx !== i))} className="hover:text-[var(--priority-high)]">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newInteresado}
            onChange={(e) => setNewInteresado(e.target.value)}
            className="flex-1 px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            placeholder="Nombre del interesado"
          />
          <button
            type="button"
            onClick={() => {
              if (newInteresado.trim()) {
                setInteresados([...interesados, newInteresado.trim()]);
                setNewInteresado("");
              }
            }}
            className="px-4 py-2 rounded-xl bg-[var(--muted)] hover:bg-[var(--border)] transition-all"
          >
            Agregar
          </button>
        </div>
      </div>

      {/* Responsables */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Responsables</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {responsables.map((name, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--accent)] bg-opacity-20 text-sm text-[var(--accent)]">
              {name}
              <button type="button" onClick={() => setResponsables(responsables.filter((_, idx) => idx !== i))} className="hover:opacity-60">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newResponsable}
            onChange={(e) => setNewResponsable(e.target.value)}
            className="flex-1 px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            placeholder="Nombre del responsable"
          />
          <button
            type="button"
            onClick={() => {
              if (newResponsable.trim()) {
                setResponsables([...responsables, newResponsable.trim()]);
                setNewResponsable("");
              }
            }}
            className="px-4 py-2 rounded-xl bg-[var(--muted)] hover:bg-[var(--border)] transition-all"
          >
            Agregar
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          className="px-6 py-3 rounded-xl bg-[var(--accent)] text-white font-medium hover:opacity-90 transition-all flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Crear tarea
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 rounded-xl border border-[var(--border)] hover:bg-[var(--muted)] transition-all"
        >
          Cancelar
        </button>
      </div>
    </form>
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

  // Group tasks by priority
  const tareasPorPrioridad = useMemo(() => {
    return {
      alta: tareasOrdenadas.filter(t => t.prioridad === "alta"),
      media: tareasOrdenadas.filter(t => t.prioridad === "media"),
      baja: tareasOrdenadas.filter(t => t.prioridad === "baja"),
    };
  }, [tareasOrdenadas]);

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

  const stats = {
    total: tareas.length,
    alta: tareasPorPrioridad.alta.length,
    media: tareasPorPrioridad.media.length,
    baja: tareasPorPrioridad.baja.length,
  };

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="w-full border-b border-[var(--border)] glass sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-semibold text-xl tracking-tight">
            TaskFlow
          </Link>
          <nav className="flex items-center gap-4">
            {editKeyVerified === false && (
              <button
                type="button"
                onClick={() => setShowKeyModal(true)}
                className="text-sm px-4 py-2 rounded-xl border border-[var(--border)] hover:bg-[var(--muted)] transition-all"
              >
                Editar
              </button>
            )}
            {isEditing && (
              <button
                type="button"
                onClick={handleLeaveEdit}
                className="text-sm px-4 py-2 rounded-xl border border-[var(--border)] hover:bg-[var(--muted)] transition-all"
              >
                Salir de edicion
              </button>
            )}
            <Link
              href={`/p/${encodeURIComponent(slug)}/completadas`}
              className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              Completadas
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
                <div className="w-16 h-16 rounded-2xl bg-[var(--accent)] flex items-center justify-center text-2xl font-bold text-white">
                  {persona.nombre.charAt(0).toUpperCase()}
                </div>
                <div>
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        className="text-2xl font-bold bg-[var(--muted)] px-3 py-1.5 rounded-xl border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveNombre()}
                        className="text-sm text-[var(--accent)] hover:underline"
                      >
                        Guardar
                      </button>
                    </div>
                  ) : (
                    <h1 className="text-2xl font-bold">{persona.nombre}</h1>
                  )}
                  <p className="text-[var(--muted-foreground)] text-sm">/p/{slug}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 rounded-xl bg-[var(--muted)] text-center">
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Total</p>
                </div>
                <div className="px-4 py-2 rounded-xl bg-[var(--priority-high-bg)] text-center">
                  <p className="text-2xl font-bold text-[var(--priority-high)]">{stats.alta}</p>
                  <p className="text-xs text-[var(--priority-high)]">Alta</p>
                </div>
                <div className="px-4 py-2 rounded-xl bg-[var(--priority-medium-bg)] text-center">
                  <p className="text-2xl font-bold text-[var(--priority-medium)]">{stats.media}</p>
                  <p className="text-xs text-[var(--priority-medium)]">Media</p>
                </div>
                <div className="px-4 py-2 rounded-xl bg-[var(--priority-low-bg)] text-center">
                  <p className="text-2xl font-bold text-[var(--priority-low)]">{stats.baja}</p>
                  <p className="text-xs text-[var(--priority-low)]">Baja</p>
                </div>
              </div>
            </div>
          </section>

          {/* New Task Button */}
          {isEditing && !newTareaOpen && (
            <button
              type="button"
              onClick={() => setNewTareaOpen(true)}
              className="w-full p-6 rounded-2xl border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)] bg-[var(--card)] hover:bg-[var(--muted)] transition-all group flex items-center justify-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-[var(--accent)] bg-opacity-10 group-hover:bg-opacity-20 flex items-center justify-center transition-all">
                <svg className="w-6 h-6 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="font-medium text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]">
                Crear nueva tarea
              </span>
            </button>
          )}

          {/* New Task Form */}
          {isEditing && newTareaOpen && (
            <NewTareaForm
              onSubmit={handleCreateTarea}
              onCancel={() => {
                setNewTareaOpen(false);
                setNewTareaInteresados([]);
                setNewTareaResponsables([]);
              }}
              interesados={newTareaInteresados}
              setInteresados={setNewTareaInteresados}
              responsables={newTareaResponsables}
              setResponsables={setNewTareaResponsables}
            />
          )}

          {/* Tasks List */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Tareas</h2>
              {isEditing && (
                <p className="text-xs text-[var(--muted-foreground)]">
                  Arrastra para reordenar dentro de la misma prioridad
                </p>
              )}
            </div>

            {tareasOrdenadas.length === 0 ? (
              <div className="py-20 text-center animate-fade-in">
                <div className="w-20 h-20 rounded-2xl bg-[var(--muted)] mx-auto flex items-center justify-center mb-6">
                  <svg className="w-10 h-10 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">No hay tareas</h3>
                <p className="text-[var(--muted-foreground)] mb-6">
                  {isEditing ? "Crea tu primera tarea para comenzar" : "Esta pagina aun no tiene tareas"}
                </p>
              </div>
            ) : (
              <ul className="space-y-4">
                {tareasOrdenadas.map((tarea, index) => {
                  const borderColors = {
                    alta: "border-l-[var(--priority-high)]",
                    media: "border-l-[var(--priority-medium)]",
                    baja: "border-l-[var(--priority-low)]",
                  };
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
                      className={`rounded-2xl border border-[var(--border)] border-l-4 ${borderColors[tarea.prioridad]} shadow-sm bg-[var(--card)] overflow-hidden transition-all duration-200 animate-fade-in ${isEditing ? "cursor-grab active:cursor-grabbing" : ""} ${isDragging ? "opacity-50 scale-[0.98]" : ""} ${isDropTarget ? "ring-2 ring-[var(--accent)] ring-offset-2" : ""}`}
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="p-5 md:p-6">
                        {editingTareaId === tarea.id && isEditing ? (
                          <TareaEditForm
                            tarea={tarea}
                            onSave={(updates) => handleUpdateTarea(tarea.id, updates)}
                            onCancel={() => setEditingTareaId(null)}
                            onDelete={() => handleDeleteTarea(tarea.id)}
                          />
                        ) : (
                          <div className="space-y-4">
                            {/* Header */}
                            <div className="flex flex-wrap items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold truncate">{tarea.titulo}</h3>
                                {tarea.created_at && (
                                  <p className="text-xs text-[var(--muted-foreground)] mt-1">
                                    Creada el{" "}
                                    {new Date(tarea.created_at).toLocaleDateString("es", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })}
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <PrioridadBadge prioridad={tarea.prioridad} />
                                <EstadoActual estado={tarea.estado} />
                              </div>
                            </div>

                            {/* Description */}
                            {tarea.descripcion && (
                              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                                {tarea.descripcion}
                              </p>
                            )}

                            {/* Timeline */}
                            {(tarea.timeline?.length ?? 0) > 0 && (
                              <div className="pt-3 border-t border-[var(--border)]">
                                <p className="text-xs font-medium text-[var(--muted-foreground)] mb-2">Timeline</p>
                                <ul className="space-y-2">
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

                                    if (editandoEste && isEditing) {
                                      return (
                                        <li key={e.id}>
                                          <TimelineEditForm
                                            contenido={e.contenido}
                                            onSave={(c) => handleUpdateTimelineEntry(tarea.id, e.id, c)}
                                            onCancel={() => setEditingTimelineEntryId(null)}
                                          />
                                        </li>
                                      );
                                    }

                                    return (
                                      <li key={e.id} className="flex items-start gap-3 text-sm group">
                                        <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${esUltimo ? "bg-[var(--accent)]" : "bg-[var(--muted-foreground)]"}`}></span>
                                        <div className="flex-1 min-w-0">
                                          <span className={esUltimo ? "font-medium" : "text-[var(--muted-foreground)]"}>{e.contenido}</span>
                                          {fecha && (
                                            <span className="ml-2 text-xs text-[var(--muted-foreground)]">{fecha}</span>
                                          )}
                                          {esUltimo && <span className="ml-2 text-xs text-[var(--accent)]">(actual)</span>}
                                        </div>
                                        {isEditing && (
                                          <button
                                            type="button"
                                            onClick={() => setEditingTimelineEntryId(e.id)}
                                            className="opacity-0 group-hover:opacity-100 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all"
                                          >
                                            Editar
                                          </button>
                                        )}
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>
                            )}

                            {/* Add Timeline */}
                            {isEditing && newTimelineTareaId === tarea.id && (
                              <TimelineAddForm
                                onAdd={(c) => handleAddTimelineEntry(tarea.id, c)}
                                onCancel={() => setNewTimelineTareaId(null)}
                              />
                            )}

                            {/* People */}
                            <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-[var(--border)]">
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
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--muted)] text-xs group"
                                      >
                                        {i.nombre}
                                        {isEditing && (
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveInteresado(i.id)}
                                            className="opacity-0 group-hover:opacity-100 hover:text-[var(--priority-high)] transition-all"
                                          >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                          </button>
                                        )}
                                      </span>
                                    ))
                                  )}
                                  {isEditing && newInteresadoTareaId === tarea.id && (
                                    <AddPersonForm
                                      placeholder="Nombre"
                                      onAdd={(n) => handleAddInteresado(tarea.id, n)}
                                      onCancel={() => setNewInteresadoTareaId(null)}
                                    />
                                  )}
                                  {isEditing && newInteresadoTareaId !== tarea.id && (
                                    <button
                                      type="button"
                                      onClick={() => setNewInteresadoTareaId(tarea.id)}
                                      className="px-2 py-0.5 rounded-full bg-[var(--muted)] text-xs hover:bg-[var(--border)] transition-all"
                                    >
                                      +
                                    </button>
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
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--accent)] bg-opacity-20 text-[var(--accent)] text-xs group"
                                      >
                                        {r.nombre}
                                        {isEditing && (
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveResponsable(r.id)}
                                            className="opacity-0 group-hover:opacity-100 hover:opacity-60 transition-all"
                                          >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                          </button>
                                        )}
                                      </span>
                                    ))
                                  )}
                                  {isEditing && newResponsableTareaId === tarea.id && (
                                    <AddPersonForm
                                      placeholder="Nombre"
                                      onAdd={(n) => handleAddResponsable(tarea.id, n)}
                                      onCancel={() => setNewResponsableTareaId(null)}
                                    />
                                  )}
                                  {isEditing && newResponsableTareaId !== tarea.id && (
                                    <button
                                      type="button"
                                      onClick={() => setNewResponsableTareaId(tarea.id)}
                                      className="px-2 py-0.5 rounded-full bg-[var(--accent)] bg-opacity-20 text-[var(--accent)] text-xs hover:bg-opacity-30 transition-all"
                                    >
                                      +
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            {isEditing && (
                              <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[var(--border)]">
                                <button
                                  type="button"
                                  onClick={() => setEditingTareaId(tarea.id)}
                                  className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setNewTimelineTareaId(tarea.id)}
                                  className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                                >
                                  Actualizar estado
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMarkCompletada(tarea.id)}
                                  className="text-sm text-[var(--priority-low)] hover:underline transition-colors ml-auto"
                                >
                                  Marcar completada
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>

      {/* Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm p-6 rounded-2xl bg-[var(--card)] shadow-2xl animate-scale-in">
            <h2 className="text-xl font-bold mb-2">Ingresar clave de edicion</h2>
            <p className="text-sm text-[var(--muted-foreground)] mb-6">
              Ingresa la clave para editar esta pagina
            </p>
            <form onSubmit={handleSubmitKey} className="space-y-4">
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="Tu clave secreta"
                className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                autoFocus
              />
              {keyError && (
                <p className="text-sm text-[var(--priority-high)]">{keyError}</p>
              )}
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-medium hover:opacity-90 transition-all"
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
                  className="py-3 px-6 rounded-xl border border-[var(--border)] hover:bg-[var(--muted)] transition-all"
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

function TimelineEditForm({
  contenido: initial,
  onSave,
  onCancel,
}: {
  contenido: string;
  onSave: (c: string) => void;
  onCancel: () => void;
}) {
  const [contenido, setContenido] = useState(initial);
  return (
    <div className="flex items-center gap-2 animate-scale-in">
      <input
        value={contenido}
        onChange={(e) => setContenido(e.target.value)}
        className="flex-1 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        autoFocus
      />
      <button
        type="button"
        onClick={() => onSave(contenido)}
        className="px-3 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm hover:opacity-90 transition-all"
      >
        Guardar
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="px-3 py-2 rounded-lg border border-[var(--border)] text-sm hover:bg-[var(--muted)] transition-all"
      >
        Cancelar
      </button>
    </div>
  );
}

function TimelineAddForm({
  onAdd,
  onCancel,
}: {
  onAdd: (c: string) => void;
  onCancel: () => void;
}) {
  const [contenido, setContenido] = useState("");
  return (
    <div className="flex items-center gap-2 animate-scale-in">
      <input
        value={contenido}
        onChange={(e) => setContenido(e.target.value)}
        placeholder="Nuevo estado..."
        className="flex-1 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        autoFocus
      />
      <button
        type="button"
        onClick={() => onAdd(contenido)}
        className="px-3 py-2 rounded-lg bg-[var(--accent)] text-white text-sm hover:opacity-90 transition-all"
      >
        Agregar
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="px-3 py-2 rounded-lg border border-[var(--border)] text-sm hover:bg-[var(--muted)] transition-all"
      >
        Cancelar
      </button>
    </div>
  );
}

function AddPersonForm({
  placeholder,
  onAdd,
  onCancel,
}: {
  placeholder: string;
  onAdd: (n: string) => void;
  onCancel: () => void;
}) {
  const [nombre, setNombre] = useState("");
  return (
    <div className="inline-flex items-center gap-1 animate-scale-in">
      <input
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder={placeholder}
        className="w-24 px-2 py-0.5 rounded text-xs border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onAdd(nombre);
          }
          if (e.key === "Escape") onCancel();
        }}
      />
      <button
        type="button"
        onClick={() => onAdd(nombre)}
        className="text-xs text-[var(--accent)] hover:underline"
      >
        OK
      </button>
    </div>
  );
}
