import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * Genera el consecutivo del proceso de selección con formato SEL-AAAA-NNNN
 * (sección 3 del documento de requisitos). Usa una transacción con bloqueo
 * a nivel de fila para evitar consecutivos duplicados ante solicitudes
 * concurrentes.
 */
export async function generarCodigoProceso(
  tx: Prisma.TransactionClient = prisma,
  prefijo = "SEL"
): Promise<string> {
  const anio = new Date().getFullYear();

  const consecutivo = await tx.consecutivo.upsert({
    where: { prefijo_anio: { prefijo, anio } },
    update: { ultimoValor: { increment: 1 } },
    create: { prefijo, anio, ultimoValor: 1 },
  });

  const numero = String(consecutivo.ultimoValor).padStart(4, "0");
  return `${prefijo}-${anio}-${numero}`;
}
