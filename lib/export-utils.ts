"use client";

import { downloadFile } from "@/lib/utils";
import { authManager } from "@/lib/auth";

const isMobileBrowser = () => typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
const safeFilename = (value: string) => String(value || "print").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "print";

export function getPrintInstitution() {
  const userInstitution = (authManager.getUser() as any)?.institution;
  let storedInstitution: any = null;
  if (typeof window !== "undefined") {
    try { storedInstitution = JSON.parse(localStorage.getItem("printInstitution") || localStorage.getItem("institution") || "null"); } catch { storedInstitution = null; }
  }
  const institution = storedInstitution?.name ? storedInstitution : userInstitution;
  return { name: institution?.name || "EASY SCHOOL", address: institution?.address || "", phone: institution?.phone || "", email: institution?.email || "", logo: institution?.logo || "" };
}

const institutionHeader = () => {
  const institution = getPrintInstitution();
  return `<header class="institution-header"><div class="institution-logo">${institution.logo ? `<img src="${institution.logo}" alt="Institution logo" />` : "Logo"}</div><div class="institution-info"><h1>${institution.name}</h1>${institution.address ? `<p>${institution.address}</p>` : ""}${(institution.phone || institution.email) ? `<p>${[institution.phone, institution.email].filter(Boolean).join(" | ")}</p>` : ""}</div></header>`;
};
const qrPayload = (title: string, extra?: string) => JSON.stringify({ title, institution: getPrintInstitution().name, address: getPrintInstitution().address, location: typeof window !== "undefined" ? window.location.href : "", timestamp: new Date().toISOString(), extra });
export async function makeQrDataUrl(value: string, width = 128) { const QRCode = await import("qrcode"); return QRCode.toDataURL(value, { width, margin: 1, errorCorrectionLevel: "M", color: { dark: "#0f172a", light: "#ffffff" } }); }
const qrBlock = (qrDataUrl?: string, label = "Scan to verify") => qrDataUrl ? `<div class="print-qr"><img src="${qrDataUrl}" alt="Verification QR" /><span>${label}</span></div>` : "";

const copyComputedStyles = (clone: HTMLElement, source: Element) => {
  const computed = window.getComputedStyle(source);
  for (let i = 0; i < computed.length; i += 1) { const p = computed.item(i); clone.style.setProperty(p, computed.getPropertyValue(p), computed.getPropertyPriority(p)); }
  const cloneChildren = Array.from(clone.children) as HTMLElement[];
  const sourceChildren = Array.from(source.children) as Element[];
  cloneChildren.forEach((child, i) => { if (sourceChildren[i]) copyComputedStyles(child, sourceChildren[i]); });
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
      const dataUrl: string = await new Promise((resolve, reject) => { reader.onloadend = () => resolve(String(reader.result || "")); reader.onerror = reject; reader.readAsDataURL(blob); });
      img.setAttribute("src", dataUrl);
    } catch {}
  }));
};

const pageShell = (title: string, body: string, styles = "") => `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${title}</title><style>@page{size:A4;margin:12mm}*{box-sizing:border-box}html,body{margin:0;color:#0f172a;font-family:Arial,Helvetica,sans-serif;background:#fff}table{width:100%;border-collapse:collapse}th,td{border:1px solid #cbd5e1;padding:8px;font-size:12px;text-align:left}th{background:#f1f5f9;font-weight:700}.institution-header{display:flex;align-items:center;gap:14px;border-bottom:2px solid #0f172a;padding-bottom:12px;margin-bottom:16px}.institution-logo{width:58px;height:58px;border:1px solid #cbd5e1;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#64748b;font-size:11px;font-weight:700;overflow:hidden}.institution-logo img{width:100%;height:100%;object-fit:contain;padding:4px}.institution-info h1{margin:0;font-size:22px;line-height:1.15;color:#0f172a}.institution-info p{margin:3px 0 0;font-size:12px;color:#475569}.print-card{border:1px solid #cbd5e1;border-radius:8px;padding:20px;background:#fff}.print-title{font-size:22px;font-weight:700;margin:0 0 4px}.print-muted{color:#64748b;font-size:12px}.print-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:16px}.print-row{border-bottom:1px solid #e2e8f0;padding:6px 0;font-size:13px}.print-row strong{display:inline-block;min-width:120px}.signature{margin-top:48px;display:flex;justify-content:space-between;gap:40px;font-size:12px}.signature div{flex:1;border-top:1px solid #334155;padding-top:6px;text-align:center}.print-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:14px}.print-qr{display:inline-flex;flex-direction:column;align-items:center;gap:4px;color:#475569;font-size:10px;font-weight:700;text-transform:uppercase}.print-qr img{width:82px;height:82px;border:1px solid #cbd5e1;border-radius:6px;padding:4px;background:#fff}${styles}</style></head><body>${body}</body></html>`;

