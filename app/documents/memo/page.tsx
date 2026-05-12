"use client";

import { useMemo, useRef, useState } from "react";
import { FileText } from "lucide-react";

import DownloadButtons from "@/components/id-cards/DownloadButtons";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
  institutionName: string;
};

const today = () => new Date().toISOString().slice(0, 10);

const initialValues: MemoForm = {
  memoNo: "MEMO-2026-001",
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
  institutionName: "DRMS School/Madrasah Management",
};

export default function MemoPage() {
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [values, setValues] = useState<MemoForm>(initialValues);

  const badgeText = useMemo(() => `Memo No: ${values.memoNo}`, [values.memoNo]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Memo Generator"
        description="Create a professional office memo and download it as PDF, PNG or print-ready output."
        icon={FileText}
        status={<Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">Professional template</Badge>}
      />

      <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Memo Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Memo No" value={values.memoNo} onChange={(memoNo) => setValues((current) => ({ ...current, memoNo }))} />
            <Field label="Date" value={values.date} onChange={(date) => setValues((current) => ({ ...current, date }))} type="date" />
            <Field label="Subject" value={values.subject} onChange={(subject) => setValues((current) => ({ ...current, subject }))} />
            <Field label="To" value={values.to} onChange={(to) => setValues((current) => ({ ...current, to }))} />
            <Field label="From" value={values.from} onChange={(from) => setValues((current) => ({ ...current, from }))} />
            <Field label="Department" value={values.department} onChange={(department) => setValues((current) => ({ ...current, department }))} />
            <Field label="Sender Name" value={values.senderName} onChange={(senderName) => setValues((current) => ({ ...current, senderName }))} />
            <Field label="Sender Designation" value={values.senderDesignation} onChange={(senderDesignation) => setValues((current) => ({ ...current, senderDesignation }))} />
            <TextareaField label="Body" value={values.body} onChange={(body) => setValues((current) => ({ ...current, body }))} />
            <TextareaField label="Note" value={values.note} onChange={(note) => setValues((current) => ({ ...current, note }))} />
            <Field label="Institution Name" value={values.institutionName} onChange={(institutionName) => setValues((current) => ({ ...current, institutionName }))} />
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-slate-50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-slate-200 bg-white">
            <div>
              <CardTitle className="text-base">Preview</CardTitle>
              <p className="mt-1 text-sm text-slate-500">A print-friendly memo layout with a formal institutional look.</p>
            </div>
            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">{badgeText}</Badge>
          </CardHeader>
          <CardContent className="p-5">
            <div ref={previewRef} className="mx-auto max-w-4xl rounded-2xl border border-slate-300 bg-white p-0 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
              <div className="border-b border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-700 px-8 py-6 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/70">Office Memo</p>
                    <h2 className="mt-2 text-2xl font-semibold leading-tight">{values.institutionName}</h2>
                    <p className="mt-2 text-sm text-white/75">{values.department}</p>
                  </div>
                  <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-right backdrop-blur">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/70">Memo No</p>
                    <p className="mt-1 text-lg font-semibold">{values.memoNo}</p>
                    <p className="text-xs text-white/70">{values.date}</p>
                  </div>
                </div>
              </div>

              <div className="px-8 py-7 text-slate-900">
                <div className="grid gap-4 border-b border-dashed border-slate-200 pb-5 sm:grid-cols-2">
                  <InfoBlock label="To" value={values.to} />
                  <InfoBlock label="From" value={values.from} />
                  <InfoBlock label="Subject" value={values.subject} className="sm:col-span-2" />
                </div>

                <div className="space-y-4 py-6 text-sm leading-7 text-slate-700">
                  <p>
                    <span className="font-semibold text-slate-900">Date:</span> {values.date}
                  </p>
                  <p>{values.body}</p>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Additional Note</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{values.note}</p>
                  </div>
                </div>

                <div className="mt-8 flex items-end justify-between gap-6 border-t border-slate-200 pt-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Prepared by</p>
                    <p className="mt-6 text-base font-semibold text-slate-950">{values.senderName}</p>
                    <p className="text-sm text-slate-600">{values.senderDesignation}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Approved by</p>
                    <div className="mt-8 h-px w-48 bg-slate-400" />
                    <p className="mt-2 text-sm font-medium text-slate-700">Authorized Signature</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <DownloadButtons targetRef={previewRef} filename={`memo-${values.memoNo}`} printTitle="Print Memo" emailSubject="Memo" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <Input value={value} type={type} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function TextareaField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <Textarea value={value} onChange={(event) => onChange(event.target.value)} className="min-h-28" />
    </div>
  );
}

function InfoBlock({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}