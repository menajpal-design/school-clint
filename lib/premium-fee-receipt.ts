"use client";

import { getPrintInstitution, makeQrDataUrl, printHtml } from "@/lib/export-utils";
import { formatCurrency, formatDate } from "@/lib/utils";

const safe = (value: unknown) => String(value ?? "-").replace(/[&<>'\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char] || char));
const receiptNoOf = (payment: any) => payment?.receiptNumber || `RCPT-${String(payment?._id || Date.now()).slice(-8).toUpperCase()}`;
const nameOf = (payment: any, student: any) => payment?.studentId?.userId?.name || payment?.studentId?.name || student?.userId?.name || student?.name || "Student";
const metaOf = (payment: any, student: any) => ({
  roll: payment?.studentId?.rollNumber || student?.rollNumber || student?.roll || "-",
  className: payment?.studentId?.classId?.name || student?.classId?.name || student?.className || student?.class || "-",
  section: payment?.studentId?.sectionId?.name || student?.sectionId?.name || student?.sectionName || student?.section || "-",
  guardian: payment?.studentId?.guardianName || student?.guardianName || student?.parentName || "-",
  phone: payment?.studentId?.guardianPhone || student?.guardianPhone || student?.userId?.phone || "-",
});
function amountInWords(value: number) {
  const n = Math.round(Number(value || 0));
  if (!Number.isFinite(n)) return "Zero taka only";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const under100 = (x: number): string => x < 20 ? ones[x] : `${tens[Math.floor(x / 10)]}${x % 10 ? " " + ones[x % 10] : ""}`;
  const under1000 = (x: number): string => x >= 100 ? `${ones[Math.floor(x / 100)]} Hundred${x % 100 ? " " + under100(x % 100) : ""}` : under100(x);
  const parts: string[] = [];
  let rest = n;
  const crore = Math.floor(rest / 10000000); if (crore) { parts.push(`${under1000(crore)} Crore`); rest %= 10000000; }
  const lakh = Math.floor(rest / 100000); if (lakh) { parts.push(`${under1000(lakh)} Lakh`); rest %= 100000; }
  const thousand = Math.floor(rest / 1000); if (thousand) { parts.push(`${under1000(thousand)} Thousand`); rest %= 1000; }
  if (rest) parts.push(under1000(rest));
  return `${parts.join(" ") || "Zero"} taka only`;
}

export async function printPremiumFeeReceipt(payment: any, student: any, institutionProfile?: any) {
  const printInstitution = getPrintInstitution();
  const institution = {
    name: institutionProfile?.name || printInstitution.name || "EASY SCHOOL",
    address: institutionProfile?.address || printInstitution.address || "",
    phone: institutionProfile?.phone || printInstitution.phone || "",
    email: institutionProfile?.email || printInstitution.email || "",
    logo: institutionProfile?.logo || printInstitution.logo || "",
    eiin: institutionProfile?.eiin || institutionProfile?.EIIN || "",
    website: institutionProfile?.website || "",
  };
  const studentName = nameOf(payment, student);
  const meta = metaOf(payment, student);
  const receiptNo = receiptNoOf(payment);
  const paymentDate = payment?.paymentDate || payment?.createdAt || new Date();
  const amount = Number(payment?.amount || 0);
  const feeType = payment?.feeId?.type || payment?.type || "Student Fee";
  const monthYear = `${payment?.month || payment?.feeId?.month || "-"} ${payment?.year || payment?.feeId?.year || ""}`.trim();
  const collectedBy = payment?.collectedBy?.name || payment?.createdBy?.name || "Accounts Office";
  const qrPayload = JSON.stringify({ type: "premium_fee_receipt", receiptNumber: receiptNo, institution: institution.name, student: studentName, roll: meta.roll, amount, paymentDate, generatedAt: new Date().toISOString() });
  const qrDataUrl = await makeQrDataUrl(qrPayload, 150);
  const body = `<main class="premium-receipt">
    <section class="hero">
      <div class="brand-left"><div class="logo">${institution.logo ? `<img src="${safe(institution.logo)}"/>` : "ES"}</div><div><p class="eyebrow">Official School Money Receipt</p><h1>${safe(institution.name)}</h1><p>${safe(institution.address || "")}</p><p>${[institution.phone, institution.email].filter(Boolean).map(safe).join(" | ")}</p>${institution.eiin || institution.website ? `<p>${institution.eiin ? `EIIN: ${safe(institution.eiin)}` : ""}${institution.eiin && institution.website ? " | " : ""}${institution.website ? safe(institution.website) : ""}</p>` : ""}</div></div>
      <div class="qr"><img src="${qrDataUrl}"/><span>QR Verified</span></div>
    </section>
    <section class="invoice-row"><div><p class="eyebrow dark">Premium Receipt</p><h2>Fee Payment Receipt</h2><p class="muted">This receipt is generated from the EasySchool student fee portal.</p></div><div class="stamp">PAID</div></section>
    <section class="summary"><div><span>Receipt No</span><b>${safe(receiptNo)}</b></div><div><span>Date</span><b>${safe(formatDate(paymentDate))}</b></div><div><span>Method</span><b>${safe(payment?.paymentMethod || "Cash")}</b></div><div><span>Status</span><b>${safe(payment?.status || "Paid")}</b></div></section>
    <section class="cards"><div class="card"><h3>Student Information</h3><p><b>Name</b><span>${safe(studentName)}</span></p><p><b>Roll</b><span>${safe(meta.roll)}</span></p><p><b>Class</b><span>${safe(meta.className)}</span></p><p><b>Section</b><span>${safe(meta.section)}</span></p><p><b>Guardian</b><span>${safe(meta.guardian)}</span></p><p><b>Phone</b><span>${safe(meta.phone)}</span></p></div><div class="card amount-card"><h3>Amount Received</h3><div class="amount">${safe(formatCurrency(amount))}</div><p class="words">${safe(amountInWords(amount))}</p><p><b>Fee Type</b><span>${safe(feeType)}</span></p><p><b>Month/Year</b><span>${safe(monthYear)}</span></p></div></section>
    <section class="table-wrap"><table><thead><tr><th>SL</th><th>Description</th><th>Month/Year</th><th>Method</th><th>Date</th><th class="right">Amount</th></tr></thead><tbody><tr><td>01</td><td>${safe(feeType)}</td><td>${safe(monthYear)}</td><td>${safe(payment?.paymentMethod || "Cash")}</td><td>${safe(formatDate(paymentDate))}</td><td class="right">${safe(formatCurrency(amount))}</td></tr></tbody><tfoot><tr><td colspan="5" class="right">Total Paid</td><td class="right">${safe(formatCurrency(amount))}</td></tr></tfoot></table></section>
    <section class="note"><b>Important:</b> Preserve this premium receipt for future reference. For verification, scan the QR code or contact the accounts office with the receipt number.</section>
    <section class="signatures"><div><i></i><b>Accounts Officer</b><small>${safe(collectedBy)}</small></div><div><i></i><b>Student / Guardian</b><small>Received copy</small></div><div><em>SEAL</em><b>Institution Seal</b><small>Verified receipt</small></div></section>
    <footer><span>${safe(institution.name)}</span><span>Generated: ${safe(new Date().toLocaleString())}</span></footer>
  </main>`;
  const styles = `.premium-receipt{position:relative;border:1px solid #d6b25e;border-radius:22px;padding:0;overflow:hidden;background:#fff;color:#0f172a;box-shadow:0 20px 50px rgba(15,23,42,.14)}.premium-receipt:before{content:"PAID";position:absolute;left:8%;bottom:15%;font-size:118px;font-weight:900;letter-spacing:.22em;color:rgba(22,163,74,.045);transform:rotate(-24deg);z-index:0}.premium-receipt>*{position:relative;z-index:1}.hero{display:flex;justify-content:space-between;gap:18px;padding:24px;background:linear-gradient(135deg,#052e2b,#0f766e 54%,#d6b25e);color:#fff}.brand-left{display:flex;gap:16px;align-items:center}.logo{width:78px;height:78px;border:2px solid rgba(255,255,255,.55);border-radius:18px;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:900;background:rgba(255,255,255,.12);overflow:hidden;flex:0 0 auto}.logo img{width:100%;height:100%;object-fit:contain;background:#fff;padding:6px}.eyebrow{margin:0 0 5px;text-transform:uppercase;letter-spacing:.22em;font-size:10px;font-weight:900;opacity:.88}.dark{color:#0f766e}.hero h1{margin:0;font-size:28px;line-height:1.1;color:#fff;text-transform:uppercase}.hero p{margin:4px 0 0;font-size:12px;color:rgba(255,255,255,.88)}.qr{display:flex;flex-direction:column;align-items:center;gap:5px;font-size:10px;font-weight:900;text-transform:uppercase;color:#fff}.qr img{width:96px;height:96px;border-radius:14px;border:2px solid rgba(255,255,255,.7);background:#fff;padding:5px}.invoice-row{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;padding:22px 24px 14px;border-bottom:1px solid #e2e8f0}.invoice-row h2{margin:0;font-size:32px;line-height:1.05}.muted{margin:6px 0 0;color:#64748b;font-size:12px}.stamp{border:4px double #16a34a;color:#16a34a;border-radius:999px;padding:12px 20px;font-size:18px;font-weight:900;letter-spacing:.18em;transform:rotate(-8deg)}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;padding:18px 24px}.summary div{border:1px solid #ead7a1;background:linear-gradient(180deg,#fffbeb,#fff);border-radius:14px;padding:12px}.summary span{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.14em;color:#92400e;font-weight:900}.summary b{display:block;margin-top:5px;font-size:13px}.cards{display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:0 24px 18px}.card{border:1px solid #cbd5e1;border-radius:16px;padding:16px;background:#fff}.card h3{margin:0 0 12px;font-size:13px;text-transform:uppercase;letter-spacing:.16em;color:#0f766e}.card p{display:flex;justify-content:space-between;gap:12px;border-bottom:1px dashed #e2e8f0;margin:0;padding:7px 0;font-size:12px}.card p:last-child{border-bottom:0}.card b{color:#475569}.card span{text-align:right;font-weight:700}.amount-card{background:linear-gradient(180deg,#f0fdfa,#fff)}.amount{font-size:36px;font-weight:900;color:#052e2b;margin:4px 0}.words{display:block!important;border:0!important;color:#0f766e!important;font-style:italic;padding:0 0 10px!important}.table-wrap{padding:0 24px 18px}.table-wrap table{width:100%;border-collapse:collapse;border-radius:14px;overflow:hidden}.table-wrap th{background:#052e2b;color:#fff;padding:10px;border:1px solid #052e2b;font-size:11px}.table-wrap td{padding:10px;border:1px solid #cbd5e1;font-size:12px}.table-wrap tfoot td{background:#fffbeb;font-weight:900}.right{text-align:right}.note{margin:0 24px 18px;border-left:5px solid #d6b25e;background:#fffbeb;padding:13px;border-radius:0 12px 12px 0;font-size:12px;color:#475569}.signatures{display:grid;grid-template-columns:repeat(3,1fr);gap:26px;padding:42px 24px 22px}.signatures div{text-align:center;font-size:12px}.signatures i{display:block;height:1px;background:#334155;margin-bottom:8px}.signatures b{display:block}.signatures small{display:block;margin-top:3px;color:#64748b}.signatures em{display:inline-flex;width:76px;height:76px;border:2px dashed #d6b25e;border-radius:999px;align-items:center;justify-content:center;font-style:normal;font-weight:900;color:#92400e;margin-bottom:8px}footer{display:flex;justify-content:space-between;gap:12px;padding:12px 24px;background:#f8fafc;color:#64748b;font-size:11px}@media(max-width:640px){.hero,.invoice-row{flex-direction:column}.summary,.cards,.signatures{grid-template-columns:1fr}.qr{align-items:flex-start}.hero h1{font-size:22px}.invoice-row h2{font-size:25px}.amount{font-size:30px}.premium-receipt{border-radius:14px}.summary,.cards,.table-wrap,.signatures{padding-left:14px;padding-right:14px}.note{margin-left:14px;margin-right:14px}.table-wrap{overflow:visible}.table-wrap th,.table-wrap td{font-size:10px;padding:7px}}`;
  await printHtml(`Premium Fee Receipt - ${receiptNo}`, body, styles, qrPayload);
}
