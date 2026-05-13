"use client";

import { downloadFile } from "@/lib/utils";
import { authManager } from "@/lib/auth";

export function getPrintInstitution() {
  const institution = authManager.getUser()?.institution as any;
  return {
    name: institution?.name || "EASY SCHOOL",
    address: institution?.address || "",
    phone: institution?.phone || "",
    email: institution?.email || "",
    logo: institution?.logo || "",
  };
}

const institutionHeader = () => {
  const institution = getPrintInstitution();
  return `
    <header class="institution-header">
      <div class="institution-logo">${institution.logo ? `<img src="${institution.logo}" alt="Institution logo" />` : "Logo"}</div>
      <div class="institution-info">
        <h1>${institution.name}</h1>
        ${institution.address ? `<p>${institution.address}</p>` : ""}
        ${(institution.phone || institution.email) ? `<p>${[institution.phone, institution.email].filter(Boolean).join(" | ")}</p>` : ""}
      </div>
    </header>
  `;
};

const qrPayload = (title: string, extra?: string) => {
  const timestamp = new Date().toISOString();
  const location = typeof window !== "undefined" ? window.location.href : "";
  const institution = getPrintInstitution();
  return JSON.stringify({ title, institution: institution.name, address: institution.address, location, timestamp, extra });
};

export async function makeQrDataUrl(value: string, width = 128) {
  const QRCode = await import("qrcode");
  return QRCode.toDataURL(value, {
    width,
    margin: 1,
    errorCorrectionLevel: "M",
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
  });
}

