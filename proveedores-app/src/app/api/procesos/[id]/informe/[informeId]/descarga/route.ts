import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerirSesion, manejarErrorApi, ApiError } from "@/lib/api-auth";
import { puedeVerProceso, obtenerProcesoOrThrow } from "@/lib/procesos-helpers";
import { getUrlDescargaFirmada } from "@/lib/storage";
import { registrarEvento } from "@/lib/audit";

export const runtime = "nodejs";

// GET /api/procesos/:id/informe/:informeId/descarga - entrega una URL firmada temporal
// (nunca se expone el bucket directamente; sección 22: "URLs temporales... para descargar documentos privados")
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; informeId: string }> }
) {
  try {
    const session = await requerirSesion();
    const { id, informeId } = await params;

    const proceso = await obtenerProcesoOrThrow(id);
    if (!puedeVerProceso(session, proceso.creadoPorId)) {
      throw new ApiError("No tienes autorización para descargar informes de este proceso.", 403);
    }

    const informe = await prisma.informe.findUnique({ where: { id: informeId } });
    if (!informe || informe.procesoId !== id) {
      throw new ApiError("El informe no existe.", 404);
    }

    const extension = informe.tipo === "PDF" ? "pdf" : "xlsx";
    const nombreDescarga = `Informe_Seleccion_${proceso.codigo}_v${informe.version}.${extension}`;

    const url = await getUrlDescargaFirmada({
      bucket: informe.bucket,
      storageKey: informe.storageKey,
      nombreDescarga,
      expiraSegundos: 300,
    });

    await registrarEvento({
      procesoId: id,
      entidad: "Informe",
      entidadId: informe.id,
      accion: "DESCARGAR",
      usuarioId: session.user.id,
    });

    return NextResponse.json({ url });
  } catch (error) {
    return manejarErrorApi(error);
  }
}
