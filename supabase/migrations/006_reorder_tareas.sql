-- RPC: reordenar tareas por lista de ids (orden = índice en la lista)
-- Valida edit_key; todas las tareas deben pertenecer a la persona.
CREATE OR REPLACE FUNCTION reorder_tareas_rpc(
  p_slug text,
  p_edit_key text,
  p_tarea_ids uuid[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_persona_id uuid;
  v_id uuid;
  v_idx int;
BEGIN
  v_persona_id := get_persona_id_if_valid(p_slug, p_edit_key);
  IF v_persona_id IS NULL THEN RAISE EXCEPTION 'Clave inválida'; END IF;

  v_idx := 0;
  FOREACH v_id IN ARRAY p_tarea_ids
  LOOP
    UPDATE tareas SET orden = v_idx
    WHERE id = v_id AND persona_id = v_persona_id;
    v_idx := v_idx + 1;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION reorder_tareas_rpc(text, text, uuid[]) TO anon;