const qrBlock = (qrDataUrl?: string, label = "Scan to verify") => qrDataUrl ? `
  <div class="print-qr">
    <img src="${qrDataUrl}" alt="Verification QR" />
    <span>${label}</span>
  </div>
` : "";

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
        .institution-header { display: flex; align-items: center; gap: 14px; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
        .institution-logo { width: 58px; height: 58px; border: 1px solid #cbd5e1; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #64748b; font-size: 11px; font-weight: 700; overflow: hidden; }
        .institution-logo img { width: 100%; height: 100%; object-fit: contain; padding: 4px; }
        .institution-info h1 { margin: 0; font-size: 22px; line-height: 1.15; color: #0f172a; }
        .institution-info p { margin: 3px 0 0; font-size: 12px; color: #475569; }
        .print-card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px; }
        .print-title { font-size: 22px; font-weight: 700; margin: 0 0 4px; }
        .print-muted { color: #64748b; font-size: 12px; }
        .print-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 16px; }
        .print-row { border-bottom: 1px solid #e2e8f0; padding: 6px 0; font-size: 13px; }
        .print-row strong { display: inline-block; min-width: 120px; }
        .signature { margin-top: 48px; display: flex; justify-content: space-between; gap: 40px; font-size: 12px; }
        .signature div { flex: 1; border-top: 1px solid #334155; padding-top: 6px; text-align: center; }
        .print-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 14px; }
        .print-qr { display: inline-flex; flex-direction: column; align-items: center; gap: 4px; color: #475569; font-size: 10px; font-weight: 700; text-transform: uppercase; }
        .print-qr img { width: 82px; height: 82px; border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px; background: #fff; }
        .print-footer { margin-top: 16px; display: flex; justify-content: flex-end; }
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
  const qrDataUrl = await makeQrDataUrl(qrPayload(filename), 128);
  const captureTarget = document.createElement("div");
  captureTarget.style.position = "fixed";
  captureTarget.style.left = "-10000px";
  captureTarget.style.top = "0";
  captureTarget.style.width = `${target.scrollWidth || target.offsetWidth || 900}px`;
  captureTarget.style.background = "#ffffff";
  captureTarget.style.padding = "16px";
  
  const header = document.createElement("div");
  header.innerHTML = institutionHeader();
  captureTarget.appendChild(header);
  
  // Clone and inline computed styles to fix color rendering
  const clonedTarget = target.cloneNode(true) as HTMLElement;
  const walk = (el: HTMLElement, original: Element) => {
    const computed = window.getComputedStyle(original);
    el.style.color = computed.color;
    el.style.backgroundColor = computed.backgroundColor;
    el.style.borderColor = computed.borderColor;
    el.style.borderWidth = computed.borderWidth;
    el.style.borderStyle = computed.borderStyle;
    el.style.borderRadius = computed.borderRadius;
    el.style.padding = computed.padding;
    el.style.margin = computed.margin;
    el.style.fontSize = computed.fontSize;
    el.style.fontWeight = computed.fontWeight;
    
    const childEls = Array.from(el.children) as HTMLElement[];
    const origChildEls = Array.from(original.children) as Element[];
    childEls.forEach((child, idx) => {
      if (origChildEls[idx]) walk(child, origChildEls[idx]);
    });
  };
  
  walk(clonedTarget, target);
  captureTarget.appendChild(clonedTarget);
  
  const qrFooter = document.createElement("div");
  qrFooter.style.display = "flex";
  qrFooter.style.justifyContent = "flex-end";
  qrFooter.style.marginTop = "16px";
  qrFooter.innerHTML = qrBlock(qrDataUrl);
  captureTarget.appendChild(qrFooter);
  document.body.appendChild(captureTarget);

  const canvas = await html2canvas(captureTarget, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    allowTaint: true,
    scrollX: 0,
    scrollY: 0,
  });
  document.body.removeChild(captureTarget);

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

export async function printElement(target: HTMLElement | null, title = "Print") {
  if (!target) return;
  const qrDataUrl = await makeQrDataUrl(qrPayload(title), 128);
  
  // Clone and inline computed styles for print consistency
  const cloned = target.cloneNode(true) as HTMLElement;
  const walk = (el: HTMLElement, original: Element) => {
    const computed = window.getComputedStyle(original);
    el.style.color = computed.color;
    el.style.backgroundColor = computed.backgroundColor;
    el.style.borderColor = computed.borderColor;
    el.style.borderWidth = computed.borderWidth;
    el.style.borderStyle = computed.borderStyle;
    el.style.borderRadius = computed.borderRadius;
    el.style.padding = computed.padding;
    el.style.margin = computed.margin;
    el.style.fontSize = computed.fontSize;
    el.style.fontWeight = computed.fontWeight;
    el.style.textAlign = computed.textAlign;
    el.style.display = computed.display;
    
    const childEls = Array.from(el.children) as HTMLElement[];
    const origChildEls = Array.from(original.children) as Element[];
    childEls.forEach((child, idx) => {
      if (origChildEls[idx]) walk(child, origChildEls[idx]);
    });
  };
  walk(cloned, target);
  
  const styleTags = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((node) => node.outerHTML)
    .join("");
  
  const popup = window.open("", "_blank", "width=1200,height=900");
  if (!popup) return;
  popup.document.open();
  popup.document.write(pageShell(title, `${styleTags}<main style="padding:20px">${institutionHeader()}${cloned.outerHTML}<div class="print-footer">${qrBlock(qrDataUrl)}</div></main>`));
  popup.document.close();
  popup.focus();
  setTimeout(() => {
    popup.print();
    popup.close();
  }, 300);
}

export async function printHtml(title: string, bodyHtml: string, styles = "", qrValue?: string) {
  const qrDataUrl = await makeQrDataUrl(qrValue || qrPayload(title), 128);
  const popup = window.open("", "_blank", "width=900,height=900");
  if (!popup) return;
  const bodyWithQr = bodyHtml
    .replace('<main class="print-card">', `<main class="print-card">${institutionHeader()}<div class="print-heading"><div>`)
    .replace('<div class="print-grid"', `</div>${qrBlock(qrDataUrl)}</div><div class="print-grid"`);
  popup.document.open();
  popup.document.write(pageShell(title, bodyWithQr, styles));
  popup.document.close();
  popup.focus();
  setTimeout(() => {
    popup.print();
    popup.close();
  }, 300);
}
