import { z } from "zod";

const fechaRequerida = z
  .string()
  .trim()
  .min(1, "Ingresá la fecha")
  .refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v), "Fecha inválida");

const fechaOpcional = z
  .string()
  .trim()
  .refine(
    (v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v),
    "Fecha inválida"
  )
  .transform((v) => (v === "" ? null : v));

const enteroDesdeTexto = (min: number, max: number, mensaje: string) =>
  z
    .string()
    .trim()
    .min(1, mensaje)
    .refine((v) => /^-?\d+$/.test(v), "Ingresá un número entero válido")
    .transform(Number)
    .refine((n) => n >= min && n <= max, mensaje);

const enteroOpcional = (min: number, max: number, mensaje: string) =>
  z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .refine(
      (v) => v === null || /^-?\d+$/.test(v),
      "Ingresá un número entero válido"
    )
    .transform((v) => (v === null ? null : Number(v)))
    .refine(
      (v) => v === null || (v >= min && v <= max),
      mensaje
    );

const montoDesdeTexto = (mensaje: string) =>
  z
    .string()
    .trim()
    .min(1, mensaje)
    .refine(
      (v) => /^\d{1,9}([.,]\d{1,2})?$/.test(v),
      "Ingresá un monto válido, ej: 125000 o 125000,50"
    )
    .transform((v) => Number(v.replace(",", ".")))
    .refine((n) => n >= 0 && n <= 999999999, mensaje);

const idRequerido = (mensaje: string) =>
  z
    .string()
    .trim()
    .min(1, mensaje)
    .refine(
      (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v),
      "Selección inválida"
    );

export const mantenimientoSchema = z.object({
  vehiculo_id: idRequerido("Seleccioná el vehículo"),
  categoria_id: idRequerido("Seleccioná la categoría"),
  fecha: fechaRequerida,
  kilometraje: enteroDesdeTexto(
    0,
    5000000,
    "El kilometraje debe estar entre 0 y 5.000.000"
  ),
  trabajo_realizado: z
    .string()
    .trim()
    .min(1, "Describí el trabajo realizado")
    .max(2000, "Máximo 2000 caracteres"),
  taller: z
    .string()
    .trim()
    .max(120, "Máximo 120 caracteres")
    .transform((v) => (v === "" ? null : v)),
  costo_total: montoDesdeTexto("Ingresá el costo total"),
  observaciones: z
    .string()
    .trim()
    .max(2000, "Máximo 2000 caracteres")
    .transform((v) => (v === "" ? null : v)),
});

export type MantenimientoFormValues = z.input<typeof mantenimientoSchema>;
export type MantenimientoInput = z.output<typeof mantenimientoSchema>;

export const programacionSchema = z
  .object({
    vehiculo_id: idRequerido("Seleccioná el vehículo"),
    categoria_id: idRequerido("Seleccioná la categoría"),
    modo: z.enum(["kilometraje", "tiempo", "ambos"]),
    intervalo_km: enteroOpcional(
      1,
      2000000,
      "El intervalo debe estar entre 1 y 2.000.000 km"
    ),
    intervalo_dias: enteroOpcional(
      1,
      3650,
      "El intervalo debe estar entre 1 y 3650 días"
    ),
    fecha_ultimo_mantenimiento: fechaOpcional,
    kilometraje_ultimo_mantenimiento: enteroOpcional(
      0,
      5000000,
      "El kilometraje debe estar entre 0 y 5.000.000"
    ),
    observaciones: z
      .string()
      .trim()
      .max(2000, "Máximo 2000 caracteres")
      .transform((v) => (v === "" ? null : v)),
  })
  .superRefine((val, ctx) => {
    if (val.modo !== "tiempo" && val.intervalo_km === null) {
      ctx.addIssue({
        code: "custom",
        path: ["intervalo_km"],
        message: "Ingresá el intervalo de km para este modo",
      });
    }
    if (val.modo !== "kilometraje" && val.intervalo_dias === null) {
      ctx.addIssue({
        code: "custom",
        path: ["intervalo_dias"],
        message: "Ingresá el intervalo en días para este modo",
      });
    }
  });

export type ProgramacionFormValues = z.input<typeof programacionSchema>;
export type ProgramacionInput = z.output<typeof programacionSchema>;
