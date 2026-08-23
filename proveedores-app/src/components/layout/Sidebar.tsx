"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardCheck,
  RefreshCw,
  FolderKanban,
  Settings,
  ShieldCheck,
  Lock,
} from "lucide-react";
import clsx from "clsx";

interface ItemMenu {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  activo: boolean;
}

const ITEMS: ItemMenu[] = [
  { href: "/", label: "Inicio", icon: LayoutDashboard, activo: true },
  { href: "/proveedores", label: "Selección de proveedores", icon: ClipboardCheck, activo: true },
  { href: "/evaluacion", label: "Evaluación y reevaluación de proveedores", icon: RefreshCw, activo: false },
  { href: "/documental", label: "Gestión documental", icon: FolderKanban, activo: false },
  { href: "/configuracion", label: "Configuración", icon: Settings, activo: true },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:flex-col w-72 shrink-0 bg-[var(--color-navy-950)] text-slate-200 min-h-screen">
      <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
        <div className="h-9 w-9 rounded-lg bg-[var(--color-navy-700)] flex items-center justify-center">
          <ShieldCheck className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white leading-tight">Compliance Suite</p>
          <p className="text-xs text-slate-400 leading-tight">Oficial de Cumplimiento</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {ITEMS.map((item) => {
          const esActivoRuta = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
          const Icon = item.icon;

          if (!item.activo) {
            return (
              <div
                key={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-500 cursor-not-allowed"
                title="Próximamente"
              >
                <Icon className="h-4.5 w-4.5 shrink-0" />
                <span className="text-sm flex-1">{item.label}</span>
                <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide bg-white/5 text-slate-400 px-1.5 py-0.5 rounded">
                  <Lock className="h-2.5 w-2.5" /> Próximamente
                </span>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition",
                esActivoRuta
                  ? "bg-[var(--color-navy-700)] text-white font-medium"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="h-4.5 w-4.5 shrink-0" />
              <span className="flex-1">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-6 py-4 border-t border-white/10 text-[11px] text-slate-500 leading-relaxed">
        Módulo activo: Selección de proveedores.
        <br />
        Próximos módulos: SARLAFT, BASC, auditorías, capacitaciones.
      </div>
    </aside>
  );
}
