import { createClient } from "@/lib/supabase/client";
import { mensajeSupabase } from "@/lib/supabase/errores";
import type { Asignacion, Tecnico } from "@/types/database";
import type { TecnicoInput } from "@/lib/validaciones/vehiculo";

const SELECT_ASIGNACION =
  "*, tecnico_anterior:tecnicos!asignaciones_tecnico_anterior_id_fkey (id, nombre, apellido), tecnico_nuevo:tecnicos!asignaciones_tecnico_nuevo_id_fkey (id, nombre, apellido)";

export async function listarTecnicos(): Promise<Tecnico[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tecnicos")
    .select("*")
    .order("apellido");

  if (error) {
    throw new Error(mensajeSupabase(error));
  }
  return (data ?? []) as Tecnico[];
}

export async function listarTecnicosActivos(): Promise<Tecnico[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tecnicos")
    .select("*")
    .eq("activo", true)
    .order("apellido");

  if (error) {
    throw new Error(mensajeSupabase(error));
  }
  return (data ?? []) as Tecnico[];
}

export async function crearTecnico(input: TecnicoInput): Promise<Tecnico> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tecnicos")
    .insert(input)
    .select("*")
    .single();

  if (error) {
    throw new Error(mensajeSupabase(error));
  }
  return data as Tecnico;
}

export async function actualizarTecnico(
  id: string,
  input: TecnicoInput
): Promise<Tecnico> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tecnicos")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(mensajeSupabase(error));
  }
  return data as Tecnico;
}

export async function cambiarEstadoTecnico(
  id: string,
  activo: boolean
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("tecnicos")
    .update({ activo })
    .eq("id", id);

  if (error) {
    throw new Error(mensajeSupabase(error));
  }
}

export async function listarAsignaciones(
  vehiculoId: string
): Promise<Asignacion[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("asignaciones")
    .select(SELECT_ASIGNACION)
    .eq("vehiculo_id", vehiculoId)
    .order("fecha_inicio", { ascending: false });

  if (error) {
    throw new Error(mensajeSupabase(error));
  }
  return (data ?? []) as Asignacion[];
}
