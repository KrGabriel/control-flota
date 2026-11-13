import { createClient } from "@/lib/supabase/server";
import type { Asignacion, Vehiculo } from "@/types/database";

export async function obtenerVehiculoServidor(
  id: string
): Promise<Vehiculo | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehiculos")
    .select("*, tecnicos (id, nombre, apellido)")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }
  return data as Vehiculo;
}

export async function listarAsignacionesServidor(
  vehiculoId: string
): Promise<Asignacion[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("asignaciones")
    .select(
      "*, tecnico_anterior:tecnicos!asignaciones_tecnico_anterior_id_fkey (id, nombre, apellido), tecnico_nuevo:tecnicos!asignaciones_tecnico_nuevo_id_fkey (id, nombre, apellido)"
    )
    .eq("vehiculo_id", vehiculoId)
    .order("fecha_inicio", { ascending: false });

  if (error) {
    return [];
  }
  return (data ?? []) as Asignacion[];
}
