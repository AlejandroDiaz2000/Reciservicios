import { z } from "zod";

export const criterioSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre del criterio es obligatorio").max(200),
  descripcion: z.string().trim().max(1000).optional().nullable(),
  peso: z.coerce.number().min(0, "El peso no puede ser negativo").max(100, "El peso no puede superar 100"),
  orden: z.coerce.number().int().optional().default(0),
  activo: z.boolean().optional().default(true),
  guia5: z.string().trim().min(1, "La guía para la calificación 5 es obligatoria"),
  guia3: z.string().trim().min(1, "La guía para la calificación 3 es obligatoria"),
  guia1: z.string().trim().min(1, "La guía para la calificación 1 es obligatoria"),
});

export const criterioActualizarSchema = criterioSchema.partial();

export type CriterioInput = z.infer<typeof criterioSchema>;
