import { z } from "zod";

const fechaOpcional = z
  .string()
  .trim()
  .refine(
    (v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v),
    "Fecha inválida"
  )
  .transform((v) => (v === "" ? null : v));

export const ELEMENTOS_ADICIONALES = [
  { valor: "patente", etiqueta: "Cédula / documentación de patente" },
  { valor: "balizas", etiqueta: "Balizas" },
  { valor: "crique", etiqueta: "Crique" },
  { valor: "llave_ruedas", etiqueta: "Llave de ruedas" },
  { valor: "otro", etiqueta: "Otro" },
] as const;

export type ElementoAdicional = (typeof ELEMENTOS_ADICIONALES)[number]["valor"];

export const documentoSchema = z
  .object({
    elemento: z.enum(["patente", "balizas", "crique", "llave_ruedas", "otro"]),
    tipo: z.enum(["documento_vencimiento", "disponible_fisica"]),
    fecha_vencimiento: fechaOpcional,
    estado_fisica: z.enum(["disponible", "faltante", "requiere_revision"]),
    observaciones: z
      .string()
      .trim()
      .max(2000, "Máximo 2000 caracteres")
      .transform((v) => (v === "" ? null : v)),
  })
  .superRefine((val, ctx) => {
    if (val.tipo === "documento_vencimiento" && val.fecha_vencimiento === null) {
      ctx.addIssue({
        code: "custom",
        path: ["fecha_vencimiento"],
        message: "Ingresá la fecha de vencimiento",
      });
    }
  });

export type DocumentoFormValues = z.input<typeof documentoSchema>;
export type DocumentoInput = z.output<typeof documentoSchema>;
