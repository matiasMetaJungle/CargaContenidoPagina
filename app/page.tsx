"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type MediaItem = {
  name: string;
  url: string;
};

const BUCKET = "meeting-media";

export default function Page() {
  const [images, setImages] = useState<MediaItem[]>([]);
  const [models, setModels] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchImages();
    fetchModels();
  }, []);

  // ===============================
  // 📃 LISTAR IMÁGENES
  // ===============================
  const fetchImages = async () => {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list("images", { limit: 100 });

    if (error) {
      console.error(error);
      return;
    }

    setImages(
      data.map((file) => ({
        name: file.name,
        url: supabase.storage
          .from(BUCKET)
          .getPublicUrl(`images/${file.name}`).data.publicUrl,
      }))
    );
  };

  // ===============================
  // 📃 LISTAR MODELOS GLB
  // ===============================
  const fetchModels = async () => {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list("models", { limit: 100 });

    if (error) {
      console.error(error);
      return;
    }

    setModels(
      data.map((file) => ({
        name: file.name,
        url: supabase.storage
          .from(BUCKET)
          .getPublicUrl(`models/${file.name}`).data.publicUrl,
      }))
    );
  };

  // ===============================
  // 📤 SUBIR IMAGEN
  // ===============================
  const uploadImage = async (file: File) => {
    setUploading(true);

    const fileName = `${Date.now()}_${file.name}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(`images/${fileName}`, file);

    if (error) {
      console.error(error);
      alert("Error subiendo imagen");
    }

    setUploading(false);
    fetchImages();
  };

  // ===============================
  // 📤 SUBIR MODELO GLB
  // ===============================
  const uploadModel = async (file: File) => {
    setUploading(true);

    const fileName = `${Date.now()}_${file.name}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(`models/${fileName}`, file);

    if (error) {
      console.error(error);
      alert("Error subiendo modelo 3D");
    }

    setUploading(false);
    fetchModels();
  };

  // ===============================
  // 🚀 MOSTRAR EN UNITY (API)
  // ===============================
  const showInUnity = async (url: string, type: "image" | "model") => {
    setSending(true);

    const res = await fetch("/api/meeting-state", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mediaType: type,
        mediaUrl: url,
      }),
    });

    if (!res.ok) {
      console.error(await res.text());
      alert("Error enviando a Unity");
    }

    setSending(false);
  };

  return (
    <main style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, marginBottom: 20 }}>
        Panel de Contenido – Reunión
      </h1>

      {/* =============================== */}
      {/* 📤 SUBIR IMAGEN */}
      {/* =============================== */}
      <section style={{ marginBottom: 24 }}>
        <h2>Subir imagen</h2>
        <input
          type="file"
          accept="image/*"
          disabled={uploading}
          onChange={(e) => e.target.files && uploadImage(e.target.files[0])}
        />
      </section>

      {/* =============================== */}
      {/* 📤 SUBIR MODELO */}
      {/* =============================== */}
      <section style={{ marginBottom: 32 }}>
        <h2>Subir modelo 3D (.glb)</h2>
        <input
          type="file"
          accept=".glb"
          disabled={uploading}
          onChange={(e) => e.target.files && uploadModel(e.target.files[0])}
        />
      </section>

      {sending && <p>Enviando contenido a Unity...</p>}

      {/* =============================== */}
      {/* 🖼️ IMÁGENES */}
      {/* =============================== */}
      <h2>Imágenes</h2>
      <Grid>
        {images.map((img) => (
          <Card key={img.name}>
            <img src={img.url} style={{ height: 140 }} />
            <button onClick={() => showInUnity(img.url, "image")}>
              Mostrar en Unity
            </button>
          </Card>
        ))}
      </Grid>

      {/* =============================== */}
      {/* 🧊 MODELOS */}
      {/* =============================== */}
      <h2 style={{ marginTop: 32 }}>Modelos 3D</h2>
      <Grid>
        {models.map((model) => (
          <Card key={model.name}>
            <p>{model.name}</p>
            <button onClick={() => showInUnity(model.url, "model")}>
              Mostrar en Unity
            </button>
          </Card>
        ))}
      </Grid>
    </main>
  );
}

// ===============================
// 🎨 COMPONENTES SIMPLES
// ===============================
const Grid = ({ children }: any) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
      gap: 16,
    }}
  >
    {children}
  </div>
);

const Card = ({ children }: any) => (
  <div
    style={{
      border: "1px solid #ddd",
      borderRadius: 8,
      padding: 12,
    }}
  >
    {children}
  </div>
);
