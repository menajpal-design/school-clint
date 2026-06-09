"use client";

import { getPrintInstitution } from "@/lib/export-utils";

type Row = { subjectId: string; subjectName: string; subjectCode?: string; date: string; duration: number; totalMarks: number; passingMarks: number };

const fmt = (d?: string) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-";
const day = (d?: string) => d ? new Date(d).toLocaleDateString("en-US", { weekday: "long" }) : "-";

export function ExamRoutinePaper({ refEl, exam, rows }: { refEl?: any; exam: any; rows: Row[] }) {
  const institution = getPrintInstitution();
  const sortedRows = [...(rows || [])].sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());
  const className = exam?.classId?.name || exam?.className || "-";
  const period = `${fmt(exam?.startDate)} - ${fmt(exam?.endDate || exam?.startDate)}`;

  return (
    <div className="overflow-x-auto rounded-2xl border bg-slate-100 p-3">
      <div ref={refEl} id={refEl ? "exam-routine-print" : undefined} className="mx-auto w-[1120px] min-w-[1120px] overflow-hidden rounded-2xl border border-slate-300 bg-white text-slate-950 shadow-sm">
        <div className="bg-gradient-to-r from-slate-950 via-emerald-900 to-slate-800 px-8 py-7 text-white">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-white/25 bg-white/10 text-xs font-bold uppercase">
                {institution.logo ? <img src={institution.logo} alt="Institution logo" className="h-full w-full bg-white object-contain p-2" /> : "Logo"}
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-wide">{institution.name || "EASY SCHOOL"}</h1>
                {institution.address && <p className="mt-1 text-sm text-white/80">{institution.address}</p>}
                {(institution.phone || institution.email) && <p className="mt-1 text-xs text-white/70">{[institution.phone, institution.email].filter(Boolean).join(" | ")}</p>}
              </div>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-right">
              <p className="text-xs font-semibold uppercase tracking-[.25em] text-emerald-100">Official</p>
              <p className="text-xl font-black">Exam Routine</p>
            </div>
          </div>
        </div>

        <div className="px-8 py-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center">
            <h2 className="text-2xl font-extrabold text-slate-950">{exam?.name || "Exam Routine"}</h2>
            <p className="mt-1 text-sm text-slate-600">Routine schedule, duration and marks setup</p>
          </div>

          <div className="mt-5 grid grid-cols-4 gap-3 text-sm">
            {[
              ["Class", className],
              ["Exam Type", exam?.type || "term"],
              ["Exam Period", period],
              ["Status", exam?.isPublished ? "Public / Published" : "Private / Draft"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
                <p className="mt-1 font-bold text-slate-950">{value}</p>
              </div>
            ))}
          </div>

          <table className="mt-6 w-full border-collapse overflow-hidden rounded-xl text-sm">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="w-14 border border-slate-700 p-3">SL</th>
                <th className="w-48 border border-slate-700 p-3">Date & Day</th>
                <th className="border border-slate-700 p-3 text-left">Subject</th>
                <th className="w-24 border border-slate-700 p-3">Code</th>
                <th className="w-28 border border-slate-700 p-3">Duration</th>
                <th className="w-24 border border-slate-700 p-3">Full Marks</th>
                <th className="w-24 border border-slate-700 p-3">Pass Marks</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.length === 0 ? (
                <tr><td className="border border-slate-300 p-8 text-center text-slate-500" colSpan={7}>Add subject and exam date.</td></tr>
              ) : sortedRows.map((r, i) => (
                <tr key={`${r.subjectId}-${i}`} className={i % 2 ? "bg-slate-50" : "bg-white"}>
                  <td className="border border-slate-300 p-3 text-center font-semibold">{i + 1}</td>
                  <td className="border border-slate-300 p-3 text-center"><div className="font-bold">{fmt(r.date)}</div><div className="text-xs text-slate-500">{day(r.date)}</div></td>
                  <td className="break-words border border-slate-300 p-3 font-bold text-slate-950">{r.subjectName}</td>
                  <td className="border border-slate-300 p-3 text-center font-semibold">{r.subjectCode || "-"}</td>
                  <td className="border border-slate-300 p-3 text-center">{r.duration} min</td>
                  <td className="border border-slate-300 p-3 text-center">{r.totalMarks}</td>
                  <td className="border border-slate-300 p-3 text-center">{r.passingMarks}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {(exam?.instructions || exam?.syllabus) && (
            <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
              {exam?.instructions && <div className="rounded-xl border border-slate-200 bg-amber-50 p-4"><p className="mb-1 font-bold text-amber-900">Instructions</p><p className="whitespace-pre-line text-slate-700">{exam.instructions}</p></div>}
              {exam?.syllabus && <div className="rounded-xl border border-slate-200 bg-emerald-50 p-4"><p className="mb-1 font-bold text-emerald-900">Syllabus</p><p className="whitespace-pre-line text-slate-700">{exam.syllabus}</p></div>}
            </div>
          )}

          <div className="mt-16 grid grid-cols-3 gap-12 text-center text-sm text-slate-700">
            <div className="border-t border-slate-900 pt-2">Prepared By</div>
            <div className="border-t border-slate-900 pt-2">Checked By</div>
            <div className="border-t border-slate-900 pt-2">Head Teacher Signature</div>
          </div>
          <p className="mt-6 border-t border-dashed border-slate-300 pt-3 text-center text-xs text-slate-500">Generated by EasySchool • {new Date().toLocaleDateString('en-GB')}</p>
        </div>
      </div>
    </div>
  );
}
