# Migraciones Supabase

## Opción 1: Supabase CLI (recomendado)

Con la CLI podés aplicar migraciones sin pegar SQL a mano.

### Instalación

- **Windows (scoop):** `scoop bucket add supabase https://github.com/supabase/scoop-bucket.git` y `scoop install supabase`
- **npm (global):** `npm install -g supabase`
- O descargar desde: https://github.com/supabase/cli/releases

### Primera vez (proyecto remoto en Cloud)

No hace falta instalar la CLI globalmente: el proyecto usa `npx supabase`.

1. **Login** (abre el navegador; hacelo en tu terminal):
   ```bash
   npx supabase login
   ```

2. **Vincular tu proyecto**
   ```bash
   npx supabase link --project-ref TU_PROJECT_REF
   ```
   El `TU_PROJECT_REF` es el ID del proyecto en la URL del dashboard:  
   `https://supabase.com/dashboard/project/TU_PROJECT_REF`  
   (ej. `wkvkkudikicqphiysfbz`).

3. **Aplicar migraciones**
   ```bash
   npm run db:push
   ```
   Eso ejecuta en orden los `.sql` de `supabase/migrations/` que aún no estén aplicados en la base remota.

### Si ya corriste 001, 002, 003 a mano

La CLI registra qué migraciones ya se aplicaron. Si aplicaste 001–003 manualmente, al hacer `db push` intentará correr 001 de nuevo y puede fallar (tablas/policies ya existen).

**Opción A – Marcar 001–003 como aplicadas**

En Supabase → SQL Editor ejecutá una sola vez:

```sql
-- Reemplazá los nombres si tus archivos tienen otro nombre
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES
  ('001_schema'),
  ('002_personas_insert_policy'),
  ('003_rpc_edicion')
ON CONFLICT (version) DO NOTHING;
```

Después ejecutá `npm run db:push` (o `supabase db push`). Solo se aplicará 004 (y las que agregues más adelante).

**Opción B – Solo correr la nueva (004) a mano**

Si preferís no usar la CLI, seguí entrando a Supabase → SQL Editor y pegando solo el contenido de `supabase/migrations/004_timeline_estado_responsables.sql` (y de cualquier migración nueva que agregues).

### Desarrollo local (opcional)

Con Docker instalado podés levantar Supabase en tu máquina y aplicar todas las migraciones desde cero:

```bash
supabase start
supabase db reset
```

`db reset` borra la DB local y vuelve a aplicar todos los archivos de `supabase/migrations/` en orden. La URL y claves locales las muestra `supabase start` (y en `.env` podés apuntar a ese proyecto local para probar).

---

## Opción 2: SQL manual (sin CLI)

- **Desde cero:** ejecutá en Supabase SQL Editor el contenido de `supabase/full_schema.sql` (borra y recrea tablas + RPCs).
- **Solo cambios nuevos:** ejecutá el contenido del archivo que corresponda, por ejemplo `supabase/migrations/004_timeline_estado_responsables.sql`.

---

## Resumen de scripts npm

| Script        | Comando real              | Uso                                                          |
|---------------|---------------------------|--------------------------------------------------------------|
| `npm run db:push`  | `npx supabase db push`  | Aplicar migraciones pendientes al proyecto vinculado (Cloud) |
| `npm run db:reset` | `npx supabase db reset` | Reiniciar DB local y aplicar todas las migraciones           |
| `npm run db:start` | `npx supabase start`   | Levantar Supabase local (Docker)                             |
