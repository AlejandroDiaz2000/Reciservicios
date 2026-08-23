import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { ReactNode } from "react";

// Segunda barrera de seguridad además de proxy.ts (defensa en profundidad):
// si por alguna razón no hay sesión, nunca se renderiza contenido protegido.
export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <AppShell nombreUsuario={session.user.name ?? session.user.email ?? "Usuario"} rol={session.user.rol}>
      {children}
    </AppShell>
  );
}
