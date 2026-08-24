"use client";

import { signOut } from "next-auth/react";
import { LogOut, Menu } from "lucide-react";

const ETIQUETA_ROL: Record<string, string> = {
  ADMINISTRADOR: "Administrador",
  RESPONSABLE_SELECCION: "Responsable de selección",
  CONSULTA: "Consulta",
};

export function Topbar({
  nombreUsuario,
  rol,
  onAbrirMenu,
}: {
  nombreUsuario: string;
  rol: string;
  onAbrirMenu: () => void;
}) {
  return (
    <header className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-slate-200 bg-white">
      <div className="flex items-center gap-3">
        <button onClick={onAbrirMenu} className="lg:hidden p-2 -ml-2 text-slate-600">
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-sm text-slate-400 hidden sm:block">
          Reciservicios / Selección de proveedores
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-slate-800 leading-tight">{nombreUsuario}</p>
          <p className="text-xs text-slate-500 leading-tight">{ETIQUETA_ROL[rol] ?? rol}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-lg px-3 py-1.5 transition"
        >
          <LogOut className="h-3.5 w-3.5" />
          Salir
        </button>
      </div>
    </header>
  );
}
