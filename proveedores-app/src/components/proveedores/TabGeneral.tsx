"use client";

import { useState } from "react";
import { api } from "@/lib/api-client";
import { Proceso } from "@/types/proceso";
import { Card, CardHeader, Campo, claseInput, Boton, Alerta } from "@/components/ui/Basicos";

export function TabGeneral({
  proceso,
  puedeEditar,
  onActualizado,
}: {
  proceso: Proceso;
  puedeEditar: boolean;
  onActualizado: () => void;
}) {
  const [form, setForm] = useState({
    fecha: proceso.fecha.slice(0, 10),
    areaSolicitante: proceso.areaSolicitante,
    responsableNombre: proceso.responsableNombre,
    responsableCargo: proceso.responsableCargo,
    tipoProveedor: proceso.tipoProveedor,
    categoria: proceso.categoria,
    descripcionNecesidad: proceso.descripcionNecesidad,
    observacionesGenerales: proceso.observacionesGenerales ?? "",
  });
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tono: "exito" | "error"; texto: string } | null>(null);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function guardar() {
    setGuardando(true);
    setMensaje(null);
    try {
      await api.patch(`/api/procesos/${proceso.id}`, form);
      setMensaje({ tono: "exito", texto: "Cambios guardados correctamente." });
      onActualizado();
    } catch (err) {
      setMensaje({ tono: "error", texto: err instanceof Error ? err.message : "No se pudo guardar." });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Información general del proceso"
        subtitle={`Creado por ${proceso.creadoPor?.nombre ?? "—"} el ${new Date(proceso.creadoAt).toLocaleString("es-CO")}`}
      />
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo label="Fecha de selección" requerido>
            <input
              type="date"
              disabled={!puedeEditar}
              className={claseInput}
              value={form.fecha}
              onChange={(e) => set("fecha", e.target.value)}
            />
          </Campo>
          <Campo label="Área solicitante" requerido>
            <input
              disabled={!puedeEditar}
              className={claseInput}
              value={form.areaSolicitante}
              onChange={(e) => set("areaSolicitante", e.target.value)}
            />
          </Campo>
          <Campo label="Responsable de la selección" requerido>
            <input
              disabled={!puedeEditar}
              className={claseInput}
              value={form.responsableNombre}
              onChange={(e) => set("responsableNombre", e.target.value)}
            />
          </Campo>
          <Campo label="Cargo del responsable" requerido>
            <input
              disabled={!puedeEditar}
              className={claseInput}
              value={form.responsableCargo}
              onChange={(e) => set("responsableCargo", e.target.value)}
            />
          </Campo>
          <Campo label="Tipo de proveedor" requerido>
            <input
              disabled={!puedeEditar}
              className={claseInput}
              value={form.tipoProveedor}
              onChange={(e) => set("tipoProveedor", e.target.value)}
            />
          </Campo>
          <Campo label="Categoría" requerido>
            <input
              disabled={!puedeEditar}
              className={claseInput}
              value={form.categoria}
              onChange={(e) => set("categoria", e.target.value)}
            />
          </Campo>
        </div>

        <Campo label="Descripción de la necesidad" requerido>
          <textarea
            disabled={!puedeEditar}
            rows={4}
            className={claseInput}
            value={form.descripcionNecesidad}
            onChange={(e) => set("descripcionNecesidad", e.target.value)}
          />
        </Campo>

        <Campo label="Observaciones generales">
          <textarea
            disabled={!puedeEditar}
            rows={3}
            className={claseInput}
            value={form.observacionesGenerales}
            onChange={(e) => set("observacionesGenerales", e.target.value)}
          />
        </Campo>

        {mensaje ? <Alerta tono={mensaje.tono}>{mensaje.texto}</Alerta> : null}

        {puedeEditar ? (
          <div className="flex justify-end">
            <Boton onClick={guardar} disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar cambios"}
            </Boton>
          </div>
        ) : (
          <Alerta tono="info">Este proceso no se puede editar con tu rol actual o porque está cerrado.</Alerta>
        )}
      </div>
    </Card>
  );
}
