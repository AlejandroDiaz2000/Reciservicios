import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ConfiguracionCriterios } from "@/components/configuracion/ConfiguracionCriterios";

export default async function ConfiguracionPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Configuración</h1>
        <p className="text-slate-500 mt-1">
          Criterios, ponderaciones y escalas de calificación de la matriz de selección de proveedores.
        </p>
      </div>
      <ConfiguracionCriterios rol={session.user.rol} />
    </div>
  );
}
