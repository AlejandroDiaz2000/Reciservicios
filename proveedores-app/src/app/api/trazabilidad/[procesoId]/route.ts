import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerirSesion, manejarErrorApi, ApiError } from "@/lib/api-auth";
import { puedeVerProceso, obtenerProcesoOrThrow } from "@/lib/procesos-helpers";

// GET /api/trazabilidad/:procesoId - historial completo de auditoría de un proceso (sección 18)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ procesoId: string }> }) {
  try {
    const session = await requerirSesion();
    const { procesoId } = await params;

    const proceso = await obtenerProcesoOrThrow(procesoId);
    if (!puedeVerProceso(session, proceso.creadoPorId)) {
      throw new ApiError("No tienes autorización para consultar la trazabilidad de este proceso.", 403);
    }

    const eventos = await prisma.eventoAuditoria.findMany({
      where: { procesoId },
      include: { usuario: { select: { nombre: true, correo: true, rol: true } } },
      orderBy: { creadoAt: "desc" },
    });

    return NextResponse.json({ eventos });
  } catch (error) {
    return manejarErrorApi(error);
  }
}
