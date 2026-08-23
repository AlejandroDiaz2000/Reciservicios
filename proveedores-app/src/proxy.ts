import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Protege todas las rutas de la aplicación (excepto login y assets públicos).
// El control de acceso por permisos específicos se aplica además dentro de
// cada Route Handler de la API (ver src/lib/api-auth.ts) y en cada página.
//
// Nota (Next.js 16): el archivo "middleware.ts" fue renombrado a "proxy.ts"
// y ahora se ejecuta siempre en runtime Node.js (antes podía ser "edge").
export default withAuth(
  function proxy() {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    /*
     * Aplica a todas las rutas excepto:
     * - /login (página pública de inicio de sesión)
     * - /api/auth (endpoints de NextAuth)
     * - archivos estáticos de Next.js
     */
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
