"use client";

import { useState } from "react";
import { api } from "@/lib/api-client";
import { Proceso } from "@/types/proceso";
import { Boton, claseInput } from "@/components/ui/Basicos";

const TRANSICIONES: Record<string, string[]> = {
  BORRADOR: ["EN_DILIGENCIAMIENTO", "PENDIENTE_REVISION"],
  EN_DILIGENCIAMIENTO: ["PENDIENTE_REVISION", "BORRADOR"],
  PENDIENTE_REVISION: ["APROBADA", "EN_DILIGENCIAMIENTO"],
  APROBADA: ["CERRADA", "PENDIENTE_REVISION"],
  CERRADA: [],
};

const ETIQUETAS: Record<string, string> = {
  BORRADOR: "Borrador",
  EN_DILIGENCIAMIENTO: "En diligenciamiento",
  PENDIENTE_REVISION: "Pendiente de revisión",
  APROBADA: "Aprobada",
  CERRADA: "Cerrada (protegida contra edición)",
};

export function GestionEstado({
  proceso,
  rol,
  puedeEditar,
  onCambio,
}: {
  proceso: Proceso;
  rol: string;
  puedeEditar: boolean;
  onCambio: () => void;
}) {
  const opciones = TRANSICIONES[proceso.estado] ?? [];
  const [destino, setDestino] = useState(opciones[0] ?? "");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [forzar, setForzar] = useState(false);

  if (!puedeEditar || opciones.length === 0) return null;

  async function aplicar() {
    if (!destino) return;
    setCargando(true);
    setError(null);
    try {
      await api.post(`/api/procesos/${proceso.id}/estado`, {
        estadoNuevo: destino,
        forzarCierreConExcepcion: forzar,
        motivo: forzar ? "Excepción autorizada por administrador ante ponderación incompleta." : undefined,
      });
      onCambio();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cambiar el estado.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <select value={destino} onChange={(e) => setDestino(e.target.value)} className={`${claseInput} w-auto`}>
          {opciones.map((o) => (
            <option key={o} value={o}>
              Pasar a: {ETIQUETAS[o]}
            </option>
          ))}
        </select>
        <Boton onClick={aplicar} disabled={cargando} variante="secundario">
          {cargando ? "Aplicando..." : "Aplicar"}
        </Boton>
      </div>
      {destino === "CERRADA" && rol === "ADMINISTRADOR" ? (
        <label className="flex items-center gap-1.5 text-xs text-slate-500">
          <input type="checkbox" checked={forzar} onChange={(e) => setForzar(e.target.checked)} />
          Forzar cierre con excepción si solo falta ponderación (queda registrado en trazabilidad)
        </label>
      ) : null}
      {error ? <p className="text-xs text-red-600 max-w-sm text-right">{error}</p> : null}
    </div>
  );
}
