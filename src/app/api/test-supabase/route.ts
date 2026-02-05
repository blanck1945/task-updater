import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    return NextResponse.json({ ok: false, error: "Falta NEXT_PUBLIC_SUPABASE_URL en .env" }, { status: 500 });
  }
  try {
    const res = await fetch(`${url}/rest/v1/`, {
      method: "HEAD",
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "", Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""}` },
    });
    return NextResponse.json({
      ok: true,
      url,
      status: res.status,
      message: "Conexión a Supabase OK. Si createPersona sigue fallando, probá borrar la carpeta .next y reiniciar sin Turbopack.",
    });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    const cause = err.cause instanceof Error ? err.cause : null;
    return NextResponse.json(
      {
        ok: false,
        error: err.message,
        cause: cause?.message ?? String(err.cause),
        url,
      },
      { status: 500 }
    );
  }
}
