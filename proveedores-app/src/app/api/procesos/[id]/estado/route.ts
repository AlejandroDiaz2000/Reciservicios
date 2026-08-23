import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerirSesion, manejarErrorApi, ApiError } from "@/lib/api-auth";
import { cambioEstadoSchema } from "@/lib/validation/proceso";
import { registrarEvento } from "@/lib/audit";
import { puedeEditarProceso, obtenerProcesoOrThrow } from "@/lib/procesos-helpers";
import { validarCierreProceso } from "@/lib/validaciones-cierre";
import { RolUsuario } from "@prisma/client";

const TRANSICIONES_VALIDAS: Record<string, string[]> = {
  BORRADOR: ["EN_DILIGENCIAMIENTO", "PENDIENTE_REVISION"],
  EN_DILIGENCIAMIENTO: ["PENDIENTE_REVISION", "BORRADOR"],
  PENDIENTE_REVISION: ["APROBADA", "EN_DILIGENCIAMIENTO"],
  APROBADA: ["CERRADA", "PENDIENTE_REVISION"],
  CERRADA: [], // solo se reabre manualmente por un administrador vía excepción (no expuesto en esta versión)
};

// POST /api/procesos/:id/estado - cambia el estado del proceso con validaciones de negocio (sección 13 y 20)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requerirSesion();
    const { id } = await params;
    const rol = session.user.rol as RolUsuario;

    const proceso = await obtenerProcesoOrThrow(id);
    if (!puedeEditarProceso(session, proceso.creadoPorId)) {
      throw new ApiError("No tienes autorización para cambiar el estado de este proceso.", 403);
    }

    const body = await req.json();
    const { estadoNuevo, motivo, forzarCierreConExcepcion } = cambioEstadoSchema.parse(body);

    const permitidas = TRANSICIONES_VALIDAS[proceso.estado] ?? [];
    if (!permitidas.includes(estadoNuevo)) {
      throw new ApiError(
        `No es válido pasar de "${proceso.estado}" a "${estadoNuevo}". Transiciones permitidas: ${
          permitidas.join(", ") || "ninguna"
        }.`,
        400
      );
    }

    // Reglas específicas para CERRAR el proceso (sección 7 y 20: validación crítica en backend)
    let cierreConExcepcion = false;
    if (estadoNuevo === "CERRADA") {
      const validacion = await validarCierreProceso(id);

      if (!validacion.ok) {
        const soloPorPonderacion =
          validacion.errores.length === 1 && validacion.errores[0].includes("ponderación");

        if (soloPorPonderacion && forzarCierreConExcepcion && rol === "ADMINISTRADOR") {
          cierreConExcepcion = true;
        } else {
          throw new ApiError(
            `No es posible cerrar el proceso. ${validacion.errores.join(" ")}`,
            400
          );
        }
      }
    }

    const actualizado = await prisma.procesoSeleccion.update({
      where: { id },
      data: {
        estado: estadoNuevo,
        actualizadoPorId: session.user.id,
        ...(estadoNuevo === "CERRADA"
          ? {
              cerradoPorId: session.user.id,
              cerradoAt: new Date(),
              cierreConExcepcion,
              cierreExcepcionAutorizadoPorId: cierreConExcepcion ? session.user.id : undefined,
              cierreExcepcionMotivo: cierreConExcepcion ? motivo : undefined,
            }
          : {}),
      },
    });

    await registrarEvento({
      procesoId: id,
      entidad: "Proceso",
      entidadId: id,
      accion: "CAMBIO_ESTADO",
      estadoAnterior: proceso.estado,
      estadoNuevo,
      usuarioId: session.user.id,
      detalle: { motivo, cierreConExcepcion },
    });

    return NextResponse.json({ proceso: actualizado });
  } catch (error) {
    return manejarErrorApi(error);
  }
}
