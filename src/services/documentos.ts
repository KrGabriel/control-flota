import { createClient } from "@/lib/supabase/client";
import { mensajeSupabase } from "@/lib/supabase/errores";
import { estadoVencimiento } from "@/lib/formato";
import type { EstadoDocumento } from "@/types/database";
import type { DocumentoInput } from "@/lib/validaciones/documento";

export interface DocumentoEquipamiento {
  id: string;
  vehiculo_id: string;
  elemento: string;
  tipo: "documento_vencimiento" | "disponible_fisica";
  fecha_vencimiento: string | null;
  estado_documento: EstadoDocumento | null;
  estado_fisica: "disponible" | "faltante" | "requiere_revision" | null;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
}

export function calcularEstadoDocumento(
  fecha: string | null
): EstadoDocumento {
  const estado = estadoVencimiento(fecha);
  return estado === "sin_dato" ? "vigente" : estado;
}

export async function listarDocumentosPorVehiculo(
  vehiculoId: string
): Promise<DocumentoEquipamiento[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("documentos_equipamiento")
    .select("*")
    .eq("vehiculo_id", vehiculoId)
    .order("elemento");

  if (error) {
    throw new Error(mensajeSupabase(error));
  }
  return (data ?? []) as DocumentoEquipamiento[];
}

export async function guardarDocumento(
  vehiculoId: string,
  input: DocumentoInput
): Promise<DocumentoEquipamiento> {
  const supabase = createClient();
  const payload = {
    vehiculo_id: vehiculoId,
    elemento: input.elemento,
    tipo: input.tipo,
    fecha_vencimiento:
      input.tipo === "documento_vencimiento" ? input.fecha_vencimiento : null,
    estado_documento:
      input.tipo === "documento_vencimiento"
        ? calcularEstadoDocumento(input.fecha_vencimiento)
        : null,
    estado_fisica:
      input.tipo === "disponible_fisica" ? input.estado_fisica : null,
    observaciones: input.observaciones,
  };

  const { data, error } = await supabase
    .from("documentos_equipamiento")
    .upsert(payload, { onConflict: "vehiculo_id,elemento" })
    .select("*")
    .single();

  if (error) {
    throw new Error(mensajeSupabase(error));
  }
  return data as DocumentoEquipamiento;
}

export async function eliminarDocumento(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("documentos_equipamiento")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(mensajeSupabase(error));
  }
}
