-- RPC: actualizar contenido de una entrada del timeline (solo para editar el último bullet desde la UI)
-- Verifica que el usuario tenga edit_key y que la entrada pertenezca a una tarea suya.
-- Si la entrada es la última de la tarea, también actualiza tareas.estado.
CREATE OR REPLACE FUNCTION update_timeline_entry_rpc(
  p_slug text,
  p_edit_key text,
  p_timeline_id uuid,
  p_contenido text
)
RETURNS SETOF tarea_timeline
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_persona_id uuid;
  v_tarea_id uuid;
  v_es_ultimo boolean;
BEGIN
  v_persona_id := get_persona_id_if_valid(p_slug, p_edit_key);
  IF v_persona_id IS NULL THEN RAISE EXCEPTION 'Clave inválida'; END IF;

  SELECT tt.tarea_id INTO v_tarea_id
  FROM tarea_timeline tt
  JOIN tareas t ON t.id = tt.tarea_id AND t.persona_id = v_persona_id
  WHERE tt.id = p_timeline_id;
  IF v_tarea_id IS NULL THEN RAISE EXCEPTION 'Entrada no encontrada o no autorizado'; END IF;

  -- Solo es "último" si es el de creado_en más reciente para esta tarea
  SELECT (SELECT id FROM tarea_timeline WHERE tarea_id = v_tarea_id ORDER BY creado_en DESC LIMIT 1) = p_timeline_id INTO v_es_ultimo;

  UPDATE tarea_timeline SET contenido = trim(p_contenido) WHERE id = p_timeline_id;
  IF v_es_ultimo THEN
    UPDATE tareas SET estado = trim(p_contenido), updated_at = now() WHERE id = v_tarea_id;
  END IF;

  RETURN QUERY SELECT * FROM tarea_timeline WHERE id = p_timeline_id;
END;
$$;

GRANT EXECUTE ON FUNCTION update_timeline_entry_rpc(text, text, uuid, text) TO anon;
