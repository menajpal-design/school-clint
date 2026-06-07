"use client";

import { useEffect } from "react";

export function PdfPrintSafetyStyles() {
  useEffect(() => {
    if (document.getElementById("pdf-print-safety-styles")) return;
    const style = document.createElement("style");
    style.id = "pdf-print-safety-styles";
    style.textContent = `
      @media print {
        @page { size: A4; margin: 10mm; }
        html, body { width: auto !important; max-width: none !important; overflow: visible !important; background: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        main, section, article, div, table { max-width: 100% !important; box-sizing: border-box !important; }
        .mobile-app-layout, .mobile-content-shell, .mobile-main-content, main, main > div, .page-shell, [class*="min-h-screen"] { overflow: visible !important; max-width: none !important; }
        .mobile-table-scroll, [class*="overflow-x"], [class*="overflow-auto"], [class*="overflow-hidden"] { overflow: visible !important; }
        table { width: 100% !important; border-collapse: collapse !important; table-layout: auto !important; page-break-inside: auto !important; }
        thead { display: table-header-group !important; }
        tr { page-break-inside: avoid !important; break-inside: avoid !important; }
        th, td { white-space: normal !important; word-break: break-word !important; overflow-wrap: anywhere !important; font-size: 10px !important; padding: 5px !important; }
        .download-buttons-portal, nav, aside, header[data-app-nav], button, .no-print { display: none !important; }
        .print-card, .professional-receipt, .routine-print, .result-print, .pdf-safe-page { width: 100% !important; max-width: 100% !important; overflow: visible !important; break-inside: auto !important; }
      }
    `;
    document.head.appendChild(style);
  }, []);
  return null;
}
