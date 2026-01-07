import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 1. Definimos las cabeceras para reutilizarlas
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // O "https://reuniontest.vercel.app" para más seguridad
  "Access-Control-Allow-Methods": "GET, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// 2. Manejador para la petición OPTIONS (crucial para CORS)
export async function OPTIONS() {
  return Response.json({}, { headers: corsHeaders });
}

export async function GET() {
  const { data, error } = await supabase
    .from("meeting_state")
    .select("image_url, model_url, video_url")
    .eq("id", 1)
    .single();

  if (error) {
    return Response.json({ error: error.message }, { 
      status: 500, 
      headers: corsHeaders // Siempre incluir headers
    });
  }

  return Response.json(data, { headers: corsHeaders });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const { type, url } = body;

  const updateData: any = {};
  if (type === "image") updateData.image_url = url;
  if (type === "model") updateData.model_url = url;
  if (type === "video") updateData.video_url = url;

  const { error } = await supabase
    .from("meeting_state")
    .update(updateData)
    .eq("id", 1);

  if (error) {
    return Response.json({ error: error.message }, { 
      status: 500, 
      headers: corsHeaders 
    });
  }

  return Response.json({ patched: true }, { headers: corsHeaders });
}