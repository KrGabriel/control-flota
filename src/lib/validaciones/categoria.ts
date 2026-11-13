import { z } from "zod";

export const categoriaSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "Ingresá el nombre de la categoría")
    .max(80, "Máximo 80 caracteres"),
  orden: z
    .string()
    .trim()
    .min(1, "Ingresá el orden")
    .refine((v) => /^-?\d+$/.test(v), "Ingresá un número entero válido")
    .transform(Number)
    .refine(
      (n) => n >= 0 && n <= 999,
      "El orden debe estar entre 0 y 999"
    ),
});

export type CategoriaFormValues = z.input<typeof categoriaSchema>;
export type CategoriaInput = z.output<typeof categoriaSchema>;
