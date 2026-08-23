"use client";

import { useState } from "react";
import { Proveedor } from "@/types/proceso";
import { Campo, claseInput, Boton, Alerta } from "@/components/ui/Basicos";

export interface ProveedorFormValues {
  razonSocial: string;
  nit: string;
  nombreComercial: string;
  nombreContacto: string;
  cargoContacto: string;
  telefono: string;
  correo: string;
  ciudad: string;
  direccion: string;
  paginaWeb: string;
  tiempoMercado: string;
  productoServicio: string;
  valorCotizacion: string;
  moneda: string;
  condicionesComerciales: string;
  formaPagoPropuesta: string;
  descuentosOfrecidos: string;
  observacionesComerciales: string;
  certificacionCalidad: boolean;
  certificacionAmbiental: boolean;
  certificacionSST: boolean;
  otrasCertificaciones: string;
  observacionesAdicionales: string;
}

export function valoresIniciales(p?: Proveedor): ProveedorFormValues {
  return {
    razonSocial: p?.razonSocial ?? "",
    nit: p?.nit ?? "",
    nombreComercial: p?.nombreComercial ?? "",
    nombreContacto: p?.nombreContacto ?? "",
    cargoContacto: p?.cargoContacto ?? "",
    telefono: p?.telefono ?? "",
    correo: p?.correo ?? "",
    ciudad: p?.ciudad ?? "",
    direccion: p?.direccion ?? "",
    paginaWeb: p?.paginaWeb ?? "",
    tiempoMercado: p?.tiempoMercado ?? "",
    productoServicio: p?.productoServicio ?? "",
    valorCotizacion: p?.valorCotizacion != null ? String(p.valorCotizacion) : "",
    moneda: p?.moneda ?? "COP",
    condicionesComerciales: p?.condicionesComerciales ?? "",
    formaPagoPropuesta: p?.formaPagoPropuesta ?? "",
    descuentosOfrecidos: p?.descuentosOfrecidos ?? "",
    observacionesComerciales: p?.observacionesComerciales ?? "",
    certificacionCalidad: p?.certificacionCalidad ?? false,
    certificacionAmbiental: p?.certificacionAmbiental ?? false,
    certificacionSST: p?.certificacionSST ?? false,
    otrasCertificaciones: p?.otrasCertificaciones ?? "",
    observacionesAdicionales: p?.observacionesAdicionales ?? "",
  };
}

