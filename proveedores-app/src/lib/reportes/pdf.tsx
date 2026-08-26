import { Document, Page, Text, View, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { DatosInforme } from "./tipos";
import { LOGO_RECISERVICIOS_BASE64 } from "./logo-base64";

// ----------------------------------------------------------------------------
// Datos del cuadro de control de versión (encabezado del formato).
// Estos valores describen el FORMATO en sí (como documento de calidad), no el
// proceso de selección puntual — se actualizan solo cuando se revisa el formato.
// ----------------------------------------------------------------------------
const FORMATO_MACROPROCESO = "GESTIÓN DE COMPRAS E INFRAESTRUCTURA";
const FORMATO_NOMBRE = "FORMATO SELECCIÓN DE PROVEEDORES";
const FORMATO_VERSION = "01";
const FORMATO_FECHA = "2026/01/26";

// Paleta de colores solicitada. #70AD47 se usa únicamente para las líneas de
// los cuadros/tablas; los textos se mantienen siempre en negro.
const COLOR_LINEA = "#70AD47"; // verde oscuro — líneas de los cuadros
const COLOR_GRIS = "#C9C9C9"; // gris — fondos de encabezados de tabla
const COLOR_VERDE_CLARO = "#C5E0B3"; // verde claro — fondos de título/resaltados
const COLOR_TEXTO = "#000000";

// Nota sobre la tipografía: se usa "Helvetica" porque es la fuente base
// disponible sin necesidad de incrustar archivos de fuente adicionales, y es
// visualmente equivalente a Arial (misma familia de letra sin serifas, con
// métricas muy similares) en el PDF generado.
const FUENTE = "Helvetica";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: FUENTE, color: COLOR_TEXTO },

  // Cuadro de control de versión (encabezado)
  cuadroVersion: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: COLOR_LINEA,
    marginBottom: 14,
  },
  cuadroLogoCelda: {
    width: "18%",
    borderRightWidth: 1,
    borderColor: COLOR_LINEA,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  cuadroLogoImg: { width: 44, height: 44 },
  cuadroCentro: {
    width: "52%",
    borderRightWidth: 1,
    borderColor: COLOR_LINEA,
  },
  cuadroCentroFila: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: COLOR_LINEA,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  cuadroCentroFilaUltima: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  cuadroMacroproceso: { fontSize: 11, fontWeight: 700, color: COLOR_TEXTO, textAlign: "center" },
  cuadroFormato: { fontSize: 11, fontWeight: 400, color: COLOR_TEXTO, textAlign: "center" },
  cuadroDerecha: { width: "30%" },
  cuadroDerechaFila: {
    flex: 1,
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: COLOR_LINEA,
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  cuadroDerechaFilaUltima: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  cuadroDerechaLabel: { fontSize: 11, fontWeight: 700, color: COLOR_TEXTO },
  cuadroDerechaValor: { fontSize: 11, fontWeight: 400, color: COLOR_TEXTO },

  // Resto del documento
  seccionTitulo: {
    fontSize: 11,
    fontWeight: 700,
    color: COLOR_TEXTO,
    marginTop: 16,
    marginBottom: 6,
    backgroundColor: COLOR_VERDE_CLARO,
    borderWidth: 1,
    borderColor: COLOR_LINEA,
    padding: 4,
  },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 4 },
  infoItem: { width: "50%", marginBottom: 3 },
  infoLabel: { fontSize: 7.5, color: COLOR_TEXTO },
  infoValor: { fontSize: 9, fontWeight: 700, color: COLOR_TEXTO },
  parrafo: { fontSize: 9, marginBottom: 4, lineHeight: 1.4, color: COLOR_TEXTO },
  table: { display: "flex", width: "auto", marginTop: 4, marginBottom: 8, borderWidth: 1, borderColor: COLOR_LINEA },
  tableRow: { flexDirection: "row" },
  tableHeaderCell: {
    backgroundColor: COLOR_GRIS,
    color: COLOR_TEXTO,
    padding: 4,
    fontSize: 7.5,
    fontWeight: 700,
    borderRight: 1,
    borderBottom: 1,
    borderColor: COLOR_LINEA,
  },
  tableCell: { padding: 4, fontSize: 7.5, borderRight: 1, borderBottom: 1, borderColor: COLOR_LINEA, color: COLOR_TEXTO },
  tableCellDestacada: {
    padding: 4,
    fontSize: 7.5,
    borderRight: 1,
    borderBottom: 1,
    borderColor: COLOR_LINEA,
    backgroundColor: COLOR_VERDE_CLARO,
    fontWeight: 700,
    color: COLOR_TEXTO,
  },
  proveedorBloque: { marginBottom: 10, break: false },
  proveedorNombre: { fontSize: 10, fontWeight: 700, marginBottom: 2, color: COLOR_TEXTO },
  resaltado: {
    backgroundColor: COLOR_VERDE_CLARO,
    borderWidth: 1,
    borderColor: COLOR_LINEA,
    padding: 8,
    borderRadius: 2,
    marginTop: 4,
    marginBottom: 8,
  },
  resaltadoTitulo: { fontSize: 9, fontWeight: 700, color: COLOR_TEXTO },
});

