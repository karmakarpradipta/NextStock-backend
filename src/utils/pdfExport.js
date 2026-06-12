import PDFDocument from "pdfkit";

export const createPDFReport = (res, filename, title, headers, rows) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4", bufferPages: true });

    // headers MUST be set before pipe
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}.pdf"`);
    res.setHeader("Transfer-Encoding", "chunked");

    // pipe to response
    doc.pipe(res);

    // handle errors
    doc.on("error", (err) => {
      reject(err);
    });

    res.on("finish", () => {
      resolve();
    });

    // Title
    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .text(title, { align: "center" });

    doc.moveDown(0.5);

    doc
      .fontSize(10)
      .font("Helvetica")
      .text(`Generated: ${new Date().toLocaleString()}`, { align: "center" });

    doc.moveDown(1);

    // Table setup
    const colWidth = (doc.page.width - 80) / headers.length;
    const startX = 40;

    // Table header row
    doc.fontSize(9).font("Helvetica-Bold");
    let y = doc.y;

    headers.forEach((h, i) => {
      doc.text(String(h), startX + i * colWidth, y, {
        width: colWidth,
        align: "left",
      });
    });

    // header underline
    const lineY = doc.y + 4;
    doc
      .moveTo(startX, lineY)
      .lineTo(doc.page.width - 40, lineY)
      .stroke();

    doc.moveDown(0.6);

    // Table rows
    doc.font("Helvetica").fontSize(8);

    rows.forEach((row) => {
      // new page if near bottom
      if (doc.y > doc.page.height - 80) {
        doc.addPage();
      }

      y = doc.y;

      row.forEach((cell, i) => {
        doc.text(String(cell ?? ""), startX + i * colWidth, y, {
          width: colWidth,
          align: "left",
        });
      });

      doc.moveDown(0.4);
    });

    // properly end the document
    doc.end();
  });
};