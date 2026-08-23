import { prisma } from "@/lib/prisma";
import { ponderacionEsCompleta, sumaPonderaciones, CriterioPeso } from "@/lib/calculations";

export interface ValidacionCierre {
  ok: boolean;
  errores: string[];
  advertencias: string[];
  totalProveedores: number;
  totalPonderacion: number;
}

/**
 * Verifica TODAS las reglas de negocio antes de permitir cerrar un proceso
 * (sección 20 del documento). Esta validación se ejecuta en backend y es la
 * que realmente decide si el cierre procede; el frontend solo la refleja.
 */
export async function validarCierreProceso(procesoId: string): Promise<ValidacionCierre> {
  const errores: string[] = [];
  const advertencias: string[] = [];

  const proceso = await prisma.procesoSeleccion.findUnique({
    where: { id: procesoId },
    include: { proveedores: true },
  });

  if (!proceso) {
    return { ok: false, errores: ["El proceso no existe."], advertencias, totalProveedores: 0, totalPonderacion: 0 };
  }

  // Mínimo 3 proveedores (sección 4 y 20)
  if (proceso.proveedores.length < 3) {
    errores.push(
      `Se requieren mínimo 3 proveedores para cerrar la selección (actualmente hay ${proceso.proveedores.length}).`
    );
  }

  // NIT no duplicados dentro del proceso
  const nits = proceso.proveedores.map((p) => p.nit.trim().toLowerCase());
  const nitsUnicos = new Set(nits);
  if (nitsUnicos.size !== nits.length) {
    errores.push("Existen proveedores con NIT duplicado dentro del proceso.");
  }

  // Ponderación de criterios activos debe sumar 100%
  const criterios = await prisma.criterioEvaluacion.findMany({ where: { activo: true } });
  const pesos: CriterioPeso[] = criterios.map((c) => ({
    criterioId: c.id,
    peso: Number(c.peso),
    activo: c.activo,
  }));
  const totalPonderacion = sumaPonderaciones(pesos);
  const ponderacionCompleta = ponderacionEsCompleta(pesos);

  if (!ponderacionCompleta) {
    errores.push(
      `La ponderación total de los criterios es ${totalPonderacion}%. Debe ser exactamente 100% para cerrar la matriz (o requiere excepción autorizada por un administrador).`
    );
  }

  // Todos los criterios deben estar calificados para todos los proveedores
  if (proceso.proveedores.length > 0 && criterios.length > 0) {
    const calificaciones = await prisma.calificacion.findMany({
      where: { procesoId },
    });
    const esperadas = proceso.proveedores.length * criterios.length;
    const completas = calificaciones.filter((c) => c.valor !== null).length;
    if (completas < esperadas) {
      errores.push(
        `Faltan calificaciones por diligenciar: ${completas} de ${esperadas} celdas de la matriz están completas.`
      );
    }
  }

  // Debe existir justificación de la selección final
  if (!proceso.proveedorSeleccionadoId || !proceso.justificacionSeleccion) {
    errores.push("Debes registrar el proveedor seleccionado finalmente y su justificación antes de cerrar.");
  }

  // Si el proveedor elegido no es el de mayor puntaje, debe existir motivo (sección 11)
  if (
    proceso.proveedorSeleccionadoId &&
    proceso.proveedorMayorPuntajeId &&
    proceso.proveedorSeleccionadoId !== proceso.proveedorMayorPuntajeId &&
    !proceso.motivoSiNoMayorPuntaje
  ) {
    errores.push(
      "El proveedor seleccionado no es el de mayor puntuación: debes registrar el motivo de esa decisión."
    );
  }

  return {
    ok: errores.length === 0,
    errores,
    advertencias,
    totalProveedores: proceso.proveedores.length,
    totalPonderacion,
  };
}
