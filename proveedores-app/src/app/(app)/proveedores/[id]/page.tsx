import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProcesoDetalle } from "@/components/proveedores/ProcesoDetalle";

export default async function ProcesoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const { id } = await params;

  return <ProcesoDetalle procesoId={id} rol={session.user.rol} usuarioId={session.user.id} />;
}
