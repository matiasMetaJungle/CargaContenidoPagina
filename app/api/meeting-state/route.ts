export const runtime = "nodejs";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data, error } = await supabase
    .from("meeting_state")
    .select("current_image_url")
    .eq("id", 1)
    .single();

  if (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return Response.json(data);
}

export async function PATCH(req: Request) {
  const { currentImageUrl } = await req.json();

  const { error } = await supabase
    .from("meeting_state")
    .update({ current_image_url: currentImageUrl })
    .eq("id", 1);

  if (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return Response.json({ ok: true });
}
