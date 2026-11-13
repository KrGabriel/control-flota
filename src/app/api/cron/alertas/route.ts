import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { estadoVencimiento, formatearFecha, hoyISO, type EstadoVencimiento } from "@/lib/formato";
import { estadoProgramacion, CONFIG_ALERTAS_POR_DEFECTO } from "@/lib/alertas";
import type { ConfigAlertas, NivelAlerta, OrigenAlerta } from "@/types/database";

interface VehiculoDoc {
  id: string;
  numero_vehiculo: number;
  patente: string;
  fecha_proxima_vtv: string | null;
  fecha_vencimiento_seguro: string | null;
  fecha_vencimiento_matafuego: string | null;
}

interface ProgramacionCron {
  id: string;
  vehiculo_id: string;
  modo: "kilometraje" | "tiempo" | "ambos";
  proxima_fecha_estimada: string | null;
  proximo_kilometraje_estimado: number | null;
  activo: boolean;
  vehiculos?: { numero_vehiculo: number; patente: string; kilometraje_actual: number } | null;
}

interface AlertaCron {
  id: string;
  vehiculo_id: string | null;
  origen: OrigenAlerta;
  referencia_id: string | null;
  nivel: NivelAlerta;
  titulo: string;
  descripcion: string | null;
  fecha_alerta: string;
  resuelta: boolean;
  vehiculos?: { numero_vehiculo: number; patente: string } | null;
}

type CampoFechaVehiculo = "fecha_proxima_vtv" | "fecha_vencimiento_seguro" | "fecha_vencimiento_matafuego";

const DOCUMENTOS: { campo: CampoFechaVehiculo; origen: OrigenAlerta; etiqueta: string }[] = [
  { campo: "fecha_proxima_vtv", origen: "vtv", etiqueta: "VTV" },
  { campo: "fecha_vencimiento_seguro", origen: "seguro", etiqueta: "Seguro" },
  { campo: "fecha_vencimiento_matafuego", origen: "matafuego", etiqueta: "Matafuego" },
];

const NIVELES_NOTIFICABLES: NivelAlerta[] = ["proximo_vencer", "urgente", "vencido"];

function nivelDesdeEstado(estado: EstadoVencimiento): NivelAlerta | null {
  switch (estado) {
    case "vencido":
      return "vencido";
    case "urgente":
      return "urgente";
    case "proximo_vencer":
      return "proximo_vencer";
    default:
      return null;
  }
}

function diasRestantes(fecha: string): number {
  const hoy = hoyISO();
  return Math.round(
    (new Date(`${fecha}T12:00:00Z`).getTime() - new Date(`${hoy}T12:00:00Z`).getTime()) / 86400000
  );
}

