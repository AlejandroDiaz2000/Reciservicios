import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-auth";
import { Session } from "next-auth";
import { RolUsuario } from "@prisma/client";

/** ¿Este usuario puede ver el proceso? (Administrador y Consulta ven todos; Responsable solo los propios). */
export function puedeVerProceso(session: Session, creadoPorId: string): boolean {
  const rol = session.user.rol as RolUsuario;
  if (rol === "ADMINISTRADOR" || rol === "CONSULTA") return true;
  return creadoPorId === session.user.id;
}

/** ¿Este usuario puede editar el proceso? (Administrador siempre; Responsable solo los propios; Consulta nunca). */
export function puedeEditarProceso(session: Session, creadoPorId: string): boolean {
  const rol = session.user.rol as RolUsuario;
  if (rol === "ADMINISTRADOR") return true;
  if (rol === "CONSULTA") return false;
  return creadoPorId === session.user.id;
}

export async function obtenerProcesoOrThrow(procesoId: string) {
  const proceso = await prisma.procesoSeleccion.findUnique({
    where: { id: procesoId },
    include: {
      proveedores: true,
    },
  });
  if (!proceso) {
    throw new ApiError("El proceso de selección no existe.", 404);
  }
  return proceso;
}

/** Un proceso CERRADA solo puede modificarse por un Administrador de forma explícita (sección 13 y 20). */
export function verificarProcesoEditable(estado: string, rol: RolUsuario) {
  if (estado === "CERRADA" && rol !== "ADMINISTRADOR") {
    throw new ApiError(
      "Este proceso está cerrado y protegido contra modificaciones. Solo un administrador puede autorizar cambios.",
      403
    );
  }
}
