# Mi estado — Update status

Página personal de estado: cada persona tiene una URL pública donde muestra "en qué estoy", tareas, prioridad, estados e interesados. Solo el dueño puede editar (con clave); el resto solo ve.

## Stack

- Next.js 15 (App Router), TypeScript, Tailwind CSS
- Supabase (Postgres)

## Setup

1. **Variables de entorno**

   Copia `.env.local.example` a `.env.local` y rellena con tu proyecto Supabase:

   - `NEXT_PUBLIC_SUPABASE_URL`: URL del proyecto
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: anon key (lectura pública)
   - `SUPABASE_SERVICE_ROLE_KEY`: service role key (para mutaciones con validación de `edit_key`)

2. **Base de datos**

   En Supabase SQL Editor ejecuta el contenido de:

   `supabase/migrations/001_schema.sql`

   para crear las tablas `personas`, `tareas`, `tareas_interesados` y políticas RLS.

3. **Instalar y ejecutar**

   ```bash
   npm install
   npm run dev
   ```

   Abre [http://localhost:3000](http://localhost:3000).

## Uso

- **Landing (`/`)**: ingresar slug y ir a ver la página de esa persona, o "Crear mi página".
- **Crear (`/crear`)**: nombre, slug (URL) y clave de edición. Tras crear se redirige a `/p/tu-slug` con edición activa.
- **Página personal (`/p/[slug]`)**: vista pública con nombre, tareas (título, descripción, estado, prioridad, interesados). Quien tenga la clave puede hacer clic en "Editar esta página", introducir la clave y activar el modo edición (editar nombre, CRUD tareas, agregar/quitar interesados).

## Rutas

| Ruta        | Descripción                          |
|------------|--------------------------------------|
| `/`        | Landing: ver página por slug / crear |
| `/crear`   | Formulario crear persona (nombre, slug, clave) |
| `/p/[slug]`| Página pública de la persona y sus tareas |
