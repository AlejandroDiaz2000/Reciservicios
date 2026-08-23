import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerirSesion, manejarErrorApi, ApiError } from "@/lib/api-auth";
import { puedeVerProceso } from "@/lib/procesos-helpers";
import { getUrlDescargaFirmada } from "@/lib/storage";
import { registrarEvento } from "@/lib/audit";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requerirSesion();
    const { id } = await params;

    const documento = await prisma.documento.findUnique({
      where: { id },
      include: { proceso: true },
    });
    if (!documento) throw new ApiError("El documento no existe.", 404);
    if (!puedeVerProceso(session, documento.proceso.creadoPorId)) {
      throw new ApiError("No tienes autorización para descargar este documento.", 403);
    }

    const url = await getUrlDescargaFirmada({
      bucket: documento.bucket,
      storageKey: documento.storageKey,
      nombreDescarga: documento.nombreOriginal,
    });

    await registrarEvento({
      procesoId: documento.procesoId,
      entidad: "Documento",
      entidadId: documento.id,
      accion: "DESCARGAR",
      usuarioId: session.user.id,
    });

    return NextResponse.json({ url });
  } catch (error) {
    return manejarErrorApi(error);
  }
}
