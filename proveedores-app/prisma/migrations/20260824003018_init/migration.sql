-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('ADMINISTRADOR', 'RESPONSABLE_SELECCION', 'CONSULTA');

-- CreateEnum
CREATE TYPE "TipoListaConfigurable" AS ENUM ('TIPO_PROVEEDOR', 'CATEGORIA_PRODUCTO_SERVICIO', 'MONEDA');

-- CreateEnum
CREATE TYPE "EstadoProceso" AS ENUM ('BORRADOR', 'EN_DILIGENCIAMIENTO', 'PENDIENTE_REVISION', 'APROBADA', 'CERRADA');

-- CreateEnum
CREATE TYPE "TipoInforme" AS ENUM ('PDF', 'EXCEL');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "cargo" TEXT,
    "passwordHash" TEXT NOT NULL,
    "rol" "RolUsuario" NOT NULL DEFAULT 'RESPONSABLE_SELECCION',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoAt" TIMESTAMP(3) NOT NULL,
    "ultimoLoginAt" TIMESTAMP(3),

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opciones_configurables" (
    "id" TEXT NOT NULL,
    "lista" "TipoListaConfigurable" NOT NULL,
    "valor" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "opciones_configurables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "criterios_evaluacion" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "peso" DECIMAL(5,2) NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "guia5" TEXT NOT NULL,
    "guia3" TEXT NOT NULL,
    "guia1" TEXT NOT NULL,
    "creadoAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "criterios_evaluacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "criterios_historial" (
    "id" TEXT NOT NULL,
    "criterioId" TEXT NOT NULL,
    "campoModificado" TEXT NOT NULL,
    "valorAnterior" TEXT,
    "valorNuevo" TEXT,
    "modificadoPorId" TEXT NOT NULL,
    "modificadoAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "criterios_historial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consecutivos" (
    "id" TEXT NOT NULL,
    "prefijo" TEXT NOT NULL DEFAULT 'SEL',
    "anio" INTEGER NOT NULL,
    "ultimoValor" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "consecutivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parametros_sistema" (
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "descripcion" TEXT,
    "actualizadoAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parametros_sistema_pkey" PRIMARY KEY ("clave")
);

-- CreateTable
CREATE TABLE "procesos_seleccion" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "areaSolicitante" TEXT NOT NULL,
    "responsableNombre" TEXT NOT NULL,
    "responsableCargo" TEXT NOT NULL,
    "tipoProveedor" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "descripcionNecesidad" TEXT NOT NULL,
    "observacionesGenerales" TEXT,
    "estado" "EstadoProceso" NOT NULL DEFAULT 'BORRADOR',
    "archivado" BOOLEAN NOT NULL DEFAULT false,
    "proveedorMayorPuntajeId" TEXT,
    "proveedorSeleccionadoId" TEXT,
    "justificacionSeleccion" TEXT,
    "motivoSiNoMayorPuntaje" TEXT,
    "observacionesFinales" TEXT,
    "cierreConExcepcion" BOOLEAN NOT NULL DEFAULT false,
    "cierreExcepcionAutorizadoPorId" TEXT,
    "cierreExcepcionMotivo" TEXT,
    "creadoPorId" TEXT NOT NULL,
    "creadoAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoPorId" TEXT,
    "actualizadoAt" TIMESTAMP(3) NOT NULL,
    "cerradoPorId" TEXT,
    "cerradoAt" TIMESTAMP(3),

    CONSTRAINT "procesos_seleccion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proveedores" (
    "id" TEXT NOT NULL,
    "procesoId" TEXT NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "nit" TEXT NOT NULL,
    "nombreComercial" TEXT,
    "nombreContacto" TEXT,
    "cargoContacto" TEXT,
    "telefono" TEXT,
    "correo" TEXT,
    "ciudad" TEXT,
    "direccion" TEXT,
    "paginaWeb" TEXT,
    "tiempoMercado" TEXT,
    "productoServicio" TEXT NOT NULL,
    "valorCotizacion" DECIMAL(18,2),
    "moneda" TEXT DEFAULT 'COP',
    "condicionesComerciales" TEXT,
    "formaPagoPropuesta" TEXT,
    "descuentosOfrecidos" TEXT,
    "observacionesComerciales" TEXT,
    "certificacionCalidad" BOOLEAN NOT NULL DEFAULT false,
    "certificacionAmbiental" BOOLEAN NOT NULL DEFAULT false,
    "certificacionSST" BOOLEAN NOT NULL DEFAULT false,
    "otrasCertificaciones" TEXT,
    "observacionesAdicionales" TEXT,
    "creadoAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calificaciones" (
    "id" TEXT NOT NULL,
    "procesoId" TEXT NOT NULL,
    "proveedorId" TEXT NOT NULL,
    "criterioId" TEXT NOT NULL,
    "valor" INTEGER,
    "resultadoPonderado" DECIMAL(6,3),
    "pesoAplicado" DECIMAL(5,2),
    "observacion" TEXT,
    "calificadoPorId" TEXT,
    "actualizadoAt" TIMESTAMP(3) NOT NULL,
    "creadoAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos" (
    "id" TEXT NOT NULL,
    "procesoId" TEXT NOT NULL,
    "proveedorId" TEXT,
    "nombreOriginal" TEXT NOT NULL,
    "tipoArchivo" TEXT NOT NULL,
    "tamanoBytes" INTEGER NOT NULL,
    "bucket" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "checksum" TEXT,
    "subidoPorId" TEXT NOT NULL,
    "subidoAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "informes" (
    "id" TEXT NOT NULL,
    "procesoId" TEXT NOT NULL,
    "tipo" "TipoInforme" NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "bucket" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "tamanoBytes" INTEGER,
    "generadoPorId" TEXT NOT NULL,
    "generadoAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "informes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventos_auditoria" (
    "id" TEXT NOT NULL,
    "procesoId" TEXT,
    "entidad" TEXT NOT NULL,
    "entidadId" TEXT,
    "accion" TEXT NOT NULL,
    "estadoAnterior" TEXT,
    "estadoNuevo" TEXT,
    "detalle" JSONB,
    "usuarioId" TEXT,
    "ip" TEXT,
    "creadoAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eventos_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "opciones_configurables_lista_valor_key" ON "opciones_configurables"("lista", "valor");

-- CreateIndex
CREATE UNIQUE INDEX "consecutivos_prefijo_anio_key" ON "consecutivos"("prefijo", "anio");

-- CreateIndex
CREATE UNIQUE INDEX "procesos_seleccion_codigo_key" ON "procesos_seleccion"("codigo");

-- CreateIndex
CREATE INDEX "procesos_seleccion_estado_idx" ON "procesos_seleccion"("estado");

-- CreateIndex
CREATE INDEX "procesos_seleccion_archivado_idx" ON "procesos_seleccion"("archivado");

-- CreateIndex
CREATE INDEX "proveedores_procesoId_idx" ON "proveedores"("procesoId");

-- CreateIndex
CREATE UNIQUE INDEX "proveedores_procesoId_nit_key" ON "proveedores"("procesoId", "nit");

-- CreateIndex
CREATE INDEX "calificaciones_procesoId_idx" ON "calificaciones"("procesoId");

-- CreateIndex
CREATE INDEX "calificaciones_proveedorId_idx" ON "calificaciones"("proveedorId");

-- CreateIndex
CREATE UNIQUE INDEX "calificaciones_procesoId_proveedorId_criterioId_key" ON "calificaciones"("procesoId", "proveedorId", "criterioId");

-- CreateIndex
CREATE INDEX "documentos_procesoId_idx" ON "documentos"("procesoId");

-- CreateIndex
CREATE INDEX "documentos_proveedorId_idx" ON "documentos"("proveedorId");

-- CreateIndex
CREATE INDEX "informes_procesoId_idx" ON "informes"("procesoId");

-- CreateIndex
CREATE INDEX "eventos_auditoria_procesoId_idx" ON "eventos_auditoria"("procesoId");

-- CreateIndex
CREATE INDEX "eventos_auditoria_entidad_entidadId_idx" ON "eventos_auditoria"("entidad", "entidadId");

-- CreateIndex
CREATE INDEX "eventos_auditoria_creadoAt_idx" ON "eventos_auditoria"("creadoAt");

-- AddForeignKey
ALTER TABLE "criterios_historial" ADD CONSTRAINT "criterios_historial_criterioId_fkey" FOREIGN KEY ("criterioId") REFERENCES "criterios_evaluacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "criterios_historial" ADD CONSTRAINT "criterios_historial_modificadoPorId_fkey" FOREIGN KEY ("modificadoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procesos_seleccion" ADD CONSTRAINT "procesos_seleccion_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procesos_seleccion" ADD CONSTRAINT "procesos_seleccion_actualizadoPorId_fkey" FOREIGN KEY ("actualizadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procesos_seleccion" ADD CONSTRAINT "procesos_seleccion_cerradoPorId_fkey" FOREIGN KEY ("cerradoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proveedores" ADD CONSTRAINT "proveedores_procesoId_fkey" FOREIGN KEY ("procesoId") REFERENCES "procesos_seleccion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calificaciones" ADD CONSTRAINT "calificaciones_procesoId_fkey" FOREIGN KEY ("procesoId") REFERENCES "procesos_seleccion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calificaciones" ADD CONSTRAINT "calificaciones_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "proveedores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calificaciones" ADD CONSTRAINT "calificaciones_criterioId_fkey" FOREIGN KEY ("criterioId") REFERENCES "criterios_evaluacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calificaciones" ADD CONSTRAINT "calificaciones_calificadoPorId_fkey" FOREIGN KEY ("calificadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_procesoId_fkey" FOREIGN KEY ("procesoId") REFERENCES "procesos_seleccion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "proveedores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_subidoPorId_fkey" FOREIGN KEY ("subidoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "informes" ADD CONSTRAINT "informes_procesoId_fkey" FOREIGN KEY ("procesoId") REFERENCES "procesos_seleccion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "informes" ADD CONSTRAINT "informes_generadoPorId_fkey" FOREIGN KEY ("generadoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_auditoria" ADD CONSTRAINT "eventos_auditoria_procesoId_fkey" FOREIGN KEY ("procesoId") REFERENCES "procesos_seleccion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_auditoria" ADD CONSTRAINT "eventos_auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
