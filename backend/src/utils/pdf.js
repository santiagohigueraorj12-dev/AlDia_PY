// Ayudas para generar PDF con pdfkit (hoja de vida RF-12 y reportes RF-25).
const PDFDocument = require('pdfkit');
const { formatoColombia, hoy } = require('./fechas');

const AZUL = '#1F4E79';
const GRIS = '#555555';

/** Crea el documento y lo envía directamente como respuesta HTTP (descarga). */
function crearPdf(res, nombreArchivo) {
  const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
  doc.pipe(res);
  return doc;
}

function encabezado(doc, titulo, subtitulo) {
  doc.fillColor(AZUL).fontSize(22).font('Helvetica-Bold').text('AlDía', { continued: false });
  doc.fillColor('black').fontSize(16).text(titulo);
  if (subtitulo) doc.fillColor(GRIS).fontSize(10).font('Helvetica').text(subtitulo);
  doc.fillColor(GRIS).fontSize(9).font('Helvetica').text(`Generado el ${formatoColombia(hoy())}`);
  doc.moveDown();
}

function seccion(doc, titulo) {
  if (doc.y > 680) doc.addPage();
  doc.moveDown(0.5).fillColor(AZUL).fontSize(13).font('Helvetica-Bold').text(titulo, 50);
  doc.moveDown(0.3).fillColor('black').font('Helvetica').fontSize(10);
}

/** Pares "etiqueta: valor" en una línea cada uno. */
function datos(doc, pares) {
  for (const [etiqueta, valor] of pares) {
    doc.font('Helvetica-Bold').text(`${etiqueta}: `, 50, doc.y, { continued: true })
      .font('Helvetica').text(String(valor ?? '—'));
  }
}

/**
 * Dibuja una tabla sencilla con salto de página automático.
 * @param {{ titulo: string, ancho: number, alinear?: 'left'|'right' }[]} columnas
 * @param {string[][]} filas
 */
function tabla(doc, columnas, filas) {
  const x0 = 50;
  const dibujarFila = (celdas, negrita, fondo) => {
    const alto = Math.max(...celdas.map((c, i) => doc.heightOfString(String(c), { width: columnas[i].ancho - 8 }))) + 8;
    if (doc.y + alto > 740) doc.addPage();
    const y = doc.y;
    if (fondo) doc.rect(x0, y, columnas.reduce((s, c) => s + c.ancho, 0), alto).fill(fondo);
    let x = x0;
    doc.fillColor(negrita ? 'white' : 'black').font(negrita ? 'Helvetica-Bold' : 'Helvetica').fontSize(9);
    celdas.forEach((celda, i) => {
      doc.text(String(celda), x + 4, y + 4, { width: columnas[i].ancho - 8, align: columnas[i].alinear || 'left' });
      x += columnas[i].ancho;
    });
    doc.y = y + alto;
  };

  dibujarFila(columnas.map((c) => c.titulo), true, AZUL);
  if (filas.length === 0) {
    doc.fillColor(GRIS).font('Helvetica-Oblique').text('Sin registros', x0 + 4, doc.y + 4);
    doc.moveDown();
  }
  filas.forEach((f, i) => dibujarFila(f, false, i % 2 ? '#F2F6FA' : null));
  doc.x = x0;
  doc.moveDown(0.5);
}

/** $1.234.567 (pesos colombianos, RNF-09). */
function pesos(valor) {
  if (valor === null || valor === undefined) return '—';
  return `$${Math.round(Number(valor)).toLocaleString('es-CO')}`;
}

module.exports = { crearPdf, encabezado, seccion, datos, tabla, pesos };
