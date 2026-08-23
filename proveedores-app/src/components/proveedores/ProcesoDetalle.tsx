"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { Proceso } from "@/types/proceso";
import { Spinner, Alerta, BotonLink } from "@/components/ui/Basicos";
import { EstadoBadge } from "@/components/ui/Badge";
import { ArrowLeft } from "lucide-react";
import clsx from "clsx";
import { TabGeneral } from "./TabGeneral";
import { TabProveedores } from "./TabProveedores";
import { TabMatriz } from "./TabMatriz";
import { TabComparacion } from "./TabComparacion";
import { TabInforme } from "./TabInforme";
import { TabTrazabilidad } from "./TabTrazabilidad";
import { GestionEstado } from "./GestionEstado";

const TABS = [
  { id: "general", label: "Información general" },
  { id: "proveedores", label: "Proveedores" },
  { id: "matriz", label: "Matriz de evaluación" },
  { id: "comparacion", label: "Comparación y selección" },
  { id: "informe", label: "Informe" },
  { id: "trazabilidad", label: "Trazabilidad" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function ProcesoDetalle({
  procesoId,
  rol,
  usuarioId,
}: {
  procesoId: string;
  rol: string;
  usuarioId: string;
}) {
  const [proceso, setProceso] = useState<Proceso | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [tab, setTab] = useState<TabId>("general");

  const cargar = useCallback(async () => {
    try {
      const data = await api.get<{ proceso: Proceso }>(`/api/procesos/${procesoId}`);
      setProceso(data.proceso);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el proceso.");
    } finally {
      setCargando(false);
    }
  }, [procesoId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  const puedeEditar = proceso ? (rol === "ADMINISTRADOR" || (rol === "RESPONSABLE_SELECCION" && proceso.creadoPorId === usuarioId)) && proceso.estado !== "CERRADA" : false;

  if (cargando) {
    return (
      <div className="py-20 flex justify-center">
        <Spinner />
      </div>
    );
  }

  if (error || !proceso) {
    return <Alerta tono="error">{error ?? "El proceso no existe."}</Alerta>;
  }

  return (
    <div className="space-y-6">
      <div>
        <BotonLink href="/proveedores" variante="secundario" className="mb-4 text-xs px-3 py-1.5">
          <ArrowLeft className="h-3.5 w-3.5" /> Volver al listado
        </BotonLink>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-slate-800">{proceso.codigo}</h1>
              <EstadoBadge estado={proceso.estado} />
              {proceso.cierreConExcepcion ? (
                <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                  Cerrado con excepción autorizada
                </span>
              ) : null}
            </div>
            <p className="text-slate-500 mt-1 text-sm">
              {proceso.areaSolicitante} · Responsable: {proceso.responsableNombre} ·{" "}
              {new Date(proceso.fecha).toLocaleDateString("es-CO")}
            </p>
          </div>

          <GestionEstado proceso={proceso} rol={rol} puedeEditar={puedeEditar} onCambio={cargar} />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={clsx(
                "px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap",
                tab === t.id
                  ? "border-[var(--color-navy-800)] text-[var(--color-navy-800)]"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        {tab === "general" && <TabGeneral proceso={proceso} puedeEditar={puedeEditar} onActualizado={cargar} />}
        {tab === "proveedores" && (
          <TabProveedores proceso={proceso} puedeEditar={puedeEditar} onActualizado={cargar} />
        )}
        {tab === "matriz" && <TabMatriz proceso={proceso} puedeEditar={puedeEditar} onActualizado={cargar} />}
        {tab === "comparacion" && (
          <TabComparacion proceso={proceso} puedeEditar={puedeEditar} onActualizado={cargar} />
        )}
        {tab === "informe" && <TabInforme proceso={proceso} rol={rol} />}
        {tab === "trazabilidad" && <TabTrazabilidad procesoId={proceso.id} />}
      </div>
    </div>
  );
}
