import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data, error } = await supabase
    .from("meeting_state")
    .select("image_url, model_url, video_url") // Traemos todos
    .eq("id", 1)
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const { type, url } = body; // 'image', 'model' o 'video'

  // Mapeamos el tipo a la columna correspondiente
  const updateData: any = {};
  if (type === "image") updateData.image_url = url;
  if (type === "model") updateData.model_url = url;
  if (type === "video") updateData.video_url = url;

  const { error } = await supabase
    .from("meeting_state")
    .update(updateData)
    .eq("id", 1);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ patched: true });
}
