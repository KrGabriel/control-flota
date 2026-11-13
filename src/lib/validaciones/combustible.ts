import { z } from "zod";

const fechaRequerida = z
  .string()
  .trim()
  .min(1, "Ingresá la fecha")
  .refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v), "Fecha inválida");

const enteroDesdeTexto = (min: number, max: number, mensaje: string) =>
  z
    .string()
    .trim()
    .min(1, mensaje)
    .refine((v) => /^-?\d+$/.test(v), "Ingresá un número entero válido")
    .transform(Number)
    .refine((n) => n >= min && n <= max, mensaje);

const decimalDesdeTexto = (
  min: number,
  max: number,
  mensaje: string
) =>
  z
    .string()
    .trim()
    .min(1, mensaje)
    .refine(
      (v) => /^\d{1,7}([.,]\d{1,2})?$/.test(v),
      "Ingresá un número válido, ej: 45,80"
    )
    .transform((v) => Number(v.replace(",", ".")))
    .refine((n) => n >= min && n <= max, mensaje);

const idRequerido = (mensaje: string) =>
  z
    .string()
    .trim()
    .min(1, mensaje)
    .refine(
      (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v),
      "Selección inválida"
    );

const idOpcional = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .refine(
    (v) => v === null || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v),
    "Selección inválida"
  );

export const cargaCombustibleSchema = z.object({
  vehiculo_id: idRequerido("Seleccioná el vehículo"),
  tecnico_id: idOpcional,
  fecha: fechaRequerida,
  kilometraje: enteroDesdeTexto(
    0,
    5000000,
    "El kilometraje debe estar entre 0 y 5.000.000"
  ),
  litros: decimalDesdeTexto(
    0.01,
    99999,
    "Los litros deben estar entre 0,01 y 99.999"
  ),
  precio_por_litro: decimalDesdeTexto(
    0.01,
    999999,
    "El precio por litro debe estar entre 0,01 y 999.999"
  ),
  observaciones: z
    .string()
    .trim()
    .max(2000, "Máximo 2000 caracteres")
    .transform((v) => (v === "" ? null : v)),
});

export type CargaCombustibleFormValues = z.input<typeof cargaCombustibleSchema>;
export type CargaCombustibleInput = z.output<typeof cargaCombustibleSchema>;
