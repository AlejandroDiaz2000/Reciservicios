import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerirSesion, manejarErrorApi, ApiError } from "@/lib/api-auth";
import { seleccionFinalSchema } from "@/lib/validation/proceso";
import { registrarEvento } from "@/lib/audit";
import { puedeEditarProceso, obtenerProcesoOrThrow, verificarProcesoEditable } from "@/lib/procesos-helpers";
import { RolUsuario } from "@prisma/client";

// POST /api/procesos/:id/seleccion-final - registra el proveedor elegido, justificación
// y (si aplica) el motivo de no elegir al de mayor puntaje (sección 11 y 12).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requerirSesion();
    const { id } = await params;
    const rol = session.user.rol as RolUsuario;

    const proceso = await obtenerProcesoOrThrow(id);
    if (!puedeEditarProceso(session, proceso.creadoPorId)) {
      throw new ApiError("No tienes autorización para registrar la selección final de este proceso.", 403);
    }
    verificarProcesoEditable(proceso.estado, rol);

    const body = await req.json();
    const datos = seleccionFinalSchema.parse(body);

    const proveedorValido = proceso.proveedores.some((p) => p.id === datos.proveedorSeleccionadoId);
    if (!proveedorValido) {
      throw new ApiError("El proveedor seleccionado no pertenece a este proceso.", 400);
    }

    // Si el proveedor elegido no es el de mayor puntaje, exigir motivo (trazabilidad para auditoría)
    if (
      proceso.proveedorMayorPuntajeId &&
      datos.proveedorSeleccionadoId !== proceso.proveedorMayorPuntajeId &&
      !datos.motivoSiNoMayorPuntaje
    ) {
      throw new ApiError(
        "El proveedor seleccionado no es el de mayor puntuación en la matriz. Debes registrar el motivo de esta decisión.",
        400
      );
    }

    const actualizado = await prisma.procesoSeleccion.update({
      where: { id },
      data: {
        proveedorSeleccionadoId: datos.proveedorSeleccionadoId,
        justificacionSeleccion: datos.justificacionSeleccion,
        motivoSiNoMayorPuntaje: datos.motivoSiNoMayorPuntaje ?? null,
        observacionesFinales: datos.observacionesFinales ?? null,
        estado: proceso.estado === "EN_DILIGENCIAMIENTO" ? "PENDIENTE_REVISION" : proceso.estado,
        actualizadoPorId: session.user.id,
      },
    });

    await registrarEvento({
      procesoId: id,
      entidad: "Proceso",
      entidadId: id,
      accion: "REGISTRAR_SELECCION_FINAL",
      usuarioId: session.user.id,
      detalle: { proveedorSeleccionadoId: datos.proveedorSeleccionadoId },
    });

    return NextResponse.json({ proceso: actualizado });
  } catch (error) {
    return manejarErrorApi(error);
  }
}
