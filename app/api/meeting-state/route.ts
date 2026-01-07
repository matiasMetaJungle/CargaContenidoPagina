import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data, error } = await supabase
    .from("meeting_state")
    .select("media_type, media_url")
    .eq("id", 1)
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}

export async function PATCH(req: Request) {
  const body = await req.json();

  const { mediaType, mediaUrl } = body;

  const { error } = await supabase
    .from("meeting_state")
    .update({
      media_type: mediaType,
      media_url: mediaUrl,
    })
    .eq("id", 1);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ patched: true });
}
