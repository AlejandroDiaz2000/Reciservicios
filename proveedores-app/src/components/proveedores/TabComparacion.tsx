"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { Proceso, ComparacionItem } from "@/types/proceso";
import { Card, CardHeader, Campo, claseInput, Boton, Alerta, Spinner } from "@/components/ui/Basicos";
import { Trophy } from "lucide-react";
import clsx from "clsx";

export function TabComparacion({
  proceso,
  puedeEditar,
  onActualizado,
}: {
  proceso: Proceso;
  puedeEditar: boolean;
  onActualizado: () => void;
}) {
  const [ranking, setRanking] = useState<ComparacionItem[] | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api
      .get<{ comparacion: { ranking: ComparacionItem[]; proveedorMayorPuntaje: ComparacionItem | null } }>(
        `/api/procesos/${proceso.id}/comparacion`
      )
      .then((d) => setRanking(d.comparacion.ranking))
      .finally(() => setCargando(false));
  }, [proceso.id]);

  const mayorPuntaje = ranking?.[0];

  const [form, setForm] = useState({
    proveedorSeleccionadoId: proceso.proveedorSeleccionadoId ?? "",
    justificacionSeleccion: proceso.justificacionSeleccion ?? "",
    motivoSiNoMayorPuntaje: proceso.motivoSiNoMayorPuntaje ?? "",
    observacionesFinales: proceso.observacionesFinales ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const requiereMotivo =
    form.proveedorSeleccionadoId && mayorPuntaje && form.proveedorSeleccionadoId !== mayorPuntaje.proveedorId;

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setExito(false);
    setGuardando(true);
    try {
      await api.post(`/api/procesos/${proceso.id}/seleccion-final`, form);
      setExito(true);
      onActualizado();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar la selección final.");
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <div className="py-14 flex justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Comparativo de proveedores" subtitle="Ordenado automáticamente de mayor a menor puntuación." />
        {!ranking || ranking.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">Aún no hay resultados para comparar.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100">
                  <th className="px-5 py-3 font-medium">Posición</th>
                  <th className="px-5 py-3 font-medium">Proveedor</th>
                  <th className="px-5 py-3 font-medium">Puntaje / 5</th>
                  <th className="px-5 py-3 font-medium">Resultado</th>
                  <th className="px-5 py-3 font-medium">Avance</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((r) => (
                  <tr
                    key={r.proveedorId}
                    className={clsx("border-b border-slate-50", r.posicion === 1 && "bg-amber-50/60")}
                  >
                    <td className="px-5 py-3 font-semibold text-slate-700">
                      <span className="inline-flex items-center gap-1.5">
                        {r.posicion === 1 ? <Trophy className="h-4 w-4 text-amber-500" /> : null}
                        {r.posicion}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-800">{r.nombre}</td>
                    <td className="px-5 py-3 text-slate-600">{r.resultado.puntajeSobreCinco.toFixed(2)} / 5</td>
                    <td className="px-5 py-3 text-slate-600">{r.resultado.porcentaje}%</td>
                    <td className="px-5 py-3 text-slate-500">
                      {r.resultado.criteriosCalificados}/{r.resultado.criteriosTotales}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {mayorPuntaje ? (
          <div className="mx-5 mb-5 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
            <strong>Proveedor con mayor puntuación en el proceso de selección:</strong> {mayorPuntaje.nombre} (
            {mayorPuntaje.resultado.porcentaje}%)
            <p className="text-xs text-emerald-700 mt-1">
              Este resultado es exclusivamente matemático según la matriz. No implica que este proveedor deba
              contratarse necesariamente: la decisión final la registra el responsable de la selección abajo.
            </p>
          </div>
        ) : null}
      </Card>

      <Card>
        <CardHeader title="Selección final y justificación" />
        <form onSubmit={guardar} className="p-5 space-y-4">
          <Campo label="Proveedor seleccionado finalmente" requerido>
            <select
              required
              disabled={!puedeEditar}
              className={claseInput}
              value={form.proveedorSeleccionadoId}
              onChange={(e) => setForm({ ...form, proveedorSeleccionadoId: e.target.value })}
            >
              <option value="">Selecciona un proveedor...</option>
              {proceso.proveedores.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.razonSocial}
                </option>
              ))}
            </select>
          </Campo>

          <Campo label="Justificación de la selección" requerido hint="Mínimo 20 caracteres.">
            <textarea
              required
              disabled={!puedeEditar}
              rows={4}
              className={claseInput}
              value={form.justificacionSeleccion}
              onChange={(e) => setForm({ ...form, justificacionSeleccion: e.target.value })}
            />
          </Campo>

          {requiereMotivo ? (
            <Campo
              label="Motivo de selección (el proveedor elegido no es el de mayor puntuación)"
              requerido
              hint="Obligatorio para trazabilidad y auditoría."
            >
              <textarea
                required
                disabled={!puedeEditar}
                rows={3}
                className={claseInput}
                value={form.motivoSiNoMayorPuntaje}
                onChange={(e) => setForm({ ...form, motivoSiNoMayorPuntaje: e.target.value })}
              />
            </Campo>
          ) : null}

          <Campo label="Observaciones generales">
            <textarea
              disabled={!puedeEditar}
              rows={3}
              className={claseInput}
              value={form.observacionesFinales}
              onChange={(e) => setForm({ ...form, observacionesFinales: e.target.value })}
            />
          </Campo>

          {error ? <Alerta tono="error">{error}</Alerta> : null}
          {exito ? <Alerta tono="exito">Selección final registrada correctamente.</Alerta> : null}

          {puedeEditar ? (
            <div className="flex justify-end">
              <Boton type="submit" disabled={guardando}>
                {guardando ? "Guardando..." : "Registrar selección final"}
              </Boton>
            </div>
          ) : null}
        </form>
      </Card>
    </div>
  );
}
