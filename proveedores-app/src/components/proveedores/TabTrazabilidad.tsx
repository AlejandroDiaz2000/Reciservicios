"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { EventoAuditoria } from "@/types/proceso";
import { Card, CardHeader, Spinner } from "@/components/ui/Basicos";
import { Badge } from "@/components/ui/Badge";

const ETIQUETAS_ACCION: Record<string, string> = {
  CREAR: "Creación",
  ACTUALIZAR: "Actualización",
  CAMBIO_ESTADO: "Cambio de estado",
  CALIFICAR: "Calificación registrada",
  REGISTRAR_SELECCION_FINAL: "Selección final registrada",
  GENERAR_INFORME: "Informe generado",
  DESCARGAR: "Descarga",
  ELIMINAR: "Eliminación",
  CARGAR: "Carga de documento",
  LOGIN: "Inicio de sesión",
};

export function TabTrazabilidad({ procesoId }: { procesoId: string }) {
  const [eventos, setEventos] = useState<EventoAuditoria[] | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api
      .get<{ eventos: EventoAuditoria[] }>(`/api/trazabilidad/${procesoId}`)
      .then((d) => setEventos(d.eventos))
      .finally(() => setCargando(false));
  }, [procesoId]);

  return (
    <Card>
      <CardHeader
        title="Trazabilidad del proceso"
        subtitle="Registro histórico de todas las acciones relevantes, para efectos de auditoría interna o externa."
      />
      {cargando ? (
        <div className="py-14 flex justify-center">
          <Spinner />
        </div>
      ) : !eventos || eventos.length === 0 ? (
        <div className="p-10 text-center text-sm text-slate-500">Aún no hay eventos registrados.</div>
      ) : (
        <div className="divide-y divide-slate-100">
          {eventos.map((ev) => (
            <div key={ev.id} className="px-5 py-3.5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-slate-800">
                  <span className="font-medium">{ETIQUETAS_ACCION[ev.accion] ?? ev.accion}</span>
                  <span className="text-slate-400"> · {ev.entidad}</span>
                </p>
                {ev.estadoAnterior || ev.estadoNuevo ? (
                  <p className="text-xs text-slate-500 mt-0.5">
                    {ev.estadoAnterior ? `${ev.estadoAnterior} → ` : ""}
                    {ev.estadoNuevo}
                  </p>
                ) : null}
                <p className="text-xs text-slate-400 mt-0.5">
                  {ev.usuario ? `${ev.usuario.nombre} (${ev.usuario.correo})` : "Sistema"}
                </p>
              </div>
              <div className="text-right shrink-0">
                <Badge>{new Date(ev.creadoAt).toLocaleString("es-CO")}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
