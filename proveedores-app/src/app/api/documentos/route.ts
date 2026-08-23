import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerirSesion, manejarErrorApi, ApiError } from "@/lib/api-auth";
import { puedeEditarProceso, obtenerProcesoOrThrow } from "@/lib/procesos-helpers";
import { generarStorageKey, getUrlSubidaFirmada } from "@/lib/storage";
import { registrarEvento } from "@/lib/audit";

export const runtime = "nodejs";

const TIPOS_PERMITIDOS = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];
const TAMANO_MAXIMO_BYTES = 15 * 1024 * 1024; // 15 MB

/**
 * Módulo de documentos: preparado desde esta versión (arquitectura de almacenamiento
 * S3-compatible con referencias seguras) para la carga de soportes de proveedores.
 * La interfaz de carga se habilitará por completo en una siguiente fase, según el
 * alcance definido para esta primera versión (sección 4 del documento de requisitos).
 */

// POST /api/documentos - solicita una URL firmada de subida y registra el documento (metadatos)
export async function POST(req: NextRequest) {
  try {
    const session = await requerirSesion();
    const body = await req.json();
    const { procesoId, proveedorId, nombreOriginal, tipoArchivo, tamanoBytes } = body as {
      procesoId: string;
      proveedorId?: string;
      nombreOriginal: string;
      tipoArchivo: string;
      tamanoBytes: number;
    };

    if (!procesoId || !nombreOriginal || !tipoArchivo || !tamanoBytes) {
      throw new ApiError("Faltan datos del documento a cargar.", 400);
    }
    if (!TIPOS_PERMITIDOS.includes(tipoArchivo)) {
      throw new ApiError("Tipo de archivo no permitido.", 400);
    }
    if (tamanoBytes > TAMANO_MAXIMO_BYTES) {
      throw new ApiError("El archivo supera el tamaño máximo permitido (15 MB).", 400);
    }

    const proceso = await obtenerProcesoOrThrow(procesoId);
    if (!puedeEditarProceso(session, proceso.creadoPorId)) {
      throw new ApiError("No tienes autorización para cargar documentos en este proceso.", 403);
    }

    const storageKey = generarStorageKey({ procesoId, categoria: "documentos", nombreOriginal });
    const urlSubida = await getUrlSubidaFirmada({ storageKey, contentType: tipoArchivo });

    const documento = await prisma.documento.create({
      data: {
        procesoId,
        proveedorId: proveedorId || null,
        nombreOriginal,
        tipoArchivo,
        tamanoBytes,
        bucket: process.env.S3_BUCKET || "",
        storageKey,
        subidoPorId: session.user.id,
      },
    });

    await registrarEvento({
      procesoId,
      entidad: "Documento",
      entidadId: documento.id,
      accion: "CARGAR",
      usuarioId: session.user.id,
      detalle: { nombreOriginal, tipoArchivo, tamanoBytes },
    });

    return NextResponse.json({ documento, urlSubida }, { status: 201 });
  } catch (error) {
    return manejarErrorApi(error);
  }
}
