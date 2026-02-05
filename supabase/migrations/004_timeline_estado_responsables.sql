-- Timeline por tarea (bullets; el último = estado actual)
-- Estado flexible (texto libre)
-- Responsables / personas relacionadas

-- 1) Estado flexible: quitar CHECK de estado en tareas
ALTER TABLE tareas DROP CONSTRAINT IF EXISTS tareas_estado_check;
ALTER TABLE tareas ALTER COLUMN estado SET DEFAULT 'Por hacer';

-- 2) Tabla timeline (cada fila = un bullet de status)
CREATE TABLE IF NOT EXISTS tarea_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarea_id UUID NOT NULL REFERENCES tareas(id) ON DELETE CASCADE,
  contenido TEXT NOT NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tarea_timeline_tarea_id ON tarea_timeline(tarea_id);

-- 3) Tabla responsables (personas relacionadas / responsables de la tarea)
CREATE TABLE IF NOT EXISTS tareas_responsables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarea_id UUID NOT NULL REFERENCES tareas(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tareas_responsables_tarea_id ON tareas_responsables(tarea_id);

-- RLS
ALTER TABLE tarea_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE tareas_responsables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tarea_timeline_select" ON tarea_timeline FOR SELECT USING (true);
CREATE POLICY "tareas_responsables_select" ON tareas_responsables FOR SELECT USING (true);

-- RPC: añadir entrada al timeline
CREATE OR REPLACE FUNCTION add_timeline_entry_rpc(
  p_slug text,
  p_edit_key text,
  p_tarea_id uuid,
  p_contenido text
)
RETURNS SETOF tarea_timeline
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_persona_id uuid;
  v_ok boolean;
BEGIN
  v_persona_id := get_persona_id_if_valid(p_slug, p_edit_key);
  IF v_persona_id IS NULL THEN RAISE EXCEPTION 'Clave inválida'; END IF;
  SELECT EXISTS(SELECT 1 FROM tareas WHERE id = p_tarea_id AND persona_id = v_persona_id) INTO v_ok;
  IF NOT v_ok THEN RAISE EXCEPTION 'Tarea no encontrada'; END IF;
  UPDATE tareas SET estado = trim(p_contenido), updated_at = now() WHERE id = p_tarea_id;
  RETURN QUERY
  INSERT INTO tarea_timeline (tarea_id, contenido) VALUES (p_tarea_id, trim(p_contenido))
  RETURNING *;
END;
$$;

-- RPC: actualizar estado de tarea (y opcionalmente añadir al timeline)
CREATE OR REPLACE FUNCTION update_tarea_estado_rpc(p_slug text, p_edit_key text, p_tarea_id uuid, p_estado text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_persona_id uuid;
BEGIN
  v_persona_id := get_persona_id_if_valid(p_slug, p_edit_key);
  IF v_persona_id IS NULL THEN RAISE EXCEPTION 'Clave inválida'; END IF;
  UPDATE tareas SET estado = trim(p_estado), updated_at = now() WHERE id = p_tarea_id AND persona_id = v_persona_id;
  INSERT INTO tarea_timeline (tarea_id, contenido) VALUES (p_tarea_id, trim(p_estado));
END;
$$;

-- RPC: añadir responsable
CREATE OR REPLACE FUNCTION add_responsable_rpc(p_slug text, p_edit_key text, p_tarea_id uuid, p_nombre text)
RETURNS SETOF tareas_responsables
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_persona_id uuid;
  v_ok boolean;
BEGIN
  v_persona_id := get_persona_id_if_valid(p_slug, p_edit_key);
  IF v_persona_id IS NULL THEN RAISE EXCEPTION 'Clave inválida'; END IF;
  SELECT EXISTS(SELECT 1 FROM tareas WHERE id = p_tarea_id AND persona_id = v_persona_id) INTO v_ok;
  IF NOT v_ok THEN RAISE EXCEPTION 'Tarea no encontrada'; END IF;
  RETURN QUERY
  INSERT INTO tareas_responsables (tarea_id, nombre) VALUES (p_tarea_id, trim(p_nombre))
  RETURNING *;
END;
$$;

-- RPC: quitar responsable
CREATE OR REPLACE FUNCTION remove_responsable_rpc(p_slug text, p_edit_key text, p_responsable_id uuid)
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
  IF v_persona_id IS NULL THEN RAISE EXCEPTION 'Clave inválida'; END IF;
  SELECT tarea_id INTO v_tarea_id FROM tareas_responsables WHERE id = p_responsable_id;
  IF v_tarea_id IS NULL THEN RETURN; END IF;
  IF NOT EXISTS(SELECT 1 FROM tareas WHERE id = v_tarea_id AND persona_id = v_persona_id) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;
  DELETE FROM tareas_responsables WHERE id = p_responsable_id;
END;
$$;

GRANT EXECUTE ON FUNCTION add_timeline_entry_rpc(text, text, uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION update_tarea_estado_rpc(text, text, uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION add_responsable_rpc(text, text, uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION remove_responsable_rpc(text, text, uuid) TO anon;

-- Recrear update_tarea_rpc para que al cambiar estado se añada al timeline
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
  IF v_persona_id IS NULL THEN RAISE EXCEPTION 'Clave inválida'; END IF;
  IF p_estado IS NOT NULL AND trim(p_estado) <> '' THEN
    INSERT INTO tarea_timeline (tarea_id, contenido) VALUES (p_tarea_id, trim(p_estado));
  END IF;
  RETURN QUERY
  UPDATE tareas
  SET
    titulo = COALESCE(NULLIF(trim(p_titulo), ''), titulo),
    descripcion = CASE WHEN p_descripcion IS NOT NULL THEN p_descripcion ELSE descripcion END,
    estado = COALESCE(NULLIF(trim(p_estado), ''), estado),
    prioridad = COALESCE(NULLIF(trim(p_prioridad), ''), prioridad),
    updated_at = now()
  WHERE id = p_tarea_id AND persona_id = v_persona_id
  RETURNING *;
END;
$$;

-- Recrear create_tarea_for_persona para que inserte primera entrada en timeline
CREATE OR REPLACE FUNCTION create_tarea_for_persona(
  p_slug text,
  p_edit_key text,
  p_titulo text,
  p_descripcion text DEFAULT NULL,
  p_estado text DEFAULT 'Por hacer',
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
  v_tarea_id uuid;
BEGIN
  v_persona_id := get_persona_id_if_valid(p_slug, p_edit_key);
  IF v_persona_id IS NULL THEN RAISE EXCEPTION 'Clave inválida'; END IF;
  SELECT COALESCE(MAX(orden), -1) + 1 INTO v_orden FROM tareas WHERE persona_id = v_persona_id;
  INSERT INTO tareas (persona_id, titulo, descripcion, estado, prioridad, orden)
  VALUES (v_persona_id, p_titulo, COALESCE(trim(p_descripcion), NULL), COALESCE(trim(p_estado), 'Por hacer'), p_prioridad, v_orden)
  RETURNING id INTO v_tarea_id;
  INSERT INTO tarea_timeline (tarea_id, contenido) VALUES (v_tarea_id, COALESCE(trim(p_estado), 'Por hacer'));
  RETURN QUERY SELECT * FROM tareas WHERE id = v_tarea_id;
END;
$$;
