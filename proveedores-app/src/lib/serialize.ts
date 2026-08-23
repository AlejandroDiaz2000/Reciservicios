import { CriterioEvaluacion, Calificacion, Proveedor } from "@prisma/client";

/**
 * Los campos Decimal de Prisma se serializan como string en JSON.
 * Estas funciones normalizan la respuesta de la API para que el frontend
 * siempre reciba números planos y no tenga que adivinar el tipo.
 */

export function serializarCriterio(c: CriterioEvaluacion) {
  return { ...c, peso: Number(c.peso) };
}

export function serializarCalificacion(c: Calificacion) {
  return {
    ...c,
    pesoAplicado: c.pesoAplicado == null ? null : Number(c.pesoAplicado),
    resultadoPonderado: c.resultadoPonderado == null ? null : Number(c.resultadoPonderado),
  };
}

export function serializarProveedor(p: Proveedor) {
  return {
    ...p,
    valorCotizacion: p.valorCotizacion == null ? null : Number(p.valorCotizacion),
  };
}
