import { createClient } from "@/lib/supabase/client";
import { mensajeSupabase } from "@/lib/supabase/errores";
import type { CategoriaInput } from "@/lib/validaciones/categoria";
import type { CategoriaMantenimiento } from "@/types/database";

export async function listarCategorias(): Promise<CategoriaMantenimiento[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("categorias_mantenimiento")
    .select("*")
    .order("orden")
    .order("nombre");

  if (error) {
    throw new Error(mensajeSupabase(error));
  }
  return (data ?? []) as CategoriaMantenimiento[];
}

export async function crearCategoria(
  input: CategoriaInput
): Promise<CategoriaMantenimiento> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("categorias_mantenimiento")
    .insert(input)
    .select("*")
    .single();

  if (error) {
    throw new Error(mensajeSupabase(error));
  }
  return data as CategoriaMantenimiento;
}

export async function actualizarCategoria(
  id: string,
  input: CategoriaInput
): Promise<CategoriaMantenimiento> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("categorias_mantenimiento")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(mensajeSupabase(error));
  }
  return data as CategoriaMantenimiento;
}

export async function cambiarEstadoCategoria(
  id: string,
  activo: boolean
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("categorias_mantenimiento")
    .update({ activo })
    .eq("id", id);

  if (error) {
    throw new Error(mensajeSupabase(error));
  }
}

export async function listarCategoriasActivas(): Promise<CategoriaMantenimiento[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("categorias_mantenimiento")
    .select("*")
    .eq("activo", true)
    .order("orden")
    .order("nombre");

  if (error) {
    throw new Error(mensajeSupabase(error));
  }
  return (data ?? []) as CategoriaMantenimiento[];
}
