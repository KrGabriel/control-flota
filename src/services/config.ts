import { createClient } from "@/lib/supabase/client";
import { mensajeSupabase } from "@/lib/supabase/errores";
import { CONFIG_ALERTAS_POR_DEFECTO } from "@/lib/alertas";
import type { ConfigAlertasFormValues } from "@/lib/validaciones/configuracion";
import type { ConfigAlertas } from "@/types/database";

export async function obtenerConfigAlertas(): Promise<ConfigAlertas> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("configuracion")
    .select("valor")
    .eq("clave", "alertas")
    .maybeSingle();

  if (error) {
    throw new Error(mensajeSupabase(error));
  }
  if (!data?.valor) return CONFIG_ALERTAS_POR_DEFECTO;
  return { ...CONFIG_ALERTAS_POR_DEFECTO, ...(data.valor as Partial<ConfigAlertas>) };
}

export async function guardarConfigAlertas(
  input: ConfigAlertasFormValues
): Promise<ConfigAlertas> {
  const supabase = createClient();
  const valor: ConfigAlertas = {
    anticipos_dias: input.anticipos_dias
      .map((f) => Number(f.dias))
      .sort((a, b) => b - a),
    umbral_km_proximo: Number(input.umbral_km_proximo),
    umbral_km_urgente: Number(input.umbral_km_urgente),
    email_habilitado: input.email_habilitado,
    email_destino: input.email_destino === "" ? null : input.email_destino,
  };

  const { data, error } = await supabase
    .from("configuracion")
    .update({ valor })
    .eq("clave", "alertas")
    .select("valor")
    .single();

  if (error) {
    throw new Error(mensajeSupabase(error));
  }
  return { ...CONFIG_ALERTAS_POR_DEFECTO, ...(data.valor as Partial<ConfigAlertas>) };
}
