/**
 * Prueba independiente (sin base de datos) del motor de cálculo de la matriz,
 * usando los ejemplos numéricos exactos del documento de requisitos
 * (secciones 6, 7, 9 y 10) para verificar que los cálculos son correctos.
 *
 * Ejecutar con: npx tsx scripts/test-calculos.ts
 */
import {
  calcularResultadoPonderado,
  sumaPonderaciones,
  ponderacionEsCompleta,
  mensajeAlertaPonderacion,
  calcularResultadoProveedor,
  compararProveedores,
} from "../src/lib/calculations";

let fallos = 0;

function assertIgual(descripcion: string, obtenido: unknown, esperado: unknown) {
  const ok = JSON.stringify(obtenido) === JSON.stringify(esperado);
  console.log(`${ok ? "OK  " : "FAIL"} ${descripcion} -> obtenido=${JSON.stringify(obtenido)} esperado=${JSON.stringify(esperado)}`);
  if (!ok) fallos++;
}

console.log("=== Sección 9: resultado ponderado por criterio (peso 20%) ===");
assertIgual("Calificación 5 en criterio de peso 20", calcularResultadoPonderado(5, 20), 20);
assertIgual("Calificación 3 en criterio de peso 20", calcularResultadoPonderado(3, 20), 12);
assertIgual("Calificación 1 en criterio de peso 20", calcularResultadoPonderado(1, 20), 4);

console.log("\n=== Sección 7: los 7 criterios oficiales suman 95% (no 100%) ===");
const criteriosOficiales = [
  { criterioId: "entrega", peso: 20, activo: true },
  { criterioId: "suministro", peso: 20, activo: true },
  { criterioId: "garantia", peso: 15, activo: true },
  { criterioId: "postventa", peso: 5, activo: true },
  { criterioId: "preventa", peso: 15, activo: true },
  { criterioId: "pqr", peso: 10, activo: true },
  { criterioId: "formaPago", peso: 10, activo: true },
];
assertIgual("Suma de ponderaciones", sumaPonderaciones(criteriosOficiales), 95);
assertIgual("¿Ponderación completa (100%)?", ponderacionEsCompleta(criteriosOficiales), false);
const alerta = mensajeAlertaPonderacion(sumaPonderaciones(criteriosOficiales));
console.log("Mensaje de alerta:", alerta);
assertIgual(
  "El mensaje de alerta menciona 95% y el 5% restante",
  alerta.includes("95") && alerta.includes("5"),
  true
);

console.log("\n=== Sección 9: cálculo de un proveedor con los 7 criterios oficiales (95% de peso total) ===");
// Un evaluador califica: 5 en entrega, 3 en suministro, 5 en garantía, 3 en postventa,
// 5 en preventa, 3 en PQR, 5 en formas de pago.
const calificacionesProveedor = [
  { criterioId: "entrega", peso: 20, valor: 5 }, // 5/5*20 = 20
  { criterioId: "suministro", peso: 20, valor: 3 }, // 3/5*20 = 12
  { criterioId: "garantia", peso: 15, valor: 5 }, // 5/5*15 = 15
  { criterioId: "postventa", peso: 5, valor: 3 }, // 3/5*5 = 3
  { criterioId: "preventa", peso: 15, valor: 5 }, // 5/5*15 = 15
  { criterioId: "pqr", peso: 10, valor: 3 }, // 3/5*10 = 6
  { criterioId: "formaPago", peso: 10, valor: 5 }, // 5/5*10 = 10
];
const resultadoEjemplo = calcularResultadoProveedor(calificacionesProveedor);
// Suma de resultados ponderados: 20+12+15+3+15+6+10 = 81 (sobre 95 de peso configurado)
assertIgual("Suma de resultados ponderados (sobre pesos configurados, 95%)", resultadoEjemplo.puntajeTotalPonderado, 81);
// Normalizado sobre 5: 81/95*5 = 4.263...
assertIgual("Puntaje normalizado sobre 5 (81/95*5)", resultadoEjemplo.puntajeSobreCinco, Number(((81 / 95) * 5).toFixed(2)));
assertIgual("Todos los criterios calificados", resultadoEjemplo.completo, true);

console.log("\n=== Sección 10: ranking, orden y detección automática del mayor puntaje ===");
// Se simulan directamente los resultados de ejemplo del documento (92%, 82%, 72%),
// que asumen que los criterios ya suman 100% (ver sección 7).
const base = calcularResultadoProveedor([{ criterioId: "unico", peso: 100, valor: 5 }]); // punto de partida con forma correcta
const comparacion = compararProveedores([
  { proveedorId: "B", nombre: "Proveedor B", resultado: { ...base, puntajeTotalPonderado: 82, puntajeSobreCinco: 4.1, porcentaje: 82 } },
  { proveedorId: "A", nombre: "Proveedor A", resultado: { ...base, puntajeTotalPonderado: 92, puntajeSobreCinco: 4.6, porcentaje: 92 } },
  { proveedorId: "C", nombre: "Proveedor C", resultado: { ...base, puntajeTotalPonderado: 72, puntajeSobreCinco: 3.6, porcentaje: 72 } },
]);
assertIgual("Proveedor con mayor puntuación es A (92%)", comparacion.proveedorMayorPuntaje?.proveedorId, "A");
assertIgual("Orden final: A (1°), B (2°), C (3°)", comparacion.ranking.map((r) => r.proveedorId), ["A", "B", "C"]);
assertIgual("Posiciones asignadas 1, 2, 3", comparacion.ranking.map((r) => r.posicion), [1, 2, 3]);
assertIgual("Puntaje sobre 5 del proveedor A (92% -> 4.60/5)", comparacion.ranking[0].resultado.puntajeSobreCinco, 4.6);
assertIgual("Puntaje sobre 5 del proveedor B (82% -> 4.10/5)", comparacion.ranking[1].resultado.puntajeSobreCinco, 4.1);
assertIgual("Puntaje sobre 5 del proveedor C (72% -> 3.60/5)", comparacion.ranking[2].resultado.puntajeSobreCinco, 3.6);

console.log("\n=== Ponderación completa al 100%: todos los criterios en 5 -> 100% y 5.00/5 ===");
const criterios100 = [...criteriosOficiales, { criterioId: "extra", peso: 5, activo: true }];
assertIgual("Suma con criterio adicional del 5%", sumaPonderaciones(criterios100), 100);
assertIgual("¿Ponderación completa?", ponderacionEsCompleta(criterios100), true);
const provTotalReal = calcularResultadoProveedor(
  criterios100.map((c) => ({ criterioId: c.criterioId, peso: c.peso, valor: 5 }))
);
assertIgual("Todos los criterios calificados en 5 sobre 100% de peso", provTotalReal, {
  puntajeTotalPonderado: 100,
  puntajeSobreCinco: 5,
  porcentaje: 100,
  criteriosCalificados: 8,
  criteriosTotales: 8,
  completo: true,
});

console.log(`\n${fallos === 0 ? "TODAS LAS PRUEBAS PASARON ✅" : `${fallos} PRUEBA(S) FALLARON ❌`}`);
process.exit(fallos === 0 ? 0 : 1);
