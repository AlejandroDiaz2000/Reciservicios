import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerirSesion, manejarErrorApi, ApiError } from "@/lib/api-auth";
import { procesoActualizarSchema } from "@/lib/validation/proceso";
import { registrarEvento } from "@/lib/audit";
import { puedeVerProceso, puedeEditarProceso, verificarProcesoEditable } from "@/lib/procesos-helpers";
import { RolUsuario } from "@prisma/client";
import { serializarProveedor } from "@/lib/serialize";

// GET /api/procesos/:id - detalle completo del proceso
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requerirSesion();
    const { id } = await params;

    const proceso = await prisma.procesoSeleccion.findUnique({
      where: { id },
      include: {
        proveedores: { orderBy: { creadoAt: "asc" } },
        creadoPor: { select: { nombre: true, correo: true } },
        actualizadoPor: { select: { nombre: true } },
        cerradoPor: { select: { nombre: true } },
        informes: { orderBy: { generadoAt: "desc" } },
      },
    });

    if (!proceso) throw new ApiError("El proceso de selección no existe.", 404);
    if (!puedeVerProceso(session, proceso.creadoPorId)) {
      throw new ApiError("No tienes autorización para consultar este proceso.", 403);
    }

    return NextResponse.json({
      proceso: { ...proceso, proveedores: proceso.proveedores.map(serializarProveedor) },
    });
  } catch (error) {
    return manejarErrorApi(error);
  }
}

// PATCH /api/procesos/:id - actualiza la información general (solo mientras no esté cerrado)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requerirSesion();
    const { id } = await params;
    const rol = session.user.rol as RolUsuario;

    const proceso = await prisma.procesoSeleccion.findUnique({ where: { id } });
    if (!proceso) throw new ApiError("El proceso de selección no existe.", 404);
    if (!puedeEditarProceso(session, proceso.creadoPorId)) {
      throw new ApiError("No tienes autorización para editar este proceso.", 403);
    }
    verificarProcesoEditable(proceso.estado, rol);

    const body = await req.json();
    const datos = procesoActualizarSchema.parse(body);

    const actualizado = await prisma.procesoSeleccion.update({
      where: { id },
      data: {
        ...datos,
        estado: proceso.estado === "BORRADOR" ? "EN_DILIGENCIAMIENTO" : proceso.estado,
        actualizadoPorId: session.user.id,
      },
    });

    await registrarEvento({
      procesoId: id,
      entidad: "Proceso",
      entidadId: id,
      accion: "ACTUALIZAR",
      usuarioId: session.user.id,
      detalle: { campos: Object.keys(datos) },
    });

    return NextResponse.json({ proceso: actualizado });
  } catch (error) {
    return manejarErrorApi(error);
  }
}
