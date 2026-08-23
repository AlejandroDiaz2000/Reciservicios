import clsx from "clsx";

const ESTILOS_ESTADO: Record<string, string> = {
  BORRADOR: "bg-slate-100 text-slate-600 border-slate-200",
  EN_DILIGENCIAMIENTO: "bg-blue-50 text-blue-700 border-blue-200",
  PENDIENTE_REVISION: "bg-amber-50 text-amber-700 border-amber-200",
  APROBADA: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CERRADA: "bg-[var(--color-navy-800)]/10 text-[var(--color-navy-800)] border-[var(--color-navy-800)]/20",
};

const ETIQUETAS_ESTADO: Record<string, string> = {
  BORRADOR: "Borrador",
  EN_DILIGENCIAMIENTO: "En diligenciamiento",
  PENDIENTE_REVISION: "Pendiente de revisión",
  APROBADA: "Aprobada",
  CERRADA: "Cerrada",
};

export function EstadoBadge({ estado }: { estado: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border",
        ESTILOS_ESTADO[estado] ?? "bg-slate-100 text-slate-600 border-slate-200"
      )}
    >
      {ETIQUETAS_ESTADO[estado] ?? estado}
    </span>
  );
}

export function Badge({
  children,
  tono = "slate",
}: {
  children: React.ReactNode;
  tono?: "slate" | "green" | "amber" | "red" | "navy";
}) {
  const estilos: Record<string, string> = {
    slate: "bg-slate-100 text-slate-600",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    navy: "bg-[var(--color-navy-800)]/10 text-[var(--color-navy-800)]",
  };
  return (
    <span className={clsx("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", estilos[tono])}>
      {children}
    </span>
  );
}
