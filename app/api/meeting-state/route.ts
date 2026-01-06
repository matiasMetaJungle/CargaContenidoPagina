export const runtime = "nodejs";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  return Response.json({ ok: true });
}

export async function PATCH(req: Request) {
  return Response.json({ patched: true });
}
