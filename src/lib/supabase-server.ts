import { createClient } from "@supabase/supabase-js";
import { fetch } from "undici";

const ENV_MSG =
  "Configurá .env (o .env.local) con la URL y las claves de tu proyecto Supabase (Project Settings → API). Después reiniciá el servidor (npm run dev).";

export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error(`Faltan variables de Supabase. ${ENV_MSG}`);
  }
  if (!url.includes(".supabase.co")) {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL debe ser la URL de tu proyecto (Project Settings → API), por ejemplo https://xxxxx.supabase.co. ${ENV_MSG}`
    );
  }
  return createClient(url, key, {
    global: { fetch: fetch as unknown as typeof globalThis.fetch },
  });
}
