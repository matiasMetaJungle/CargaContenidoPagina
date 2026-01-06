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
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}

export async function PATCH(req: Request) {
  const body = await req.json();

  await supabase
    .from("meeting_state")
    .update({
      current_image_url: body.currentImageUrl
    })
    .eq("id", 1);

  return Response.json({ ok: true });
}
