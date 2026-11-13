import { z } from "zod";

const enteroKm = (mensaje: string) =>
  z
    .string()
    .trim()
    .min(1, mensaje)
    .refine((v) => /^\d+$/.test(v), "Ingresá un número entero válido")
    .refine((v) => Number(v) >= 0 && Number(v) <= 100000, mensaje);

export const configAlertasSchema = z
  .object({
    anticipos_dias: z
      .array(
        z.object({
          dias: z
            .string()
            .trim()
            .min(1, "Ingresá los días")
            .refine((v) => /^\d+$/.test(v), "Ingresá un número entero válido")
            .refine((v) => Number(v) >= 0 && Number(v) <= 365, "Entre 0 y 365 días"),
        })
      )
      .min(1, "Agregá al menos un anticipo"),
    umbral_km_proximo: enteroKm("Ingresá el umbral próximo"),
    umbral_km_urgente: enteroKm("Ingresá el umbral urgente"),
    email_habilitado: z.boolean(),
    email_destino: z
      .string()
      .trim()
      .refine(
        (v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
        "Correo electrónico inválido"
      ),
  })
  .superRefine((val, ctx) => {
    if (Number(val.umbral_km_urgente) > Number(val.umbral_km_proximo)) {
      ctx.addIssue({
        code: "custom",
        path: ["umbral_km_urgente"],
        message: "Debe ser menor o igual al umbral próximo",
      });
    }
    if (new Set(val.anticipos_dias.map((f) => f.dias)).size !== val.anticipos_dias.length) {
      ctx.addIssue({
        code: "custom",
        path: ["anticipos_dias"],
        message: "Hay anticipos repetidos",
      });
    }
    if (val.email_habilitado && val.email_destino === "") {
      ctx.addIssue({
        code: "custom",
        path: ["email_destino"],
        message: "Ingresá el destinatario para habilitar el envío",
      });
    }
  });

export type ConfigAlertasFormValues = z.infer<typeof configAlertasSchema>;
