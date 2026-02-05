-- ============================================================
-- ESQUEMA COMPLETO: tablas, políticas RLS y funciones RPC
-- Ejecutá todo en Supabase → SQL Editor → New query → Run
-- ============================================================

-- 1) Borrar funciones RPC (si existen)
DROP FUNCTION IF EXISTS verify_edit_key(text, text);
DROP FUNCTION IF EXISTS update_persona_rpc(text, text, text);
DROP FUNCTION IF EXISTS remove_interesado_rpc(text, text, uuid);
DROP FUNCTION IF EXISTS add_interesado_rpc(text, text, uuid, text);
DROP FUNCTION IF EXISTS delete_tarea_rpc(text, text, uuid);
DROP FUNCTION IF EXISTS update_tarea_rpc(text, text, uuid, text, text, text, text);
DROP FUNCTION IF EXISTS create_tarea_for_persona(text, text, text, text, text, text);
DROP FUNCTION IF EXISTS get_persona_id_if_valid(text, text);

-- 2) Borrar tablas (orden por foreign keys)
DROP TABLE IF EXISTS tareas_interesados;
DROP TABLE IF EXISTS tareas;
DROP TABLE IF EXISTS personas;

-- 3) Tablas
CREATE TABLE personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  edit_key TEXT NOT NULL,
  nombre TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tareas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  estado TEXT NOT NULL DEFAULT 'por_hacer' CHECK (estado IN ('por_hacer', 'en_curso', 'bloqueado', 'hecho')),
  prioridad TEXT NOT NULL DEFAULT 'media' CHECK (prioridad IN ('alta', 'media', 'baja')),
  orden INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tareas_persona_id ON tareas(persona_id);
CREATE INDEX idx_tareas_orden ON tareas(persona_id, orden);

CREATE TABLE tareas_interesados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarea_id UUID NOT NULL REFERENCES tareas(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL
);

CREATE INDEX idx_tareas_interesados_tarea_id ON tareas_interesados(tarea_id);

-- 4) RLS
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tareas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tareas_interesados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "personas_select" ON personas FOR SELECT USING (true);
CREATE POLICY "tareas_select" ON tareas FOR SELECT USING (true);
CREATE POLICY "tareas_interesados_select" ON tareas_interesados FOR SELECT USING (true);
CREATE POLICY "personas_insert" ON personas FOR INSERT WITH CHECK (true);

-- 5) Funciones RPC
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

GRANT EXECUTE ON FUNCTION get_persona_id_if_valid(text, text) TO anon;
GRANT EXECUTE ON FUNCTION verify_edit_key(text, text) TO anon;
GRANT EXECUTE ON FUNCTION create_tarea_for_persona(text, text, text, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION update_tarea_rpc(text, text, uuid, text, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION delete_tarea_rpc(text, text, uuid) TO anon;
GRANT EXECUTE ON FUNCTION add_interesado_rpc(text, text, uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION remove_interesado_rpc(text, text, uuid) TO anon;
GRANT EXECUTE ON FUNCTION update_persona_rpc(text, text, text) TO anon;