function etiquetaNivelAlerta(nivel: NivelAlerta): string {
  switch (nivel) {
    case "vencido":
      return "Vencido";
    case "urgente":
      return "Urgente";
    case "proximo_vencer":
      return "Próximo a vencer";
    default:
      return "—";
  }
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const autorizacion = request.headers.get("authorization");
  if (!secret || autorizacion !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const hoy = hoyISO();

  const { data: configData, error: configError } = await supabase
    .from("configuracion")
    .select("valor")
    .eq("clave", "alertas")
    .maybeSingle();
  if (configError) {
    return NextResponse.json(
      { ok: false, error: `Error al leer configuración: ${configError.message}` },
      { status: 500 }
    );
  }
  const config: ConfigAlertas = {
    ...CONFIG_ALERTAS_POR_DEFECTO,
    ...((configData?.valor ?? {}) as Partial<ConfigAlertas>),
  };

  const diasProximo = Math.max(...config.anticipos_dias, 0);
  const diasUrgente = Math.min(
    ...config.anticipos_dias.filter((d) => d > 0),
    diasProximo || Infinity
  );

  const [{ data: vehiculos, error: errorVehiculos }, { data: programaciones, error: errorProgramaciones }] =
    await Promise.all([
      supabase
        .from("vehiculos")
        .select(
          "id, numero_vehiculo, patente, fecha_proxima_vtv, fecha_vencimiento_seguro, fecha_vencimiento_matafuego"
        )
        .eq("activo", true),
      supabase
        .from("programaciones_mantenimiento")
        .select(
          "id, vehiculo_id, modo, proxima_fecha_estimada, proximo_kilometraje_estimado, activo, vehiculos (numero_vehiculo, patente, kilometraje_actual)"
        )
        .eq("activo", true),
    ]);

  if (errorVehiculos || errorProgramaciones) {
    return NextResponse.json(
      {
        ok: false,
        error: errorVehiculos?.message ?? errorProgramaciones?.message ?? "Error al leer datos",
      },
      { status: 500 }
    );
  }

  const { data: alertasActivas, error: errorAlertas } = await supabase
    .from("alertas")
    .select("*")
    .eq("resuelta", false);
  if (errorAlertas) {
    return NextResponse.json(
      { ok: false, error: `Error al leer alertas: ${errorAlertas.message}` },
      { status: 500 }
    );
  }

  const activas = (alertasActivas ?? []) as AlertaCron[];
  let creadas = 0;
  let actualizadas = 0;

  function clavesAlerta(vehiculoId: string, origen: OrigenAlerta, referenciaId: string | null) {
    return `${vehiculoId}|${origen}|${referenciaId ?? "-"}`;
  }

  const indiceActivas = new Map(
    activas.map((a) => [clavesAlerta(a.vehiculo_id ?? "", a.origen, a.referencia_id), a])
  );

  async function registrarAlerta(params: {
    vehiculoId: string;
    origen: OrigenAlerta;
    referenciaId: string | null;
    nivel: NivelAlerta;
    titulo: string;
    descripcion: string;
  }) {
    const clave = clavesAlerta(params.vehiculoId, params.origen, params.referenciaId);
    const existente = indiceActivas.get(clave);
    if (existente) {
      if (existente.nivel !== params.nivel || existente.descripcion !== params.descripcion) {
        const { error } = await supabase
          .from("alertas")
          .update({ nivel: params.nivel, titulo: params.titulo, descripcion: params.descripcion, fecha_alerta: hoy })
          .eq("id", existente.id);
        if (error) throw new Error(error.message);
        existente.nivel = params.nivel;
        actualizadas += 1;
      }
      return;
    }
    const { error } = await supabase
      .from("alertas")
      .insert({
        vehiculo_id: params.vehiculoId,
        origen: params.origen,
        referencia_id: params.referenciaId,
        nivel: params.nivel,
        titulo: params.titulo,
        descripcion: params.descripcion,
        fecha_alerta: hoy,
      });
    if (error) throw new Error(error.message);
    creadas += 1;
  }

  try {
    for (const vehiculo of (vehiculos ?? []) as VehiculoDoc[]) {
      for (const doc of DOCUMENTOS) {
        const fecha = vehiculo[doc.campo];
        if (!fecha) continue;
        const nivel = nivelDesdeEstado(estadoVencimiento(fecha, diasUrgente, diasProximo));
        if (!nivel) continue;
        const dias = diasRestantes(fecha);
        await registrarAlerta({
          vehiculoId: vehiculo.id,
          origen: doc.origen,
          referenciaId: null,
          nivel,
          titulo: `${doc.etiqueta} · ${vehiculo.patente}`,
          descripcion: dias > 0 ? `Vence el ${formatearFecha(fecha)} (en ${dias} días).` : `Venció el ${formatearFecha(fecha)}.`,
        });
      }
    }

    for (const prog of (programaciones ?? []) as unknown as ProgramacionCron[]) {
      const nivel = nivelDesdeEstado(estadoProgramacion(prog as never, config));
      if (!nivel) continue;
      const patente = prog.vehiculos?.patente ?? "—";
      const partes: string[] = [];
      if (prog.proxima_fecha_estimada) {
        const dias = diasRestantes(prog.proxima_fecha_estimada);
        partes.push(
          dias > 0
            ? `Fecha estimada: ${formatearFecha(prog.proxima_fecha_estimada)} (en ${dias} días).`
            : `Fecha estimada vencida: ${formatearFecha(prog.proxima_fecha_estimada)}.`
        );
      }
      if (
        prog.proximo_kilometraje_estimado !== null &&
        prog.vehiculos?.kilometraje_actual !== undefined
      ) {
        const faltante = prog.proximo_kilometraje_estimado - prog.vehiculos.kilometraje_actual;
        partes.push(
          faltante > 0
            ? `Próximo servicio a los ${prog.proximo_kilometraje_estimado.toLocaleString("es-AR")} km (faltan ${faltante.toLocaleString("es-AR")} km).`
            : `Kilometraje del próximo servicio alcanzado.`
        );
      }
      await registrarAlerta({
        vehiculoId: prog.vehiculo_id,
        origen: "mantenimiento_programado",
        referenciaId: prog.id,
        nivel,
        titulo: `Mantenimiento programado · ${patente}`,
        descripcion: partes.join(" ") || "Requiere atención.",
      });
    }
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error al registrar alertas" },
      { status: 500 }
    );
  }

  const { data: notificables, error: errorNotificables } = await supabase
    .from("alertas")
    .select("*, vehiculos (numero_vehiculo, patente)")
    .eq("resuelta", false)
    .in("nivel", NIVELES_NOTIFICABLES);
  if (errorNotificables) {
    return NextResponse.json(
      { ok: false, error: `Error al listar alertas: ${errorNotificables.message}` },
      { status: 500 }
    );
  }
  const listaNotificable = (notificables ?? []) as AlertaCron[];

  let estadoEmail = "Deshabilitado en la configuración.";
  if (listaNotificable.length === 0) {
    estadoEmail = "Sin alertas activas para notificar.";
  } else if (!config.email_habilitado) {
    estadoEmail = "Deshabilitado en la configuración.";
  } else if (!config.email_destino) {
    estadoEmail = "Sin destinatario configurado.";
  } else if (!process.env.RESEND_API_KEY) {
    estadoEmail = "Falta configurar RESEND_API_KEY en el entorno.";
  } else {
    const conteo = listaNotificable.reduce<Record<string, number>>((acc, a) => {
      acc[a.nivel] = (acc[a.nivel] ?? 0) + 1;
      return acc;
    }, {});
    const filas = listaNotificable
      .map(
        (a) =>
          `<tr><td style="padding:6px 10px;border-bottom:1px solid #e5e7eb">${etiquetaNivelAlerta(a.nivel)}</td>` +
          `<td style="padding:6px 10px;border-bottom:1px solid #e5e7eb">${a.vehiculos?.patente ?? "—"}</td>` +
          `<td style="padding:6px 10px;border-bottom:1px solid #e5e7eb">${a.titulo}</td>` +
          `<td style="padding:6px 10px;border-bottom:1px solid #e5e7eb">${a.descripcion ?? ""}</td></tr>`
      )
      .join("");
    const html = `<p>Resumen de alertas de la flota al ${formatearFecha(hoy)}:</p>
      <p style="color:#6b7280;font-size:13px">${NIVELES_NOTIFICABLES.map((n) => `${conteo[n] ?? 0} ${etiquetaNivelAlerta(n).toLowerCase()}`).join(" · ")}</p>
      <table style="border-collapse:collapse;font-size:14px">
        <tr>${["Nivel", "Patente", "Alerta", "Detalle"].map((h) => `<th style="padding:6px 10px;text-align:left;border-bottom:2px solid #d1d5db">${h}</th>`).join("")}</tr>
        ${filas}
      </table>`;
    try {
      const respuesta = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Flota <onboarding@resend.dev>",
          to: [config.email_destino],
          subject: `Alertas de flota · ${listaNotificable.length} activa(s) · ${formatearFecha(hoy)}`,
          html,
        }),
      });
      if (!respuesta.ok) {
        const detalle = await respuesta.text();
        estadoEmail = `Resend respondió con error: ${detalle.slice(0, 200)}`;
      } else {
        const { error: errorRegistro } = await supabase
          .from("notificaciones_enviadas")
          .upsert(
            listaNotificable.map((a) => ({
              alerta_id: a.id,
              canal: "email",
              nivel_al_enviar: a.nivel,
            })),
            { onConflict: "alerta_id,canal,nivel_al_enviar", ignoreDuplicates: true }
          );
        if (errorRegistro) {
          estadoEmail = `Correo enviado, pero no se pudo registrar: ${errorRegistro.message}`;
        } else {
          estadoEmail = `Enviado a ${config.email_destino} (${listaNotificable.length} alertas).`;
        }
      }
    } catch (error) {
      estadoEmail = `Error al contactar Resend: ${error instanceof Error ? error.message : "desconocido"}`;
    }
  }

  return NextResponse.json({
    ok: true,
    fecha: hoy,
    alertas_creadas: creadas,
    alertas_actualizadas: actualizadas,
    alertas_activas_notificables: listaNotificable.length,
    email: estadoEmail,
  });
}