function fila(label: string, valor: string) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValor}>{valor || "-"}</Text>
    </View>
  );
}

/** Cuadro de control de versión del formato, replicando el encabezado corporativo.
 *  Se marca como `fixed` para que se repita automáticamente en cada página generada,
 *  con el número de página actualizado en cada una. */
function CuadroVersion() {
  return (
    <View style={styles.cuadroVersion} fixed>
      <View style={styles.cuadroLogoCelda}>
        <Image src={LOGO_RECISERVICIOS_BASE64} style={styles.cuadroLogoImg} />
      </View>
      <View style={styles.cuadroCentro}>
        <View style={styles.cuadroCentroFila}>
          <Text style={styles.cuadroMacroproceso}>MACROPROCESO: {FORMATO_MACROPROCESO}</Text>
        </View>
        <View style={styles.cuadroCentroFilaUltima}>
          <Text style={styles.cuadroFormato}>{FORMATO_NOMBRE}</Text>
        </View>
      </View>
      <View style={styles.cuadroDerecha}>
        <View style={styles.cuadroDerechaFila}>
          <Text style={styles.cuadroDerechaLabel}>VERSIÓN: </Text>
          <Text style={styles.cuadroDerechaValor}>{FORMATO_VERSION}</Text>
        </View>
        <View style={styles.cuadroDerechaFila}>
          <Text style={styles.cuadroDerechaLabel}>FECHA: </Text>
          <Text style={styles.cuadroDerechaValor}>{FORMATO_FECHA}</Text>
        </View>
        <View style={styles.cuadroDerechaFilaUltima}>
          <Text style={styles.cuadroDerechaLabel}>PÁGINA: </Text>
          <Text
            style={styles.cuadroDerechaValor}
            render={({ pageNumber, totalPages }) => `${pageNumber} de ${totalPages}`}
            fixed
          />
        </View>
      </View>
    </View>
  );
}

