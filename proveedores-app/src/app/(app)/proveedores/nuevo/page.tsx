"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { Card, CardHeader, Campo, claseInput, Boton, Alerta } from "@/components/ui/Basicos";

interface Opcion {
  id: string;
  valor: string;
}

export default function NuevoProcesoPage() {
  const router = useRouter();
  const [tiposProveedor, setTiposProveedor] = useState<Opcion[]>([]);
  const [categorias, setCategorias] = useState<Opcion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const [form, setForm] = useState({
    fecha: new Date().toISOString().slice(0, 10),
    areaSolicitante: "",
    responsableNombre: "",
    responsableCargo: "",
    tipoProveedor: "",
    categoria: "",
    descripcionNecesidad: "",
    observacionesGenerales: "",
  });

  useEffect(() => {
    api
      .get<{ opciones: Opcion[] }>("/api/opciones?lista=TIPO_PROVEEDOR")
      .then((d) => setTiposProveedor(d.opciones));
    api
      .get<{ opciones: Opcion[] }>("/api/opciones?lista=CATEGORIA_PRODUCTO_SERVICIO")
      .then((d) => setCategorias(d.opciones));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const { proceso } = await api.post<{ proceso: { id: string } }>("/api/procesos", form);
      router.push(`/proveedores/${proceso.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el proceso.");
      setEnviando(false);
    }
  }

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Nueva selección de proveedores</h1>
        <p className="text-slate-500 mt-1">
          Registra la información general del proceso. El código de selección se genera automáticamente.
        </p>
      </div>

      <Card>
        <CardHeader title="Información del proceso" />
        <form onSubmit={onSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Campo label="Fecha de selección" requerido>
              <input
                type="date"
                required
                className={claseInput}
                value={form.fecha}
                onChange={(e) => set("fecha", e.target.value)}
              />
            </Campo>
            <Campo label="Área solicitante" requerido>
              <input
                required
                className={claseInput}
                value={form.areaSolicitante}
                onChange={(e) => set("areaSolicitante", e.target.value)}
                placeholder="Ej. Operaciones, Mantenimiento, Compras..."
              />
            </Campo>
            <Campo label="Nombre del responsable de la selección" requerido>
              <input
                required
                className={claseInput}
                value={form.responsableNombre}
                onChange={(e) => set("responsableNombre", e.target.value)}
              />
            </Campo>
            <Campo label="Cargo del responsable" requerido>
              <input
                required
                className={claseInput}
                value={form.responsableCargo}
                onChange={(e) => set("responsableCargo", e.target.value)}
              />
            </Campo>
            <Campo label="Tipo de proveedor" requerido>
              <select
                required
                className={claseInput}
                value={form.tipoProveedor}
                onChange={(e) => set("tipoProveedor", e.target.value)}
              >
                <option value="">Selecciona...</option>
                {tiposProveedor.map((o) => (
                  <option key={o.id} value={o.valor}>
                    {o.valor}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo label="Categoría del producto o servicio" requerido>
              <select
                required
                className={claseInput}
                value={form.categoria}
                onChange={(e) => set("categoria", e.target.value)}
              >
                <option value="">Selecciona...</option>
                {categorias.map((o) => (
                  <option key={o.id} value={o.valor}>
                    {o.valor}
                  </option>
                ))}
              </select>
            </Campo>
          </div>

          <Campo label="Descripción de la necesidad" requerido>
            <textarea
              required
              rows={4}
              className={claseInput}
              value={form.descripcionNecesidad}
              onChange={(e) => set("descripcionNecesidad", e.target.value)}
              placeholder="Describe qué se requiere contratar y por qué."
            />
          </Campo>

          <Campo label="Observaciones generales">
            <textarea
              rows={3}
              className={claseInput}
              value={form.observacionesGenerales}
              onChange={(e) => set("observacionesGenerales", e.target.value)}
            />
          </Campo>

          {error ? <Alerta tono="error">{error}</Alerta> : null}

          <div className="flex justify-end gap-3 pt-2">
            <Boton type="submit" disabled={enviando}>
              {enviando ? "Guardando..." : "Guardar como borrador y continuar"}
            </Boton>
          </div>
        </form>
      </Card>
    </div>
  );
}
