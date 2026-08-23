import { z } from "zod";

// El evaluador ÚNICAMENTE puede elegir 5, 3 o 1 (sección 5 y 20 del documento).
// Cualquier otro valor debe ser rechazado tanto en frontend como en backend.
export const calificacionItemSchema = z.object({
  proveedorId: z.string().min(1),
  criterioId: z.string().min(1),
  valor: z.union([z.literal(5), z.literal(3), z.literal(1)]),
  observacion: z.string().trim().max(3000).optional().nullable(),
});

export const calificacionesLoteSchema = z.object({
  calificaciones: z.array(calificacionItemSchema).min(1),
});

export type CalificacionItemInput = z.infer<typeof calificacionItemSchema>;
export type CalificacionesLoteInput = z.infer<typeof calificacionesLoteSchema>;