export function InformeSeleccionPDF({ datos }: { datos: DatosInforme }) {
  const anchoNombreCol = 26;
  const anchoOtrasCol = (100 - anchoNombreCol) / 3;

  return (
    <Document
      title={`Evaluación y Selección de Proveedores - ${datos.proceso.codigo}`}
      author={datos.empresa.nombre}
    >
      <Page size="A4" style={styles.page} wrap>
        {/* Cuadro de control de versión (encabezado, se repite en cada página) */}
        <CuadroVersion />

        {/* Información general del proceso */}
        <Text style={styles.seccionTitulo}>1. Información general del proceso</Text>
        <View style={styles.infoGrid}>
          {fila("Fecha", datos.proceso.fecha)}
          {fila("Área solicitante", datos.proceso.areaSolicitante)}
          {fila("Responsable de la selección", `${datos.proceso.responsableNombre} - ${datos.proceso.responsableCargo}`)}
          {fila("Tipo de proveedor", datos.proceso.tipoProveedor)}
          {fila("Categoría", datos.proceso.categoria)}
        </View>
        <Text style={styles.infoLabel}>Descripción de la necesidad</Text>
        <Text style={styles.parrafo}>{datos.proceso.descripcionNecesidad}</Text>
        {datos.proceso.observacionesGenerales ? (
          <>
            <Text style={styles.infoLabel}>Observaciones generales</Text>
            <Text style={styles.parrafo}>{datos.proceso.observacionesGenerales}</Text>
          </>
        ) : null}

        {/* Proveedores participantes */}
        <Text style={styles.seccionTitulo}>2. Proveedores participantes</Text>
        <View style={styles.table}>
          <View style={styles.tableRow} fixed>
            <Text style={[styles.tableHeaderCell, { width: "22%" }]}>Razón social</Text>
            <Text style={[styles.tableHeaderCell, { width: "13%" }]}>NIT</Text>
            <Text style={[styles.tableHeaderCell, { width: "18%" }]}>Contacto</Text>
            <Text style={[styles.tableHeaderCell, { width: "12%" }]}>Ciudad</Text>
            <Text style={[styles.tableHeaderCell, { width: "20%" }]}>Producto / servicio</Text>
            <Text style={[styles.tableHeaderCell, { width: "15%", borderRight: 0 }]}>Valor cotización</Text>
          </View>
          {datos.proveedores.map((p) => (
            <View style={styles.tableRow} key={p.id} wrap={false}>
              <Text style={[styles.tableCell, { width: "22%" }]}>{p.razonSocial}</Text>
              <Text style={[styles.tableCell, { width: "13%" }]}>{p.nit}</Text>
              <Text style={[styles.tableCell, { width: "18%" }]}>{p.nombreContacto || "-"}</Text>
              <Text style={[styles.tableCell, { width: "12%" }]}>{p.ciudad || "-"}</Text>
              <Text style={[styles.tableCell, { width: "20%" }]}>{p.productoServicio}</Text>
              <Text style={[styles.tableCell, { width: "15%", borderRight: 0 }]}>
                {p.valorCotizacion != null ? `${p.moneda ?? ""} ${p.valorCotizacion.toLocaleString("es-CO")}` : "-"}
              </Text>
            </View>
          ))}
        </View>

        {/* Matriz de evaluación por proveedor */}
        <Text style={styles.seccionTitulo}>3. Matriz de evaluación</Text>
        {datos.proveedores.map((p) => (
          <View key={p.id} style={styles.proveedorBloque} wrap={false}>
            <Text style={styles.proveedorNombre}>
              {p.razonSocial} — Resultado: {p.puntajeTotalPonderado}% ({p.puntajeSobreCinco.toFixed(2)} / 5)
            </Text>
            <View style={styles.table}>
              <View style={styles.tableRow}>
                <Text style={[styles.tableHeaderCell, { width: `${anchoNombreCol}%` }]}>Criterio</Text>
                <Text style={[styles.tableHeaderCell, { width: `${anchoOtrasCol}%` }]}>Peso</Text>
                <Text style={[styles.tableHeaderCell, { width: `${anchoOtrasCol}%` }]}>Calificación</Text>
                <Text style={[styles.tableHeaderCell, { width: `${anchoOtrasCol}%`, borderRight: 0 }]}>
                  Resultado ponderado
                </Text>
              </View>
              {p.calificaciones.map((c) => {
                const crit = datos.criterios.find((cr) => cr.id === c.criterioId);
                return (
                  <View key={c.criterioId} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { width: `${anchoNombreCol}%` }]}>{crit?.nombre}</Text>
                    <Text style={[styles.tableCell, { width: `${anchoOtrasCol}%` }]}>{crit?.peso}%</Text>
                    <Text style={[styles.tableCell, { width: `${anchoOtrasCol}%` }]}>{c.valor ?? "Sin calificar"}</Text>
                    <Text style={[styles.tableCell, { width: `${anchoOtrasCol}%`, borderRight: 0 }]}>
                      {c.resultadoPonderado != null ? `${c.resultadoPonderado}%` : "-"}
                    </Text>
                  </View>
                );
              })}
              {p.calificaciones.map((c) =>
                c.observacion ? (
                  <View key={`obs-${c.criterioId}`} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { width: "100%", fontStyle: "italic", color: COLOR_TEXTO }]}>
                      {datos.criterios.find((cr) => cr.id === c.criterioId)?.nombre}: {c.observacion}
                    </Text>
                  </View>
                ) : null
              )}
            </View>
          </View>
        ))}

        {/* Comparativo */}
        <Text style={styles.seccionTitulo}>4. Comparativo de proveedores</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={[styles.tableHeaderCell, { width: "10%" }]}>Posición</Text>
            <Text style={[styles.tableHeaderCell, { width: "40%" }]}>Proveedor</Text>
            <Text style={[styles.tableHeaderCell, { width: "25%" }]}>Puntaje / 5</Text>
            <Text style={[styles.tableHeaderCell, { width: "25%", borderRight: 0 }]}>Resultado</Text>
          </View>
          {[...datos.proveedores]
            .sort((a, b) => a.posicion - b.posicion)
            .map((p) => (
              <View style={styles.tableRow} key={p.id}>
                <Text style={p.posicion === 1 ? styles.tableCellDestacada : styles.tableCell} >{p.posicion}</Text>
                <Text style={[p.posicion === 1 ? styles.tableCellDestacada : styles.tableCell, { width: "40%" }]}>
                  {p.razonSocial}
                </Text>
                <Text style={[p.posicion === 1 ? styles.tableCellDestacada : styles.tableCell, { width: "25%" }]}>
                  {p.puntajeSobreCinco.toFixed(2)} / 5
                </Text>
                <Text
                  style={[
                    p.posicion === 1 ? styles.tableCellDestacada : styles.tableCell,
                    { width: "25%", borderRight: 0 },
                  ]}
                >
                  {p.puntajeTotalPonderado}%
                </Text>
              </View>
            ))}
        </View>

        {/* Resultado final */}
        <Text style={styles.seccionTitulo}>5. Resultado final</Text>
        <View style={styles.resaltado}>
          <Text style={styles.resaltadoTitulo}>
            Proveedor con mayor puntuación en el proceso de selección: {datos.proceso.proveedorMayorPuntajeNombre || "-"}
          </Text>
        </View>
        <View style={styles.infoGrid}>
          {fila("Proveedor seleccionado finalmente", datos.proceso.proveedorSeleccionadoNombre || "-")}
        </View>
        <Text style={styles.infoLabel}>Justificación de la selección</Text>
        <Text style={styles.parrafo}>{datos.proceso.justificacionSeleccion || "-"}</Text>
        {datos.proceso.motivoSiNoMayorPuntaje ? (
          <>
            <Text style={styles.infoLabel}>
              Motivo de selección (el proveedor elegido no es el de mayor puntuación)
            </Text>
            <Text style={styles.parrafo}>{datos.proceso.motivoSiNoMayorPuntaje}</Text>
          </>
        ) : null}
        {datos.proceso.observacionesFinales ? (
          <>
            <Text style={styles.infoLabel}>Observaciones generales</Text>
            <Text style={styles.parrafo}>{datos.proceso.observacionesFinales}</Text>
          </>
        ) : null}

      </Page>
    </Document>
  );
}

export async function generarInformePDF(datos: DatosInforme): Promise<Buffer> {
  const buffer = await renderToBuffer(<InformeSeleccionPDF datos={datos} />);
  return Buffer.from(buffer);
}
