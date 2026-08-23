"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { Criterio } from "@/types/proceso";
import { Card, CardHeader, Campo, claseInput, Boton, Alerta, Spinner } from "@/components/ui/Basicos";
import { Pencil, Plus, ShieldAlert } from "lucide-react";

interface Ponderacion {
  total: number;
  completa: boolean;
  alerta: string | null;
}

interface FormCriterio {
  nombre: string;
  descripcion: string;
  peso: string;
  guia5: string;
  guia3: string;
  guia1: string;
}

const FORM_VACIO: FormCriterio = { nombre: "", descripcion: "", peso: "", guia5: "", guia3: "", guia1: "" };

export function ConfiguracionCriterios({ rol }: { rol: string }) {
  const esAdmin = rol === "ADMINISTRADOR";
  const [criterios, setCriterios] = useState<Criterio[] | null>(null);
  const [ponderacion, setPonderacion] = useState<Ponderacion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);
  const [form, setForm] = useState<FormCriterio>(FORM_VACIO);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  function cargar() {
    setCargando(true);
    api
      .get<{ criterios: Criterio[]; ponderacion: Ponderacion }>("/api/criterios")
      .then((d) => {
        setCriterios(d.criterios);
        setPonderacion(d.ponderacion);
      })
      .finally(() => setCargando(false));
  }

  useEffect(() => {
    // "cargando" ya inicia en true; cargar() lo reafirma para las recargas posteriores al guardar.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, []);

  function iniciarEdicion(c: Criterio) {
    setEditando(c.id);
    setCreando(false);
    setForm({
      nombre: c.nombre,
      descripcion: c.descripcion ?? "",
      peso: String(c.peso),
      guia5: c.guia5,
      guia3: c.guia3,
      guia1: c.guia1,
    });
  }

  function iniciarCreacion() {
    setCreando(true);
    setEditando(null);
    setForm(FORM_VACIO);
  }

  async function guardar() {
    setGuardando(true);
    setError(null);
    const payload = { ...form, peso: Number(form.peso) };
    try {
      if (editando) {
        await api.patch(`/api/criterios/${editando}`, payload);
      } else {
        await api.post("/api/criterios", payload);
      }
      setEditando(null);
      setCreando(false);
      cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el criterio.");
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
      {!esAdmin ? (
        <Alerta tono="info" titulo="Acceso de solo lectura">
          Solo los administradores pueden modificar los criterios y ponderaciones. A continuación puedes consultar
          la configuración vigente.
        </Alerta>
      ) : null}

      {ponderacion ? (
        <Alerta tono={ponderacion.completa ? "exito" : "advertencia"} titulo={ponderacion.completa ? "Ponderación completa" : "Alerta de configuración"}>
          {ponderacion.completa
            ? `Los criterios activos suman ${ponderacion.total}% de la evaluación.`
            : ponderacion.alerta}
        </Alerta>
      ) : null}

      <Card>
        <CardHeader
          title="Criterios de evaluación"
          subtitle="Pesos y guías de calificación utilizados en la matriz de selección de proveedores."
          acciones={
            esAdmin ? (
              <Boton onClick={iniciarCreacion} variante="secundario">
                <Plus className="h-4 w-4" /> Nuevo criterio
              </Boton>
            ) : undefined
          }
        />
        <div className="divide-y divide-slate-100">
          {criterios?.map((c) => (
            <div key={c.id} className="px-5 py-4">
              {editando === c.id ? (
                <FormularioCriterio form={form} setForm={setForm} onCancelar={() => setEditando(null)} onGuardar={guardar} guardando={guardando} error={error} />
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-800">
                      {c.nombre} <span className="text-slate-400 text-sm font-normal">— {c.peso}%</span>
                      {!c.activo ? <span className="text-xs text-red-500 ml-2">(inactivo)</span> : null}
                    </p>
                    {c.descripcion ? <p className="text-sm text-slate-500 mt-0.5">{c.descripcion}</p> : null}
                    <div className="text-xs text-slate-400 mt-2 space-y-0.5">
                      <p>5: {c.guia5}</p>
                      <p>3: {c.guia3}</p>
                      <p>1: {c.guia1}</p>
                    </div>
                  </div>
                  {esAdmin ? (
                    <button
                      onClick={() => iniciarEdicion(c)}
                      className="p-1.5 text-slate-500 hover:text-[var(--color-navy-700)] hover:bg-slate-100 rounded shrink-0"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          ))}

          {creando ? (
            <div className="px-5 py-4">
              <FormularioCriterio form={form} setForm={setForm} onCancelar={() => setCreando(false)} onGuardar={guardar} guardando={guardando} error={error} />
            </div>
          ) : null}
        </div>
      </Card>

      <Alerta tono="info">
        <span className="inline-flex items-center gap-1.5">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          Todo cambio en criterios y ponderaciones queda registrado en el historial de configuración, con el
          usuario y la fecha del cambio, para efectos de auditoría.
        </span>
      </Alerta>
    </div>
  );
}

function FormularioCriterio({
  form,
  setForm,
  onCancelar,
  onGuardar,
  guardando,
  error,
}: {
  form: FormCriterio;
  setForm: (f: FormCriterio) => void;
  onCancelar: () => void;
  onGuardar: () => void;
  guardando: boolean;
  error: string | null;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Campo label="Nombre del criterio" requerido>
          <input className={claseInput} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
        </Campo>
        <Campo label="Peso (%)" requerido>
          <input type="number" min={0} max={100} step="0.01" className={claseInput} value={form.peso} onChange={(e) => setForm({ ...form, peso: e.target.value })} />
        </Campo>
      </div>
      <Campo label="Descripción">
        <input className={claseInput} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
      </Campo>
      <Campo label="Guía para calificación 5 (Excelente)" requerido>
        <input className={claseInput} value={form.guia5} onChange={(e) => setForm({ ...form, guia5: e.target.value })} />
      </Campo>
      <Campo label="Guía para calificación 3 (Aceptable)" requerido>
        <input className={claseInput} value={form.guia3} onChange={(e) => setForm({ ...form, guia3: e.target.value })} />
      </Campo>
      <Campo label="Guía para calificación 1 (Desfavorable)" requerido>
        <input className={claseInput} value={form.guia1} onChange={(e) => setForm({ ...form, guia1: e.target.value })} />
      </Campo>
      {error ? <Alerta tono="error">{error}</Alerta> : null}
      <div className="flex justify-end gap-2">
        <Boton variante="secundario" onClick={onCancelar}>
          Cancelar
        </Boton>
        <Boton onClick={onGuardar} disabled={guardando}>
          {guardando ? "Guardando..." : "Guardar"}
        </Boton>
      </div>
    </div>
  );
}
