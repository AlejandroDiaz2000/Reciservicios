import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerirSesion, requerirPermiso, manejarErrorApi } from "@/lib/api-auth";
import { criterioSchema } from "@/lib/validation/criterio";
import { registrarEvento } from "@/lib/audit";
import { sumaPonderaciones, ponderacionEsCompleta, mensajeAlertaPonderacion } from "@/lib/calculations";
import { serializarCriterio } from "@/lib/serialize";

// GET /api/criterios - lista todos los criterios configurados (activos e inactivos)
export async function GET() {
  try {
    await requerirSesion();
    const criterios = await prisma.criterioEvaluacion.findMany({ orderBy: { orden: "asc" } });

    const pesos = criterios
      .filter((c) => c.activo)
      .map((c) => ({ criterioId: c.id, peso: Number(c.peso), activo: c.activo }));
    const total = sumaPonderaciones(pesos);
    const completa = ponderacionEsCompleta(pesos);

    return NextResponse.json({
      criterios: criterios.map(serializarCriterio),
      ponderacion: {
        total,
        completa,
        alerta: completa ? null : mensajeAlertaPonderacion(total),
      },
    });
  } catch (error) {
    return manejarErrorApi(error);
  }
}

// POST /api/criterios - crea un nuevo criterio (solo Administrador, sección 21)
export async function POST(req: NextRequest) {
  try {
    const session = await requerirPermiso("criterios:configurar");
    const body = await req.json();
    const datos = criterioSchema.parse(body);

    const criterio = await prisma.criterioEvaluacion.create({ data: datos });

    await registrarEvento({
      entidad: "Criterio",
      entidadId: criterio.id,
      accion: "CREAR",
      usuarioId: session.user.id,
      detalle: { nombre: criterio.nombre, peso: datos.peso },
    });

    return NextResponse.json({ criterio }, { status: 201 });
  } catch (error) {
    return manejarErrorApi(error);
  }
}
