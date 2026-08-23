import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Card } from "@/components/ui/Basicos";
import { BotonLink } from "@/components/ui/Basicos";
import { ClipboardCheck, RefreshCw, FolderKanban, Settings, ArrowRight } from "lucide-react";

const MODULOS = [
  {
    href: "/proveedores",
    titulo: "Selección de proveedores",
    descripcion: "Crea y compara procesos de selección mediante una matriz de criterios ponderados.",
    icono: ClipboardCheck,
    activo: true,
  },
  {
    href: "/evaluacion",
    titulo: "Evaluación y reevaluación de proveedores",
    descripcion: "Seguimiento periódico al desempeño de proveedores ya contratados.",
    icono: RefreshCw,
    activo: false,
  },
  {
    href: "/documental",
    titulo: "Gestión documental",
    descripcion: "Repositorio centralizado de soportes y evidencias de cumplimiento.",
    icono: FolderKanban,
    activo: false,
  },
  {
    href: "/configuracion",
    titulo: "Configuración",
    descripcion: "Criterios, ponderaciones, escalas y parámetros del sistema.",
    icono: Settings,
    activo: true,
  },
];

export default async function InicioPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">
          Hola, {session?.user?.name?.split(" ")[0] ?? "bienvenido"}
        </h1>
        <p className="text-slate-500 mt-1">
          Plataforma empresarial de cumplimiento. Este es el punto de partida para los módulos disponibles.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {MODULOS.map((m) => {
          const Icon = m.icono;
          return (
            <Card key={m.href} className={!m.activo ? "opacity-70" : ""}>
              <div className="p-5 flex flex-col h-full">
                <div className="h-10 w-10 rounded-lg bg-[var(--color-navy-800)]/10 flex items-center justify-center mb-3">
                  <Icon className="h-5 w-5 text-[var(--color-navy-800)]" />
                </div>
                <h3 className="font-semibold text-slate-800">{m.titulo}</h3>
                <p className="text-sm text-slate-500 mt-1 flex-1">{m.descripcion}</p>
                <div className="mt-4">
                  {m.activo ? (
                    <BotonLink href={m.href} variante="secundario" className="text-sm">
                      Abrir módulo <ArrowRight className="h-3.5 w-3.5" />
                    </BotonLink>
                  ) : (
                    <span className="inline-flex items-center text-xs font-medium uppercase tracking-wide text-slate-400 bg-slate-100 rounded-full px-3 py-1">
                      Próximamente
                    </span>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
