import { createClient } from "@/lib/supabase/client";
import { mensajeSupabase } from "@/lib/supabase/errores";
import type { EstadoDocumento } from "@/types/database";

export interface Alerta {
  id: string;
  vehiculo_id: string | null;
  origen: string;
  referencia_id: string | null;
  nivel: EstadoDocumento;
  titulo: string;
  descripcion: string | null;
  fecha_alerta: string;
  resuelta: boolean;
  created_at: string;
  updated_at: string;
}

export async function listarAlertasPorVehiculo(
  vehiculoId: string
): Promise<Alerta[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("alertas")
    .select("*")
    .eq("vehiculo_id", vehiculoId)
    .order("fecha_alerta", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(mensajeSupabase(error));
  }
  return (data ?? []) as Alerta[];
}
