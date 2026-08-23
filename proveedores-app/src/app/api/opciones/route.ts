import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerirSesion, requerirPermiso, manejarErrorApi, ApiError } from "@/lib/api-auth";
import { registrarEvento } from "@/lib/audit";
import { TipoListaConfigurable } from "@prisma/client";

// GET /api/opciones?lista=TIPO_PROVEEDOR - listas configurables (tipos de proveedor, categorías, monedas)
export async function GET(req: NextRequest) {
  try {
    await requerirSesion();
    const { searchParams } = new URL(req.url);
    const lista = searchParams.get("lista") as TipoListaConfigurable | null;

    const opciones = await prisma.opcionConfigurable.findMany({
      where: { activo: true, ...(lista ? { lista } : {}) },
      orderBy: { orden: "asc" },
    });

    return NextResponse.json({ opciones });
  } catch (error) {
    return manejarErrorApi(error);
  }
}

// POST /api/opciones - agrega una nueva opción a una lista configurable (solo Administrador)
export async function POST(req: NextRequest) {
  try {
    const session = await requerirPermiso("criterios:configurar");
    const body = await req.json();
    const { lista, valor, orden } = body as { lista: TipoListaConfigurable; valor: string; orden?: number };

    if (!lista || !valor) {
      throw new ApiError("Debes indicar la lista y el valor de la opción.", 400);
    }

    const opcion = await prisma.opcionConfigurable.create({
      data: { lista, valor: valor.trim(), orden: orden ?? 0 },
    });

    await registrarEvento({
      entidad: "OpcionConfigurable",
      entidadId: opcion.id,
      accion: "CREAR",
      usuarioId: session.user.id,
      detalle: { lista, valor },
    });

    return NextResponse.json({ opcion }, { status: 201 });
  } catch (error) {
    return manejarErrorApi(error);
  }
}
