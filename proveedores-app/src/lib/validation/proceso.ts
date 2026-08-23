import { z } from "zod";

export const procesoCrearSchema = z.object({
  fecha: z.coerce.date({ error: "La fecha de selección es obligatoria" }),
  areaSolicitante: z.string().trim().min(1, "El área solicitante es obligatoria").max(200),
  responsableNombre: z.string().trim().min(1, "El nombre del responsable es obligatorio").max(200),
  responsableCargo: z.string().trim().min(1, "El cargo del responsable es obligatorio").max(200),
  tipoProveedor: z.string().trim().min(1, "El tipo de proveedor es obligatorio"),
  categoria: z.string().trim().min(1, "La categoría es obligatoria"),
  descripcionNecesidad: z.string().trim().min(1, "La descripción de la necesidad es obligatoria"),
  observacionesGenerales: z.string().trim().max(5000).optional().nullable(),
});

export const procesoActualizarSchema = procesoCrearSchema.partial();

export const cambioEstadoSchema = z.object({
  estadoNuevo: z.enum([
    "BORRADOR",
    "EN_DILIGENCIAMIENTO",
    "PENDIENTE_REVISION",
    "APROBADA",
    "CERRADA",
  ]),
  motivo: z.string().trim().max(2000).optional(),
  // Solo un ADMINISTRADOR puede forzar el cierre si la ponderación no suma 100%
  forzarCierreConExcepcion: z.boolean().optional().default(false),
});

export const seleccionFinalSchema = z.object({
  proveedorSeleccionadoId: z.string().min(1, "Debes indicar el proveedor seleccionado"),
  justificacionSeleccion: z
    .string()
    .trim()
    .min(20, "La justificación debe tener al menos 20 caracteres"),
  motivoSiNoMayorPuntaje: z.string().trim().max(3000).optional().nullable(),
  observacionesFinales: z.string().trim().max(5000).optional().nullable(),
});

export type ProcesoCrearInput = z.infer<typeof procesoCrearSchema>;
export type ProcesoActualizarInput = z.infer<typeof procesoActualizarSchema>;
export type CambioEstadoInput = z.infer<typeof cambioEstadoSchema>;
export type SeleccionFinalInput = z.infer<typeof seleccionFinalSchema>;
