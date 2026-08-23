import { RolUsuario } from "@prisma/client";

/**
 * Matriz de permisos por rol (sección 22 del documento de requisitos).
 *
 * ADMINISTRADOR         -> configura criterios/ponderaciones, crea usuarios,
 *                          consulta todos los procesos, autoriza excepciones.
 * RESPONSABLE_SELECCION -> crea procesos, registra/califica proveedores,
 *                          genera informes, consulta SUS procesos.
 * CONSULTA               -> solo lectura de procesos e informes.
 */

export type Permiso =
  | "proceso:crear"
  | "proceso:editar_propio"
  | "proceso:editar_cualquiera"
  | "proceso:ver_propio"
  | "proceso:ver_todos"
  | "proceso:cerrar"
  | "proceso:cerrar_con_excepcion"
  | "proveedor:gestionar"
  | "calificacion:diligenciar"
  | "informe:generar"
  | "informe:ver"
  | "criterios:configurar"
  | "usuarios:gestionar"
  | "trazabilidad:ver";

const PERMISOS_POR_ROL: Record<RolUsuario, Permiso[]> = {
  ADMINISTRADOR: [
    "proceso:crear",
    "proceso:editar_propio",
    "proceso:editar_cualquiera",
    "proceso:ver_propio",
    "proceso:ver_todos",
    "proceso:cerrar",
    "proceso:cerrar_con_excepcion",
    "proveedor:gestionar",
    "calificacion:diligenciar",
    "informe:generar",
    "informe:ver",
    "criterios:configurar",
    "usuarios:gestionar",
    "trazabilidad:ver",
  ],
  RESPONSABLE_SELECCION: [
    "proceso:crear",
    "proceso:editar_propio",
    "proceso:ver_propio",
    "proceso:cerrar",
    "proveedor:gestionar",
    "calificacion:diligenciar",
    "informe:generar",
    "informe:ver",
  ],
  CONSULTA: ["proceso:ver_propio", "informe:ver"],
};

// CONSULTA y ADMINISTRADOR pueden ver todos los procesos (solo lectura para CONSULTA)
PERMISOS_POR_ROL.CONSULTA.push("proceso:ver_todos" as Permiso);

export function tienePermiso(rol: RolUsuario, permiso: Permiso): boolean {
  return PERMISOS_POR_ROL[rol]?.includes(permiso) ?? false;
}

export function requierePermiso(rol: RolUsuario, permiso: Permiso): void {
  if (!tienePermiso(rol, permiso)) {
    const err = new Error(`No autorizado: el rol ${rol} no tiene el permiso ${permiso}`);
    (err as Error & { status?: number }).status = 403;
    throw err;
  }
}

export function esAdministrador(rol: RolUsuario): boolean {
  return rol === "ADMINISTRADOR";
}
