export function formatearFecha(fecha: string | null | undefined): string {
  if (!fecha) return "—";
  const fechaUTC = new Date(`${fecha}T12:00:00Z`);
  if (Number.isNaN(fechaUTC.getTime())) return "—";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(fechaUTC);
}

export function formatearMoneda(monto: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(monto);
}

export function hoyISO(): string {
  const ahora = new Date();
  const offsetBsAs = -3 * 60;
  const fechaBsAs = new Date(ahora.getTime() + (ahora.getTimezoneOffset() + offsetBsAs) * 60000);
  return fechaBsAs.toISOString().slice(0, 10);
}

export function sumarDias(fechaISO: string, dias: number): string {
  const fecha = new Date(`${fechaISO}T12:00:00Z`);
  if (Number.isNaN(fecha.getTime())) return fechaISO;
  fecha.setUTCDate(fecha.getUTCDate() + dias);
  return fecha.toISOString().slice(0, 10);
}

export type EstadoVencimiento = "vigente" | "proximo_vencer" | "urgente" | "vencido" | "sin_dato";

export function estadoVencimiento(
  fecha: string | null | undefined,
  diasUrgente = 7,
  diasProximo = 30
): EstadoVencimiento {
  if (!fecha) return "sin_dato";
  const hoy = hoyISO();
  if (fecha <= hoy) return "vencido";
  const diasRestantes = Math.round(
    (new Date(`${fecha}T12:00:00Z`).getTime() - new Date(`${hoy}T12:00:00Z`).getTime()) / 86400000
  );
  if (diasRestantes <= diasUrgente) return "urgente";
  if (diasRestantes <= diasProximo) return "proximo_vencer";
  return "vigente";
}