export const csvCell = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
export function downloadCsv(filename: string, rows: unknown[][]) { downloadFile(`\uFEFF${rows.map((r) => r.map(csvCell).join(",")).join("\r\n")}`, filename, "text/csv;charset=utf-8"); }

export async function downloadHtmlAsPdf(title: string, bodyHtml: string, styles = "", filename?: string) {
  const html2canvas = (await import("html2canvas")).default;
  const jsPDF = (await import("jspdf")).default;
  const wrapper = document.createElement("div");
  wrapper.style.position = "fixed"; wrapper.style.left = "0"; wrapper.style.top = "0"; wrapper.style.width = "794px"; wrapper.style.minHeight = "1123px"; wrapper.style.background = "#ffffff"; wrapper.style.padding = "45px"; wrapper.style.zIndex = "2147483647"; wrapper.style.pointerEvents = "none"; wrapper.style.visibility = "visible";
  wrapper.innerHTML = pageShell(title, bodyHtml, styles).replace(/^[\s\S]*<body>/i, "").replace(/<\/body>[\s\S]*$/i, "");
  document.body.appendChild(wrapper);
  try {
    await document.fonts?.ready?.catch(() => undefined); await inlineImages(wrapper); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const canvas = await html2canvas(wrapper, { scale: 1.5, backgroundColor: "#ffffff", useCORS: true, allowTaint: true, scrollX: 0, scrollY: 0, x: 0, y: 0, width: 794, windowWidth: 794 });
    const pdf = new jsPDF("p", "mm", "a4");
    const pw = pdf.internal.pageSize.getWidth(), ph = pdf.internal.pageSize.getHeight();
    const iw = pw, ih = (canvas.height * iw) / canvas.width, data = canvas.toDataURL("image/png", 1.0);
    let left = ih, pos = 0; pdf.addImage(data, "PNG", 0, pos, iw, ih); left -= ph;
    while (left > 0) { pos = left - ih; pdf.addPage(); pdf.addImage(data, "PNG", 0, pos, iw, ih); left -= ph; }
    pdf.save(filename || `${safeFilename(title)}.pdf`);
  } finally { document.body.removeChild(wrapper); }
}

