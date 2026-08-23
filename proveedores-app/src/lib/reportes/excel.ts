import ExcelJS from "exceljs";
import { DatosInforme } from "./tipos";

const AZUL = "1E3A5F";
const AMARILLO = "FFF6D9";
const VERDE = "EAF6EC";

export async function generarInformeExcel(datos: DatosInforme): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = datos.generadoPor;
  wb.created = new Date(datos.generadoAt);

  // ---- Hoja 1: Información general ----
  const hojaInfo = wb.addWorksheet("Información general");
  hojaInfo.columns = [{ width: 32 }, { width: 70 }];
  hojaInfo.addRow([datos.empresa.nombre]).font = { bold: true, size: 14, color: { argb: "FF" + AZUL } };
  hojaInfo.addRow(["Evaluación y Selección de Proveedores"]).font = { bold: true, size: 12 };
  hojaInfo.addRow([]);
  const filasInfo: [string, string][] = [
    ["Código del proceso", datos.proceso.codigo],
    ["Fecha", datos.proceso.fecha],
    ["Área solicitante", datos.proceso.areaSolicitante],
    ["Responsable", `${datos.proceso.responsableNombre} - ${datos.proceso.responsableCargo}`],
    ["Tipo de proveedor", datos.proceso.tipoProveedor],
    ["Categoría", datos.proceso.categoria],
    ["Descripción de la necesidad", datos.proceso.descripcionNecesidad],
    ["Observaciones generales", datos.proceso.observacionesGenerales || "-"],
    ["Estado del proceso", datos.proceso.estado],
    ["Proveedor con mayor puntuación", datos.proceso.proveedorMayorPuntajeNombre || "-"],
    ["Proveedor seleccionado finalmente", datos.proceso.proveedorSeleccionadoNombre || "-"],
    ["Justificación de la selección", datos.proceso.justificacionSeleccion || "-"],
    ["Motivo (si no es el de mayor puntaje)", datos.proceso.motivoSiNoMayorPuntaje || "-"],
    ["Generado por", datos.generadoPor],
    ["Fecha de generación", new Date(datos.generadoAt).toLocaleString("es-CO")],
    ["Versión del informe", String(datos.version)],
  ];
  filasInfo.forEach(([label, valor]) => {
    const row = hojaInfo.addRow([label, valor]);
    row.getCell(1).font = { bold: true };
    row.getCell(2).alignment = { wrapText: true, vertical: "top" };
  });

  // ---- Hoja 2: Proveedores ----
  const hojaProv = wb.addWorksheet("Proveedores");
  hojaProv.columns = [
    { header: "Razón social", key: "razonSocial", width: 28 },
    { header: "NIT", key: "nit", width: 16 },
    { header: "Nombre comercial", key: "nombreComercial", width: 22 },
    { header: "Contacto", key: "contacto", width: 22 },
    { header: "Teléfono", key: "telefono", width: 16 },
    { header: "Correo", key: "correo", width: 24 },
    { header: "Ciudad", key: "ciudad", width: 16 },
    { header: "Producto / servicio", key: "producto", width: 30 },
    { header: "Valor cotización", key: "valor", width: 18 },
    { header: "Moneda", key: "moneda", width: 10 },
  ];
  estilizarEncabezado(hojaProv.getRow(1));
  datos.proveedores.forEach((p) => {
    hojaProv.addRow({
      razonSocial: p.razonSocial,
      nit: p.nit,
      nombreComercial: p.nombreComercial || "-",
      contacto: p.nombreContacto || "-",
      telefono: p.telefono || "-",
      correo: p.correo || "-",
      ciudad: p.ciudad || "-",
      producto: p.productoServicio,
      valor: p.valorCotizacion ?? "-",
      moneda: p.moneda || "-",
    });
  });

  // ---- Hoja 3: Matriz de evaluación ----
  const hojaMatriz = wb.addWorksheet("Matriz de evaluación");
  const colsMatriz = [
    { header: "Proveedor", key: "proveedor", width: 26 },
    { header: "Criterio", key: "criterio", width: 24 },
    { header: "Peso (%)", key: "peso", width: 12 },
    { header: "Calificación", key: "valor", width: 14 },
    { header: "Resultado ponderado (%)", key: "resultado", width: 22 },
    { header: "Observación", key: "observacion", width: 45 },
  ];
  hojaMatriz.columns = colsMatriz;
  estilizarEncabezado(hojaMatriz.getRow(1));
  datos.proveedores.forEach((p) => {
    p.calificaciones.forEach((c) => {
      const crit = datos.criterios.find((cr) => cr.id === c.criterioId);
      hojaMatriz.addRow({
        proveedor: p.razonSocial,
        criterio: crit?.nombre,
        peso: crit?.peso,
        valor: c.valor ?? "Sin calificar",
        // Fórmula visible en Excel: valor/5*peso, para que el usuario pueda auditar el cálculo
        resultado: c.resultadoPonderado ?? "-",
        observacion: c.observacion || "",
      });
    });
    hojaMatriz.addRow({
      proveedor: `${p.razonSocial} — TOTAL`,
      criterio: "",
      peso: "",
      valor: "",
      resultado: p.puntajeTotalPonderado,
      observacion: `${p.puntajeSobreCinco.toFixed(2)} / 5`,
    }).font = { bold: true };
  });

  // ---- Hoja 4: Comparativo ----
  const hojaComp = wb.addWorksheet("Comparativo");
  hojaComp.columns = [
    { header: "Posición", key: "posicion", width: 10 },
    { header: "Proveedor", key: "proveedor", width: 30 },
    { header: "Puntaje / 5", key: "puntaje5", width: 14 },
    { header: "Resultado (%)", key: "resultado", width: 16 },
  ];
  estilizarEncabezado(hojaComp.getRow(1));
  [...datos.proveedores]
    .sort((a, b) => a.posicion - b.posicion)
    .forEach((p) => {
      const row = hojaComp.addRow({
        posicion: p.posicion,
        proveedor: p.razonSocial,
        puntaje5: Number(p.puntajeSobreCinco.toFixed(2)),
        resultado: p.puntajeTotalPonderado,
      });
      if (p.posicion === 1) {
        row.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + AMARILLO } };
          cell.font = { bold: true };
        });
      }
    });
  hojaComp.addRow([]);
  const filaResultado = hojaComp.addRow([
    "",
    "Proveedor con mayor puntuación en el proceso de selección:",
    datos.proceso.proveedorMayorPuntajeNombre || "-",
  ]);
  filaResultado.font = { bold: true };
  filaResultado.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + VERDE } };
  });

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

function estilizarEncabezado(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + AZUL } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  });
}
