import PDFDocument from "pdfkit";

export const createPDFReport = (res, filename, title, headers, rows) => {
  const doc = new PDFDocument({ margin: 40, size: "A4" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}.pdf"`);
  doc.pipe(res);

  // Title
  doc.fontSize(18).font("Helvetica-Bold").text(title, { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(10).font("Helvetica").text(`Generated: ${new Date().toLocaleString()}`, { align: "center" });
  doc.moveDown(1);

  // Table header
  const colWidth = (doc.page.width - 80) / headers.length;
  const startX = 40;
  let y = doc.y;

  doc.fontSize(9).font("Helvetica-Bold");
  headers.forEach((h, i) => {
    doc.text(h, startX + i * colWidth, y, { width: colWidth, align: "left" });
  });

  doc.moveDown(0.3);
  doc.moveTo(startX, doc.y).lineTo(doc.page.width - 40, doc.y).stroke();
  doc.moveDown(0.3);

  // Table rows
  doc.font("Helvetica").fontSize(8);
  rows.forEach((row) => {
    y = doc.y;
    if (y > doc.page.height - 80) {
      doc.addPage();
      y = doc.y;
    }
    row.forEach((cell, i) => {
      doc.text(String(cell ?? ""), startX + i * colWidth, y, { width: colWidth, align: "left" });
    });
    doc.moveDown(0.4);
  });

  doc.end();
};