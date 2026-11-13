import { createClient } from "@/lib/supabase/client";
import { mensajeSupabase } from "@/lib/supabase/errores";
import type { CargaCombustible } from "@/types/database";
import type { CargaCombustibleInput } from "@/lib/validaciones/combustible";

const SELECT_CARGA =
  "*, vehiculos (id, numero_vehiculo, patente, marca, modelo, kilometraje_actual), tecnicos (id, nombre, apellido)";

export async function listarCargas(): Promise<CargaCombustible[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cargas_combustible")
    .select(SELECT_CARGA)
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(mensajeSupabase(error));
  }
  return (data ?? []) as CargaCombustible[];
}

export async function listarCargasPorVehiculo(
  vehiculoId: string
): Promise<CargaCombustible[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cargas_combustible")
    .select(SELECT_CARGA)
    .eq("vehiculo_id", vehiculoId)
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(mensajeSupabase(error));
  }
  return (data ?? []) as CargaCombustible[];
}

export async function crearCarga(
  input: CargaCombustibleInput
): Promise<CargaCombustible> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cargas_combustible")
    .insert(input)
    .select(SELECT_CARGA)
    .single();

  if (error) {
    throw new Error(mensajeSupabase(error));
  }
  return data as CargaCombustible;
}

export async function actualizarCarga(
  id: string,
  input: CargaCombustibleInput
): Promise<CargaCombustible> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cargas_combustible")
    .update(input)
    .eq("id", id)
    .select(SELECT_CARGA)
    .single();

  if (error) {
    throw new Error(mensajeSupabase(error));
  }
  return data as CargaCombustible;
}
