"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { Proceso, Informe } from "@/types/proceso";
import { Card, CardHeader, Boton, Alerta, Spinner } from "@/components/ui/Basicos";
import { FileText, FileSpreadsheet, Download } from "lucide-react";

export function TabInforme({ proceso, rol }: { proceso: Proceso; rol: string }) {
  const puedeGenerar = rol !== "CONSULTA";
  const [informes, setInformes] = useState<Informe[] | null>(null);
  const [cargando, setCargando] = useState(true);
  const [generando, setGenerando] = useState<"PDF" | "EXCEL" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [descargando, setDescargando] = useState<string | null>(null);

  function cargar() {
    setCargando(true);
    api
      .get<{ informes: Informe[] }>(`/api/procesos/${proceso.id}/informe`)
      .then((d) => setInformes(d.informes))
      .finally(() => setCargando(false));
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proceso.id]);

  async function generar(tipo: "PDF" | "EXCEL") {
    setGenerando(tipo);
    setError(null);
    try {
      await api.post(`/api/procesos/${proceso.id}/informe`, { tipo });
      cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo generar el informe.");
    } finally {
      setGenerando(null);
    }
  }

  async function descargar(informeId: string) {
    setDescargando(informeId);
    try {
      const { url } = await api.get<{ url: string }>(`/api/procesos/${proceso.id}/informe/${informeId}/descarga`);
      window.open(url, "_blank");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo generar el enlace de descarga.");
    } finally {
      setDescargando(null);
    }
  }

  const sinProveedores = proceso.proveedores.length === 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Generar informe formal"
          subtitle="El informe se genera con la información diligenciada hasta el momento y se almacena de forma segura en la nube."
        />
        <div className="p-5 space-y-4">
          {sinProveedores ? (
            <Alerta tono="info">Registra proveedores y calificaciones antes de generar el informe.</Alerta>
          ) : null}
          {error ? <Alerta tono="error">{error}</Alerta> : null}
          {puedeGenerar ? (
            <div className="flex flex-wrap gap-3">
              <Boton onClick={() => generar("PDF")} disabled={generando !== null || sinProveedores}>
                <FileText className="h-4 w-4" /> {generando === "PDF" ? "Generando..." : "Generar informe PDF"}
              </Boton>
              <Boton
                variante="secundario"
                onClick={() => generar("EXCEL")}
                disabled={generando !== null || sinProveedores}
              >
                <FileSpreadsheet className="h-4 w-4" /> {generando === "EXCEL" ? "Generando..." : "Generar informe Excel"}
              </Boton>
            </div>
          ) : (
            <Alerta tono="info">Tu rol tiene acceso de solo consulta a los informes generados.</Alerta>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="Informes generados" subtitle="Historial de versiones, con acceso mediante enlace temporal seguro." />
        {cargando ? (
          <div className="py-10 flex justify-center">
            <Spinner />
          </div>
        ) : !informes || informes.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">Aún no se han generado informes.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {informes.map((inf) => (
              <div key={inf.id} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  {inf.tipo === "PDF" ? (
                    <FileText className="h-4.5 w-4.5 text-red-500" />
                  ) : (
                    <FileSpreadsheet className="h-4.5 w-4.5 text-emerald-600" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      Informe {inf.tipo} — versión {inf.version}
                    </p>
                    <p className="text-xs text-slate-500">
                      Generado el {new Date(inf.generadoAt).toLocaleString("es-CO")}
                      {inf.generadoPor ? ` por ${inf.generadoPor.nombre}` : ""}
                    </p>
                  </div>
                </div>
                <Boton variante="secundario" onClick={() => descargar(inf.id)} disabled={descargando === inf.id}>
                  <Download className="h-3.5 w-3.5" /> {descargando === inf.id ? "..." : "Descargar"}
                </Boton>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
