"use client";

import { createClient } from "@/lib/supabase";
import type { PrioridadTarea } from "@/types/db";

export async function verifyEditKeyClient(slug: string, editKey: string): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("verify_edit_key", {
    p_slug: slug,
    p_edit_key: editKey,
  });
  if (error) return false;
  return data === true;
}

export async function createTareaClient(
  slug: string,
  editKey: string,
  tarea: {
    titulo: string;
    descripcion?: string;
    estado?: string;
    prioridad?: PrioridadTarea;
  }
) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("create_tarea_for_persona", {
    p_slug: slug,
    p_edit_key: editKey,
    p_titulo: tarea.titulo.trim(),
    p_descripcion: tarea.descripcion?.trim() ?? null,
    p_estado: tarea.estado?.trim() ?? "Por hacer",
    p_prioridad: tarea.prioridad ?? "media",
  });
  if (error) return { data: null, error };
  const row = Array.isArray(data) ? data[0] : data;
  return { data: row, error: null };
}

export async function updateTareaClient(
  slug: string,
  editKey: string,
  tareaId: string,
  updates: Partial<{
    titulo: string;
    descripcion: string;
    estado: string;
    prioridad: PrioridadTarea;
  }>
) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("update_tarea_rpc", {
    p_slug: slug,
    p_edit_key: editKey,
    p_tarea_id: tareaId,
    p_titulo: updates.titulo ?? null,
    p_descripcion: updates.descripcion ?? null,
    p_estado: updates.estado ?? null,
    p_prioridad: updates.prioridad ?? null,
  });
  if (error) return { data: null, error };
  const row = Array.isArray(data) ? data[0] : data;
  return { data: row, error: null };
}

export async function deleteTareaClient(slug: string, editKey: string, tareaId: string) {
  const supabase = createClient();
  const { error } = await supabase.rpc("delete_tarea_rpc", {
    p_slug: slug,
    p_edit_key: editKey,
    p_tarea_id: tareaId,
  });
  return { error };
}

export async function reorderTareasClient(
  slug: string,
  editKey: string,
  tareaIds: string[]
): Promise<{ error: Error | null }> {
  const supabase = createClient();
  const { error } = await supabase.rpc("reorder_tareas_rpc", {
    p_slug: slug,
    p_edit_key: editKey,
    p_tarea_ids: tareaIds,
  });
  return { error: error ?? null };
}

export async function markTareaCompletadaClient(
  slug: string,
  editKey: string,
  tareaId: string
) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("mark_tarea_completada_rpc", {
    p_slug: slug,
    p_edit_key: editKey,
    p_tarea_id: tareaId,
  });
  if (error) return { data: null, error };
  const row = Array.isArray(data) ? data[0] : data;
  return { data: row, error: null };
}

export async function markTareaNoCompletadaClient(
  slug: string,
  editKey: string,
  tareaId: string
) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("mark_tarea_no_completada_rpc", {
    p_slug: slug,
    p_edit_key: editKey,
    p_tarea_id: tareaId,
  });
  if (error) return { data: null, error };
  const row = Array.isArray(data) ? data[0] : data;
  return { data: row, error: null };
}

export async function addInteresadoClient(
  slug: string,
  editKey: string,
  tareaId: string,
  nombre: string
) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("add_interesado_rpc", {
    p_slug: slug,
    p_edit_key: editKey,
    p_tarea_id: tareaId,
    p_nombre: nombre.trim(),
  });
  if (error) return { data: null, error };
  const row = Array.isArray(data) ? data[0] : data;
  return { data: row, error: null };
}

export async function removeInteresadoClient(
  slug: string,
  editKey: string,
  interesadoId: string
) {
  const supabase = createClient();
  const { error } = await supabase.rpc("remove_interesado_rpc", {
    p_slug: slug,
    p_edit_key: editKey,
    p_interesado_id: interesadoId,
  });
  return { error };
}

export async function updatePersonaClient(
  slug: string,
  editKey: string,
  nombre: string
) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("update_persona_rpc", {
    p_slug: slug,
    p_edit_key: editKey,
    p_nombre: nombre.trim(),
  });
  if (error) return { data: null, error };
  const row = Array.isArray(data) ? data[0] : data;
  return { data: row, error: null };
}

export async function addTimelineEntryClient(
  slug: string,
  editKey: string,
  tareaId: string,
  contenido: string
) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("add_timeline_entry_rpc", {
    p_slug: slug,
    p_edit_key: editKey,
    p_tarea_id: tareaId,
    p_contenido: contenido.trim(),
  });
  if (error) return { data: null, error };
  const row = Array.isArray(data) ? data[0] : data;
  return { data: row, error: null };
}

export async function updateTimelineEntryClient(
  slug: string,
  editKey: string,
  timelineEntryId: string,
  contenido: string
) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("update_timeline_entry_rpc", {
    p_slug: slug,
    p_edit_key: editKey,
    p_timeline_id: timelineEntryId,
    p_contenido: contenido.trim(),
  });
  if (error) return { data: null, error };
  const row = Array.isArray(data) ? data[0] : data;
  return { data: row, error: null };
}

export async function addResponsableClient(
  slug: string,
  editKey: string,
  tareaId: string,
  nombre: string
) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("add_responsable_rpc", {
    p_slug: slug,
    p_edit_key: editKey,
    p_tarea_id: tareaId,
    p_nombre: nombre.trim(),
  });
  if (error) return { data: null, error };
  const row = Array.isArray(data) ? data[0] : data;
  return { data: row, error: null };
}

export async function removeResponsableClient(
  slug: string,
  editKey: string,
  responsableId: string
) {
  const supabase = createClient();
  const { error } = await supabase.rpc("remove_responsable_rpc", {
    p_slug: slug,
    p_edit_key: editKey,
    p_responsable_id: responsableId,
  });
  return { error };
}
