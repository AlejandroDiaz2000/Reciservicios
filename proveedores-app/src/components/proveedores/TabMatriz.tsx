"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api-client";
import { Proceso, Criterio, CalificacionApi } from "@/types/proceso";
import { Card, CardHeader, Boton, Alerta, Spinner, claseInput } from "@/components/ui/Basicos";
import { calcularResultadoPonderado, calcularResultadoProveedor, ValorCalificacion } from "@/lib/calculations";
import clsx from "clsx";
import { CheckCircle2 } from "lucide-react";

interface EstadoCelda {
  valor: ValorCalificacion | null;
  observacion: string;
}

const GUIA_TEXTO: Record<ValorCalificacion, string> = {
  5: "Excelente / condición favorable según los parámetros establecidos.",
  3: "Aceptable / condición intermedia según los parámetros establecidos.",
  1: "Desfavorable / condición no favorable según los parámetros establecidos.",
};

export function TabMatriz({
  proceso,
  puedeEditar,
  onActualizado,
}: {
  proceso: Proceso;
  puedeEditar: boolean;
  onActualizado: () => void;
}) {
  const [criterios, setCriterios] = useState<Criterio[] | null>(null);
  const [ponderacion, setPonderacion] = useState<{ total: number; completa: boolean; alerta: string | null } | null>(
    null
  );
  const [celdas, setCeldas] = useState<Record<string, EstadoCelda>>({});
  const [proveedorActivo, setProveedorActivo] = useState<string | null>(proceso.proveedores[0]?.id ?? null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tono: "exito" | "error"; texto: string } | null>(null);

  useEffect(() => {
    api
      .get<{
        criterios: Criterio[];
        calificaciones: CalificacionApi[];
        ponderacion: { total: number; completa: boolean; alerta: string | null };
      }>(`/api/procesos/${proceso.id}/calificaciones`)
      .then((data) => {
        setCriterios(data.criterios);
        setPonderacion(data.ponderacion);
        const mapa: Record<string, EstadoCelda> = {};
        data.calificaciones.forEach((c) => {
          mapa[`${c.proveedorId}-${c.criterioId}`] = {
            valor: (c.valor as ValorCalificacion) ?? null,
            observacion: c.observacion ?? "",
          };
        });
        setCeldas(mapa);
      })
      .finally(() => setCargando(false));
  }, [proceso.id]);

  const resultadosPorProveedor = useMemo(() => {
    if (!criterios) return {};
    const resultado: Record<string, ReturnType<typeof calcularResultadoProveedor>> = {};
    for (const prov of proceso.proveedores) {
      const items = criterios.map((crit) => ({
        criterioId: crit.id,
        peso: crit.peso,
        valor: celdas[`${prov.id}-${crit.id}`]?.valor ?? null,
      }));
      resultado[prov.id] = calcularResultadoProveedor(items);
    }
    return resultado;
  }, [criterios, celdas, proceso.proveedores]);

  function setCelda(proveedorId: string, criterioId: string, cambio: Partial<EstadoCelda>) {
    const clave = `${proveedorId}-${criterioId}`;
    setCeldas((prev) => ({
      ...prev,
      [clave]: { valor: prev[clave]?.valor ?? null, observacion: prev[clave]?.observacion ?? "", ...cambio },
    }));
  }

  async function guardarProveedor(proveedorId: string) {
    if (!criterios) return;
    setGuardando(true);
    setMensaje(null);
    try {
      const calificaciones = criterios
        .map((crit) => {
          const celda = celdas[`${proveedorId}-${crit.id}`];
          if (!celda?.valor) return null;
          return {
            proveedorId,
            criterioId: crit.id,
            valor: celda.valor,
            observacion: celda.observacion || null,
          };
        })
        .filter((c): c is NonNullable<typeof c> => c !== null);

      if (calificaciones.length === 0) {
        setMensaje({ tono: "error", texto: "Asigna al menos una calificación antes de guardar." });
        return;
      }

      await api.put(`/api/procesos/${proceso.id}/calificaciones`, { calificaciones });
      setMensaje({ tono: "exito", texto: "Calificaciones guardadas correctamente." });
      onActualizado();
    } catch (err) {
      setMensaje({ tono: "error", texto: err instanceof Error ? err.message : "No se pudo guardar." });
    } finally {
      setGuardando(false);
    }
  }

  if (cargando || !criterios) {
    return (
      <div className="py-14 flex justify-center">
        <Spinner />
      </div>
    );
  }

  if (proceso.proveedores.length === 0) {
    return <Alerta tono="info">Registra proveedores en la pestaña anterior para poder calificarlos.</Alerta>;
  }

  return (
    <div className="space-y-4">
      {ponderacion?.alerta ? <Alerta tono="advertencia" titulo="Alerta de configuración">{ponderacion.alerta}</Alerta> : null}

      {/* Selector de proveedor */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {proceso.proveedores.map((p) => {
          const r = resultadosPorProveedor[p.id];
          return (
            <button
              key={p.id}
              onClick={() => setProveedorActivo(p.id)}
              className={clsx(
                "shrink-0 rounded-xl border px-4 py-2.5 text-left transition",
                proveedorActivo === p.id
                  ? "border-[var(--color-navy-800)] bg-[var(--color-navy-800)]/5"
                  : "border-slate-200 hover:border-slate-300"
              )}
            >
              <p className="text-sm font-medium text-slate-800">{p.razonSocial}</p>
              <p className="text-xs text-slate-500">
                {r?.criteriosCalificados ?? 0}/{criterios.length} calificados · {r?.puntajeTotalPonderado ?? 0}%
              </p>
            </button>
          );
        })}
      </div>

      {proveedorActivo ? (
        <Card>
          <CardHeader
            title={`Matriz de evaluación — ${proceso.proveedores.find((p) => p.id === proveedorActivo)?.razonSocial}`}
            subtitle="Selecciona 5, 3 o 1 para cada criterio. El resultado ponderado se calcula automáticamente."
          />
          <div className="p-5 space-y-5">
            {criterios.map((crit) => {
              const celda = celdas[`${proveedorActivo}-${crit.id}`];
              const resultado = celda?.valor ? calcularResultadoPonderado(celda.valor, crit.peso) : null;
              return (
                <div key={crit.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-800">
                        {crit.nombre} <span className="text-xs text-slate-400 font-normal">— peso {crit.peso}%</span>
                      </p>
                      {crit.descripcion ? <p className="text-xs text-slate-500 mt-0.5">{crit.descripcion}</p> : null}
                    </div>
                    <div className="text-sm font-semibold text-slate-700 shrink-0">
                      Resultado: {resultado != null ? `${resultado}%` : "—"}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {([5, 3, 1] as ValorCalificacion[]).map((valor) => (
                      <button
                        key={valor}
                        type="button"
                        disabled={!puedeEditar}
                        onClick={() => setCelda(proveedorActivo, crit.id, { valor })}
                        className={clsx(
                          "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition",
                          celda?.valor === valor
                            ? "border-[var(--color-navy-800)] bg-[var(--color-navy-800)] text-white"
                            : "border-slate-300 text-slate-600 hover:border-slate-400",
                          !puedeEditar && "opacity-60"
                        )}
                      >
                        {celda?.valor === valor ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                        {valor}
                      </button>
                    ))}
                  </div>

                  {celda?.valor ? (
                    <p className="text-xs text-slate-500 mt-2 bg-slate-50 rounded px-2 py-1.5">
                      <span className="font-medium">{celda.valor} — </span>
                      {GUIA_TEXTO[celda.valor]}
                      <br />
                      <span className="text-slate-400">
                        {celda.valor === 5 ? crit.guia5 : celda.valor === 3 ? crit.guia3 : crit.guia1}
                      </span>
                    </p>
                  ) : (
                    <div className="text-xs text-slate-400 mt-2 space-y-0.5">
                      <p>5: {crit.guia5}</p>
                      <p>3: {crit.guia3}</p>
                      <p>1: {crit.guia1}</p>
                    </div>
                  )}

                  <textarea
                    disabled={!puedeEditar}
                    placeholder="Observación o justificación de esta calificación..."
                    rows={2}
                    className={`${claseInput} mt-3 text-sm`}
                    value={celda?.observacion ?? ""}
                    onChange={(e) => setCelda(proveedorActivo, crit.id, { observacion: e.target.value })}
                  />
                </div>
              );
            })}

            {mensaje ? <Alerta tono={mensaje.tono}>{mensaje.texto}</Alerta> : null}

            {puedeEditar ? (
              <div className="flex justify-end">
                <Boton onClick={() => guardarProveedor(proveedorActivo)} disabled={guardando}>
                  {guardando ? "Guardando..." : "Guardar calificaciones de este proveedor"}
                </Boton>
              </div>
            ) : null}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
