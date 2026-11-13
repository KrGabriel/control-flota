import { createClient } from "@/lib/supabase/server";
import { mensajeSupabase } from "@/lib/supabase/errores";
import {
  estadoVencimiento,
  hoyISO,
  formatearFecha,
  type EstadoVencimiento,
} from "@/lib/formato";
import { estadoProgramacion, CONFIG_ALERTAS_POR_DEFECTO } from "@/lib/alertas";
import type {
  ConfigAlertas,
  Programacion,
  Vehiculo,
} from "@/types/database";

export interface AlertaDestacada {
  vehiculoId: string;
  patente: string;
  titulo: string;
  detalle: string;
  nivel: EstadoVencimiento;
  fecha: string | null;
}

export interface GastosMes {
  etiquetaMes: string;
  combustible: number;
  mantenimiento: number;
  total: number;
  combustibleMesAnterior: number;
  mantenimientoMesAnterior: number;
  acumuladoAnio: number;
}

export interface PuntoMensual {
  mes: string;
  combustible: number;
  mantenimiento: number;
}

export interface CostoPorVehiculo {
  patente: string;
  combustible: number;
  mantenimiento: number;
}

export interface DatosDashboard {
  flota: {
    total: number;
    disponibles: number;
    asignados: number;
    enMantenimiento: number;
    fueraDeServicio: number;
  };
  vencimientos: {
    proximos: number;
    vencidos: number;
    mantenimientosPendientes: number;
  };
  gastos: GastosMes;
  alertas: AlertaDestacada[];
  gastosMensuales: PuntoMensual[];
  costosPorVehiculo: CostoPorVehiculo[];
}

const ZONA = "America/Argentina/Buenos_Aires";

function formatoMes(fechaISO: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    month: "short",
    timeZone: ZONA,
  }).format(new Date(`${fechaISO}T12:00:00Z`));
}

/** Mes actual (y el desplazado) en formato AAAA-MM para la zona horaria local. */
function mesActual(desplazamiento = 0): string {
  const ahora = new Date();
  const offsetBsAs = -3 * 60;
  const fechaBsAs = new Date(
    ahora.getTime() + (ahora.getTimezoneOffset() + offsetBsAs) * 60000
  );
  fechaBsAs.setUTCDate(1);
  fechaBsAs.setUTCMonth(fechaBsAs.getUTCMonth() + desplazamiento);
  return fechaBsAs.toISOString().slice(0, 7);
}

function esDelMes(fecha: string, mes: string): boolean {
  return fecha.startsWith(mes);
}

function esDelAnio(fecha: string, mes: string): boolean {
  return fecha.startsWith(mes.slice(0, 4));
}

