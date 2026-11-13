import { z } from "zod";

const fechaOpcional = z
  .string()
  .trim()
  .refine(
    (v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v),
    "Fecha inválida"
  )
  .transform((v) => (v === "" ? null : v));

const idOpcional = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .refine(
    (v) => v === null || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v),
    "Selección inválida"
  );

const enteroDesdeTexto = (min: number, max: number, mensaje: string) =>
  z
    .string()
    .trim()
    .min(1, mensaje)
    .refine((v) => /^-?\d+$/.test(v), "Ingresá un número entero válido")
    .transform(Number)
    .refine((n) => n >= min && n <= max, mensaje);

export const vehiculoSchema = z.object({
  numero_vehiculo: enteroDesdeTexto(
    1,
    999999,
    "Ingresá el número de vehículo"
  ),
  tipo_vehiculo: z.string().trim().min(1, "Ingresá el tipo de vehículo"),
  patente: z
    .string()
    .trim()
    .min(5, "Patente inválida")
    .max(10, "Patente inválida")
    .toUpperCase(),
  marca: z.string().trim().min(1, "Ingresá la marca"),
  modelo: z.string().trim().min(1, "Ingresá el modelo"),
  anio: enteroDesdeTexto(1980, 2100, "Ingresá un año entre 1980 y 2100"),
  tecnico_responsable_id: idOpcional,
  kilometraje_actual: enteroDesdeTexto(
    0,
    5000000,
    "El kilometraje debe estar entre 0 y 5.000.000"
  ),
  fecha_proxima_vtv: fechaOpcional,
  fecha_vencimiento_seguro: fechaOpcional,
  fecha_vencimiento_matafuego: fechaOpcional,
  fecha_instalacion_bateria: fechaOpcional,
  estado_botiquin: z.enum(["disponible", "faltante", "requiere_revision"]),
  estado_cubiertas: z.enum(["disponible", "faltante", "requiere_revision"]),
  estado_operativo: z.enum([
    "disponible",
    "asignado",
    "en_mantenimiento",
    "fuera_de_servicio",
  ]),
  observaciones: z
    .string()
    .trim()
    .max(2000, "Máximo 2000 caracteres")
    .transform((v) => (v === "" ? null : v)),
});

export type VehiculoFormValues = z.input<typeof vehiculoSchema>;
export type VehiculoInput = z.output<typeof vehiculoSchema>;

export const tecnicoSchema = z.object({
  nombre: z.string().trim().min(1, "Ingresá el nombre"),
  apellido: z.string().trim().min(1, "Ingresá el apellido"),
  telefono: z
    .string()
    .trim()
    .max(30, "Máximo 30 caracteres")
    .transform((v) => (v === "" ? null : v))
    .optional(),
  email: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .refine(
      (v) => v === null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      "Correo electrónico inválido"
    ),
  observaciones: z
    .string()
    .trim()
    .max(2000, "Máximo 2000 caracteres")
    .transform((v) => (v === "" ? null : v))
    .optional(),
});

export type TecnicoFormValues = z.input<typeof tecnicoSchema>;
export type TecnicoInput = z.output<typeof tecnicoSchema>;
