import { createClient } from "@/lib/supabase/client";
import { mensajeSupabase } from "@/lib/supabase/errores";
import type { Mantenimiento } from "@/types/database";
import type { MantenimientoInput } from "@/lib/validaciones/mantenimiento";

const SELECT_MANTENIMIENTO =
  "*, vehiculos (id, numero_vehiculo, patente, marca, modelo, kilometraje_actual), categorias_mantenimiento (id, nombre)";

export async function listarMantenimientos(): Promise<Mantenimiento[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("mantenimientos")
    .select(SELECT_MANTENIMIENTO)
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(mensajeSupabase(error));
  }
  return (data ?? []) as Mantenimiento[];
}

export async function listarMantenimientosPorVehiculo(
  vehiculoId: string
): Promise<Mantenimiento[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("mantenimientos")
    .select(SELECT_MANTENIMIENTO)
    .eq("vehiculo_id", vehiculoId)
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(mensajeSupabase(error));
  }
  return (data ?? []) as Mantenimiento[];
}

export async function crearMantenimiento(
  input: MantenimientoInput
): Promise<Mantenimiento> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("mantenimientos")
    .insert(input)
    .select(SELECT_MANTENIMIENTO)
    .single();

  if (error) {
    throw new Error(mensajeSupabase(error));
  }
  return data as Mantenimiento;
}

export async function actualizarMantenimiento(
  id: string,
  input: MantenimientoInput
): Promise<Mantenimiento> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("mantenimientos")
    .update(input)
    .eq("id", id)
    .select(SELECT_MANTENIMIENTO)
    .single();

  if (error) {
    throw new Error(mensajeSupabase(error));
  }
  return data as Mantenimiento;
}
