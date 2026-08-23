import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerirSesion, manejarErrorApi, ApiError } from "@/lib/api-auth";
import { proveedorSchema } from "@/lib/validation/proveedor";
import { registrarEvento } from "@/lib/audit";
import { puedeEditarProceso, obtenerProcesoOrThrow, verificarProcesoEditable } from "@/lib/procesos-helpers";
import { RolUsuario } from "@prisma/client";
import { serializarProveedor } from "@/lib/serialize";

// POST /api/procesos/:id/proveedores - registra un proveedor dentro del proceso (sección 4)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requerirSesion();
    const { id } = await params;
    const rol = session.user.rol as RolUsuario;

    const proceso = await obtenerProcesoOrThrow(id);
    if (!puedeEditarProceso(session, proceso.creadoPorId)) {
      throw new ApiError("No tienes autorización para registrar proveedores en este proceso.", 403);
    }
    verificarProcesoEditable(proceso.estado, rol);

    const body = await req.json();
    const datos = proveedorSchema.parse(body);

    // Validación: NIT no duplicado dentro del mismo proceso (sección 20)
    const nitExistente = proceso.proveedores.find(
      (p) => p.nit.trim().toLowerCase() === datos.nit.trim().toLowerCase()
    );
    if (nitExistente) {
      throw new ApiError(`Ya existe un proveedor con el NIT ${datos.nit} en este proceso.`, 400);
    }

    const proveedor = await prisma.$transaction(async (tx) => {
      const nuevo = await tx.proveedor.create({
        data: {
          procesoId: id,
          razonSocial: datos.razonSocial,
          nit: datos.nit,
          nombreComercial: datos.nombreComercial || null,
          nombreContacto: datos.nombreContacto || null,
          cargoContacto: datos.cargoContacto || null,
          telefono: datos.telefono || null,
          correo: datos.correo || null,
          ciudad: datos.ciudad || null,
          direccion: datos.direccion || null,
          paginaWeb: datos.paginaWeb || null,
          tiempoMercado: datos.tiempoMercado || null,
          productoServicio: datos.productoServicio,
          valorCotizacion: datos.valorCotizacion ?? null,
          moneda: datos.moneda || "COP",
          condicionesComerciales: datos.condicionesComerciales || null,
          formaPagoPropuesta: datos.formaPagoPropuesta || null,
          descuentosOfrecidos: datos.descuentosOfrecidos || null,
          observacionesComerciales: datos.observacionesComerciales || null,
          certificacionCalidad: datos.certificacionCalidad ?? false,
          certificacionAmbiental: datos.certificacionAmbiental ?? false,
          certificacionSST: datos.certificacionSST ?? false,
          otrasCertificaciones: datos.otrasCertificaciones || null,
          observacionesAdicionales: datos.observacionesAdicionales || null,
        },
      });

      // Crea automáticamente las filas de calificación (vacías) para cada criterio activo,
      // así la matriz queda lista para diligenciar sin cálculos implícitos.
      const criterios = await tx.criterioEvaluacion.findMany({ where: { activo: true } });
      if (criterios.length > 0) {
        await tx.calificacion.createMany({
          data: criterios.map((c) => ({
            procesoId: id,
            proveedorId: nuevo.id,
            criterioId: c.id,
            pesoAplicado: c.peso,
          })),
        });
      }

      if (proceso.estado === "BORRADOR") {
        await tx.procesoSeleccion.update({
          where: { id },
          data: { estado: "EN_DILIGENCIAMIENTO", actualizadoPorId: session.user.id },
        });
      }

      return nuevo;
    });

    await registrarEvento({
      procesoId: id,
      entidad: "Proveedor",
      entidadId: proveedor.id,
      accion: "CREAR",
      usuarioId: session.user.id,
      detalle: { razonSocial: proveedor.razonSocial, nit: proveedor.nit },
    });

    return NextResponse.json({ proveedor: serializarProveedor(proveedor) }, { status: 201 });
  } catch (error) {
    return manejarErrorApi(error);
  }
}
