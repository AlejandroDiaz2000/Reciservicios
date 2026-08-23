"use client";

import { useState } from "react";
import { api } from "@/lib/api-client";
import { Proceso, Proveedor } from "@/types/proceso";
import { Card, CardHeader, Boton, Alerta } from "@/components/ui/Basicos";
import { Badge } from "@/components/ui/Badge";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
import { ProveedorForm, ProveedorFormValues } from "./ProveedorForm";

export function TabProveedores({
  proceso,
  puedeEditar,
  onActualizado,
}: {
  proceso: Proceso;
  puedeEditar: boolean;
  onActualizado: () => void;
}) {
  const [modo, setModo] = useState<"lista" | "crear" | { editar: string }>("lista");
  const [eliminando, setEliminando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function payload(v: ProveedorFormValues) {
    return {
      ...v,
      valorCotizacion: v.valorCotizacion ? Number(v.valorCotizacion) : null,
    };
  }

  async function crear(v: ProveedorFormValues) {
    await api.post(`/api/procesos/${proceso.id}/proveedores`, payload(v));
    setModo("lista");
    onActualizado();
  }

  async function editar(proveedorId: string, v: ProveedorFormValues) {
    await api.patch(`/api/procesos/${proceso.id}/proveedores/${proveedorId}`, payload(v));
    setModo("lista");
    onActualizado();
  }

  async function eliminar(proveedorId: string) {
    setError(null);
    setEliminando(proveedorId);
    try {
      await api.delete(`/api/procesos/${proceso.id}/proveedores/${proveedorId}`);
      onActualizado();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar el proveedor.");
    } finally {
      setEliminando(null);
    }
  }

  if (modo === "crear") {
    return (
      <Card>
        <CardHeader title="Registrar proveedor" />
        <div className="p-5">
          <ProveedorForm onGuardar={crear} onCancelar={() => setModo("lista")} />
        </div>
      </Card>
    );
  }

  if (typeof modo === "object") {
    const proveedor = proceso.proveedores.find((p) => p.id === modo.editar);
    return (
      <Card>
        <CardHeader title="Editar proveedor" />
        <div className="p-5">
          <ProveedorForm
            valoresPrevios={proveedor}
            onGuardar={(v) => editar(modo.editar, v)}
            onCancelar={() => setModo("lista")}
          />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {proceso.proveedores.length < 3 ? (
        <Alerta tono="advertencia">
          Se requieren mínimo 3 proveedores para poder cerrar el proceso. Actualmente hay{" "}
          {proceso.proveedores.length}.
        </Alerta>
      ) : null}
      {error ? <Alerta tono="error">{error}</Alerta> : null}

      <div className="flex justify-end">
        {puedeEditar ? (
          <Boton onClick={() => setModo("crear")}>
            <Plus className="h-4 w-4" /> Registrar proveedor
          </Boton>
        ) : null}
      </div>

      {proceso.proveedores.length === 0 ? (
        <Card className="p-10 text-center text-sm text-slate-500">Aún no se han registrado proveedores.</Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {proceso.proveedores.map((p: Proveedor) => (
            <Card key={p.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <Building2 className="h-4.5 w-4.5 text-slate-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{p.razonSocial}</p>
                    <p className="text-xs text-slate-500">NIT {p.nit}</p>
                  </div>
                </div>
                {puedeEditar ? (
                  <div className="flex gap-1">
                    <button
                      onClick={() => setModo({ editar: p.id })}
                      className="p-1.5 text-slate-500 hover:text-[var(--color-navy-700)] hover:bg-slate-100 rounded"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => eliminar(p.id)}
                      disabled={eliminando === p.id}
                      className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : null}
              </div>

              <p className="text-sm text-slate-600 mt-3 line-clamp-2">{p.productoServicio}</p>

              <div className="flex flex-wrap gap-2 mt-3">
                {p.ciudad ? <Badge>{p.ciudad}</Badge> : null}
                {p.valorCotizacion != null ? (
                  <Badge tono="navy">
                    {p.moneda} {p.valorCotizacion.toLocaleString("es-CO")}
                  </Badge>
                ) : null}
                {p.certificacionCalidad ? <Badge tono="green">Calidad</Badge> : null}
                {p.certificacionAmbiental ? <Badge tono="green">Ambiental</Badge> : null}
                {p.certificacionSST ? <Badge tono="green">SST</Badge> : null}
              </div>

              {p.nombreContacto ? (
                <p className="text-xs text-slate-400 mt-3">
                  Contacto: {p.nombreContacto} {p.cargoContacto ? `(${p.cargoContacto})` : ""}{" "}
                  {p.telefono ? `· ${p.telefono}` : ""}
                </p>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
