import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerirSesion, manejarErrorApi, ApiError } from "@/lib/api-auth";
import { calificacionesLoteSchema } from "@/lib/validation/calificacion";
import { registrarEvento } from "@/lib/audit";
import { puedeEditarProceso, puedeVerProceso, obtenerProcesoOrThrow, verificarProcesoEditable } from "@/lib/procesos-helpers";
import {
  calcularResultadoPonderado,
  calcularResultadoProveedor,
  compararProveedores,
  sumaPonderaciones,
  ponderacionEsCompleta,
  mensajeAlertaPonderacion,
} from "@/lib/calculations";
import { RolUsuario } from "@prisma/client";
import { serializarCriterio, serializarCalificacion, serializarProveedor } from "@/lib/serialize";

// GET /api/procesos/:id/calificaciones - datos completos de la matriz de evaluación (sección 5 y 8)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requerirSesion();
    const { id } = await params;

    const proceso = await obtenerProcesoOrThrow(id);
    if (!puedeVerProceso(session, proceso.creadoPorId)) {
      throw new ApiError("No tienes autorización para consultar este proceso.", 403);
    }

    const [criterios, calificaciones] = await Promise.all([
      prisma.criterioEvaluacion.findMany({ where: { activo: true }, orderBy: { orden: "asc" } }),
      prisma.calificacion.findMany({ where: { procesoId: id } }),
    ]);

    const pesos = criterios.map((c) => ({ criterioId: c.id, peso: Number(c.peso), activo: c.activo }));
    const totalPonderacion = sumaPonderaciones(pesos);
    const ponderacionCompleta = ponderacionEsCompleta(pesos);

    return NextResponse.json({
      criterios: criterios.map(serializarCriterio),
      calificaciones: calificaciones.map(serializarCalificacion),
      proveedores: proceso.proveedores.map(serializarProveedor),
      ponderacion: {
        total: totalPonderacion,
        completa: ponderacionCompleta,
        alerta: ponderacionCompleta ? null : mensajeAlertaPonderacion(totalPonderacion),
      },
    });
  } catch (error) {
    return manejarErrorApi(error);
  }
}

// PUT /api/procesos/:id/calificaciones - guarda calificaciones (5/3/1) y observaciones.
// El resultado ponderado SIEMPRE se calcula en el backend (sección 9): nunca se acepta
// un resultado calculado por el navegador.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requerirSesion();
    const { id } = await params;
    const rol = session.user.rol as RolUsuario;

    const proceso = await obtenerProcesoOrThrow(id);
    if (!puedeEditarProceso(session, proceso.creadoPorId)) {
      throw new ApiError("No tienes autorización para calificar proveedores en este proceso.", 403);
    }
    verificarProcesoEditable(proceso.estado, rol);

    const body = await req.json();
    const { calificaciones } = calificacionesLoteSchema.parse(body);

    const proveedorIds = new Set(proceso.proveedores.map((p) => p.id));
    const criterios = await prisma.criterioEvaluacion.findMany({ where: { activo: true } });
    const criteriosPorId = new Map(criterios.map((c) => [c.id, c]));

    for (const item of calificaciones) {
      if (!proveedorIds.has(item.proveedorId)) {
        throw new ApiError("Uno de los proveedores no pertenece a este proceso.", 400);
      }
      if (!criteriosPorId.has(item.criterioId)) {
        throw new ApiError("Uno de los criterios no es válido o no está activo.", 400);
      }
    }

    await prisma.$transaction(
      calificaciones.map((item) => {
        const criterio = criteriosPorId.get(item.criterioId)!;
        const peso = Number(criterio.peso);
        const resultadoPonderado = calcularResultadoPonderado(item.valor, peso);

        return prisma.calificacion.upsert({
          where: {
            procesoId_proveedorId_criterioId: {
              procesoId: id,
              proveedorId: item.proveedorId,
              criterioId: item.criterioId,
            },
          },
          update: {
            valor: item.valor,
            pesoAplicado: peso,
            resultadoPonderado,
            observacion: item.observacion ?? null,
            calificadoPorId: session.user.id,
          },
          create: {
            procesoId: id,
            proveedorId: item.proveedorId,
            criterioId: item.criterioId,
            valor: item.valor,
            pesoAplicado: peso,
            resultadoPonderado,
            observacion: item.observacion ?? null,
            calificadoPorId: session.user.id,
          },
        });
      })
    );

    await registrarEvento({
      procesoId: id,
      entidad: "Calificacion",
      accion: "CALIFICAR",
      usuarioId: session.user.id,
      detalle: { cantidad: calificaciones.length },
    });

    // Recalcula el proveedor con mayor puntuación y lo guarda como referencia
    // (usado luego para exigir motivo si el responsable elige a otro proveedor, sección 11).
    const todasLasCalificaciones = await prisma.calificacion.findMany({ where: { procesoId: id } });
    const resultadosPorProveedor = proceso.proveedores.map((prov) => {
      const deEsteProveedor = todasLasCalificaciones
        .filter((c) => c.proveedorId === prov.id)
        .map((c) => ({ criterioId: c.criterioId, peso: Number(c.pesoAplicado ?? 0), valor: c.valor }));
      return {
        proveedorId: prov.id,
        nombre: prov.razonSocial,
        resultado: calcularResultadoProveedor(deEsteProveedor),
      };
    });
    const { proveedorMayorPuntaje } = compararProveedores(resultadosPorProveedor);

    if (proveedorMayorPuntaje) {
      await prisma.procesoSeleccion.update({
        where: { id },
        data: { proveedorMayorPuntajeId: proveedorMayorPuntaje.proveedorId },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return manejarErrorApi(error);
  }
}
