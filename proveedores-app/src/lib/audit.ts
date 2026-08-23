import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

interface RegistrarEventoParams {
  procesoId?: string;
  entidad: string;
  entidadId?: string;
  accion: string;
  estadoAnterior?: string;
  estadoNuevo?: string;
  detalle?: Prisma.InputJsonValue;
  usuarioId?: string;
  ip?: string;
}

/**
 * Registra un evento en la bitácora de trazabilidad/auditoría.
 * Toda acción relevante del sistema (creación, edición, cambios de estado,
 * calificaciones, generación de informes, descargas, cambios de configuración)
 * debe pasar por aquí. Esta tabla NUNCA se borra ni se edita.
 */
export async function registrarEvento(params: RegistrarEventoParams) {
  try {
    await prisma.eventoAuditoria.create({
      data: {
        procesoId: params.procesoId,
        entidad: params.entidad,
        entidadId: params.entidadId,
        accion: params.accion,
        estadoAnterior: params.estadoAnterior,
        estadoNuevo: params.estadoNuevo,
        detalle: params.detalle,
        usuarioId: params.usuarioId,
        ip: params.ip,
      },
    });
  } catch (error) {
    // La auditoría no debe tumbar la operación principal, pero sí debe quedar
    // visible en logs del servidor para investigación.
    console.error("[auditoria] No se pudo registrar el evento:", params, error);
  }
}
