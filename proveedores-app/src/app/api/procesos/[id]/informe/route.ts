import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerirSesion, requerirPermiso, manejarErrorApi, ApiError } from "@/lib/api-auth";
import { puedeVerProceso, obtenerProcesoOrThrow } from "@/lib/procesos-helpers";
import { construirDatosInforme } from "@/lib/reportes/datos";
import { generarInformePDF } from "@/lib/reportes/pdf";
import { generarInformeExcel } from "@/lib/reportes/excel";
import { generarStorageKey, subirObjeto } from "@/lib/storage";
import { registrarEvento } from "@/lib/audit";

export const runtime = "nodejs";

// GET /api/procesos/:id/informe - lista los informes generados para este proceso (sección 15)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requerirSesion();
    const { id } = await params;

    const proceso = await obtenerProcesoOrThrow(id);
    if (!puedeVerProceso(session, proceso.creadoPorId)) {
      throw new ApiError("No tienes autorización para consultar los informes de este proceso.", 403);
    }

    const informes = await prisma.informe.findMany({
      where: { procesoId: id },
      include: { generadoPor: { select: { nombre: true } } },
      orderBy: { generadoAt: "desc" },
    });

    return NextResponse.json({ informes });
  } catch (error) {
    return manejarErrorApi(error);
  }
}

// POST /api/procesos/:id/informe - genera el informe formal en PDF o Excel y lo guarda en el storage cloud (sección 14 y 15)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requerirPermiso("informe:generar");
    const { id } = await params;

    const proceso = await obtenerProcesoOrThrow(id);
    if (!puedeVerProceso(session, proceso.creadoPorId)) {
      throw new ApiError("No tienes autorización para generar informes de este proceso.", 403);
    }

    const body = await req.json().catch(() => ({}));
    const tipo = (body?.tipo as "PDF" | "EXCEL") ?? "PDF";
    if (tipo !== "PDF" && tipo !== "EXCEL") {
      throw new ApiError("Tipo de informe no válido. Usa PDF o EXCEL.", 400);
    }

    const datos = await construirDatosInforme(id, session.user.name ?? session.user.email ?? "Usuario");

    const ultimaVersion = await prisma.informe.findFirst({
      where: { procesoId: id, tipo },
      orderBy: { version: "desc" },
    });
    const version = (ultimaVersion?.version ?? 0) + 1;
    datos.version = version;

    const buffer =
      tipo === "PDF" ? await generarInformePDF(datos) : await generarInformeExcel(datos);
    const contentType =
      tipo === "PDF"
        ? "application/pdf"
        : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    const extension = tipo === "PDF" ? "pdf" : "xlsx";
    const nombreArchivo = `Informe_Seleccion_${proceso.codigo}_v${version}.${extension}`;

    const storageKey = generarStorageKey({ procesoId: id, categoria: "informes", nombreOriginal: nombreArchivo });
    const { bucket } = await subirObjeto({ storageKey, body: buffer, contentType });

    const informe = await prisma.informe.create({
      data: {
        procesoId: id,
        tipo,
        version,
        bucket,
        storageKey,
        tamanoBytes: buffer.byteLength,
        generadoPorId: session.user.id,
      },
    });

    await registrarEvento({
      procesoId: id,
      entidad: "Informe",
      entidadId: informe.id,
      accion: "GENERAR_INFORME",
      usuarioId: session.user.id,
      detalle: { tipo, version },
    });

    return NextResponse.json({ informe }, { status: 201 });
  } catch (error) {
    return manejarErrorApi(error);
  }
}
