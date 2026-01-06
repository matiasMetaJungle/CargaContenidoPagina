"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type ImageItem = {
  name: string;
  url: string;
};

const BUCKET = "meeting-images";
const FOLDER = "global";

export default function Page() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(FOLDER, { limit: 100, sortBy: { column: "created_at", order: "desc" } });

    if (error) {
      console.error(error);
      return;
    }

    const mapped = data.map((file) => ({
      name: file.name,
      url: supabase.storage
        .from(BUCKET)
        .getPublicUrl(`${FOLDER}/${file.name}`).data.publicUrl,
    }));

    setImages(mapped);
  };

  const showInUnity = async (url: string) => {
    setLoading(true);

    const { error } = await supabase
      .from("meeting_state")
      .update({ current_image_url: url })
      .eq("id", 1);

    if (error) {
      console.error(error);
      alert("Error actualizando la imagen");
    }

    setLoading(false);
  };

  const deleteImage = async (name: string) => {
    const confirmDelete = confirm("¿Seguro que quieres borrar esta imagen?");
    if (!confirmDelete) return;

    const { error } = await supabase.storage
      .from(BUCKET)
      .remove([`${FOLDER}/${name}`]);

    if (error) {
      console.error(error);
      alert("Error borrando imagen");
      return;
    }

    fetchImages();
  };

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, marginBottom: 16 }}>
        Panel de Imágenes – Reunión
      </h1>

      {loading && <p>Enviando imagen a Unity...</p>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 16,
        }}
      >
        {images.map((img) => (
          <div
            key={img.name}
            style={{
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: 12,
            }}
          >
            <img
              src={img.url}
              alt={img.name}
              style={{
                width: "100%",
                height: 140,
                objectFit: "cover",
                borderRadius: 6,
                marginBottom: 8,
              }}
            />

            <button
              onClick={() => showInUnity(img.url)}
              style={{
                width: "100%",
                padding: 8,
                background: "#2563eb",
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                marginBottom: 6,
              }}
            >
              Mostrar en Unity
            </button>

            <button
              onClick={() => deleteImage(img.name)}
              style={{
                width: "100%",
                padding: 6,
                background: "#dc2626",
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              Borrar
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
