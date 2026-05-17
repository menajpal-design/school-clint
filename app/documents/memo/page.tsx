"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, FileText, ImageDown, Printer, RefreshCw } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { authManager } from "@/lib/auth";
import { downloadBlob } from "@/lib/utils";

type MemoForm = {
  memoNo: string;
  date: string;
  subject: string;
  to: string;
  from: string;
  department: string;
  body: string;
  note: string;
  senderName: string;
  senderDesignation: string;
  approverName: string;
  approverDesignation: string;
  institutionName: string;
  institutionAddress: string;
  institutionPhone: string;
  institutionEmail: string;
  institutionLogo: string;
};

const today = () => new Date().toISOString().slice(0, 10);
const safeFilename = (value: string) => String(value || "memo").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "memo";
const isMobileBrowser = () => typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

const initialValues: MemoForm = {
  memoNo: `MEMO-${new Date().getFullYear()}-001`,
  date: today(),
  subject: "Routine classroom monitoring and attendance update",
  to: "All Class Teachers",
  from: "Vice Principal Office",
  department: "Academic Section",
  body: "Please ensure attendance is marked within the first 15 minutes of class and all pending class registers are updated before the end of the day. Submit any student disciplinary notes to the academic office.",
  note: "This memo is effective immediately and should be shared with the relevant staff members.",
  senderName: "Dr. Rahman",
  senderDesignation: "Vice Principal",
  approverName: "",
  approverDesignation: "",
  institutionName: "EASY SCHOOL - School/Madrasah Management",
  institutionAddress: "",
  institutionPhone: "",
  institutionEmail: "",
  institutionLogo: "",
};

const displayDate = (value: string) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "2-digit" });
};

async function inlineImages(root: HTMLElement) {
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
    } catch {}
  }));
}

async function captureA4(target: HTMLElement) {
  await document.fonts?.ready?.catch(() => undefined);
  const wrapper = document.createElement("div");
  wrapper.style.position = "fixed";
  wrapper.style.left = "-9999px";
  wrapper.style.top = "0";
  wrapper.style.width = "794px";
  wrapper.style.minHeight = "1123px";
  wrapper.style.background = "#ffffff";
  wrapper.style.padding = "0";
  wrapper.style.zIndex = "-1";
  const cloned = target.cloneNode(true) as HTMLElement;
  cloned.style.transform = "none";
  cloned.style.zoom = "1";
  cloned.style.width = "794px";
  cloned.style.minHeight = "1123px";
  cloned.classList.add("memo-export-clone");
  wrapper.appendChild(cloned);
  document.body.appendChild(wrapper);
  await inlineImages(wrapper);
  const canvas = await html2canvas(wrapper, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    allowTaint: true,
    scrollX: 0,
    scrollY: 0,
    windowWidth: 794,
    windowHeight: Math.max(1123, wrapper.scrollHeight),
  });
  document.body.removeChild(wrapper);
  return canvas;
}

