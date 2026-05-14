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

const copyComputedStyles = (clone: HTMLElement, source: Element) => {
  const computed = window.getComputedStyle(source);
  for (let index = 0; index < computed.length; index += 1) {
    const property = computed.item(index);
    clone.style.setProperty(property, computed.getPropertyValue(property), computed.getPropertyPriority(property));
  }

  const cloneChildren = Array.from(clone.children) as HTMLElement[];
  const sourceChildren = Array.from(source.children) as Element[];
  cloneChildren.forEach((child, index) => {
    if (sourceChildren[index]) copyComputedStyles(child, sourceChildren[index]);
  });
};

const inlineImages = async (root: HTMLElement) => {
  const imgs = Array.from(root.querySelectorAll("img")) as HTMLImageElement[];
  await Promise.all(imgs.map(async (img) => {
    try {
      const src = img.getAttribute("src") || "";
      if (!src || src.startsWith("data:") || src.startsWith("blob:")) return;
      const res = await fetch(src);
      if (!res.ok) return;
      const blob = await res.blob();
      const reader = new FileReader();
      const dataUrl: string = await new Promise((resolve, reject) => {
        reader.onloadend = () => resolve(String(reader.result || ""));
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      img.setAttribute("src", dataUrl);
    } catch (e) {
      // Keep the original image source when it cannot be converted.
    }
  }));
};

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
  const captureTarget = document.createElement("div");
  captureTarget.style.position = "fixed";
  captureTarget.style.left = "-10000px";
  captureTarget.style.top = "0";
  
  // Detect card type and use exact fixed dimensions
  const isAdmitCard = target.classList.contains('admit-card');
  const captureWidth = isAdmitCard ? 850 : 800;
  const captureHeight = isAdmitCard ? 600 : 500;
  
  captureTarget.style.width = `${captureWidth}px`;
  captureTarget.style.height = `${captureHeight}px`;
  captureTarget.style.background = "#ffffff";
  captureTarget.style.padding = "0";
  captureTarget.style.overflow = "hidden";
  
  const clonedTarget = target.cloneNode(true) as HTMLElement;
  copyComputedStyles(clonedTarget, target);
  await inlineImages(clonedTarget);
  captureTarget.appendChild(clonedTarget);
  document.body.appendChild(captureTarget);

  const canvas = await html2canvas(captureTarget, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    allowTaint: true,
    foreignObjectRendering: false,
    scrollX: 0,
    scrollY: 0,
    windowWidth: captureWidth,
    windowHeight: captureHeight,
  });
  document.body.removeChild(captureTarget);

  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const marginX = 6;
  const marginY = 6;
  const imgWidth = pageWidth - marginX * 2;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const imgData = canvas.toDataURL("image/png");

  let remainingHeight = imgHeight;
  let y = marginY;
  pdf.addImage(imgData, "PNG", marginX, y, imgWidth, imgHeight);
  remainingHeight -= pageHeight - marginY * 2;

  while (remainingHeight > 0) {
    y = marginY - (imgHeight - remainingHeight);
    pdf.addPage();
    pdf.addImage(imgData, "PNG", marginX, y, imgWidth, imgHeight);
    remainingHeight -= pageHeight - marginY * 2;
  }

  pdf.save(filename);
}

export async function printElement(target: HTMLElement | null, title = "Print") {
  if (!target) return;
  await document.fonts?.ready?.catch(() => undefined);
  const cloned = target.cloneNode(true) as HTMLElement;
  copyComputedStyles(cloned, target);
  await inlineImages(cloned);
  
  const styleTags = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((node) => node.outerHTML)
    .join("");
  
  const popup = window.open("", "_blank", "width=1200,height=900");
  if (!popup) return;
  popup.document.open();
  popup.document.write(pageShell(title, `${styleTags}<main style="padding:20px">${cloned.outerHTML}</main>`));
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
