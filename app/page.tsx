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
    const { data } = await supabase.storage
      .from(BUCKET)
      .list("images", { limit: 100 });

    if (!data) return;

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
  // 📃 LISTAR MODELOS
  // ===============================
  const fetchModels = async () => {
    const { data } = await supabase.storage
      .from(BUCKET)
      .list("models", { limit: 100 });

    if (!data) return;

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
    await supabase.storage
      .from(BUCKET)
      .upload(`images/${Date.now()}_${file.name}`, file);
    setUploading(false);
    fetchImages();
  };

  // ===============================
  // 📤 SUBIR MODELO
  // ===============================
  const uploadModel = async (file: File) => {
    setUploading(true);
    await supabase.storage
      .from(BUCKET)
      .upload(`models/${Date.now()}_${file.name}`, file);
    setUploading(false);
    fetchModels();
  };

  // ===============================
  // 🚀 MOSTRAR EN UNITY
  // ===============================
  const showInUnity = async (url: string, type: "image" | "model") => {
    setSending(true);

    await fetch("/api/meeting-state", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mediaType: type,
        mediaUrl: url,
      }),
    });

    setSending(false);
  };

  // ===============================
  // 🗑️ BORRAR MEDIA
  // ===============================
  const deleteMedia = async (
    folder: "images" | "models",
    name: string
  ) => {
    const ok = confirm("¿Seguro que quieres borrar este contenido?");
    if (!ok) return;

    await supabase.storage
      .from(BUCKET)
      .remove([`${folder}/${name}`]);

    folder === "images" ? fetchImages() : fetchModels();
  };

  return (
    <main style={styles.main}>
      <h1 style={styles.title}>Panel de Contenido – Reunión</h1>

      {/* SUBIDAS */}
      <section style={styles.section}>
        <UploadBlock
          title="Subir imagen"
          accept="image/*"
          onUpload={uploadImage}
          uploading={uploading}
        />

        <UploadBlock
          title="Subir modelo 3D (.glb)"
          accept=".glb"
          onUpload={uploadModel}
          uploading={uploading}
        />
      </section>

      {sending && <p style={{ color: "#38bdf8" }}>Enviando a Unity...</p>}

      {/* IMÁGENES */}
      <h2 style={styles.subtitle}>Imágenes</h2>
      <Grid>
        {images.map((img) => (
          <Card key={img.name}>
            <img src={img.url} style={styles.image} />
            <ActionButtons>
              <Primary onClick={() => showInUnity(img.url, "image")}>
                Mostrar en Unity
              </Primary>
              <Danger onClick={() => deleteMedia("images", img.name)}>
                Borrar
              </Danger>
            </ActionButtons>
          </Card>
        ))}
      </Grid>

      {/* MODELOS */}
      <h2 style={styles.subtitle}>Modelos 3D</h2>
      <Grid>
        {models.map((model) => (
          <Card key={model.name}>
            <p style={{ fontSize: 14 }}>{model.name}</p>
            <ActionButtons>
              <Primary onClick={() => showInUnity(model.url, "model")}>
                Mostrar en Unity
              </Primary>
              <Danger onClick={() => deleteMedia("models", model.name)}>
                Borrar
              </Danger>
            </ActionButtons>
          </Card>
        ))}
      </Grid>
    </main>
  );
}

/* ===============================
   🎨 COMPONENTES UI
================================ */
const UploadBlock = ({ title, accept, onUpload, uploading }: any) => (
  <div style={styles.upload}>
    <h3>{title}</h3>
    <input
      type="file"
      accept={accept}
      disabled={uploading}
      onChange={(e) => e.target.files && onUpload(e.target.files[0])}
    />
  </div>
);

const Grid = ({ children }: any) => (
  <div style={styles.grid}>{children}</div>
);

const Card = ({ children }: any) => (
  <div style={styles.card}>{children}</div>
);

const ActionButtons = ({ children }: any) => (
  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>{children}</div>
);

const Primary = ({ children, ...props }: any) => (
  <button {...props} style={styles.primary}>{children}</button>
);

const Danger = ({ children, ...props }: any) => (
  <button {...props} style={styles.danger}>{children}</button>
);

/* ===============================
   🎨 ESTILOS
================================ */
const styles: any = {
  main: {
    padding: 24,
    maxWidth: 1200,
    margin: "0 auto",
    color: "#e5e7eb",
  },
  title: {
    fontSize: 28,
    marginBottom: 20,
  },
  subtitle: {
    marginTop: 32,
    marginBottom: 12,
  },
  section: {
    display: "flex",
    gap: 24,
    marginBottom: 32,
  },
  upload: {
    padding: 16,
    borderRadius: 10,
    background: "#0f172a",
    border: "1px solid #1e293b",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: 16,
  },
  card: {
    background: "#020617",
    border: "1px solid #1e293b",
    borderRadius: 10,
    padding: 12,
  },
  image: {
    width: "100%",
    height: 140,
    objectFit: "cover",
    borderRadius: 6,
  },
  primary: {
    flex: 1,
    background: "#2563eb",
    color: "white",
    border: "none",
    padding: 8,
    borderRadius: 6,
    cursor: "pointer",
  },
  danger: {
    flex: 1,
    background: "#dc2626",
    color: "white",
    border: "none",
    padding: 8,
    borderRadius: 6,
    cursor: "pointer",
  },
};
