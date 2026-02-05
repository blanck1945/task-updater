"use server";

import { createServerClient } from "@/lib/supabase-server";
import type { PrioridadTarea } from "@/types/db";

export async function getPersonaBySlug(slug: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("personas")
    .select("*")
    .eq("slug", slug)
    .single();
  if (error) return { data: null, error };
  return { data, error: null };
}

export async function getTareasConInteresados(personaId: string) {
  const supabase = createServerClient();
  const { data: tareas, error: errTareas } = await supabase
    .from("tareas")
    .select("*")
    .eq("persona_id", personaId)
    .order("orden", { ascending: true });
  if (errTareas) return { data: [], error: errTareas };
  if (!tareas?.length) return { data: [], error: null };

  const { data: interesados, error: errInt } = await supabase
    .from("tareas_interesados")
    .select("*")
    .in("tarea_id", tareas.map((t) => t.id));
  if (errInt) return { data: [], error: errInt };

  const byTarea = (interesados ?? []).reduce<Record<string, typeof interesados>>((acc, i) => {
    if (!acc[i.tarea_id]) acc[i.tarea_id] = [];
    acc[i.tarea_id].push(i);
    return acc;
  }, {});

  const data = tareas.map((t) => ({
    ...t,
    interesados: byTarea[t.id] ?? [],
  }));
  return { data, error: null };
}

export async function verifyEditKey(slug: string, editKey: string) {
  const { data } = await getPersonaBySlug(slug);
  if (!data) return { valid: false };
  return { valid: data.edit_key === editKey };
}

export async function createPersona(formData: {
  nombre: string;
  slug: string;
  edit_key: string;
}) {
  try {
    const supabase = createServerClient();
    const slug = formData.slug.trim().toLowerCase().replace(/\s+/g, "-");
    const { data, error } = await supabase
      .from("personas")
      .insert({
        nombre: formData.nombre.trim(),
        slug,
        edit_key: formData.edit_key,
      })
      .select()
      .single();
    if (error) {
      return {
        data: null,
        error: new Error(
          error.message?.includes("Invalid") || error.message?.includes("JWT")
            ? "Clave de Supabase inválida. Revisá NEXT_PUBLIC_SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY en .env.local (Project Settings → API)."
            : error.message ?? "Error al crear la página."
        ),
      };
    }
    return { data, error: null };
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    const cause = err.cause instanceof Error ? err.cause.message : String(err.cause ?? "");
    const raw = `${err.message}${cause ? ` (${cause})` : ""}`;
    const isFetchFailed =
      raw.includes("fetch failed") ||
      raw.includes("Failed to fetch") ||
      raw.includes("ECONNREFUSED") ||
      raw.includes("ENOTFOUND") ||
      raw.includes("getaddrinfo") ||
      raw.includes("ETIMEDOUT") ||
      raw.includes("ECONNRESET");
    const hint =
      "Cerrando el servidor (Ctrl+C), borrá la carpeta .next, ejecutá de nuevo npm run dev. Si sigue fallando, probá sin Turbopack: en package.json cambiá el script dev a \"next dev -p 3333\" (sin --turbopack). Revisá también firewall o antivirus que puedan bloquear la conexión.";
    const msg = isFetchFailed
      ? `No se pudo conectar a Supabase. ${raw}. ${hint}`
      : raw;
    return { data: null, error: new Error(msg) };
  }
}

export async function updatePersona(
  slug: string,
  editKey: string,
  updates: { nombre?: string }
) {
  const { valid } = await verifyEditKey(slug, editKey);
  if (!valid) return { data: null, error: new Error("Clave inválida") };
  const supabase = createServerClient();
  const { data: persona } = await supabase.from("personas").select("id").eq("slug", slug).single();
  if (!persona) return { data: null, error: new Error("Persona no encontrada") };
  const { data, error } = await supabase
    .from("personas")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", persona.id)
    .select()
    .single();
  if (error) return { data: null, error };
  return { data, error: null };
}

