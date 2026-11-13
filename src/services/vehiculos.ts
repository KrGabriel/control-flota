import { createClient } from "@/lib/supabase/client";
import { mensajeSupabase } from "@/lib/supabase/errores";
import type { Vehiculo } from "@/types/database";
import type { VehiculoInput } from "@/lib/validaciones/vehiculo";

const SELECT_VEHICULO =
  "*, tecnicos (id, nombre, apellido)";

export async function listarVehiculos(): Promise<Vehiculo[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("vehiculos")
    .select(SELECT_VEHICULO)
    .order("numero_vehiculo");

  if (error) {
    throw new Error(mensajeSupabase(error));
  }
  return (data ?? []) as Vehiculo[];
}

export async function obtenerVehiculo(id: string): Promise<Vehiculo | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("vehiculos")
    .select(SELECT_VEHICULO)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(mensajeSupabase(error));
  }
  return (data as Vehiculo) ?? null;
}

export async function crearVehiculo(input: VehiculoInput): Promise<Vehiculo> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("vehiculos")
    .insert(input)
    .select(SELECT_VEHICULO)
    .single();

  if (error) {
    throw new Error(mensajeSupabase(error));
  }
  return data as Vehiculo;
}

export async function crearVehiculosMasivo(
  inputs: VehiculoInput[]
): Promise<Vehiculo[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("vehiculos")
    .insert(inputs)
    .select(SELECT_VEHICULO);

  if (error) {
    throw new Error(mensajeSupabase(error));
  }
  return (data ?? []) as Vehiculo[];
}

export async function actualizarVehiculo(
  id: string,
  input: VehiculoInput
): Promise<Vehiculo> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("vehiculos")
    .update(input)
    .eq("id", id)
    .select(SELECT_VEHICULO)
    .single();

  if (error) {
    throw new Error(mensajeSupabase(error));
  }
  return data as Vehiculo;
}

export async function desactivarVehiculo(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("vehiculos")
    .update({ activo: false })
    .eq("id", id);

  if (error) {
    throw new Error(mensajeSupabase(error));
  }
}

export async function reactivarVehiculo(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("vehiculos")
    .update({ activo: true })
    .eq("id", id);

  if (error) {
    throw new Error(mensajeSupabase(error));
  }
}
