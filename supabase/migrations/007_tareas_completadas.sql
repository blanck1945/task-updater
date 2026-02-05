-- Tareas completadas: campo y RPC para marcar/desmarcar
ALTER TABLE tareas
  ADD COLUMN IF NOT EXISTS completada boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS completada_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_tareas_completada ON tareas(persona_id, completada) WHERE completada = true;

-- RPC: marcar tarea como completada
CREATE OR REPLACE FUNCTION mark_tarea_completada_rpc(
  p_slug text,
  p_edit_key text,
  p_tarea_id uuid
)
RETURNS SETOF tareas
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_persona_id uuid;
BEGIN
  v_persona_id := get_persona_id_if_valid(p_slug, p_edit_key);
  IF v_persona_id IS NULL THEN RAISE EXCEPTION 'Clave inválida'; END IF;
  IF NOT EXISTS(SELECT 1 FROM tareas WHERE id = p_tarea_id AND persona_id = v_persona_id) THEN
    RAISE EXCEPTION 'Tarea no encontrada';
  END IF;
  UPDATE tareas SET completada = true, completada_at = now() WHERE id = p_tarea_id AND persona_id = v_persona_id;
  RETURN QUERY SELECT * FROM tareas WHERE id = p_tarea_id;
END;
$$;

-- RPC: desmarcar tarea (volver a pendientes)
CREATE OR REPLACE FUNCTION mark_tarea_no_completada_rpc(
  p_slug text,
  p_edit_key text,
  p_tarea_id uuid
)
RETURNS SETOF tareas
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_persona_id uuid;
BEGIN
  v_persona_id := get_persona_id_if_valid(p_slug, p_edit_key);
  IF v_persona_id IS NULL THEN RAISE EXCEPTION 'Clave inválida'; END IF;
  IF NOT EXISTS(SELECT 1 FROM tareas WHERE id = p_tarea_id AND persona_id = v_persona_id) THEN
    RAISE EXCEPTION 'Tarea no encontrada';
  END IF;
  UPDATE tareas SET completada = false, completada_at = NULL WHERE id = p_tarea_id AND persona_id = v_persona_id;
  RETURN QUERY SELECT * FROM tareas WHERE id = p_tarea_id;
END;
$$;

GRANT EXECUTE ON FUNCTION mark_tarea_completada_rpc(text, text, uuid) TO anon;
GRANT EXECUTE ON FUNCTION mark_tarea_no_completada_rpc(text, text, uuid) TO anon;
