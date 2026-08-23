import { getServerSession, Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { Permiso, tienePermiso } from "@/lib/rbac";
import { RolUsuario } from "@prisma/client";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

/**
 * Obtiene la sesión autenticada en un Route Handler, o lanza un error 401.
 * Toda ruta de la API que exponga o modifique datos debe usar esto: la
 * autorización NUNCA depende únicamente de lo que el frontend permita ver.
 */
export async function requerirSesion(): Promise<Session> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new ApiError("No autenticado. Inicia sesión para continuar.", 401);
  }
  return session;
}

/** Obtiene la sesión y valida que el usuario tenga el permiso indicado. */
export async function requerirPermiso(permiso: Permiso): Promise<Session> {
  const session = await requerirSesion();
  const rol = session.user.rol as RolUsuario;
  if (!tienePermiso(rol, permiso)) {
    throw new ApiError("No tienes autorización para realizar esta acción.", 403);
  }
  return session;
}

/** Envuelve un handler de API y convierte ApiError / errores conocidos en respuestas JSON consistentes. */
export function manejarErrorApi(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error && typeof error === "object" && "status" in error && "message" in error) {
    const e = error as { status?: number; message: string };
    return NextResponse.json({ error: e.message }, { status: e.status ?? 400 });
  }
  console.error("[api] Error no controlado:", error);
  return NextResponse.json({ error: "Ocurrió un error inesperado en el servidor." }, { status: 500 });
}