export async function createTarea(
  slug: string,
  editKey: string,
  tarea: { titulo: string; descripcion?: string; estado?: string; prioridad?: PrioridadTarea }
) {
  const { valid } = await verifyEditKey(slug, editKey);
  if (!valid) return { data: null, error: new Error("Clave inválida") };
  const supabase = createServerClient();
  const { data: persona } = await supabase.from("personas").select("id").eq("slug", slug).single();
  if (!persona) return { data: null, error: new Error("Persona no encontrada") };
  const { data: max } = await supabase
    .from("tareas")
    .select("orden")
    .eq("persona_id", persona.id)
    .order("orden", { ascending: false })
    .limit(1)
    .single();
  const orden = (max?.orden ?? -1) + 1;
  const { data, error } = await supabase
    .from("tareas")
    .insert({
      persona_id: persona.id,
      titulo: tarea.titulo.trim(),
      descripcion: tarea.descripcion?.trim() ?? null,
      estado: tarea.estado ?? "Por hacer",
      prioridad: tarea.prioridad ?? "media",
      orden,
    })
    .select()
    .single();
  if (error) return { data: null, error };
  return { data, error: null };
}

export async function updateTarea(
  slug: string,
  editKey: string,
  tareaId: string,
  updates: Partial<{
    titulo: string;
    descripcion: string;
    estado: string;
    prioridad: PrioridadTarea;
    orden: number;
  }>
) {
  const { valid } = await verifyEditKey(slug, editKey);
  if (!valid) return { data: null, error: new Error("Clave inválida") };
  const supabase = createServerClient();
  const { data: persona } = await supabase.from("personas").select("id").eq("slug", slug).single();
  if (!persona) return { data: null, error: new Error("Persona no encontrada") };
  const obj: Record<string, unknown> = { ...updates, updated_at: new Date().toISOString() };
  const { data, error } = await supabase
    .from("tareas")
    .update(obj)
    .eq("id", tareaId)
    .eq("persona_id", persona.id)
    .select()
    .single();
  if (error) return { data: null, error };
  return { data, error: null };
}

export async function deleteTarea(slug: string, editKey: string, tareaId: string) {
  const { valid } = await verifyEditKey(slug, editKey);
  if (!valid) return { error: new Error("Clave inválida") };
  const supabase = createServerClient();
  const { data: persona } = await supabase.from("personas").select("id").eq("slug", slug).single();
  if (!persona) return { error: new Error("Persona no encontrada") };
  const { error } = await supabase
    .from("tareas")
    .delete()
    .eq("id", tareaId)
    .eq("persona_id", persona.id);
  return { error: error ?? null };
}

export async function addInteresado(
  slug: string,
  editKey: string,
  tareaId: string,
  nombre: string
) {
  const { valid } = await verifyEditKey(slug, editKey);
  if (!valid) return { data: null, error: new Error("Clave inválida") };
  const supabase = createServerClient();
  const { data: tarea } = await supabase.from("tareas").select("persona_id").eq("id", tareaId).single();
  if (!tarea) return { data: null, error: new Error("Tarea no encontrada") };
  const { data: persona } = await supabase.from("personas").select("id").eq("slug", slug).single();
  if (!persona || tarea.persona_id !== persona.id) return { data: null, error: new Error("No autorizado") };
  const { data, error } = await supabase
    .from("tareas_interesados")
    .insert({ tarea_id: tareaId, nombre: nombre.trim() })
    .select()
    .single();
  if (error) return { data: null, error };
  return { data, error: null };
}

export async function removeInteresado(
  slug: string,
  editKey: string,
  interesadoId: string
) {
  const { valid } = await verifyEditKey(slug, editKey);
  if (!valid) return { error: new Error("Clave inválida") };
  const supabase = createServerClient();
  const { data: row } = await supabase
    .from("tareas_interesados")
    .select("tarea_id")
    .eq("id", interesadoId)
    .single();
  if (!row) return { error: new Error("Interesado no encontrado") };
  const { data: tarea } = await supabase.from("tareas").select("persona_id").eq("id", row.tarea_id).single();
  const { data: persona } = await supabase.from("personas").select("id").eq("slug", slug).single();
  if (!persona || !tarea || tarea.persona_id !== persona.id) return { error: new Error("No autorizado") };
  const { error } = await supabase.from("tareas_interesados").delete().eq("id", interesadoId);
  return { error: error ?? null };
}
