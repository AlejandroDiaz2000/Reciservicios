import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerirSesion, manejarErrorApi, ApiError } from "@/lib/api-auth";
import { proveedorSchema } from "@/lib/validation/proveedor";
import { registrarEvento } from "@/lib/audit";
import { puedeEditarProceso, obtenerProcesoOrThrow, verificarProcesoEditable } from "@/lib/procesos-helpers";
import { RolUsuario } from "@prisma/client";
import { serializarProveedor } from "@/lib/serialize";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; proveedorId: string }> }
) {
  try {
    const session = await requerirSesion();
    const { id, proveedorId } = await params;
    const rol = session.user.rol as RolUsuario;

    const proceso = await obtenerProcesoOrThrow(id);
    if (!puedeEditarProceso(session, proceso.creadoPorId)) {
      throw new ApiError("No tienes autorización para editar proveedores en este proceso.", 403);
    }
    verificarProcesoEditable(proceso.estado, rol);

    const proveedorActual = proceso.proveedores.find((p) => p.id === proveedorId);
    if (!proveedorActual) throw new ApiError("El proveedor no existe en este proceso.", 404);

    const body = await req.json();
    const datos = proveedorSchema.partial().parse(body);

    if (datos.nit) {
      const duplicado = proceso.proveedores.find(
        (p) => p.id !== proveedorId && p.nit.trim().toLowerCase() === datos.nit!.trim().toLowerCase()
      );
      if (duplicado) {
        throw new ApiError(`Ya existe un proveedor con el NIT ${datos.nit} en este proceso.`, 400);
      }
    }

    const actualizado = await prisma.proveedor.update({
      where: { id: proveedorId },
      data: datos,
    });

    await registrarEvento({
      procesoId: id,
      entidad: "Proveedor",
      entidadId: proveedorId,
      accion: "ACTUALIZAR",
      usuarioId: session.user.id,
      detalle: { campos: Object.keys(datos) },
    });

    return NextResponse.json({ proveedor: serializarProveedor(actualizado) });
  } catch (error) {
    return manejarErrorApi(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; proveedorId: string }> }
) {
  try {
    const session = await requerirSesion();
    const { id, proveedorId } = await params;
    const rol = session.user.rol as RolUsuario;

    const proceso = await obtenerProcesoOrThrow(id);
    if (!puedeEditarProceso(session, proceso.creadoPorId)) {
      throw new ApiError("No tienes autorización para eliminar proveedores en este proceso.", 403);
    }
    verificarProcesoEditable(proceso.estado, rol);

    const proveedorActual = proceso.proveedores.find((p) => p.id === proveedorId);
    if (!proveedorActual) throw new ApiError("El proveedor no existe en este proceso.", 404);

    await prisma.proveedor.delete({ where: { id: proveedorId } });

    await registrarEvento({
      procesoId: id,
      entidad: "Proveedor",
      entidadId: proveedorId,
      accion: "ELIMINAR",
      usuarioId: session.user.id,
      detalle: { razonSocial: proveedorActual.razonSocial, nit: proveedorActual.nit },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return manejarErrorApi(error);
  }
}
