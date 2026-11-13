import { estadoVencimiento, type EstadoVencimiento } from "@/lib/formato";
import type { ConfigAlertas, Programacion } from "@/types/database";

export const CONFIG_ALERTAS_POR_DEFECTO: ConfigAlertas = {
  anticipos_dias: [30, 15, 7, 0],
  umbral_km_proximo: 2000,
  umbral_km_urgente: 500,
  email_habilitado: false,
  email_destino: null,
};

function nivelPorFecha(
  fecha: string | null,
  anticipos: number[]
): EstadoVencimiento {
  if (!fecha || anticipos.length === 0) return "sin_dato";
  const diasProximo = Math.max(...anticipos);
  const diasUrgente = Math.min(...anticipos.filter((d) => d > 0), diasProximo);
  return estadoVencimiento(fecha, diasUrgente, diasProximo);
}

function nivelPorKm(prog: Programacion, config: ConfigAlertas): EstadoVencimiento {
  if (
    prog.proximo_kilometraje_estimado === null ||
    prog.vehiculos === undefined
  ) {
    return "sin_dato";
  }
  const kmActual = prog.vehiculos?.kilometraje_actual ?? 0;
  const faltante = prog.proximo_kilometraje_estimado - kmActual;
  if (faltante <= 0) return "vencido";
  if (faltante <= config.umbral_km_urgente) return "urgente";
  if (faltante <= config.umbral_km_proximo) return "proximo_vencer";
  return "vigente";
}

const JERARQUIA: Record<EstadoVencimiento, number> = {
  sin_dato: -1,
  vigente: 0,
  proximo_vencer: 1,
  urgente: 2,
  vencido: 3,
};

export function estadoProgramacion(
  prog: Programacion,
  config: ConfigAlertas
): EstadoVencimiento {
  const porFecha = nivelPorFecha(prog.proxima_fecha_estimada, config.anticipos_dias);
  const porKm =
    prog.modo === "tiempo" ? ("sin_dato" as EstadoVencimiento) : nivelPorKm(prog, config);
  return JERARQUIA[porFecha] >= JERARQUIA[porKm] ? porFecha : porKm;
}

export function etiquetaNivel(nivel: EstadoVencimiento): string {
  switch (nivel) {
    case "vencido":
      return "Vencido";
    case "urgente":
      return "Urgente";
    case "proximo_vencer":
      return "Próximo";
    case "vigente":
      return "Al día";
    default:
      return "Sin dato";
  }
}
