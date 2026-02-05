-- Tabla personas (dueños de página)
CREATE TABLE IF NOT EXISTS personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  edit_key TEXT NOT NULL,
  nombre TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla tareas
CREATE TABLE IF NOT EXISTS tareas (
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

CREATE INDEX IF NOT EXISTS idx_tareas_persona_id ON tareas(persona_id);
CREATE INDEX IF NOT EXISTS idx_tareas_orden ON tareas(persona_id, orden);

-- Tabla interesados por tarea
CREATE TABLE IF NOT EXISTS tareas_interesados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarea_id UUID NOT NULL REFERENCES tareas(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tareas_interesados_tarea_id ON tareas_interesados(tarea_id);

-- Habilitar RLS (lectura pública de personas y tareas; escritura vía API con edit_key)
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tareas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tareas_interesados ENABLE ROW LEVEL SECURITY;

-- Políticas: lectura pública por slug (personas) y por persona_id (tareas)
DROP POLICY IF EXISTS "personas_select" ON personas;
DROP POLICY IF EXISTS "tareas_select" ON tareas;
DROP POLICY IF EXISTS "tareas_interesados_select" ON tareas_interesados;
CREATE POLICY "personas_select" ON personas FOR SELECT USING (true);
CREATE POLICY "tareas_select" ON tareas FOR SELECT USING (true);
CREATE POLICY "tareas_interesados_select" ON tareas_interesados FOR SELECT USING (true);

-- Las inserciones/updates se harán desde Next.js con service role (bypass RLS) validando edit_key
