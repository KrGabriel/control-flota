import { createClient } from "@/lib/supabase/client";
import { mensajeSupabase } from "@/lib/supabase/errores";
import { sumarDias } from "@/lib/formato";
import type { Programacion } from "@/types/database";
import type { ProgramacionInput } from "@/lib/validaciones/mantenimiento";

const SELECT_PROGRAMACION =
  "*, vehiculos (id, numero_vehiculo, patente, marca, modelo, kilometraje_actual), categorias_mantenimiento (id, nombre)";

export function calcularEstimaciones(input: ProgramacionInput) {
  const proximaFecha =
    input.modo !== "kilometraje" &&
    input.fecha_ultimo_mantenimiento !== null &&
    input.intervalo_dias !== null
      ? sumarDias(input.fecha_ultimo_mantenimiento, input.intervalo_dias)
      : null;

  const proximoKm =
    input.modo !== "tiempo" &&
    input.kilometraje_ultimo_mantenimiento !== null &&
    input.intervalo_km !== null
      ? input.kilometraje_ultimo_mantenimiento + input.intervalo_km
      : null;

  return {
    proxima_fecha_estimada: proximaFecha,
    proximo_kilometraje_estimado: proximoKm,
  };
}

export async function listarProgramaciones(): Promise<Programacion[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("programaciones_mantenimiento")
    .select(SELECT_PROGRAMACION)
    .order("activo", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(mensajeSupabase(error));
  }
  return (data ?? []) as Programacion[];
}

export async function listarProgramacionesPorVehiculo(
  vehiculoId: string
): Promise<Programacion[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("programaciones_mantenimiento")
    .select(SELECT_PROGRAMACION)
    .eq("vehiculo_id", vehiculoId)
    .order("activo", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(mensajeSupabase(error));
  }
  return (data ?? []) as Programacion[];
}

export async function crearProgramacion(
  input: ProgramacionInput
): Promise<Programacion> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("programaciones_mantenimiento")
    .insert({ ...input, ...calcularEstimaciones(input) })
    .select(SELECT_PROGRAMACION)
    .single();

  if (error) {
    throw new Error(mensajeSupabase(error));
  }
  return data as Programacion;
}

export async function actualizarProgramacion(
  id: string,
  input: ProgramacionInput
): Promise<Programacion> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("programaciones_mantenimiento")
    .update({ ...input, ...calcularEstimaciones(input) })
    .eq("id", id)
    .select(SELECT_PROGRAMACION)
    .single();

  if (error) {
    throw new Error(mensajeSupabase(error));
  }
  return data as Programacion;
}

export async function desactivarProgramacion(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("programaciones_mantenimiento")
    .update({ activo: false })
    .eq("id", id);

  if (error) {
    throw new Error(mensajeSupabase(error));
  }
}

export async function reactivarProgramacion(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("programaciones_mantenimiento")
    .update({ activo: true })
    .eq("id", id);

  if (error) {
    throw new Error(mensajeSupabase(error));
  }
}
