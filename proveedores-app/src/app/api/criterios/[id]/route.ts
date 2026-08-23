import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerirPermiso, manejarErrorApi, ApiError } from "@/lib/api-auth";
import { criterioActualizarSchema } from "@/lib/validation/criterio";
import { registrarEvento } from "@/lib/audit";
import { serializarCriterio } from "@/lib/serialize";

// PATCH /api/criterios/:id - modifica peso/descripciones/guías de un criterio (solo Administrador).
// Cada cambio queda registrado en CriterioHistorial para trazabilidad de configuración (sección 21).
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requerirPermiso("criterios:configurar");
    const { id } = await params;

    const criterioActual = await prisma.criterioEvaluacion.findUnique({ where: { id } });
    if (!criterioActual) throw new ApiError("El criterio no existe.", 404);

    const body = await req.json();
    const datos = criterioActualizarSchema.parse(body);

    const historial: { campoModificado: string; valorAnterior: string | null; valorNuevo: string | null }[] = [];
    for (const [campo, valorNuevo] of Object.entries(datos)) {
      const valorAnterior = (criterioActual as unknown as Record<string, unknown>)[campo];
      if (valorNuevo !== undefined && String(valorAnterior) !== String(valorNuevo)) {
        historial.push({
          campoModificado: campo,
          valorAnterior: valorAnterior === null || valorAnterior === undefined ? null : String(valorAnterior),
          valorNuevo: valorNuevo === null ? null : String(valorNuevo),
        });
      }
    }

    const [criterio] = await prisma.$transaction([
      prisma.criterioEvaluacion.update({ where: { id }, data: datos }),
      ...historial.map((h) =>
        prisma.criterioHistorial.create({
          data: {
            criterioId: id,
            campoModificado: h.campoModificado,
            valorAnterior: h.valorAnterior,
            valorNuevo: h.valorNuevo,
            modificadoPorId: session.user.id,
          },
        })
      ),
    ]);

    await registrarEvento({
      entidad: "Criterio",
      entidadId: id,
      accion: "ACTUALIZAR",
      usuarioId: session.user.id,
      detalle: { cambios: historial },
    });

    return NextResponse.json({ criterio: serializarCriterio(criterio) });
  } catch (error) {
    return manejarErrorApi(error);
  }
}

// DELETE /api/criterios/:id - desactivación lógica (nunca se borra físicamente, por trazabilidad)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requerirPermiso("criterios:configurar");
    const { id } = await params;

    const criterio = await prisma.criterioEvaluacion.update({
      where: { id },
      data: { activo: false },
    });

    await registrarEvento({
      entidad: "Criterio",
      entidadId: id,
      accion: "DESACTIVAR",
      usuarioId: session.user.id,
    });

    return NextResponse.json({ criterio: serializarCriterio(criterio) });
  } catch (error) {
    return manejarErrorApi(error);
  }
}
