"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
// Importamos dynamic de Next.js para carga segura en cliente
import dynamic from "next/dynamic";

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
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Marcamos que ya estamos en el cliente
    setIsClient(true);
    // Importamos la librería solo aquí para evitar errores de SSR
    import("@google/model-viewer");
    
    fetchImages();
    fetchModels();
  }, []);

  const fetchImages = async () => {
    const { data } = await supabase.storage.from(BUCKET).list("images", { limit: 100 });
    if (!data) return;
    setImages(data.map((file) => ({
      name: file.name,
      url: supabase.storage.from(BUCKET).getPublicUrl(`images/${file.name}`).data.publicUrl,
    })));
  };

  const fetchModels = async () => {
    const { data } = await supabase.storage.from(BUCKET).list("models", { limit: 100 });
    if (!data) return;
    setModels(data.map((file) => ({
      name: file.name,
      url: supabase.storage.from(BUCKET).getPublicUrl(`models/${file.name}`).data.publicUrl,
    })));
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    await supabase.storage.from(BUCKET).upload(`images/${Date.now()}_${file.name}`, file);
    setUploading(false);
    fetchImages();
  };

  const uploadModel = async (file: File) => {
    setUploading(true);
    await supabase.storage.from(BUCKET).upload(`models/${Date.now()}_${file.name}`, file);
    setUploading(false);
    fetchModels();
  };

  const showInUnity = async (url: string, type: "image" | "model") => {
    setSending(true);
    await fetch("/api/meeting-state", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mediaType: type, mediaUrl: url }),
    });
    setSending(false);
  };

  const deleteMedia = async (folder: "images" | "models", name: string) => {
    if (!confirm("¿Seguro?")) return;
    await supabase.storage.from(BUCKET).remove([`${folder}/${name}`]);
    folder === "images" ? fetchImages() : fetchModels();
  };

  return (
    <main style={styles.main}>
      <h1 style={styles.title}>Panel de Contenido – Reunión</h1>

      <section style={styles.section}>
        <UploadBlock title="Subir imagen" accept="image/*" onUpload={uploadImage} uploading={uploading} />
        <UploadBlock title="Subir modelo 3D (.glb)" accept=".glb" onUpload={uploadModel} uploading={uploading} />
      </section>

      {sending && <p style={{ color: "#38bdf8", marginBottom: 16 }}>Enviando a Unity...</p>}

      <h2 style={styles.subtitle}>Imágenes</h2>
      <Grid>
        {images.map((img) => (
          <Card key={img.name}>
            <img src={img.url} style={styles.image} alt={img.name} />
            <ActionButtons>
              <Primary onClick={() => showInUnity(img.url, "image")}>Mostrar en Unity</Primary>
              <Danger onClick={() => deleteMedia("images", img.name)}>Borrar</Danger>
            </ActionButtons>
          </Card>
        ))}
      </Grid>

      <h2 style={styles.subtitle}>Modelos 3D</h2>
      <Grid>
        {models.map((model) => (
          <Card key={model.name}>
            <div style={styles.modelWrapper}>
              {/* Solo renderizamos el model-viewer si estamos en el cliente */}
              {isClient ? (
                React.createElement("model-viewer", {
                  src: model.url,
                  alt: model.name,
                  "auto-rotate": "",
                  "camera-controls": "",
                  "shadow-intensity": "1",
                  style: styles.modelViewer,
                } as any)
              ) : (
                <div style={{ color: "#475569", padding: 20 }}>Cargando visor...</div>
              )}
            </div>
            <p style={styles.modelLabel}>{model.name}</p>
            <ActionButtons>
              <Primary onClick={() => showInUnity(model.url, "model")}>Mostrar en Unity</Primary>
              <Danger onClick={() => deleteMedia("models", model.name)}>Borrar</Danger>
            </ActionButtons>
          </Card>
        ))}
      </Grid>
    </main>
  );
}

// --- Componentes UI y Estilos (Igual que antes) ---
const UploadBlock = ({ title, accept, onUpload, uploading }: any) => (
  <div style={styles.upload}>
    <h3 style={{ marginBottom: 10, fontSize: 16 }}>{title}</h3>
    <input type="file" accept={accept} disabled={uploading} onChange={(e) => e.target.files && onUpload(e.target.files[0])} />
  </div>
);

const Grid = ({ children }: any) => <div style={styles.grid}>{children}</div>;
const Card = ({ children }: any) => <div style={styles.card}>{children}</div>;
const ActionButtons = ({ children }: any) => <div style={{ display: "flex", gap: 8, marginTop: 12 }}>{children}</div>;
const Primary = ({ children, ...props }: any) => <button {...props} style={styles.primary}>{children}</button>;
const Danger = ({ children, ...props }: any) => <button {...props} style={styles.danger}>{children}</button>;

const styles: any = {
  main: { padding: 24, maxWidth: 1200, margin: "0 auto", color: "#e5e7eb", fontFamily: "sans-serif" },
  title: { fontSize: 28, marginBottom: 20, fontWeight: "bold" },
  subtitle: { marginTop: 40, marginBottom: 16, fontSize: 20, borderBottom: "1px solid #1e293b", paddingBottom: 8 },
  section: { display: "flex", gap: 24, marginBottom: 32, flexWrap: "wrap" },
  upload: { padding: 20, borderRadius: 12, background: "#0f172a", border: "1px solid #1e293b", flex: 1, minWidth: "300px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 },
  card: { background: "#020617", border: "1px solid #1e293b", borderRadius: 12, padding: 12, display: "flex", flexDirection: "column" },
  image: { width: "100%", height: 160, objectFit: "cover", borderRadius: 8 },
  modelWrapper: { width: "100%", height: 160, background: "#0f172a", borderRadius: 8, overflow: "hidden", display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modelViewer: { width: "100%", height: "100%", outline: "none" },
  modelLabel: { fontSize: 12, marginTop: 8, color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  primary: { flex: 2, background: "#2563eb", color: "white", border: "none", padding: "8px 4px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: "600" },
  danger: { flex: 1, background: "#dc2626", color: "white", border: "none", padding: "8px 4px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: "600" },
};