/**
 * Motor de cálculo de la matriz de selección de proveedores.
 *
 * REGLA FUNDAMENTAL (sección 23 del documento de requisitos):
 * La persona que realiza la selección es responsable de asignar la
 * calificación (5, 3 o 1). Este módulo NUNCA decide ni sugiere una
 * calificación: únicamente aplica la ponderación configurada y calcula
 * resultados de forma determinística.
 *
 * Este archivo es puro (sin dependencias de Prisma/red) a propósito, para
 * poder probarlo de forma aislada y garantizar que backend y frontend usen
 * exactamente la misma lógica. La fuente de verdad de los cálculos SIEMPRE
 * es el backend (ver /api/procesos/[id]/calificaciones): el frontend solo
 * usa estas mismas funciones para mostrar una vista previa inmediata.
 */

export const CALIFICACIONES_VALIDAS = [5, 3, 1] as const;
export type ValorCalificacion = (typeof CALIFICACIONES_VALIDAS)[number];

export function esCalificacionValida(valor: unknown): valor is ValorCalificacion {
  return typeof valor === "number" && CALIFICACIONES_VALIDAS.includes(valor as ValorCalificacion);
}

/** Tolerancia para comparaciones de punto flotante en porcentajes (evita falsos negativos por redondeo). */
export const TOLERANCIA_PONDERACION = 0.01;

/**
 * Resultado ponderado de UN criterio para UN proveedor.
 * Fórmula (sección 9 del documento): valor / 5 * peso
 * Ejemplo: calificación 5 en criterio de peso 20 -> 5/5*20 = 20
 */
export function calcularResultadoPonderado(valor: number, pesoCriterio: number): number {
  const resultado = (valor / 5) * pesoCriterio;
  return redondear(resultado, 3);
}

export interface CriterioPeso {
  criterioId: string;
  peso: number;
  activo: boolean;
}

/** Suma de las ponderaciones de los criterios activos, en puntos porcentuales (ej. 95, 100). */
export function sumaPonderaciones(criterios: CriterioPeso[]): number {
  const total = criterios.filter((c) => c.activo).reduce((acc, c) => acc + c.peso, 0);
  return redondear(total, 2);
}

/** ¿La ponderación total configurada es exactamente 100% (dentro de tolerancia)? */
export function ponderacionEsCompleta(criterios: CriterioPeso[]): boolean {
  const total = sumaPonderaciones(criterios);
  return Math.abs(total - 100) <= TOLERANCIA_PONDERACION;
}

/** Mensaje de alerta de configuración cuando la ponderación no suma 100% (sección 7). */
export function mensajeAlertaPonderacion(totalActual: number): string {
  const totalFmt = formatearPorcentaje(totalActual);
  const faltante = formatearPorcentaje(redondear(100 - totalActual, 2));
  return `Los criterios configurados actualmente representan el ${totalFmt}% de la evaluación. Se requiere definir el ${faltante}% restante o ajustar las ponderaciones antes de cerrar la matriz.`;
}

export interface CalificacionCriterio {
  criterioId: string;
  peso: number;
  valor: number | null;
}

export interface ResultadoProveedor {
  puntajeTotalPonderado: number; // suma de resultados ponderados, en puntos porcentuales según pesos configurados
  puntajeSobreCinco: number; // normalizado a escala de 0 a 5, independiente de si los pesos suman 100%
  porcentaje: number; // igual a puntajeTotalPonderado cuando los pesos suman 100%; ver nota abajo
  criteriosCalificados: number;
  criteriosTotales: number;
  completo: boolean; // true si todos los criterios activos tienen calificación
}

/**
 * Calcula el resultado total de un proveedor a partir de sus calificaciones
 * por criterio. Es tolerante a matrices cuya ponderación aún no suma 100%
 * (normaliza sobre el total configurado) para poder mostrar avances durante
 * el diligenciamiento, pero el cierre definitivo del proceso exige 100%
 * (ver ponderacionEsCompleta).
 */
export function calcularResultadoProveedor(calificaciones: CalificacionCriterio[]): ResultadoProveedor {
  const pesoTotalConfigurado = redondear(
    calificaciones.reduce((acc, c) => acc + c.peso, 0),
    2
  );

  const calificadas = calificaciones.filter((c) => esCalificacionValida(c.valor));

  const puntajeTotalPonderado = redondear(
    calificadas.reduce((acc, c) => acc + calcularResultadoPonderado(c.valor as number, c.peso), 0),
    3
  );

  const puntajeSobreCinco =
    pesoTotalConfigurado > 0 ? redondear((puntajeTotalPonderado / pesoTotalConfigurado) * 5, 2) : 0;

  return {
    puntajeTotalPonderado,
    puntajeSobreCinco,
    porcentaje: puntajeTotalPonderado,
    criteriosCalificados: calificadas.length,
    criteriosTotales: calificaciones.length,
    completo: calificadas.length === calificaciones.length && calificaciones.length > 0,
  };
}

export interface ProveedorComparado {
  proveedorId: string;
  nombre: string;
  resultado: ResultadoProveedor;
}

export interface ComparacionResultado {
  ranking: (ProveedorComparado & { posicion: number })[];
  proveedorMayorPuntaje: ProveedorComparado | null;
}

/**
 * Ordena los proveedores de mayor a menor puntaje y detecta automáticamente
 * cuál obtuvo la mayor puntuación (sección 10). Esto es un hecho matemático,
 * NO una recomendación de contratación (ver sección 11).
 */
export function compararProveedores(proveedores: ProveedorComparado[]): ComparacionResultado {
  const ordenado = [...proveedores].sort(
    (a, b) => b.resultado.puntajeTotalPonderado - a.resultado.puntajeTotalPonderado
  );
  const ranking = ordenado.map((p, idx) => ({ ...p, posicion: idx + 1 }));
  return {
    ranking,
    proveedorMayorPuntaje: ranking[0] ?? null,
  };
}

export function redondear(valor: number, decimales: number): number {
  const factor = Math.pow(10, decimales);
  return Math.round((valor + Number.EPSILON) * factor) / factor;
}

export function formatearPorcentaje(valor: number): string {
  // Muestra sin decimales innecesarios (20 en vez de 20.00), pero conserva hasta 2 decimales si existen.
  return Number(valor.toFixed(2)).toString().replace(".", ",");
}