export async function obtenerDatosDashboard(): Promise<DatosDashboard> {
  const supabase = await createClient();
  const hoy = hoyISO();

  const [vehiculosRes, mantenimientosRes, cargasRes, programacionesRes, configRes] =
    await Promise.all([
      supabase
        .from("vehiculos")
        .select(
          "id, numero_vehiculo, patente, estado_operativo, activo, kilometraje_actual, fecha_proxima_vtv, fecha_vencimiento_seguro, fecha_vencimiento_matafuego"
        )
        .eq("activo", true),
      supabase
        .from("mantenimientos")
        .select("vehiculo_id, fecha, costo_total, vehiculos (patente)"),
      supabase
        .from("cargas_combustible")
        .select("vehiculo_id, fecha, costo_total, vehiculos (patente)"),
      supabase
        .from("programaciones_mantenimiento")
        .select(
          "id, vehiculo_id, modo, proxima_fecha_estimada, proximo_kilometraje_estimado, activo, observaciones, created_at, updated_at, vehiculos (numero_vehiculo, patente, kilometraje_actual), categorias_mantenimiento (id, nombre)"
        )
        .eq("activo", true),
      supabase.from("configuracion").select("valor").eq("clave", "alertas").maybeSingle(),
    ]);

  const errorPrimero =
    vehiculosRes.error ?? mantenimientosRes.error ?? cargasRes.error ?? programacionesRes.error ?? configRes.error;
  if (errorPrimero) {
    throw new Error(mensajeSupabase(errorPrimero));
  }

  const vehiculos = (vehiculosRes.data ?? []) as Pick<
    Vehiculo,
    | "id"
    | "numero_vehiculo"
    | "patente"
    | "estado_operativo"
    | "kilometraje_actual"
    | "fecha_proxima_vtv"
    | "fecha_vencimiento_seguro"
    | "fecha_vencimiento_matafuego"
  >[];
  const mantenimientos = (mantenimientosRes.data ?? []) as unknown as {
    vehiculo_id: string;
    fecha: string;
    costo_total: number;
    vehiculos?: { patente: string } | null;
  }[];
  const cargas = (cargasRes.data ?? []) as unknown as {
    vehiculo_id: string;
    fecha: string;
    costo_total: number;
    vehiculos?: { patente: string } | null;
  }[];
  const programaciones = (programacionesRes.data ?? []) as unknown as Programacion[];
  const config: ConfigAlertas = {
    ...CONFIG_ALERTAS_POR_DEFECTO,
    ...((configRes.data?.valor ?? {}) as Partial<ConfigAlertas>),
  };

  // --- Estado de la flota ---
  const flota = {
    total: vehiculos.length,
    disponibles: vehiculos.filter((v) => v.estado_operativo === "disponible").length,
    asignados: vehiculos.filter((v) => v.estado_operativo === "asignado").length,
    enMantenimiento: vehiculos.filter((v) => v.estado_operativo === "en_mantenimiento").length,
    fueraDeServicio: vehiculos.filter((v) => v.estado_operativo === "fuera_de_servicio").length,
  };

  // --- Vencimientos de documentación ---
  const diasProximo = Math.max(...config.anticipos_dias, 0);
  const diasUrgente = Math.min(
    ...config.anticipos_dias.filter((d) => d > 0),
    diasProximo || Infinity
  );
  const alertas: AlertaDestacada[] = [];
  let proximos = 0;
  let vencidos = 0;

  const DOCS = [
    { campo: "fecha_proxima_vtv" as const, etiqueta: "VTV" },
    { campo: "fecha_vencimiento_seguro" as const, etiqueta: "Seguro" },
    { campo: "fecha_vencimiento_matafuego" as const, etiqueta: "Matafuego" },
  ];

  for (const vehiculo of vehiculos) {
    for (const doc of DOCS) {
      const fecha = vehiculo[doc.campo];
      if (!fecha) continue;
      const estado = estadoVencimiento(fecha, diasUrgente, diasProximo);
      if (estado === "proximo_vencer") proximos += 1;
      if (estado === "urgente") proximos += 1;
      if (estado === "vencido") vencidos += 1;
      if (estado === "proximo_vencer" || estado === "urgente" || estado === "vencido") {
        const diasRestantes = Math.round(
          (new Date(`${fecha}T12:00:00Z`).getTime() -
            new Date(`${hoy}T12:00:00Z`).getTime()) /
            86400000
        );
        alertas.push({
          vehiculoId: vehiculo.id,
          patente: vehiculo.patente,
          titulo: `${doc.etiqueta} · ${vehiculo.patente}`,
          detalle:
            diasRestantes > 0
              ? `Vence el ${formatearFecha(fecha)} (en ${diasRestantes} días).`
              : `Venció el ${formatearFecha(fecha)}.`,
          nivel: estado,
          fecha,
        });
      }
    }
  }

  // --- Mantenimientos programados pendientes ---
  let mantenimientosPendientes = 0;
  for (const prog of programaciones) {
    const estado = estadoProgramacion(prog, config);
    if (estado === "urgente" || estado === "vencido" || estado === "proximo_vencer") {
      mantenimientosPendientes += 1;
      const patente = prog.vehiculos?.patente ?? "—";
      const partes: string[] = [];
      if (prog.proxima_fecha_estimada) {
        partes.push(
          `Fecha estimada: ${formatearFecha(prog.proxima_fecha_estimada)}.`
        );
      }
      if (
        prog.proximo_kilometraje_estimado !== null &&
        prog.vehiculos?.kilometraje_actual !== undefined
      ) {
        const faltante = prog.proximo_kilometraje_estimado - prog.vehiculos.kilometraje_actual;
        partes.push(
          faltante > 0
            ? `Faltan ${faltante.toLocaleString("es-AR")} km.`
            : "Kilometraje alcanzado."
        );
      }
      alertas.push({
        vehiculoId: prog.vehiculo_id,
        patente,
        titulo: `Mantenimiento programado · ${patente}`,
        detalle: partes.join(" ") || "Requiere atención.",
        nivel: estado,
        fecha: prog.proxima_fecha_estimada,
      });
    }
  }

  const JERARQUIA: Record<EstadoVencimiento, number> = {
    sin_dato: -1,
    vigente: 0,
    proximo_vencer: 1,
    urgente: 2,
    vencido: 3,
  };
  alertas.sort((a, b) => {
    const dif = JERARQUIA[b.nivel] - JERARQUIA[a.nivel];
    if (dif !== 0) return dif;
    return (a.fecha ?? "").localeCompare(b.fecha ?? "");
  });

  // --- Gastos ---
  const mesActualClave = mesActual();
  const mesAnteriorClave = mesActual(-1);

  const combustibleMes = cargas
    .filter((c) => esDelMes(c.fecha, mesActualClave))
    .reduce((s, c) => s + Number(c.costo_total), 0);
  const mantenimientoMes = mantenimientos
    .filter((m) => esDelMes(m.fecha, mesActualClave))
    .reduce((s, m) => s + Number(m.costo_total), 0);
  const combustibleMesAnterior = cargas
    .filter((c) => esDelMes(c.fecha, mesAnteriorClave))
    .reduce((s, c) => s + Number(c.costo_total), 0);
  const mantenimientoMesAnterior = mantenimientos
    .filter((m) => esDelMes(m.fecha, mesAnteriorClave))
    .reduce((s, m) => s + Number(m.costo_total), 0);
  const acumuladoAnio =
    cargas
      .filter((c) => esDelAnio(c.fecha, mesActualClave))
      .reduce((s, c) => s + Number(c.costo_total), 0) +
    mantenimientos
      .filter((m) => esDelAnio(m.fecha, mesActualClave))
      .reduce((s, m) => s + Number(m.costo_total), 0);

  const gastos: GastosMes = {
    etiquetaMes: formatoMes(`${mesActualClave}-15`),
    combustible: combustibleMes,
    mantenimiento: mantenimientoMes,
    total: combustibleMes + mantenimientoMes,
    combustibleMesAnterior,
    mantenimientoMesAnterior,
    acumuladoAnio,
  };

  // --- Serie mensual (últimos 12 meses) ---
  const gastosMensuales: PuntoMensual[] = [];
  for (let i = 11; i >= 0; i--) {
    const clave = mesActual(-i);
    gastosMensuales.push({
      mes: formatoMes(`${clave}-15`),
      combustible: cargas
        .filter((c) => esDelMes(c.fecha, clave))
        .reduce((s, c) => s + Number(c.costo_total), 0),
      mantenimiento: mantenimientos
        .filter((m) => esDelMes(m.fecha, clave))
        .reduce((s, m) => s + Number(m.costo_total), 0),
    });
  }

  // --- Costos por vehículo (acumulado del año) ---
  const costos = new Map<string, CostoPorVehiculo>();
  for (const v of vehiculos) {
    costos.set(v.patente, { patente: v.patente, combustible: 0, mantenimiento: 0 });
  }
  for (const c of cargas) {
    if (!esDelAnio(c.fecha, mesActualClave)) continue;
    const patente = c.vehiculos?.patente;
    if (!patente) continue;
    const registro = costos.get(patente);
    if (registro) registro.combustible += Number(c.costo_total);
  }
  for (const m of mantenimientos) {
    if (!esDelAnio(m.fecha, mesActualClave)) continue;
    const patente = m.vehiculos?.patente;
    if (!patente) continue;
    const registro = costos.get(patente);
    if (registro) registro.mantenimiento += Number(m.costo_total);
  }
  const costosPorVehiculo = [...costos.values()]
    .filter((c) => c.combustible + c.mantenimiento > 0)
    .sort(
      (a, b) =>
        b.combustible + b.mantenimiento - (a.combustible + a.mantenimiento)
    )
    .slice(0, 8);

  return {
    flota,
    vencimientos: {
      proximos,
      vencidos,
      mantenimientosPendientes,
    },
    gastos,
    alertas: alertas.slice(0, 8),
    gastosMensuales,
    costosPorVehiculo,
  };
}
