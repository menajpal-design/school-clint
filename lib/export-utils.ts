"use client";

import { downloadFile } from "@/lib/utils";
import { authManager } from "@/lib/auth";

const isMobileBrowser = () => typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
const safeFilename = (value: string) => String(value || "print").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "print";
const A4_WIDTH_PX = 1123;
const A4_MIN_HEIGHT_PX = 794;
const CAPTURE_PADDING_PX = 40;

export function getPrintInstitution() {
  const userInstitution = (authManager.getUser() as any)?.institution;
  let storedInstitution: any = null;
  if (typeof window !== "undefined") {
    try { storedInstitution = JSON.parse(localStorage.getItem("printInstitution") || localStorage.getItem("institution") || "null"); } catch { storedInstitution = null; }
  }
  const institution = storedInstitution?.name ? storedInstitution : userInstitution;
  return { name: institution?.name || "EASY SCHOOL", address: institution?.address || "", phone: institution?.phone || "", email: institution?.email || "", logo: institution?.logo || "" };
}

const escapeHtml = (value: unknown) => String(value ?? "").replace(/[&<>\"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[ch] || ch));
const institutionHeader = () => {
  const i = getPrintInstitution();
  return `<header class="institution-header"><div class="institution-logo">${i.logo ? `<img src="${escapeHtml(i.logo)}" alt="Institution logo" />` : "Logo"}</div><div class="institution-info"><h1>${escapeHtml(i.name)}</h1>${i.address ? `<p>${escapeHtml(i.address)}</p>` : ""}${(i.phone || i.email) ? `<p>${[i.phone, i.email].filter(Boolean).map(escapeHtml).join(" | ")}</p>` : ""}</div></header>`;
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
      const res = await fetch(src, { mode: "cors" });
      if (!res.ok) return;
      const blob = await res.blob();
      const reader = new FileReader();
      const dataUrl: string = await new Promise((resolve, reject) => { reader.onloadend = () => resolve(String(reader.result || "")); reader.onerror = reject; reader.readAsDataURL(blob); });
      img.setAttribute("src", dataUrl);
    } catch {}
  }));
};

const printCss = `@page{size:A4;margin:10mm}*{box-sizing:border-box}html,body{margin:0;color:#0f172a;font-family:Arial,Helvetica,sans-serif;background:#fff;print-color-adjust:exact;-webkit-print-color-adjust:exact}body{width:100%;overflow:visible}main,.print-card,.pdf-safe-page{max-width:100%;overflow:visible}table{width:100%;border-collapse:collapse;table-layout:auto;page-break-inside:auto}thead{display:table-header-group}tr{page-break-inside:avoid;break-inside:avoid}th,td{border:1px solid #cbd5e1;padding:7px;font-size:11px;text-align:left;white-space:normal;word-break:break-word;overflow-wrap:anywhere}th{background:#e2e8f0;font-weight:700;color:#0f172a}.institution-header{display:flex;align-items:center;justify-content:space-between;gap:14px;border-radius:16px;background:linear-gradient(135deg,#0f172a 0%,#0f766e 100%);color:#fff;padding:14px 16px;margin-bottom:14px;box-shadow:0 10px 24px rgba(15,23,42,.18);break-inside:avoid}.institution-logo{width:58px;height:58px;border:1px solid rgba(255,255,255,.25);border-radius:14px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:700;overflow:hidden;background:rgba(255,255,255,.08);flex:0 0 auto}.institution-logo img{width:100%;height:100%;object-fit:contain;padding:4px;background:#fff}.institution-info{flex:1;min-width:0}.institution-info h1{margin:0;font-size:21px;line-height:1.15;color:#fff}.institution-info p{margin:3px 0 0;font-size:12px;color:rgba(255,255,255,.84)}.print-card{border:1px solid #cbd5e1;border-radius:16px;padding:16px;background:#fff}.print-title{font-size:22px;font-weight:700;margin:0 0 4px}.print-muted{color:#64748b;font-size:12px}.print-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:14px}.print-row{border-bottom:1px solid #e2e8f0;padding:6px 0;font-size:13px;overflow-wrap:anywhere}.print-row strong{display:inline-block;min-width:120px}.signature{margin-top:42px;display:flex;justify-content:space-between;gap:40px;font-size:12px;break-inside:avoid}.signature div{flex:1;border-top:1px solid #334155;padding-top:6px;text-align:center}.print-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:14px;break-inside:avoid}.print-qr{display:inline-flex;flex-direction:column;align-items:center;gap:4px;color:#475569;font-size:10px;font-weight:700;text-transform:uppercase}.print-qr img{width:82px;height:82px;border:1px solid #cbd5e1;border-radius:6px;padding:4px;background:#fff}.print-footer{margin-top:16px;padding-top:10px;border-top:1px dashed #cbd5e1;color:#64748b;font-size:11px;display:flex;justify-content:space-between;gap:12px}`;
const pageShell = (title: string, body: string, styles = "") => `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${escapeHtml(title)}</title><style>${printCss}${styles}</style></head><body>${body}</body></html>`;

