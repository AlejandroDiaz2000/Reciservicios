import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerirSesion, manejarErrorApi, ApiError } from "@/lib/api-auth";
import { puedeVerProceso, obtenerProcesoOrThrow } from "@/lib/procesos-helpers";
import { calcularResultadoProveedor, compararProveedores } from "@/lib/calculations";

// GET /api/procesos/:id/comparacion - comparación y ranking automático (sección 10 y 11)
// Se recalcula siempre en el backend a partir de las calificaciones guardadas.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requerirSesion();
    const { id } = await params;

    const proceso = await obtenerProcesoOrThrow(id);
    if (!puedeVerProceso(session, proceso.creadoPorId)) {
      throw new ApiError("No tienes autorización para consultar este proceso.", 403);
    }

    const calificaciones = await prisma.calificacion.findMany({ where: { procesoId: id } });

    const proveedoresComparados = proceso.proveedores.map((prov) => {
      const deEsteProveedor = calificaciones
        .filter((c) => c.proveedorId === prov.id)
        .map((c) => ({ criterioId: c.criterioId, peso: Number(c.pesoAplicado ?? 0), valor: c.valor }));
      return {
        proveedorId: prov.id,
        nombre: prov.razonSocial,
        resultado: calcularResultadoProveedor(deEsteProveedor),
      };
    });

    const comparacion = compararProveedores(proveedoresComparados);

    return NextResponse.json({ comparacion });
  } catch (error) {
    return manejarErrorApi(error);
  }
}
