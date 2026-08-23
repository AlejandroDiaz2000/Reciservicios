import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerirSesion, manejarErrorApi, ApiError } from "@/lib/api-auth";
import { procesoCrearSchema } from "@/lib/validation/proceso";
import { generarCodigoProceso } from "@/lib/codigo";
import { registrarEvento } from "@/lib/audit";
import { RolUsuario, Prisma } from "@prisma/client";

// GET /api/procesos - lista/búsqueda de procesos (dashboard e historial, sección 16-17)
export async function GET(req: NextRequest) {
  try {
    const session = await requerirSesion();
    const rol = session.user.rol as RolUsuario;
    const { searchParams } = new URL(req.url);

    const codigo = searchParams.get("codigo")?.trim();
    const nit = searchParams.get("nit")?.trim();
    const razonSocial = searchParams.get("razonSocial")?.trim();
    const fecha = searchParams.get("fecha")?.trim();
    const area = searchParams.get("area")?.trim();
    const responsable = searchParams.get("responsable")?.trim();
    const estado = searchParams.get("estado")?.trim();
    const incluirArchivados = searchParams.get("incluirArchivados") === "true";

    const where: Prisma.ProcesoSeleccionWhereInput = {};

    // Alcance por rol: Responsable solo ve sus propios procesos.
    if (rol === "RESPONSABLE_SELECCION") {
      where.creadoPorId = session.user.id;
    }

    if (!incluirArchivados) where.archivado = false;
    if (codigo) where.codigo = { contains: codigo, mode: "insensitive" };
    if (area) where.areaSolicitante = { contains: area, mode: "insensitive" };
    if (responsable) where.responsableNombre = { contains: responsable, mode: "insensitive" };
    if (estado) where.estado = estado as Prisma.EnumEstadoProcesoFilter;
    if (fecha) {
      const dia = new Date(fecha);
      const siguienteDia = new Date(dia);
      siguienteDia.setDate(siguienteDia.getDate() + 1);
      where.fecha = { gte: dia, lt: siguienteDia };
    }
    if (nit || razonSocial) {
      where.proveedores = {
        some: {
          ...(nit ? { nit: { contains: nit, mode: "insensitive" } } : {}),
          ...(razonSocial ? { razonSocial: { contains: razonSocial, mode: "insensitive" } } : {}),
        },
      };
    }

    const procesos = await prisma.procesoSeleccion.findMany({
      where,
      orderBy: { creadoAt: "desc" },
      include: {
        proveedores: { select: { id: true, razonSocial: true, nit: true } },
        creadoPor: { select: { nombre: true } },
      },
      take: 200,
    });

    return NextResponse.json({ procesos });
  } catch (error) {
    return manejarErrorApi(error);
  }
}

// POST /api/procesos - crea un nuevo proceso como BORRADOR (sección 3)
export async function POST(req: NextRequest) {
  try {
    const session = await requerirSesion();
    const rol = session.user.rol as RolUsuario;
    if (rol === "CONSULTA") {
      throw new ApiError("El rol de consulta no puede crear procesos de selección.", 403);
    }

    const body = await req.json();
    const datos = procesoCrearSchema.parse(body);

    const proceso = await prisma.$transaction(async (tx) => {
      const codigo = await generarCodigoProceso(tx);
      return tx.procesoSeleccion.create({
        data: {
          codigo,
          fecha: datos.fecha,
          areaSolicitante: datos.areaSolicitante,
          responsableNombre: datos.responsableNombre,
          responsableCargo: datos.responsableCargo,
          tipoProveedor: datos.tipoProveedor,
          categoria: datos.categoria,
          descripcionNecesidad: datos.descripcionNecesidad,
          observacionesGenerales: datos.observacionesGenerales ?? null,
          estado: "BORRADOR",
          creadoPorId: session.user.id,
        },
      });
    });

    await registrarEvento({
      procesoId: proceso.id,
      entidad: "Proceso",
      entidadId: proceso.id,
      accion: "CREAR",
      estadoNuevo: "BORRADOR",
      usuarioId: session.user.id,
      detalle: { codigo: proceso.codigo },
    });

    return NextResponse.json({ proceso }, { status: 201 });
  } catch (error) {
    return manejarErrorApi(error);
  }
}
