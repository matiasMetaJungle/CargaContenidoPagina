"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type ImageItem = {
  name: string;
  url: string;
  path: string;
};

export default function ImagePanel() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<ImageItem[]>([]);

  const FOLDER = "global";
  const BUCKET = "meeting-images";

  // 🔄 Cargar imágenes existentes
  const loadImages = async () => {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(FOLDER, {
        limit: 100,
        sortBy: { column: "created_at", order: "desc" },
      });

    if (error) {
      console.error("Error cargando imágenes", error);
      return;
    }

    const items: ImageItem[] = data.map((file) => {
      const path = `${FOLDER}/${file.name}`;
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

      return {
        name: file.name,
        path,
        url: data.publicUrl,
      };
    });

    setImages(items);
  };

  useEffect(() => {
    loadImages();
  }, []);

  // ⬆️ Subir imagen
  const uploadImage = async () => {
    if (!file) {
      alert("Selecciona una imagen");
      return;
    }

    setUploading(true);

    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}.${ext}`;
    const path = `${FOLDER}/${fileName}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file);

    if (error) {
      alert("Error subiendo imagen");
      console.error(error);
      setUploading(false);
      return;
    }

    setFile(null);
    setUploading(false);
    loadImages();
  };

  // 🗑️ Borrar imagen
  const deleteImage = async (path: string) => {
    const confirmDelete = confirm("¿Borrar esta imagen?");
    if (!confirmDelete) return;

    const { error } = await supabase.storage
      .from(BUCKET)
      .remove([path]);

    if (error) {
      alert("Error borrando imagen");
      console.error(error);
      return;
    }

    loadImages();
  };

  return (
    <div style={styles.container}>
      <h1>Panel de imágenes (Sala global)</h1>

      <div style={styles.card}>
        <h2>Subir imagen</h2>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <br /><br />
        <button onClick={uploadImage} disabled={uploading} style={styles.primary}>
          {uploading ? "Subiendo..." : "Subir imagen"}
        </button>
      </div>

      <div style={styles.gallery}>
        {images.map((img) => (
          <div key={img.path} style={styles.imageCard}>
            <img src={img.url} style={styles.image} />
            <button
              onClick={() => deleteImage(img.path)}
              style={styles.delete}
            >
              Borrar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: "100vh",
    background: "#155492ff",
    padding: 40,
    fontFamily: "Arial",
  },
  h4:{
    background: "red",
    color: "red",
  },
  card: {
    background: "white",
    padding: 20,
    borderRadius: 12,
    maxWidth: 400,
    marginBottom: 30,
    boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
  },
  primary: {
    background: "#2563eb",
    color: "white",
    padding: "10px 20px",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  },
  gallery: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: 20,
  },
  imageCard: {
    background: "white",
    padding: 10,
    borderRadius: 10,
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
  },
  image: {
    width: "100%",
    borderRadius: 8,
    marginBottom: 10,
  },
  delete: {
    background: "#dc2626",
    color: "white",
    border: "none",
    padding: "6px 12px",
    borderRadius: 6,
    cursor: "pointer",
    width: "100%",
  },
};
