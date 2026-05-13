"use client";

import { downloadFile } from "@/lib/utils";

const pageShell = (title: string, body: string, styles = "") => `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${title}</title>
      <style>
        @page { size: A4; margin: 12mm; }
        * { box-sizing: border-box; }
        body { margin: 0; color: #0f172a; font-family: Arial, Helvetica, sans-serif; background: #fff; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #cbd5e1; padding: 8px; font-size: 12px; text-align: left; }
        th { background: #f1f5f9; font-weight: 700; }
        .print-card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px; }
        .print-title { font-size: 22px; font-weight: 700; margin: 0 0 4px; }
        .print-muted { color: #64748b; font-size: 12px; }
        .print-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 16px; }
        .print-row { border-bottom: 1px solid #e2e8f0; padding: 6px 0; font-size: 13px; }
        .print-row strong { display: inline-block; min-width: 120px; }
        .signature { margin-top: 48px; display: flex; justify-content: space-between; gap: 40px; font-size: 12px; }
        .signature div { flex: 1; border-top: 1px solid #334155; padding-top: 6px; text-align: center; }
        ${styles}
      </style>
    </head>
    <body>${body}</body>
  </html>
`;

export const csvCell = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;

export function downloadCsv(filename: string, rows: unknown[][]) {
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  downloadFile(`\uFEFF${csv}`, filename, "text/csv;charset=utf-8");
}

export async function downloadElementPdf(target: HTMLElement | null, filename: string) {
  if (!target) return;
  const html2canvas = (await import("html2canvas")).default;
  const jsPDF = (await import("jspdf")).default;
  await document.fonts?.ready?.catch(() => undefined);

  const canvas = await html2canvas(target, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    allowTaint: true,
    scrollX: 0,
    scrollY: -window.scrollY,
  });

  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const imgData = canvas.toDataURL("image/png");

  let remainingHeight = imgHeight;
  let y = 0;
  pdf.addImage(imgData, "PNG", 0, y, imgWidth, imgHeight);
  remainingHeight -= pageHeight;

  while (remainingHeight > 0) {
    y = remainingHeight - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, y, imgWidth, imgHeight);
    remainingHeight -= pageHeight;
  }

  pdf.save(filename);
}

export function printElement(target: HTMLElement | null, title = "Print") {
  if (!target) return;
  const styleTags = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((node) => node.outerHTML)
    .join("");
  const popup = window.open("", "_blank", "width=1200,height=900");
  if (!popup) return;
  popup.document.open();
  popup.document.write(pageShell(title, `${styleTags}<main style="padding:20px">${target.outerHTML}</main>`));
  popup.document.close();
  popup.focus();
  setTimeout(() => {
    popup.print();
    popup.close();
  }, 300);
}

export function printHtml(title: string, bodyHtml: string, styles = "") {
  const popup = window.open("", "_blank", "width=900,height=900");
  if (!popup) return;
  popup.document.open();
  popup.document.write(pageShell(title, bodyHtml, styles));
  popup.document.close();
  popup.focus();
  setTimeout(() => {
    popup.print();
    popup.close();
  }, 300);
}
