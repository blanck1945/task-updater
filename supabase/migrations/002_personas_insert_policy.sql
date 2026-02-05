-- Permitir crear personas desde el cliente (navegador) con la clave anon/publishable
DROP POLICY IF EXISTS "personas_insert" ON personas;
CREATE POLICY "personas_insert" ON personas FOR INSERT WITH CHECK (true);