export default function MemoPage() {
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [values, setValues] = useState<MemoForm>(initialValues);
  const [exporting, setExporting] = useState<"pdf" | "png" | "print" | "" >("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const sessionInstitution = (authManager.getUser() as any)?.institution;
    if (sessionInstitution) {
      setValues((current) => ({
        ...current,
        institutionName: sessionInstitution.name || current.institutionName,
        institutionAddress: sessionInstitution.address || current.institutionAddress,
        institutionPhone: sessionInstitution.phone || current.institutionPhone,
        institutionEmail: sessionInstitution.email || current.institutionEmail,
        institutionLogo: sessionInstitution.logo || current.institutionLogo,
      }));
    }

    api.institution.profile()
      .then((response: any) => {
        const institution = response?.institution || response?.profile;
        if (!institution) return;
        setValues((current) => ({
          ...current,
          institutionName: institution.name || current.institutionName,
          institutionAddress: institution.address || current.institutionAddress,
          institutionPhone: institution.phone || current.institutionPhone,
          institutionEmail: institution.email || current.institutionEmail,
          institutionLogo: institution.logo || current.institutionLogo,
          approverName: institution.headId?.name || institution.headName || current.approverName,
          approverDesignation: institution.headId?.name || institution.headName ? "Institution Head" : current.approverDesignation,
        }));
      })
      .catch(() => undefined);
  }, []);

  const badgeText = useMemo(() => `Memo No: ${values.memoNo}`, [values.memoNo]);
  const contactLine = [values.institutionAddress, values.institutionPhone, values.institutionEmail].filter(Boolean).join(" | ");
  const filename = useMemo(() => safeFilename(`${values.memoNo}-${values.subject || "memo"}`), [values.memoNo, values.subject]);
  const verificationText = useMemo(() => {
    const date = new Date().toISOString().slice(0, 10);
    return `Generated by Easy School • ${values.memoNo} • ${date}`;
  }, [values.memoNo]);

  const downloadPDF = async () => {
    if (!previewRef.current) return;
    setExporting("pdf");
    setMessage("");
    try {
      const canvas = await captureA4(previewRef.current);
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgData = canvas.toDataURL("image/png");
      const imgHeight = (canvas.height * pageWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight, undefined, "FAST");
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight, undefined, "FAST");
        heightLeft -= pageHeight;
      }
      pdf.save(`${filename}.pdf`);
      setMessage("Professional memo PDF downloaded successfully.");
    } finally {
      setExporting("");
    }
  };

  const downloadPNG = async () => {
    if (!previewRef.current) return;
    setExporting("png");
    setMessage("");
    try {
      const canvas = await captureA4(previewRef.current);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png", 1));
      if (blob) downloadBlob(blob, `${filename}.png`);
      setMessage("High quality memo image downloaded successfully.");
    } finally {
      setExporting("");
    }
  };

  const printMemo = async () => {
    if (!previewRef.current) return;
    setExporting("print");
    setMessage("");
    try {
      if (isMobileBrowser()) {
        await downloadPDF();
        setMessage("Mobile browser detected. PDF downloaded for printing.");
        return;
      }
      const cloned = previewRef.current.cloneNode(true) as HTMLElement;
      await inlineImages(cloned);
      const popup = window.open("", "_blank", "width=1000,height=900");
      if (!popup) {
        await downloadPDF();
        return;
      }
      popup.document.open();
      popup.document.write(`<!doctype html><html><head><meta charset="utf-8" /><title>${values.memoNo}</title><style>@page{size:A4;margin:0}html,body{margin:0;background:#fff;font-family:Arial,Helvetica,sans-serif}.memo-print-wrapper{width:210mm;min-height:297mm;margin:0 auto;background:#fff}*{box-sizing:border-box}</style></head><body><main class="memo-print-wrapper">${cloned.outerHTML}</main></body></html>`);
      popup.document.close();
      popup.focus();
      setTimeout(() => { try { popup.print(); } catch {} }, 500);
      setMessage("Print window opened.");
    } finally {
      setExporting("");
    }
  };

  return (
    <div className="space-y-5">
      <style jsx global>{`
        @media print {
          body * { visibility: hidden !important; }
          #professional-memo-preview, #professional-memo-preview * { visibility: visible !important; }
          #professional-memo-preview { position: absolute !important; left: 0 !important; top: 0 !important; width: 210mm !important; min-height: 297mm !important; box-shadow: none !important; border: 0 !important; }
          .memo-no-print { display: none !important; }
          @page { size: A4; margin: 0; }
        }
      `}</style>

      <PageHeader
        title="Memo Generator"
        description="Professional memo download system with A4 PDF, PNG, print-ready layout, signature and seal area."
        icon={FileText}
        status={<Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">Professional download</Badge>}
        actions={[
          <Button key="pdf" size="sm" onClick={downloadPDF} disabled={!!exporting}><Download className="mr-2 h-4 w-4" />{exporting === "pdf" ? "Creating PDF..." : "Download PDF"}</Button>,
          <Button key="print" size="sm" variant="outline" onClick={printMemo} disabled={!!exporting}><Printer className="mr-2 h-4 w-4" />Print</Button>,
          <Button key="png" size="sm" variant="outline" onClick={downloadPNG} disabled={!!exporting}><ImageDown className="mr-2 h-4 w-4" />PNG</Button>,
        ]}
      />

      {message && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}

      <div className="grid gap-5 xl:grid-cols-[430px_1fr]">
        <Card className="memo-no-print border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-200">
            <CardTitle className="flex items-center justify-between text-base">
              Memo Details
              <Button variant="outline" size="sm" onClick={() => setValues(initialValues)}><RefreshCw className="mr-2 h-4 w-4" />Reset</Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Memo No" value={values.memoNo} onChange={(memoNo) => update(setValues, { memoNo })} />
              <Field label="Date" value={values.date} onChange={(date) => update(setValues, { date })} type="date" />
            </div>
            <Field label="Subject" value={values.subject} onChange={(subject) => update(setValues, { subject })} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="To" value={values.to} onChange={(to) => update(setValues, { to })} />
              <Field label="From" value={values.from} onChange={(from) => update(setValues, { from })} />
            </div>
            <Field label="Department" value={values.department} onChange={(department) => update(setValues, { department })} />
            <TextareaField label="Body" value={values.body} onChange={(body) => update(setValues, { body })} />
            <TextareaField label="Note" value={values.note} onChange={(note) => update(setValues, { note })} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Sender Name" value={values.senderName} onChange={(senderName) => update(setValues, { senderName })} />
              <Field label="Sender Designation" value={values.senderDesignation} onChange={(senderDesignation) => update(setValues, { senderDesignation })} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Approver Name" value={values.approverName} onChange={(approverName) => update(setValues, { approverName })} />
              <Field label="Approver Designation" value={values.approverDesignation} onChange={(approverDesignation) => update(setValues, { approverDesignation })} />
            </div>
            <Field label="Institution Name" value={values.institutionName} onChange={(institutionName) => update(setValues, { institutionName })} />
            <TextareaField label="Institution Address" value={values.institutionAddress} onChange={(institutionAddress) => update(setValues, { institutionAddress })} rows={2} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Institution Phone" value={values.institutionPhone} onChange={(institutionPhone) => update(setValues, { institutionPhone })} />
              <Field label="Institution Email" value={values.institutionEmail} onChange={(institutionEmail) => update(setValues, { institutionEmail })} />
            </div>
            <Field label="Logo URL" value={values.institutionLogo} onChange={(institutionLogo) => update(setValues, { institutionLogo })} />
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-slate-50 shadow-sm">
          <CardHeader className="memo-no-print flex flex-row items-center justify-between gap-3 border-b border-border bg-card">
            <div>
              <CardTitle className="text-base">Professional Preview</CardTitle>
              <p className="mt-1 text-sm text-slate-500">A4 letterhead memo with verified footer and signature area.</p>
            </div>
            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">{badgeText}</Badge>
          </CardHeader>
          <CardContent className="overflow-x-auto p-4 md:p-5">
            <article
              id="professional-memo-preview"
              ref={previewRef}
              className="mx-auto min-h-[1123px] w-[794px] overflow-hidden border border-slate-200 bg-white text-slate-950 shadow-[0_20px_55px_rgba(15,23,42,0.12)]"
            >
              <div className="h-4 bg-slate-950" />
              <div className="relative px-14 pb-10 pt-10">
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.035]">
                  <span className="rotate-[-28deg] text-8xl font-black uppercase tracking-widest text-slate-900">Memo</span>
                </div>

                <header className="relative border-b-2 border-slate-900 pb-6">
                  <div className="flex items-start justify-between gap-8">
                    <div className="flex min-w-0 flex-1 items-start gap-4">
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-slate-900 bg-slate-50 text-xs font-bold uppercase text-slate-500">
                        {values.institutionLogo ? <img src={values.institutionLogo} alt="Institution logo" className="h-full w-full object-contain p-2" /> : "Logo"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h1 className="text-2xl font-bold uppercase leading-8 tracking-wide text-slate-950">{values.institutionName}</h1>
                        {contactLine && <p className="mt-2 text-xs leading-5 text-slate-600">{contactLine}</p>}
                      </div>
                    </div>
                    <div className="min-w-[168px] border-l-4 border-slate-900 pl-4 text-right">
                      <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">Office Memo</p>
                      <p className="mt-2 text-sm font-semibold text-slate-950">{values.memoNo}</p>
                      <p className="text-xs text-slate-500">{displayDate(values.date)}</p>
                    </div>
                  </div>
                  {values.department && <p className="mt-5 text-sm font-semibold uppercase tracking-[0.2em] text-slate-700">{values.department}</p>}
                </header>

                <section className="relative mt-8 grid grid-cols-2 border border-slate-300 text-sm">
                  <MemoCell label="To" value={values.to} />
                  <MemoCell label="From" value={values.from} />
                  <MemoCell label="Date" value={displayDate(values.date)} />
                  <MemoCell label="Memo No" value={values.memoNo} />
                  <MemoCell label="Subject" value={values.subject} wide />
                </section>

                <section className="relative mt-9">
                  <h2 className="border-b border-slate-300 pb-2 text-sm font-bold uppercase tracking-[0.25em] text-slate-600">Memo Body</h2>
                  <div className="mt-5 whitespace-pre-wrap text-[15px] leading-8 text-slate-800">{values.body}</div>
                </section>

                {values.note && (
                  <section className="relative mt-8 border-l-4 border-slate-900 bg-slate-50 px-5 py-4">
                    <h3 className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">Note</h3>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">{values.note}</p>
                  </section>
                )}

                <footer className="relative mt-16 grid grid-cols-2 gap-10 border-t border-slate-300 pt-10">
                  <SignatureBlock title="Prepared by" name={values.senderName} designation={values.senderDesignation} />
                  <SignatureBlock title="Approved by" name={values.approverName} designation={values.approverDesignation} align="right" />
                </footer>

                <div className="relative mt-10 flex items-end justify-between border-t border-slate-200 pt-4 text-[10px] text-slate-500">
                  <p>{verificationText}</p>
                  <div className="rounded-full border border-dashed border-slate-400 px-6 py-3 text-center font-bold uppercase tracking-widest text-slate-500">Seal</div>
                </div>
              </div>
            </article>

            <div className="memo-no-print mt-5 flex flex-wrap items-center gap-2">
              <Button onClick={downloadPDF} disabled={!!exporting}><Download className="mr-2 h-4 w-4" />{exporting === "pdf" ? "Creating PDF..." : "Download PDF"}</Button>
              <Button onClick={printMemo} variant="outline" disabled={!!exporting}><Printer className="mr-2 h-4 w-4" />Print</Button>
              <Button onClick={downloadPNG} variant="outline" disabled={!!exporting}><ImageDown className="mr-2 h-4 w-4" />Download PNG</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function update(setValues: React.Dispatch<React.SetStateAction<MemoForm>>, patch: Partial<MemoForm>) {
  setValues((current) => ({ ...current, ...patch }));
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <Input value={value} type={type} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function TextareaField({ label, value, onChange, rows = 5 }: { label: string; value: string; onChange: (value: string) => void; rows?: number }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <Textarea value={value} onChange={(event) => onChange(event.target.value)} className="resize-y" rows={rows} />
    </div>
  );
}

function MemoCell({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`${wide ? "col-span-2" : ""} border-b border-r border-slate-300 px-4 py-3 last:border-b-0`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold leading-6 text-slate-950">{value}</p>
    </div>
  );
}

function SignatureBlock({ title, name, designation, align = "left" }: { title: string; name: string; designation: string; align?: "left" | "right" }) {
  return (
    <div className={align === "right" ? "text-right" : ""}>
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">{title}</p>
      <div className={`${align === "right" ? "ml-auto" : ""} mt-10 h-px w-52 bg-slate-500`} />
      {name && <p className="mt-3 text-base font-bold text-slate-950">{name}</p>}
      {designation && <p className="text-sm text-slate-600">{designation}</p>}
    </div>
  );
}
