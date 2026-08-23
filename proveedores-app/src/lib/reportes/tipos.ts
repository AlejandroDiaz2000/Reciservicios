export interface DatosInformeCriterio {
  id: string;
  nombre: string;
  peso: number;
}

export interface DatosInformeCalificacion {
  criterioId: string;
  valor: number | null;
  resultadoPonderado: number | null;
  observacion: string | null;
}

export interface DatosInformeProveedor {
  id: string;
  razonSocial: string;
  nit: string;
  nombreComercial: string | null;
  nombreContacto: string | null;
  telefono: string | null;
  correo: string | null;
  ciudad: string | null;
  productoServicio: string;
  valorCotizacion: number | null;
  moneda: string | null;
  calificaciones: DatosInformeCalificacion[];
  puntajeTotalPonderado: number;
  puntajeSobreCinco: number;
  posicion: number;
}

export interface DatosInformeProceso {
  codigo: string;
  fecha: string;
  areaSolicitante: string;
  responsableNombre: string;
  responsableCargo: string;
  tipoProveedor: string;
  categoria: string;
  descripcionNecesidad: string;
  observacionesGenerales: string | null;
  estado: string;
  proveedorMayorPuntajeNombre: string | null;
  proveedorSeleccionadoNombre: string | null;
  justificacionSeleccion: string | null;
  motivoSiNoMayorPuntaje: string | null;
  observacionesFinales: string | null;
}

export interface DatosInformeEmpresa {
  nombre: string;
  nit: string;
}

export interface DatosInforme {
  empresa: DatosInformeEmpresa;
  proceso: DatosInformeProceso;
  criterios: DatosInformeCriterio[];
  proveedores: DatosInformeProveedor[];
  version: number;
  generadoPor: string;
  generadoAt: string;
}
