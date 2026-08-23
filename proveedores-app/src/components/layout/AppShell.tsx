"use client";

import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { X, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const ITEMS = [
  { href: "/", label: "Inicio", activo: true },
  { href: "/proveedores", label: "Selección de proveedores", activo: true },
  { href: "/evaluacion", label: "Evaluación y reevaluación de proveedores", activo: false },
  { href: "/documental", label: "Gestión documental", activo: false },
  { href: "/configuracion", label: "Configuración", activo: true },
];

export function AppShell({
  children,
  nombreUsuario,
  rol,
}: {
  children: ReactNode;
  nombreUsuario: string;
  rol: string;
}) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen w-full bg-[var(--color-slate-50)]">
      <Sidebar />

      {/* Drawer móvil */}
      {menuAbierto ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuAbierto(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-[var(--color-navy-950)] text-slate-200 p-4">
            <div className="flex justify-end mb-4">
              <button onClick={() => setMenuAbierto(false)} className="text-slate-300 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="space-y-1">
              {ITEMS.map((item) => {
                const esActivoRuta = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
                if (!item.activo) {
                  return (
                    <div key={item.href} className="px-3 py-2.5 rounded-lg text-slate-500 text-sm">
                      {item.label} <span className="text-[10px] uppercase ml-1">(Próximamente)</span>
                    </div>
                  );
                }
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuAbierto(false)}
                    className={clsx(
                      "block px-3 py-2.5 rounded-lg text-sm",
                      esActivoRuta ? "bg-[var(--color-navy-700)] text-white font-medium" : "text-slate-300"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      ) : null}

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar nombreUsuario={nombreUsuario} rol={rol} onAbrirMenu={() => setMenuAbierto(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}

export function BotonMenuMovil({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="lg:hidden p-2 text-slate-600">
      <Menu className="h-5 w-5" />
    </button>
  );
}