export async function downloadElementPdf(target: HTMLElement | null, filename: string) {
  if (!target) return;
  const html2canvas = (await import("html2canvas")).default;
  const jsPDF = (await import("jspdf")).default;
  await document.fonts?.ready?.catch(() => undefined);
  const rect = target.getBoundingClientRect();
  const fullWidth = Math.ceil(Math.max(target.scrollWidth, target.offsetWidth, rect.width, 1050));
  const fullHeight = Math.ceil(Math.max(target.scrollHeight, target.offsetHeight, rect.height, 600));
  const landscape = fullWidth >= 900 || fullWidth > fullHeight * 0.72;
  const wrapper = document.createElement("div");
  wrapper.style.position = "fixed"; wrapper.style.left = "0"; wrapper.style.top = "0"; wrapper.style.width = `${fullWidth}px`; wrapper.style.minWidth = `${fullWidth}px`; wrapper.style.minHeight = `${fullHeight}px`; wrapper.style.background = "#ffffff"; wrapper.style.padding = "0"; wrapper.style.margin = "0"; wrapper.style.overflow = "visible"; wrapper.style.pointerEvents = "none"; wrapper.style.zIndex = "2147483647"; wrapper.style.visibility = "visible";
  const clonedTarget = target.cloneNode(true) as HTMLElement;
  copyComputedStyles(clonedTarget, target);
  const forceFullCapture = (el: Element) => {
    if (el instanceof HTMLElement) {
      el.style.zoom = "1"; el.style.transform = "none"; el.style.maxWidth = "none"; el.style.overflow = "visible"; el.style.boxSizing = "border-box"; el.style.opacity = "1"; el.style.visibility = "visible";
      if (el === clonedTarget) { el.style.width = `${fullWidth}px`; el.style.minWidth = `${fullWidth}px`; el.style.marginLeft = "0"; el.style.marginRight = "0"; }
    }
    Array.from(el.children).forEach(forceFullCapture);
  };
  forceFullCapture(clonedTarget);
  wrapper.appendChild(clonedTarget);
  document.body.appendChild(wrapper);
  try {
    await inlineImages(wrapper); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const captureHeight = Math.ceil(Math.max(wrapper.scrollHeight, clonedTarget.scrollHeight, fullHeight));
    const canvas = await html2canvas(wrapper, { scale: 2, backgroundColor: "#ffffff", useCORS: true, allowTaint: true, foreignObjectRendering: false, scrollX: 0, scrollY: 0, x: 0, y: 0, width: fullWidth, height: captureHeight, windowWidth: fullWidth, windowHeight: captureHeight });
    const pdf = new jsPDF(landscape ? "l" : "p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth(), pageHeight = pdf.internal.pageSize.getHeight();
    const marginX = 3, marginY = 3, maxWidth = pageWidth - marginX * 2, maxHeight = pageHeight - marginY * 2;
    const imgWidth = maxWidth, imgHeight = (canvas.height * imgWidth) / canvas.width, data = canvas.toDataURL("image/png", 1.0);
    let left = imgHeight, y = marginY; pdf.addImage(data, "PNG", marginX, y, imgWidth, imgHeight, undefined, "FAST"); left -= maxHeight;
    while (left > 1) { y = marginY - (imgHeight - left); pdf.addPage(); pdf.addImage(data, "PNG", marginX, y, imgWidth, imgHeight, undefined, "FAST"); left -= maxHeight; }
    pdf.save(filename);
  } finally { document.body.removeChild(wrapper); }
}

export async function printElement(target: HTMLElement | null, title = "Print") {
  if (!target) return;
  if (isMobileBrowser()) { await downloadElementPdf(target, `${safeFilename(title)}.pdf`); return; }
  await document.fonts?.ready?.catch(() => undefined);
  const cloned = target.cloneNode(true) as HTMLElement; copyComputedStyles(cloned, target); await inlineImages(cloned);
  const styleTags = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]')).map((n) => n.outerHTML).join("");
  const popup = window.open("", "_blank", "width=1200,height=900");
  if (!popup) { await downloadElementPdf(target, `${safeFilename(title)}.pdf`); return; }
  popup.document.open(); popup.document.write(pageShell(title, `${styleTags}<main style="padding:20px;background:#fff;">${cloned.outerHTML}</main>`)); popup.document.close(); popup.focus(); setTimeout(() => { try { popup.print(); } catch {} }, 500);
}

export async function printHtml(title: string, bodyHtml: string, styles = "", qrValue?: string) {
  const qrDataUrl = await makeQrDataUrl(qrValue || qrPayload(title), 128);
  const bodyWithQr = bodyHtml.replace('<main class="print-card">', `<main class="print-card">${institutionHeader()}<div class="print-heading"><div>`).replace('<div class="print-grid"', `</div>${qrBlock(qrDataUrl)}</div><div class="print-grid"`);
  if (isMobileBrowser()) { await downloadHtmlAsPdf(title, bodyWithQr, styles, `${safeFilename(title)}.pdf`); return; }
  const popup = window.open("", "_blank", "width=900,height=900");
  if (!popup) { await downloadHtmlAsPdf(title, bodyWithQr, styles, `${safeFilename(title)}.pdf`); return; }
  popup.document.open(); popup.document.write(pageShell(title, bodyWithQr, styles)); popup.document.close(); popup.focus(); setTimeout(() => { try { popup.print(); } catch {} }, 500);
}
