"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api-client";
import { Card, Boton, BotonLink, Campo, claseInput, EstadoVacio, Spinner } from "@/components/ui/Basicos";
import { EstadoBadge } from "@/components/ui/Badge";
import { Plus, Search, Users, FileCheck2, FileClock, FileStack, ChevronRight } from "lucide-react";
import Link from "next/link";

interface Indicadores {
  totalProcesos: number;
  procesosBorrador: number;
  procesosFinalizados: number;
  procesosPendientesRevision: number;
  proveedoresEvaluados: number;
  proveedoresSeleccionados: number;
}

interface ProcesoListado {
  id: string;
  codigo: string;
  fecha: string;
  areaSolicitante: string;
  responsableNombre: string;
  estado: string;
  proveedores: { id: string; razonSocial: string; nit: string }[];
  proveedorMayorPuntajeId: string | null;
}

const ESTADOS = [
  { value: "", label: "Todos los estados" },
  { value: "BORRADOR", label: "Borrador" },
  { value: "EN_DILIGENCIAMIENTO", label: "En diligenciamiento" },
  { value: "PENDIENTE_REVISION", label: "Pendiente de revisión" },
  { value: "APROBADA", label: "Aprobada" },
  { value: "CERRADA", label: "Cerrada" },
];

export default function ProveedoresDashboardPage() {
  const [indicadores, setIndicadores] = useState<Indicadores | null>(null);
  const [procesos, setProcesos] = useState<ProcesoListado[] | null>(null);
  const [cargando, setCargando] = useState(true);

  const [filtros, setFiltros] = useState({
    codigo: "",
    nit: "",
    razonSocial: "",
    fecha: "",
    area: "",
    responsable: "",
    estado: "",
  });

  const cargarProcesos = useCallback(async (f: typeof filtros) => {
    const params = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    const data = await api.get<{ procesos: ProcesoListado[] }>(`/api/procesos?${params.toString()}`);
    setProcesos(data.procesos);
  }, []);

  useEffect(() => {
    // cargando ya inicia en true (ver useState arriba); esta es la carga inicial.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    Promise.all([api.get<Indicadores>("/api/dashboard"), cargarProcesos(filtros)])
      .then(([ind]) => setIndicadores(ind))
      .finally(() => setCargando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSubmitFiltros(e: React.FormEvent) {
    e.preventDefault();
    cargarProcesos(filtros);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Selección de proveedores</h1>
          <p className="text-slate-500 mt-1">
            Crea, diligencia y consulta procesos de selección mediante la matriz de criterios ponderados.
          </p>
        </div>
        <BotonLink href="/proveedores/nuevo" className="shrink-0">
          <Plus className="h-4 w-4" /> Nueva selección de proveedores
        </BotonLink>
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <IndicadorTarjeta etiqueta="Total procesos" valor={indicadores?.totalProcesos} icono={FileStack} />
        <IndicadorTarjeta etiqueta="Borradores" valor={indicadores?.procesosBorrador} icono={FileClock} />
        <IndicadorTarjeta
          etiqueta="Pendientes de revisión"
          valor={indicadores?.procesosPendientesRevision}
          icono={FileClock}
        />
        <IndicadorTarjeta etiqueta="Finalizados" valor={indicadores?.procesosFinalizados} icono={FileCheck2} />
        <IndicadorTarjeta etiqueta="Proveedores evaluados" valor={indicadores?.proveedoresEvaluados} icono={Users} />
        <IndicadorTarjeta
          etiqueta="Proveedores seleccionados"
          valor={indicadores?.proveedoresSeleccionados}
          icono={Users}
        />
      </div>

      {/* Filtros */}
      <Card>
        <form onSubmit={onSubmitFiltros} className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Campo label="Código de selección">
            <input
              className={claseInput}
              value={filtros.codigo}
              onChange={(e) => setFiltros({ ...filtros, codigo: e.target.value })}
              placeholder="SEL-2026-0001"
            />
          </Campo>
          <Campo label="NIT del proveedor">
            <input
              className={claseInput}
              value={filtros.nit}
              onChange={(e) => setFiltros({ ...filtros, nit: e.target.value })}
            />
          </Campo>
          <Campo label="Razón social">
            <input
              className={claseInput}
              value={filtros.razonSocial}
              onChange={(e) => setFiltros({ ...filtros, razonSocial: e.target.value })}
            />
          </Campo>
          <Campo label="Fecha">
            <input
              type="date"
              className={claseInput}
              value={filtros.fecha}
              onChange={(e) => setFiltros({ ...filtros, fecha: e.target.value })}
            />
          </Campo>
          <Campo label="Área solicitante">
            <input
              className={claseInput}
              value={filtros.area}
              onChange={(e) => setFiltros({ ...filtros, area: e.target.value })}
            />
          </Campo>
          <Campo label="Responsable">
            <input
              className={claseInput}
              value={filtros.responsable}
              onChange={(e) => setFiltros({ ...filtros, responsable: e.target.value })}
            />
          </Campo>
          <Campo label="Estado">
            <select
              className={claseInput}
              value={filtros.estado}
              onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
            >
              {ESTADOS.map((e) => (
                <option key={e.value} value={e.value}>
                  {e.label}
                </option>
              ))}
            </select>
          </Campo>
          <div className="flex items-end">
            <Boton type="submit" variante="secundario" className="w-full">
              <Search className="h-4 w-4" /> Buscar
            </Boton>
          </div>
        </form>
      </Card>

      {/* Historial de procesos */}
      <Card>
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">Historial de procesos</h2>
        </div>
        {cargando ? (
          <div className="py-14 flex justify-center">
            <Spinner />
          </div>
        ) : !procesos || procesos.length === 0 ? (
          <EstadoVacio
            titulo="Aún no hay procesos de selección"
            descripcion="Crea el primer proceso para empezar a comparar proveedores."
            accion={
              <BotonLink href="/proveedores/nuevo">
                <Plus className="h-4 w-4" /> Nueva selección de proveedores
              </BotonLink>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100">
                  <th className="px-5 py-3 font-medium">Código</th>
                  <th className="px-5 py-3 font-medium">Fecha</th>
                  <th className="px-5 py-3 font-medium">Área</th>
                  <th className="px-5 py-3 font-medium">Responsable</th>
                  <th className="px-5 py-3 font-medium">Proveedores</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {procesos.map((p) => (
                  <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-800">{p.codigo}</td>
                    <td className="px-5 py-3 text-slate-600">{new Date(p.fecha).toLocaleDateString("es-CO")}</td>
                    <td className="px-5 py-3 text-slate-600">{p.areaSolicitante}</td>
                    <td className="px-5 py-3 text-slate-600">{p.responsableNombre}</td>
                    <td className="px-5 py-3 text-slate-600">{p.proveedores.length}</td>
                    <td className="px-5 py-3">
                      <EstadoBadge estado={p.estado} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/proveedores/${p.id}`}
                        className="inline-flex items-center gap-1 text-[var(--color-navy-700)] font-medium hover:underline"
                      >
                        Ver detalle <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function IndicadorTarjeta({
  etiqueta,
  valor,
  icono: Icon,
}: {
  etiqueta: string;
  valor: number | undefined;
  icono: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <Icon className="h-4 w-4 text-slate-400" />
      </div>
      <p className="text-2xl font-semibold text-slate-800">{valor ?? "–"}</p>
      <p className="text-xs text-slate-500 mt-0.5">{etiqueta}</p>
    </Card>
  );
}
