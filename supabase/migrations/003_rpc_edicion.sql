-- Funciones RPC para editar desde el cliente (validan edit_key sin pasar por Next.js)

-- Obtener persona_id si slug + edit_key son válidos
CREATE OR REPLACE FUNCTION get_persona_id_if_valid(p_slug text, p_edit_key text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM personas WHERE slug = p_slug AND edit_key = p_edit_key;
  RETURN v_id;
END;
$$;

-- Crear tarea (cliente llama con slug + edit_key)
CREATE OR REPLACE FUNCTION create_tarea_for_persona(
  p_slug text,
  p_edit_key text,
  p_titulo text,
  p_descripcion text DEFAULT NULL,
  p_estado text DEFAULT 'por_hacer',
  p_prioridad text DEFAULT 'media'
)
RETURNS SETOF tareas
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_persona_id uuid;
  v_orden int;
BEGIN
  v_persona_id := get_persona_id_if_valid(p_slug, p_edit_key);
  IF v_persona_id IS NULL THEN
    RAISE EXCEPTION 'Clave inválida';
  END IF;
  SELECT COALESCE(MAX(orden), -1) + 1 INTO v_orden FROM tareas WHERE persona_id = v_persona_id;
  RETURN QUERY
  INSERT INTO tareas (persona_id, titulo, descripcion, estado, prioridad, orden)
  VALUES (v_persona_id, p_titulo, COALESCE(trim(p_descripcion), NULL), p_estado, p_prioridad, v_orden)
  RETURNING *;
END;
$$;

-- Actualizar tarea
CREATE OR REPLACE FUNCTION update_tarea_rpc(
  p_slug text,
  p_edit_key text,
  p_tarea_id uuid,
  p_titulo text DEFAULT NULL,
  p_descripcion text DEFAULT NULL,
  p_estado text DEFAULT NULL,
  p_prioridad text DEFAULT NULL
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
  IF v_persona_id IS NULL THEN
    RAISE EXCEPTION 'Clave inválida';
  END IF;
  RETURN QUERY
  UPDATE tareas
  SET
    titulo = COALESCE(p_titulo, titulo),
    descripcion = CASE WHEN p_descripcion IS NOT NULL THEN p_descripcion ELSE descripcion END,
    estado = COALESCE(p_estado, estado),
    prioridad = COALESCE(p_prioridad, prioridad),
    updated_at = now()
  WHERE id = p_tarea_id AND persona_id = v_persona_id
  RETURNING *;
END;
$$;

-- Eliminar tarea
CREATE OR REPLACE FUNCTION delete_tarea_rpc(p_slug text, p_edit_key text, p_tarea_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_persona_id uuid;
BEGIN
  v_persona_id := get_persona_id_if_valid(p_slug, p_edit_key);
  IF v_persona_id IS NULL THEN
    RAISE EXCEPTION 'Clave inválida';
  END IF;
  DELETE FROM tareas WHERE id = p_tarea_id AND persona_id = v_persona_id;
END;
$$;

-- Añadir interesado
CREATE OR REPLACE FUNCTION add_interesado_rpc(
  p_slug text,
  p_edit_key text,
  p_tarea_id uuid,
  p_nombre text
)
RETURNS SETOF tareas_interesados
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_persona_id uuid;
  v_ok boolean;
BEGIN
  v_persona_id := get_persona_id_if_valid(p_slug, p_edit_key);
  IF v_persona_id IS NULL THEN
    RAISE EXCEPTION 'Clave inválida';
  END IF;
  SELECT EXISTS(SELECT 1 FROM tareas WHERE id = p_tarea_id AND persona_id = v_persona_id) INTO v_ok;
  IF NOT v_ok THEN
    RAISE EXCEPTION 'Tarea no encontrada';
  END IF;
  RETURN QUERY
  INSERT INTO tareas_interesados (tarea_id, nombre) VALUES (p_tarea_id, trim(p_nombre))
  RETURNING *;
END;
$$;

-- Quitar interesado
CREATE OR REPLACE FUNCTION remove_interesado_rpc(p_slug text, p_edit_key text, p_interesado_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_persona_id uuid;
  v_tarea_id uuid;
BEGIN
  v_persona_id := get_persona_id_if_valid(p_slug, p_edit_key);
  IF v_persona_id IS NULL THEN
    RAISE EXCEPTION 'Clave inválida';
  END IF;
  SELECT tarea_id INTO v_tarea_id FROM tareas_interesados WHERE id = p_interesado_id;
  IF v_tarea_id IS NULL THEN
    RETURN;
  END IF;
  IF NOT EXISTS(SELECT 1 FROM tareas WHERE id = v_tarea_id AND persona_id = v_persona_id) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;
  DELETE FROM tareas_interesados WHERE id = p_interesado_id;
END;
$$;

-- Actualizar nombre de persona
CREATE OR REPLACE FUNCTION update_persona_rpc(p_slug text, p_edit_key text, p_nombre text)
RETURNS SETOF personas
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM personas WHERE slug = p_slug AND edit_key = p_edit_key;
  IF v_id IS NULL THEN
    RAISE EXCEPTION 'Clave inválida';
  END IF;
  RETURN QUERY
  UPDATE personas SET nombre = trim(p_nombre), updated_at = now() WHERE id = v_id
  RETURNING id, slug, edit_key, nombre, created_at, updated_at;
END;
$$;

-- Verificar clave (para el cliente)
CREATE OR REPLACE FUNCTION verify_edit_key(p_slug text, p_edit_key text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN get_persona_id_if_valid(p_slug, p_edit_key) IS NOT NULL;
END;
$$;

-- Permitir que anon ejecute las funciones
GRANT EXECUTE ON FUNCTION get_persona_id_if_valid(text, text) TO anon;
GRANT EXECUTE ON FUNCTION verify_edit_key(text, text) TO anon;
GRANT EXECUTE ON FUNCTION create_tarea_for_persona(text, text, text, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION update_tarea_rpc(text, text, uuid, text, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION delete_tarea_rpc(text, text, uuid) TO anon;
GRANT EXECUTE ON FUNCTION add_interesado_rpc(text, text, uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION remove_interesado_rpc(text, text, uuid) TO anon;
GRANT EXECUTE ON FUNCTION update_persona_rpc(text, text, text) TO anon;