export const csvCell = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
export function downloadCsv(filename: string, rows: unknown[][]) { downloadFile(`\uFEFF${rows.map((r) => r.map(csvCell).join(",")).join("\r\n")}`, filename, "text/csv;charset=utf-8"); }

function preparePdfNode(root: HTMLElement, widthPx: number) {
  const walk = (el: Element) => {
    if (el instanceof HTMLElement) {
      el.style.zoom = "1";
      el.style.transform = "none";
      el.style.maxWidth = "none";
      el.style.overflow = "visible";
      el.style.boxSizing = "border-box";
      el.style.opacity = "1";
      el.style.visibility = "visible";
      if (el.tagName === "TABLE") { el.style.width = "100%"; el.style.tableLayout = "auto"; }
      if (el.tagName === "TH" || el.tagName === "TD") { el.style.whiteSpace = "normal"; el.style.wordBreak = "break-word"; }
    }
    Array.from(el.children).forEach(walk);
  };
  root.style.width = `${widthPx}px`;
  root.style.minWidth = `${widthPx}px`;
  walk(root);
}

async function saveCanvasAsPdf(canvas: HTMLCanvasElement, filename: string, landscape: boolean) {
  const jsPDF = (await import("jspdf")).default;
  const pdf = new jsPDF(landscape ? "l" : "p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const marginX = 8;
  const marginY = 8;
  const imgWidth = pageWidth - marginX * 2;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const data = canvas.toDataURL("image/png", 1.0);
  let remaining = imgHeight;
  let y = marginY;
  pdf.addImage(data, "PNG", marginX, y, imgWidth, imgHeight, undefined, "FAST");
  remaining -= (pageHeight - marginY * 2);
  while (remaining > 2) {
    pdf.addPage();
    y = marginY - (imgHeight - remaining);
    pdf.addImage(data, "PNG", marginX, y, imgWidth, imgHeight, undefined, "FAST");
    remaining -= (pageHeight - marginY * 2);
  }
  pdf.save(filename);
}

export async function downloadHtmlAsPdf(title: string, bodyHtml: string, styles = "", filename?: string) {
  const html2canvas = (await import("html2canvas")).default;
  const contentWidth = A4_WIDTH_PX;
  const wrapperWidth = contentWidth + CAPTURE_PADDING_PX * 2;
  const wrapper = document.createElement("div");
  wrapper.style.cssText = `position:fixed;left:0;top:0;width:${wrapperWidth}px;min-height:1123px;background:#fff;padding:${CAPTURE_PADDING_PX}px;z-index:2147483647;pointer-events:none;overflow:visible;box-sizing:border-box;`;
  wrapper.innerHTML = `<div class="pdf-safe-page" style="width:${contentWidth}px;max-width:none;background:#fff;overflow:visible;box-sizing:border-box;">${pageShell(title, `<div class="print-card">${bodyHtml}</div><div class="print-footer"><span>${escapeHtml(getPrintInstitution().name)}</span><span>${new Date().toLocaleDateString()}</span></div>`, styles).replace(/^[\s\S]*<body>/i, "").replace(/<\/body>[\s\S]*$/i, "")}</div>`;
  document.body.appendChild(wrapper);
  try {
    await document.fonts?.ready?.catch(() => undefined);
    await inlineImages(wrapper);
    preparePdfNode(wrapper, wrapperWidth);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const h = Math.ceil(Math.max(wrapper.scrollHeight, wrapper.offsetHeight, A4_MIN_HEIGHT_PX));
    const canvas = await html2canvas(wrapper, { scale: 2, backgroundColor: "#ffffff", useCORS: true, allowTaint: true, scrollX: 0, scrollY: 0, width: wrapperWidth, height: h, windowWidth: wrapperWidth, windowHeight: h });
    await saveCanvasAsPdf(canvas, filename || `${safeFilename(title)}.pdf`, false);
  } finally { document.body.removeChild(wrapper); }
}

export async function downloadElementPdf(target: HTMLElement | null, filename: string) {
  if (!target) return;
  const html2canvas = (await import("html2canvas")).default;
  await document.fonts?.ready?.catch(() => undefined);
  const rect = target.getBoundingClientRect();
  const contentWidth = Math.ceil(Math.max(target.scrollWidth, target.offsetWidth, rect.width, 900));
  const contentHeight = Math.ceil(Math.max(target.scrollHeight, target.offsetHeight, rect.height, 600));
  const wrapperWidth = contentWidth + CAPTURE_PADDING_PX * 2;
  const landscape = contentWidth > 980 || contentWidth > contentHeight * 0.78;
  const institution = getPrintInstitution();
  const documentTitle = safeFilename(filename.replace(/\.pdf$/i, "").replace(/-/g, " ")) || "document";
  const wrapper = document.createElement("div");
  wrapper.style.cssText = `position:fixed;left:0;top:0;width:${wrapperWidth}px;min-width:${wrapperWidth}px;min-height:${contentHeight}px;background:#fff;padding:${CAPTURE_PADDING_PX}px;margin:0;overflow:visible;pointer-events:none;z-index:2147483647;visibility:visible;box-sizing:border-box;`;
  const chrome = document.createElement("div");
  chrome.style.cssText = "border-radius:18px;background:linear-gradient(135deg,#0f172a 0%,#0f766e 100%);color:#fff;padding:16px 18px;margin-bottom:16px;box-shadow:0 12px 28px rgba(15,23,42,.18);break-inside:avoid;";
  chrome.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between;gap:16px;"><div style="min-width:0;"><div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;opacity:.85">${escapeHtml(institution.name)}</div><div style="font-size:22px;font-weight:800;line-height:1.1;margin-top:3px;white-space:normal;overflow-wrap:anywhere;max-width:${Math.max(240, contentWidth - 250)}px;">${escapeHtml(documentTitle)}</div><div style="font-size:12px;opacity:.82;margin-top:4px;">${new Date().toLocaleString()}</div></div><div style="border-radius:999px;background:rgba(255,255,255,.12);padding:8px 12px;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap;">PDF Download</div></div>`;
  const bodyShell = document.createElement("div");
  bodyShell.style.cssText = `width:${contentWidth}px;min-width:${contentWidth}px;border-radius:18px;background:#fff;padding:18px;border:1px solid #e2e8f0;box-shadow:0 12px 30px rgba(15,23,42,.08);overflow:visible;box-sizing:border-box;`;
  const clonedTarget = target.cloneNode(true) as HTMLElement;
  copyComputedStyles(clonedTarget, target);
  preparePdfNode(clonedTarget, Math.max(0, contentWidth - 36));
  const footer = document.createElement("div");
  footer.style.cssText = "display:flex;justify-content:space-between;gap:12px;padding:12px 4px 2px;margin-top:12px;border-top:1px dashed #cbd5e1;color:#64748b;font-size:11px;";
  footer.innerHTML = `<span>${escapeHtml(institution.address || institution.phone || institution.email || "Easy School PDF")}</span><span>${new Date().toLocaleDateString()}</span>`;
  bodyShell.appendChild(clonedTarget);
  wrapper.appendChild(chrome);
  wrapper.appendChild(bodyShell);
  wrapper.appendChild(footer);
  document.body.appendChild(wrapper);
  try {
    await inlineImages(wrapper);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const captureHeight = Math.ceil(Math.max(wrapper.scrollHeight, wrapper.offsetHeight, clonedTarget.scrollHeight + 120, contentHeight));
    const canvas = await html2canvas(wrapper, { scale: 2, backgroundColor: "#ffffff", useCORS: true, allowTaint: true, foreignObjectRendering: false, scrollX: 0, scrollY: 0, x: 0, y: 0, width: wrapperWidth, height: captureHeight, windowWidth: wrapperWidth, windowHeight: captureHeight });
    await saveCanvasAsPdf(canvas, filename, landscape);
  } finally { document.body.removeChild(wrapper); }
}

export async function printElement(target: HTMLElement | null, title = "Print") {
  if (!target) return;
  if (isMobileBrowser()) { await downloadElementPdf(target, `${safeFilename(title)}.pdf`); return; }
  await document.fonts?.ready?.catch(() => undefined);
  const cloned = target.cloneNode(true) as HTMLElement;
  copyComputedStyles(cloned, target);
  preparePdfNode(cloned, Math.ceil(Math.max(target.scrollWidth, target.offsetWidth, target.getBoundingClientRect().width, 900)));
  await inlineImages(cloned);
  const popup = window.open("", "_blank", "width=1200,height=900");
  if (!popup) { await downloadElementPdf(target, `${safeFilename(title)}.pdf`); return; }
  popup.document.open(); popup.document.write(pageShell(title, `<main style="padding:12mm;background:#fff;overflow:visible;">${cloned.outerHTML}</main>`)); popup.document.close(); popup.focus(); setTimeout(() => { try { popup.print(); } catch {} }, 600);
}

export async function printHtml(title: string, bodyHtml: string, styles = "", qrValue?: string) {
  const qrDataUrl = await makeQrDataUrl(qrValue || qrPayload(title), 128);
  const bodyWithQr = bodyHtml.replace('<main class="print-card">', `<main class="print-card">${institutionHeader()}<div class="print-heading"><div>`).replace('<div class="print-grid"', `</div>${qrBlock(qrDataUrl)}</div><div class="print-grid"`);
  if (isMobileBrowser()) { await downloadHtmlAsPdf(title, bodyWithQr, styles, `${safeFilename(title)}.pdf`); return; }
  const popup = window.open("", "_blank", "width=1000,height=900");
  if (!popup) { await downloadHtmlAsPdf(title, bodyWithQr, styles, `${safeFilename(title)}.pdf`); return; }
  popup.document.open(); popup.document.write(pageShell(title, bodyWithQr, styles)); popup.document.close(); popup.focus(); setTimeout(() => { try { popup.print(); } catch {} }, 600);
}
