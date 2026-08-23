import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerirSesion, manejarErrorApi } from "@/lib/api-auth";
import { RolUsuario, Prisma } from "@prisma/client";

// GET /api/dashboard - indicadores del módulo de selección de proveedores (sección 16)
export async function GET() {
  try {
    const session = await requerirSesion();
    const rol = session.user.rol as RolUsuario;

    const where: Prisma.ProcesoSeleccionWhereInput =
      rol === "RESPONSABLE_SELECCION" ? { creadoPorId: session.user.id, archivado: false } : { archivado: false };

    const [total, borradores, cerrados, pendientes, proveedores, seleccionados] = await Promise.all([
      prisma.procesoSeleccion.count({ where }),
      prisma.procesoSeleccion.count({ where: { ...where, estado: "BORRADOR" } }),
      prisma.procesoSeleccion.count({ where: { ...where, estado: "CERRADA" } }),
      prisma.procesoSeleccion.count({ where: { ...where, estado: "PENDIENTE_REVISION" } }),
      prisma.proveedor.count({ where: { proceso: where } }),
      prisma.procesoSeleccion.count({ where: { ...where, NOT: { proveedorSeleccionadoId: null } } }),
    ]);

    return NextResponse.json({
      totalProcesos: total,
      procesosBorrador: borradores,
      procesosFinalizados: cerrados,
      procesosPendientesRevision: pendientes,
      proveedoresEvaluados: proveedores,
      proveedoresSeleccionados: seleccionados,
    });
  } catch (error) {
    return manejarErrorApi(error);
  }
}
