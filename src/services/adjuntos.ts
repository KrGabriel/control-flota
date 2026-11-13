import { createClient } from "@/lib/supabase/client";
import { mensajeSupabase } from "@/lib/supabase/errores";
import type { Adjunto } from "@/types/database";

export const BUCKET_ADJUNTOS = "documentos-vehiculos";

const SELECT_ADJUNTO = "*";

export async function listarAdjuntos(
  entidad: Adjunto["entidad"],
  entidadId: string
): Promise<Adjunto[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("adjuntos")
    .select(SELECT_ADJUNTO)
    .eq("entidad", entidad)
    .eq("entidad_id", entidadId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(mensajeSupabase(error));
  }
  return (data ?? []) as Adjunto[];
}

export async function subirAdjunto(
  entidad: Adjunto["entidad"],
  entidadId: string,
  file: File
): Promise<Adjunto> {
  const supabase = createClient();
  const id = crypto.randomUUID();
  const limpio = file.name.replace(/[^\w.\-() ]+/g, "_");
  const path = `${entidad}/${entidadId}/${id}-${limpio}`;

  const { error: errorUpload } = await supabase.storage
    .from(BUCKET_ADJUNTOS)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
  if (errorUpload) {
    throw new Error(mensajeSupabase(errorUpload));
  }

  const registro = {
    entidad,
    entidad_id: entidadId,
    nombre_archivo: file.name,
    path_storage: path,
    tipo_mime: file.type || null,
    tamano_bytes: file.size,
  };
  const { data, error } = await supabase
    .from("adjuntos")
    .insert(registro)
    .select(SELECT_ADJUNTO)
    .single();

  if (error) {
    await supabase.storage.from(BUCKET_ADJUNTOS).remove([path]);
    throw new Error(mensajeSupabase(error));
  }
  return data as Adjunto;
}

/** URL firmada temporal (1 hora) para descargar o mostrar el archivo. */
export async function obtenerUrlAdjunto(path: string): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(BUCKET_ADJUNTOS)
    .createSignedUrl(path, 3600);
  if (error || !data) {
    throw new Error(
      error ? mensajeSupabase(error) : "No se pudo generar el enlace del archivo."
    );
  }
  return data.signedUrl;
}

export async function eliminarAdjunto(adjunto: Adjunto): Promise<void> {
  const supabase = createClient();
  const { error: errorStorage } = await supabase.storage
    .from(BUCKET_ADJUNTOS)
    .remove([adjunto.path_storage]);
  if (errorStorage) {
    throw new Error(mensajeSupabase(errorStorage));
  }
  const { error } = await supabase
    .from("adjuntos")
    .delete()
    .eq("id", adjunto.id);
  if (error) {
    throw new Error(mensajeSupabase(error));
  }
}