export function ProveedorForm({
  valoresPrevios,
  onGuardar,
  onCancelar,
}: {
  valoresPrevios?: Proveedor;
  onGuardar: (valores: ProveedorFormValues) => Promise<void>;
  onCancelar: () => void;
}) {
  const [form, setForm] = useState<ProveedorFormValues>(valoresIniciales(valoresPrevios));
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  function set<K extends keyof ProveedorFormValues>(key: K, value: ProveedorFormValues[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      await onGuardar(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el proveedor.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section>
        <h4 className="text-sm font-semibold text-slate-700 mb-3">Información general</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo label="Razón social" requerido>
            <input required className={claseInput} value={form.razonSocial} onChange={(e) => set("razonSocial", e.target.value)} />
          </Campo>
          <Campo label="NIT" requerido>
            <input required className={claseInput} value={form.nit} onChange={(e) => set("nit", e.target.value)} />
          </Campo>
          <Campo label="Nombre comercial">
            <input className={claseInput} value={form.nombreComercial} onChange={(e) => set("nombreComercial", e.target.value)} />
          </Campo>
          <Campo label="Nombre del contacto">
            <input className={claseInput} value={form.nombreContacto} onChange={(e) => set("nombreContacto", e.target.value)} />
          </Campo>
          <Campo label="Cargo del contacto">
            <input className={claseInput} value={form.cargoContacto} onChange={(e) => set("cargoContacto", e.target.value)} />
          </Campo>
          <Campo label="Teléfono">
            <input className={claseInput} value={form.telefono} onChange={(e) => set("telefono", e.target.value)} />
          </Campo>
          <Campo label="Correo electrónico">
            <input type="email" className={claseInput} value={form.correo} onChange={(e) => set("correo", e.target.value)} />
          </Campo>
          <Campo label="Ciudad">
            <input className={claseInput} value={form.ciudad} onChange={(e) => set("ciudad", e.target.value)} />
          </Campo>
          <Campo label="Dirección">
            <input className={claseInput} value={form.direccion} onChange={(e) => set("direccion", e.target.value)} />
          </Campo>
          <Campo label="Página web">
            <input className={claseInput} value={form.paginaWeb} onChange={(e) => set("paginaWeb", e.target.value)} />
          </Campo>
          <Campo label="Tiempo en el mercado">
            <input className={claseInput} placeholder="Ej. 8 años" value={form.tiempoMercado} onChange={(e) => set("tiempoMercado", e.target.value)} />
          </Campo>
        </div>
        <div className="mt-4">
          <Campo label="Producto o servicio ofrecido" requerido>
            <textarea required rows={2} className={claseInput} value={form.productoServicio} onChange={(e) => set("productoServicio", e.target.value)} />
          </Campo>
        </div>
      </section>

      <section>
        <h4 className="text-sm font-semibold text-slate-700 mb-3">Información comercial</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo label="Valor de la cotización">
            <input type="number" step="0.01" min="0" className={claseInput} value={form.valorCotizacion} onChange={(e) => set("valorCotizacion", e.target.value)} />
          </Campo>
          <Campo label="Moneda">
            <select className={claseInput} value={form.moneda} onChange={(e) => set("moneda", e.target.value)}>
              <option value="COP">COP</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </Campo>
          <Campo label="Forma de pago propuesta">
            <input className={claseInput} value={form.formaPagoPropuesta} onChange={(e) => set("formaPagoPropuesta", e.target.value)} />
          </Campo>
          <Campo label="Descuentos ofrecidos">
            <input className={claseInput} value={form.descuentosOfrecidos} onChange={(e) => set("descuentosOfrecidos", e.target.value)} />
          </Campo>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo label="Condiciones comerciales">
            <textarea rows={2} className={claseInput} value={form.condicionesComerciales} onChange={(e) => set("condicionesComerciales", e.target.value)} />
          </Campo>
          <Campo label="Observaciones comerciales">
            <textarea rows={2} className={claseInput} value={form.observacionesComerciales} onChange={(e) => set("observacionesComerciales", e.target.value)} />
          </Campo>
        </div>
      </section>

      <section>
        <h4 className="text-sm font-semibold text-slate-700 mb-3">Información adicional</h4>
        <div className="flex flex-wrap gap-4 mb-4">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={form.certificacionCalidad} onChange={(e) => set("certificacionCalidad", e.target.checked)} />
            Certificación de calidad
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={form.certificacionAmbiental} onChange={(e) => set("certificacionAmbiental", e.target.checked)} />
            Certificación ambiental
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={form.certificacionSST} onChange={(e) => set("certificacionSST", e.target.checked)} />
            Certificación en Seguridad y Salud en el Trabajo
          </label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo label="Otras certificaciones">
            <input className={claseInput} value={form.otrasCertificaciones} onChange={(e) => set("otrasCertificaciones", e.target.value)} />
          </Campo>
          <Campo label="Observaciones">
            <textarea rows={2} className={claseInput} value={form.observacionesAdicionales} onChange={(e) => set("observacionesAdicionales", e.target.value)} />
          </Campo>
        </div>
      </section>

      {error ? <Alerta tono="error">{error}</Alerta> : null}

      <div className="flex justify-end gap-3">
        <Boton type="button" variante="secundario" onClick={onCancelar}>
          Cancelar
        </Boton>
        <Boton type="submit" disabled={guardando}>
          {guardando ? "Guardando..." : "Guardar proveedor"}
        </Boton>
      </div>
    </form>
  );
}
