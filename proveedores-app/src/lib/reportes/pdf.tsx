import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { DatosInforme } from "./tipos";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: "Helvetica", color: "#1a1a1a" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12, borderBottom: 2, borderColor: "#1e3a5f", paddingBottom: 10 },
  empresaNombre: { fontSize: 13, fontWeight: 700, color: "#1e3a5f" },
  empresaNit: { fontSize: 8, color: "#555" },
  tituloDoc: { fontSize: 14, fontWeight: 700, textAlign: "right", color: "#1e3a5f" },
  codigoDoc: { fontSize: 9, textAlign: "right", color: "#555" },
  seccionTitulo: { fontSize: 11, fontWeight: 700, color: "#1e3a5f", marginTop: 16, marginBottom: 6, backgroundColor: "#eef2f7", padding: 4 },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 4 },
  infoItem: { width: "50%", marginBottom: 3 },
  infoLabel: { fontSize: 7.5, color: "#666" },
  infoValor: { fontSize: 9, fontWeight: 700 },
  parrafo: { fontSize: 9, marginBottom: 4, lineHeight: 1.4 },
  table: { display: "flex", width: "auto", marginTop: 4, marginBottom: 8 },
  tableRow: { flexDirection: "row" },
  tableHeaderCell: { backgroundColor: "#1e3a5f", color: "#fff", padding: 4, fontSize: 7.5, fontWeight: 700, borderRight: 1, borderColor: "#fff" },
  tableCell: { padding: 4, fontSize: 7.5, borderRight: 1, borderBottom: 1, borderColor: "#ddd" },
  tableCellDestacada: { padding: 4, fontSize: 7.5, borderRight: 1, borderBottom: 1, borderColor: "#ddd", backgroundColor: "#fff6d9", fontWeight: 700 },
  proveedorBloque: { marginBottom: 10, break: false },
  proveedorNombre: { fontSize: 10, fontWeight: 700, marginBottom: 2, color: "#1e3a5f" },
  resaltado: { backgroundColor: "#eaf6ec", padding: 8, borderRadius: 2, marginTop: 4, marginBottom: 8 },
  resaltadoTitulo: { fontSize: 9, fontWeight: 700, color: "#1c6b34" },
  firmaBloque: { width: "31%", borderTop: 1, borderColor: "#999", paddingTop: 4, marginTop: 40 },
  firmaLabel: { fontSize: 8, color: "#555" },
  footer: { position: "absolute", bottom: 20, left: 32, right: 32, fontSize: 7, color: "#999", textAlign: "center", borderTop: 1, borderColor: "#ddd", paddingTop: 4 },
});

function fila(label: string, valor: string) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValor}>{valor || "-"}</Text>
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
        {/* Encabezado */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.empresaNombre}>{datos.empresa.nombre}</Text>
            {datos.empresa.nit ? <Text style={styles.empresaNit}>NIT {datos.empresa.nit}</Text> : null}
          </View>
          <View>
            <Text style={styles.tituloDoc}>Evaluación y Selección de Proveedores</Text>
            <Text style={styles.codigoDoc}>Código: {datos.proceso.codigo}</Text>
            <Text style={styles.codigoDoc}>Fecha: {datos.proceso.fecha}</Text>
          </View>
        </View>

        {/* Información general del proceso */}
        <Text style={styles.seccionTitulo}>1. Información general del proceso</Text>
        <View style={styles.infoGrid}>
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
                    <Text style={[styles.tableCell, { width: "100%", fontStyle: "italic", color: "#555" }]}>
                      {datos.criterios.find((cr) => cr.id === c.criterioId)?.nombre}: {c.observacion}
                    </Text>
                  </View>
                ) : null
              )}
            </View>
          </View>
        ))}

        {/* Comparativo */}
        <Text style={styles.seccionTitulo} break>
          4. Comparativo de proveedores
        </Text>
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

        {/* Firmas */}
        <Text style={styles.seccionTitulo} break>
          6. Firmas
        </Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 30 }}>
          {["Elaboró", "Revisó", "Aprobó"].map((rol) => (
            <View key={rol} style={styles.firmaBloque}>
              <Text style={styles.firmaLabel}>{rol}</Text>
              <Text style={styles.firmaLabel}>Nombre: ___________________________</Text>
              <Text style={styles.firmaLabel}>Cargo: ____________________________</Text>
              <Text style={styles.firmaLabel}>Fecha: ____________________________</Text>
              <Text style={styles.firmaLabel}>Firma: ____________________________</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer} fixed>
          Documento generado automáticamente por el sistema el {new Date(datos.generadoAt).toLocaleString("es-CO")} por{" "}
          {datos.generadoPor} — Versión {datos.version} — Este documento constituye evidencia del proceso de
          selección de proveedores y puede ser utilizado en auditorías internas o externas.
        </Text>
      </Page>
    </Document>
  );
}

export async function generarInformePDF(datos: DatosInforme): Promise<Buffer> {
  const buffer = await renderToBuffer(<InformeSeleccionPDF datos={datos} />);
  return Buffer.from(buffer);
}
