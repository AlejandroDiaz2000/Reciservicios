import { prisma } from "@/lib/prisma";
import { calcularResultadoProveedor, compararProveedores } from "@/lib/calculations";
import { DatosInforme } from "./tipos";
import { ApiError } from "@/lib/api-auth";

/** Reúne toda la información del proceso necesaria para generar el informe formal (sección 14). */
export async function construirDatosInforme(procesoId: string, generadoPorNombre: string): Promise<DatosInforme> {
  const proceso = await prisma.procesoSeleccion.findUnique({
    where: { id: procesoId },
    include: { proveedores: { orderBy: { creadoAt: "asc" } } },
  });
  if (!proceso) throw new ApiError("El proceso no existe.", 404);

  const criterios = await prisma.criterioEvaluacion.findMany({ where: { activo: true }, orderBy: { orden: "asc" } });
  const calificaciones = await prisma.calificacion.findMany({ where: { procesoId } });

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
  const { ranking } = compararProveedores(proveedoresComparados);
  const posicionPorProveedor = new Map(ranking.map((r) => [r.proveedorId, r.posicion]));

  const proveedorMayorPuntaje = proceso.proveedores.find((p) => p.id === proceso.proveedorMayorPuntajeId);
  const proveedorSeleccionado = proceso.proveedores.find((p) => p.id === proceso.proveedorSeleccionadoId);

  return {
    empresa: {
      nombre: process.env.EMPRESA_NOMBRE || "Empresa de Transporte de Carga",
      nit: process.env.EMPRESA_NIT || "",
    },
    proceso: {
      codigo: proceso.codigo,
      fecha: proceso.fecha.toISOString().slice(0, 10),
      areaSolicitante: proceso.areaSolicitante,
      responsableNombre: proceso.responsableNombre,
      responsableCargo: proceso.responsableCargo,
      tipoProveedor: proceso.tipoProveedor,
      categoria: proceso.categoria,
      descripcionNecesidad: proceso.descripcionNecesidad,
      observacionesGenerales: proceso.observacionesGenerales,
      estado: proceso.estado,
      proveedorMayorPuntajeNombre: proveedorMayorPuntaje?.razonSocial ?? null,
      proveedorSeleccionadoNombre: proveedorSeleccionado?.razonSocial ?? null,
      justificacionSeleccion: proceso.justificacionSeleccion,
      motivoSiNoMayorPuntaje: proceso.motivoSiNoMayorPuntaje,
      observacionesFinales: proceso.observacionesFinales,
    },
    criterios: criterios.map((c) => ({ id: c.id, nombre: c.nombre, peso: Number(c.peso) })),
    proveedores: proceso.proveedores.map((prov) => {
      const calDelProveedor = calificaciones.filter((c) => c.proveedorId === prov.id);
      const resultado = proveedoresComparados.find((p) => p.proveedorId === prov.id)!.resultado;
      return {
        id: prov.id,
        razonSocial: prov.razonSocial,
        nit: prov.nit,
        nombreComercial: prov.nombreComercial,
        nombreContacto: prov.nombreContacto,
        telefono: prov.telefono,
        correo: prov.correo,
        ciudad: prov.ciudad,
        productoServicio: prov.productoServicio,
        valorCotizacion: prov.valorCotizacion ? Number(prov.valorCotizacion) : null,
        moneda: prov.moneda,
        calificaciones: criterios.map((crit) => {
          const cal = calDelProveedor.find((c) => c.criterioId === crit.id);
          return {
            criterioId: crit.id,
            valor: cal?.valor ?? null,
            resultadoPonderado: cal?.resultadoPonderado ? Number(cal.resultadoPonderado) : null,
            observacion: cal?.observacion ?? null,
          };
        }),
        puntajeTotalPonderado: resultado.puntajeTotalPonderado,
        puntajeSobreCinco: resultado.puntajeSobreCinco,
        posicion: posicionPorProveedor.get(prov.id) ?? 0,
      };
    }),
    version: 1, // se sobreescribe con el número real al guardar el registro de Informe
    generadoPor: generadoPorNombre,
    generadoAt: new Date().toISOString(),
  };
}
