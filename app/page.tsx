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
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchImages();
  }, []);

  // 🔹 LISTAR IMÁGENES
  const fetchImages = async () => {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(FOLDER, {
        limit: 100,
        sortBy: { column: "created_at", order: "desc" },
      });

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

  // 🔹 SUBIR IMAGEN
  const uploadImage = async (file: File) => {
    setUploading(true);

    const fileName = `${Date.now()}_${file.name}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(`${FOLDER}/${fileName}`, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error(error);
      alert("Error subiendo imagen");
    }

    setUploading(false);
    fetchImages();
  };

  // 🔹 MOSTRAR EN UNITY (USANDO API)
  const showInUnity = async (url: string) => {
    setSending(true);

    const res = await fetch("/api/meeting-state", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        currentImageUrl: url,
      }),
    });

    if (!res.ok) {
      console.error(await res.text());
      alert("Error enviando imagen a Unity");
    }

    setSending(false);
  };

  // 🔹 BORRAR IMAGEN
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
    <main style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, marginBottom: 16 }}>
        Panel de Contenido – Reunión
      </h1>

      {/* 🔼 SUBIR IMAGEN */}
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 16,
          marginBottom: 24,
        }}
      >
        <h2 style={{ marginBottom: 8 }}>Subir imagen</h2>

        <input
          type="file"
          accept="image/*"
          disabled={uploading}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              uploadImage(e.target.files[0]);
            }
          }}
        />

        {uploading && <p>Subiendo imagen...</p>}
      </div>

      {/* 🖼️ GALERÍA */}
      <h2 style={{ marginBottom: 12 }}>Imágenes disponibles</h2>

      {sending && <p>Enviando imagen a Unity...</p>}

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
