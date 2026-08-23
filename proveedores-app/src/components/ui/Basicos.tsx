import clsx from "clsx";
import Link from "next/link";
import { AlertTriangle, Info, CheckCircle2 } from "lucide-react";

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("bg-white rounded-xl border border-slate-200 shadow-sm", className)}>{children}</div>
  );
}

export function CardHeader({ title, subtitle, acciones }: { title: string; subtitle?: string; acciones?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-slate-100">
      <div>
        <h2 className="text-base font-semibold text-slate-800">{title}</h2>
        {subtitle ? <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p> : null}
      </div>
      {acciones ? <div className="flex items-center gap-2">{acciones}</div> : null}
    </div>
  );
}

export function Boton({
  children,
  variante = "primario",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variante?: "primario" | "secundario" | "peligro" | "fantasma" }) {
  const estilos: Record<string, string> = {
    primario: "bg-[var(--color-navy-800)] text-white hover:bg-[var(--color-navy-700)] disabled:opacity-50",
    secundario: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 disabled:opacity-50",
    peligro: "bg-red-600 text-white hover:bg-red-700 disabled:opacity-50",
    fantasma: "text-slate-600 hover:bg-slate-100 disabled:opacity-50",
  };
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-1.5 rounded-lg text-sm font-medium px-4 py-2 transition",
        estilos[variante],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function BotonLink({
  href,
  children,
  variante = "primario",
  className,
}: {
  href: string;
  children: React.ReactNode;
  variante?: "primario" | "secundario";
  className?: string;
}) {
  const estilos: Record<string, string> = {
    primario: "bg-[var(--color-navy-800)] text-white hover:bg-[var(--color-navy-700)]",
    secundario: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50",
  };
  return (
    <Link
      href={href}
      className={clsx(
        "inline-flex items-center justify-center gap-1.5 rounded-lg text-sm font-medium px-4 py-2 transition",
        estilos[variante],
        className
      )}
    >
      {children}
    </Link>
  );
}

export function Alerta({
  tono = "info",
  titulo,
  children,
}: {
  tono?: "info" | "advertencia" | "error" | "exito";
  titulo?: string;
  children: React.ReactNode;
}) {
  const estilos: Record<string, { caja: string; icono: React.ReactNode }> = {
    info: { caja: "bg-blue-50 border-blue-200 text-blue-800", icono: <Info className="h-4 w-4" /> },
    advertencia: { caja: "bg-amber-50 border-amber-200 text-amber-800", icono: <AlertTriangle className="h-4 w-4" /> },
    error: { caja: "bg-red-50 border-red-200 text-red-800", icono: <AlertTriangle className="h-4 w-4" /> },
    exito: { caja: "bg-emerald-50 border-emerald-200 text-emerald-800", icono: <CheckCircle2 className="h-4 w-4" /> },
  };
  const s = estilos[tono];
  return (
    <div className={clsx("flex gap-2.5 rounded-lg border px-4 py-3 text-sm", s.caja)}>
      <div className="shrink-0 mt-0.5">{s.icono}</div>
      <div>
        {titulo ? <p className="font-medium mb-0.5">{titulo}</p> : null}
        <div>{children}</div>
      </div>
    </div>
  );
}

export function Campo({
  label,
  requerido,
  children,
  error,
  hint,
}: {
  label: string;
  requerido?: boolean;
  children: React.ReactNode;
  error?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label} {requerido ? <span className="text-red-500">*</span> : null}
      </label>
      {children}
      {hint ? <p className="text-xs text-slate-400 mt-1">{hint}</p> : null}
      {error ? <p className="text-xs text-red-600 mt-1">{error}</p> : null}
    </div>
  );
}

export const claseInput =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-navy-600)] disabled:bg-slate-50 disabled:text-slate-400";

export function EstadoVacio({ titulo, descripcion, accion }: { titulo: string; descripcion?: string; accion?: React.ReactNode }) {
  return (
    <div className="text-center py-14 px-6">
      <p className="text-sm font-medium text-slate-700">{titulo}</p>
      {descripcion ? <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">{descripcion}</p> : null}
      {accion ? <div className="mt-4">{accion}</div> : null}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={clsx("animate-spin rounded-full border-2 border-slate-300 border-t-[var(--color-navy-700)]", className)}
      style={{ width: 20, height: 20 }}
    />
  );
}
