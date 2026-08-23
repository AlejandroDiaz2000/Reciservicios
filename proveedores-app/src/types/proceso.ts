export type EstadoProceso = "BORRADOR" | "EN_DILIGENCIAMIENTO" | "PENDIENTE_REVISION" | "APROBADA" | "CERRADA";

export interface Proceso {
  id: string;
  codigo: string;
  fecha: string;
  areaSolicitante: string;
  responsableNombre: string;
  responsableCargo: string;
  tipoProveedor: string;
  categoria: string;
  descripcionNecesidad: string;
  observacionesGenerales: string | null;
  estado: EstadoProceso;
  archivado: boolean;
  proveedorMayorPuntajeId: string | null;
  proveedorSeleccionadoId: string | null;
  justificacionSeleccion: string | null;
  motivoSiNoMayorPuntaje: string | null;
  observacionesFinales: string | null;
  cierreConExcepcion: boolean;
  creadoPorId: string;
  creadoAt: string;
  actualizadoAt: string;
  cerradoAt: string | null;
  proveedores: Proveedor[];
  creadoPor?: { nombre: string; correo: string };
  informes?: Informe[];
}

export interface Proveedor {
  id: string;
  procesoId: string;
  razonSocial: string;
  nit: string;
  nombreComercial: string | null;
  nombreContacto: string | null;
  cargoContacto: string | null;
  telefono: string | null;
  correo: string | null;
  ciudad: string | null;
  direccion: string | null;
  paginaWeb: string | null;
  tiempoMercado: string | null;
  productoServicio: string;
  valorCotizacion: number | null;
  moneda: string | null;
  condicionesComerciales: string | null;
  formaPagoPropuesta: string | null;
  descuentosOfrecidos: string | null;
  observacionesComerciales: string | null;
  certificacionCalidad: boolean;
  certificacionAmbiental: boolean;
  certificacionSST: boolean;
  otrasCertificaciones: string | null;
  observacionesAdicionales: string | null;
}

export interface Criterio {
  id: string;
  nombre: string;
  descripcion: string | null;
  peso: number;
  orden: number;
  activo: boolean;
  guia5: string;
  guia3: string;
  guia1: string;
}

export interface CalificacionApi {
  id: string;
  procesoId: string;
  proveedorId: string;
  criterioId: string;
  valor: number | null;
  resultadoPonderado: number | null;
  pesoAplicado: number | null;
  observacion: string | null;
}

export interface Informe {
  id: string;
  procesoId: string;
  tipo: "PDF" | "EXCEL";
  version: number;
  generadoAt: string;
  generadoPor?: { nombre: string };
}

export interface EventoAuditoria {
  id: string;
  entidad: string;
  entidadId: string | null;
  accion: string;
  estadoAnterior: string | null;
  estadoNuevo: string | null;
  detalle: unknown;
  creadoAt: string;
  usuario?: { nombre: string; correo: string; rol: string } | null;
}

export interface ResultadoProveedorApi {
  puntajeTotalPonderado: number;
  puntajeSobreCinco: number;
  porcentaje: number;
  criteriosCalificados: number;
  criteriosTotales: number;
  completo: boolean;
}

export interface ComparacionItem {
  proveedorId: string;
  nombre: string;
  resultado: ResultadoProveedorApi;
  posicion: number;
}
