export type Persona = {
  id: string;
  slug: string;
  edit_key: string;
  nombre: string;
  created_at: string;
  updated_at: string;
};

export type PrioridadTarea = "alta" | "media" | "baja";

export type Tarea = {
  id: string;
  persona_id: string;
  titulo: string;
  descripcion: string | null;
  estado: string;
  prioridad: PrioridadTarea;
  orden: number;
  created_at: string;
  updated_at: string;
  completada?: boolean;
  completada_at?: string | null;
};

export type TareaInteresado = {
  id: string;
  tarea_id: string;
  nombre: string;
};

export type TareaResponsable = {
  id: string;
  tarea_id: string;
  nombre: string;
};

export type TareaTimelineEntry = {
  id: string;
  tarea_id: string;
  contenido: string;
  creado_en: string;
};

export type TareaConInteresados = Tarea & {
  interesados: TareaInteresado[];
  responsables?: TareaResponsable[];
  timeline?: TareaTimelineEntry[];
};
