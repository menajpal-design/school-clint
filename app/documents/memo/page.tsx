"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FileText } from "lucide-react";

import DownloadButtons from "@/components/id-cards/DownloadButtons";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { authManager } from "@/lib/auth";

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
};

const today = () => new Date().toISOString().slice(0, 10);

const initialValues: MemoForm = {
  memoNo: `MEMO-${new Date().getFullYear()}-001`,
  date: today(),
  subject: "Routine classroom monitoring and attendance update",
  to: "All Class Teachers",
  from: "Vice Principal Office",
  department: "Academic Section",
  body:
    "Please ensure attendance is marked within the first 15 minutes of class and all pending class registers are updated before the end of the day. Submit any student disciplinary notes to the academic office.",
  note: "This memo is effective immediately and should be shared with the relevant staff members.",
  senderName: "Dr. Rahman",
  senderDesignation: "Vice Principal",
  approverName: "",
  approverDesignation: "",
  institutionName: "EASY SCHOOL - School/Madrasah Management",
  institutionAddress: "",
  institutionPhone: "",
  institutionEmail: "",
};

const displayDate = (value: string) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "2-digit" });
};

export default function MemoPage() {
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [values, setValues] = useState<MemoForm>(initialValues);

  useEffect(() => {
    const sessionInstitution = (authManager.getUser() as any)?.institution;
    if (sessionInstitution) {
      setValues((current) => ({
        ...current,
        institutionName: sessionInstitution.name || current.institutionName,
        institutionAddress: sessionInstitution.address || current.institutionAddress,
        institutionPhone: sessionInstitution.phone || current.institutionPhone,
        institutionEmail: sessionInstitution.email || current.institutionEmail,
      }));
    }

    api.institution.profile()
      .then((response: any) => {
        const institution = response?.institution;
        if (!institution) return;
        setValues((current) => ({
          ...current,
          institutionName: institution.name || current.institutionName,
          institutionAddress: institution.address || current.institutionAddress,
          institutionPhone: institution.phone || current.institutionPhone,
          institutionEmail: institution.email || current.institutionEmail,
          approverName: institution.headId?.name || institution.headName || current.approverName,
          approverDesignation: institution.headId?.name || institution.headName ? "Institution Head" : current.approverDesignation,
        }));
      })
      .catch(() => undefined);
  }, []);

  const badgeText = useMemo(() => `Memo No: ${values.memoNo}`, [values.memoNo]);
  const contactLine = [values.institutionAddress, values.institutionPhone, values.institutionEmail].filter(Boolean).join(" | ");

  return (
    <div className="space-y-5">
      <PageHeader
        title="Memo Generator"
        description="Create a professional office memo and download it as PDF, PNG or print-ready output."
        icon={FileText}
        status={<Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">Professional template</Badge>}
      />

      <div className="grid gap-5 xl:grid-cols-[430px_1fr]">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-200">
            <CardTitle className="text-base">Memo Details</CardTitle>
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
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-slate-50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-border bg-card">
            <div>
              <CardTitle className="text-base">Preview</CardTitle>
              <p className="mt-1 text-sm text-slate-500">A formal print-ready office memo layout.</p>
            </div>
            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">{badgeText}</Badge>
          </CardHeader>
          <CardContent className="p-5">
            <article
              ref={previewRef}
              className="mx-auto min-h-[930px] max-w-[794px] overflow-hidden border border-border bg-card text-foreground shadow-[0_20px_55px_rgba(15,23,42,0.12)]"
            >
              <div className="h-3 bg-slate-950" />
              <div className="px-12 pb-10 pt-9">
                <header className="border-b-2 border-slate-900 pb-6">
                  <div className="flex items-start justify-between gap-8">
                    <div className="min-w-0 flex-1">
                      <h1 className="text-2xl font-bold uppercase leading-8 tracking-wide text-slate-950">{values.institutionName}</h1>
                      {contactLine && <p className="mt-2 text-xs leading-5 text-slate-600">{contactLine}</p>}
                    </div>
                    <div className="min-w-[160px] border-l-4 border-slate-900 pl-4 text-right">
                      <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">Office Memo</p>
                      <p className="mt-2 text-sm font-semibold text-slate-950">{values.memoNo}</p>
                      <p className="text-xs text-slate-500">{displayDate(values.date)}</p>
                    </div>
                  </div>
                  {values.department && <p className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-700">{values.department}</p>}
                </header>

                <section className="mt-8 grid grid-cols-2 gap-0 border border-slate-300 text-sm">
                  <MemoCell label="To" value={values.to} />
                  <MemoCell label="From" value={values.from} />
                  <MemoCell label="Date" value={displayDate(values.date)} />
                  <MemoCell label="Memo No" value={values.memoNo} />
                  <MemoCell label="Subject" value={values.subject} wide />
                </section>

                <section className="mt-9">
                  <h2 className="border-b border-slate-300 pb-2 text-sm font-bold uppercase tracking-[0.25em] text-slate-600">Memo Body</h2>
                  <div className="mt-5 whitespace-pre-wrap text-[15px] leading-8 text-slate-800">{values.body}</div>
                </section>

                {values.note && (
                  <section className="mt-8 border-l-4 border-slate-900 bg-slate-50 px-5 py-4">
                    <h3 className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">Note</h3>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">{values.note}</p>
                  </section>
                )}

                <footer className="mt-16 grid grid-cols-2 gap-10 border-t border-slate-300 pt-10">
                  <SignatureBlock title="Prepared by" name={values.senderName} designation={values.senderDesignation} />
                  <SignatureBlock title="Approved by" name={values.approverName} designation={values.approverDesignation} align="right" />
                </footer>
              </div>
            </article>

            <div className="mt-6">
              <DownloadButtons targetRef={previewRef} filename={`memo-${values.memoNo}`} printTitle="Print Memo" emailSubject={values.subject || "Memo"} />
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
