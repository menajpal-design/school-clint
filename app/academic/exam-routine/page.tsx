"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Download, Eye, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import ResponsiveTable from '@/components/shared/ResponsiveTable';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api, apiClient } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { downloadElementPdf } from "@/lib/export-utils";
import { normalizeUserRole } from "@/lib/permissions";

type Row = { subjectId: string; subjectName: string; subjectCode?: string; date: string; duration: number; totalMarks: number; passingMarks: number };
type Exam = { _id?: string; id?: string; name: string; type?: string; classId?: any; className?: string; startDate?: string; endDate?: string; isPublished?: boolean; subjectMarks?: any[]; instructions?: string; syllabus?: string; updatedAt?: string; status?: string };

const ROLES = ["head", "assistant_head", "admin", "super_admin", "subject_teacher", "class_teacher"];
const EXAM_CACHE_KEY = "easy-school-exam-routine-exams-v2";
const SUBJECT_CACHE_KEY = "easy-school-subject-cache-v2";
const CLASS_CACHE_KEY = "easy-school-syllabus-class-cache-v1";
const idOf = (x: any) => String(x?._id || x?.id || x || "");
const read = (k: string) => { try { const v = JSON.parse(localStorage.getItem(k) || "[]"); return Array.isArray(v) ? v : []; } catch { return []; } };
const write = (k: string, v: any[]) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const unique = (a: any[]) => Array.from(new Map(a.filter(Boolean).map((x) => [idOf(x), x])).values());
const fmt = (d?: string) => d ? new Date(d).toLocaleDateString("bn-BD") : "-";
const inputDate = (d?: string) => d ? new Date(d).toISOString().slice(0, 10) : "";
const rowsFrom = (exam: any): Row[] => (exam?.subjectMarks || []).map((m: any) => ({ subjectId: idOf(m.subjectId), subjectName: m.subjectId?.name || m.subjectName || m.name || "-", subjectCode: m.subjectId?.code || m.subjectCode || m.code || "", date: inputDate(m.date), duration: Number(m.duration || 120), totalMarks: Number(m.totalMarks || 100), passingMarks: Number(m.passingMarks || 33) }));
const ready = (exam: any) => rowsFrom(exam).length > 0 && rowsFrom(exam).every((r) => r.subjectId && r.date && r.duration);
const subjectFromExams = (exams: any[]) => unique(exams.flatMap((e) => (e.subjectMarks || []).map((m: any) => m.subjectId).filter(Boolean))).map((s: any) => ({ _id: idOf(s), name: s.name || "Subject", code: s.code || "", classId: s.classId }));
const toast = (msg: string, type: "success" | "error" | "info" = "success") => window.dispatchEvent(new CustomEvent("app-toast", { detail: { title: "Exam Routine", message: msg, type, duration: 6500 } }));

export default function ExamRoutinePage() {
  const { user } = useAuth();
  const normalizedRole = normalizeUserRole(user?.role);
  const canManage = normalizedRole ? ROLES.includes(normalizedRole) : false;
  const printRef = useRef<HTMLDivElement | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [classId, setClassId] = useState("");
  const [examId, setExamId] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [preview, setPreview] = useState<Exam | null>(null);
  const [pendingDownload, setPendingDownload] = useState<Exam | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const loadParentPortal = async () => {
    if (user?.role !== "parent") return;
    try {
      const res = await api.parent.portal() as any;
      const childList = res?.portal?.children || [];
      setChildren(childList);
      setSelectedChildId((current) => current || childList[0]?._id || "");
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (user?.role === "parent") {
      loadParentPortal().catch(() => undefined);
    }
  }, [user]);

  const selectedChild = useMemo(() => user?.role === "parent" ? children.find((c) => c._id === selectedChildId) || children[0] : null, [user, children, selectedChildId]);

  const displayExams = useMemo(() => {
    const role = normalizeUserRole(user?.role);
    if (role === "parent" && selectedChild) {
      const childClassId = String(selectedChild.classId?._id || selectedChild.classId || "");
      return exams.filter((exam) => String(exam.classId?._id || exam.classId || "") === childClassId);
    }
    if (role === "student") {
      const student = user?.student || user?.studentId || {};
      const studentClassId = String(student.classId?._id || student.classId || "");
      return exams.filter((exam) => String(exam.classId?._id || exam.classId || "") === studentClassId);
    }
    return exams;
  }, [exams, user, selectedChild]);

  const displaySaved = useMemo(() => {
    return [...displayExams].sort((a: any, b: any) => new Date(b.updatedAt || b.endDate || 0).getTime() - new Date(a.updatedAt || a.endDate || 0).getTime());
  }, [displayExams]);

  const selectedExam = useMemo(() => displayExams.find((e) => idOf(e) === examId) || displayExams.find((e: any) => !classId || idOf(e.classId) === classId) || displayExams[0], [displayExams, examId, classId]);
  const visibleExams = useMemo(() => displayExams.filter((e: any) => !classId || idOf(e.classId) === classId), [displayExams, classId]);
  const classSubjects = useMemo(() => { const all = unique([...subjects, ...subjectFromExams(exams)]); const match = all.filter((s: any) => !classId || idOf(s.classId) === classId); return match.length ? match : all; }, [subjects, exams, classId]);

  const ok = (x: string) => { setMsg(x); setErr(""); toast(x); };
  const bad = (x: string) => { setErr(x); setMsg(""); toast(x, "error"); };
  const sync = (e: any) => setRows(rowsFrom(e));
  const upsert = (exam: Exam) => setExams((cur) => { const next = unique([exam, ...cur.filter((x) => idOf(x) !== idOf(exam))]); write(EXAM_CACHE_KEY, next); return next; });

  const load = useCallback(async () => {
    const cached = read(EXAM_CACHE_KEY);
    try {
      const [er, cr, sr] = await Promise.all([
        api.academic.exams.getAll().catch(() => ({ exams: cached })) as any,
        api.academic.classes.getAll().catch(() => ({ classes: read(CLASS_CACHE_KEY) })) as any,
        api.academic.subjects.getAll().catch(() => ({ subjects: read(SUBJECT_CACHE_KEY) })) as any,
      ]);
      const nextExams = unique([...(Array.isArray(er.exams) ? er.exams : []), ...cached]);
      setExams(nextExams); setClasses(cr.classes || []); setSubjects(sr.subjects || []);
      write(EXAM_CACHE_KEY, nextExams); write(CLASS_CACHE_KEY, cr.classes || []); write(SUBJECT_CACHE_KEY, sr.subjects || []);
      const firstExam = nextExams.find((e) => idOf(e) === examId) || nextExams[0];
      if (firstExam) { setExamId(idOf(firstExam)); setClassId(idOf(firstExam.classId)); sync(firstExam); }
    } catch (e: any) { bad(e?.message || "Exam routine load failed"); }
  }, [examId]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (selectedExam) sync(selectedExam); }, [selectedExam]);
  useEffect(() => { if (!pendingDownload || idOf(pendingDownload) !== idOf(selectedExam) || !rows.length) return; const t = window.setTimeout(() => { downloadElementPdf(printRef.current, `exam-routine-${pendingDownload.name || "routine"}.pdf`); setPendingDownload(null); }, 250); return () => window.clearTimeout(t); }, [pendingDownload, selectedExam, rows.length]);

  const select = (e: Exam) => { setClassId(idOf(e.classId)); setExamId(idOf(e)); sync(e); };
  const publish = async (e: Exam) => {
    if (!e.isPublished && !ready(e)) return bad("Routine incomplete. Publish করার আগে subject, date, duration complete করুন।");
    setSaving(true);
    try { const r: any = await apiClient.patch(`/academic/exams/${idOf(e)}/public-routine`, { isPublished: !e.isPublished }); const updated = r?.exam || { ...e, isPublished: !e.isPublished, updatedAt: new Date().toISOString() }; upsert(updated); setPreview((p) => p && idOf(p) === idOf(e) ? updated : p); ok(updated.isPublished ? "Routine published হয়েছে।" : "Routine private করা হয়েছে।"); } catch (x: any) { bad(x?.message || "Publish failed"); } finally { setSaving(false); }
  };
  const download = (e: Exam) => { if (!ready(e)) return bad("Routine incomplete. Download করার আগে subject, date, duration complete করুন।"); select(e); setPendingDownload(e); };
  const addRow = () => { const used = new Set(rows.map((r) => r.subjectId)); const s = classSubjects.find((x: any) => !used.has(x._id)) || classSubjects[0]; if (!s) return bad("Subject পাওয়া যায়নি। আগে Academic > Subjects থেকে subject add করুন।"); setRows((r) => [...r, { subjectId: s._id, subjectName: s.name, subjectCode: s.code || "", date: "", duration: 120, totalMarks: 100, passingMarks: 33 }]); };
  const save = async () => {
    if (!selectedExam) return bad("Exam select করা নেই।");
    const subjectMarks = rows.filter((r) => r.subjectId && r.date).map((r) => ({ subjectId: r.subjectId, date: r.date, duration: r.duration, totalMarks: r.totalMarks, passingMarks: r.passingMarks }));
    if (!subjectMarks.length) return bad("At least one subject and date is required.");
    setSaving(true);
    try { const sorted = subjectMarks.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); const payload = { name: selectedExam.name, type: selectedExam.type || "term", classId: idOf(selectedExam.classId) || classId, startDate: sorted[0].date, endDate: sorted[sorted.length - 1].date, status: selectedExam.status || "scheduled", isPublished: selectedExam.isPublished === true, subjectMarks: sorted, instructions: selectedExam.instructions || "", syllabus: selectedExam.syllabus || "" }; const r: any = await api.academic.exams.update(idOf(selectedExam), payload); const updated = r?.exam || { ...selectedExam, ...payload, updatedAt: new Date().toISOString(), subjectMarks: rows.map((row) => ({ ...row, subjectId: subjects.find((s: any) => s._id === row.subjectId) || { _id: row.subjectId, name: row.subjectName, code: row.subjectCode } })) }; upsert(updated); setExamId(idOf(updated)); ok("Exam routine save হয়েছে।"); } catch (x: any) { bad(x?.message || "Save failed"); } finally { setSaving(false); }
  };

  return <div className="space-y-5">
    <style jsx global>{`@media print{body *{visibility:hidden!important}#exam-routine-print,#exam-routine-print *{visibility:visible!important}#exam-routine-print{position:absolute;left:0;top:0;width:100%!important;min-width:1050px!important;background:#fff;color:#000}.no-print{display:none!important}@page{size:A4 landscape;margin:8mm}}`}</style>
    <PageHeader title="Exam Routine" description="Saved list থেকে Edit, Preview, Publish/Unpublish ও Download করা যাবে।" icon={CalendarDays} status={<Badge variant="outline">{displaySaved.length} saved routines</Badge>} actions={[<Button key="refresh" size="sm" variant="outline" onClick={load}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>, canManage && <Button key="save" size="sm" disabled={saving || !selectedExam} onClick={save}><Save className="mr-2 h-4 w-4" />Save Routine</Button>, <Button key="pdf" size="sm" variant="outline" onClick={() => downloadElementPdf(printRef.current, `exam-routine-${selectedExam?.name || "routine"}.pdf`)}><Download className="mr-2 h-4 w-4" />PDF</Button>].filter(Boolean) as any} />
    {msg && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">{msg}</div>}{err && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{err}</div>}
    
    {user?.role === "parent" && children.length > 0 && (
      <section className="no-print rounded-lg border bg-card p-4 shadow-sm">
        <div className="max-w-xs">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-800">Select Child</span>
            <select
              className="h-10 w-full rounded-md border px-3 text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
              value={selectedChildId}
              onChange={(e) => setSelectedChildId(e.target.value)}
            >
              {children.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.userId?.name || `Roll: ${item.rollNumber}`} ({item.classId?.name || "N/A"})
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>
    )}

    <section className="no-print rounded-lg border bg-card p-4 shadow-sm"><div className="grid gap-3 md:grid-cols-3"><select className="h-10 rounded-md border px-3 text-sm" value={classId} onChange={(e) => { setClassId(e.target.value); setExamId(""); }}><option value="">All classes</option>{classes.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}</select><select className="h-10 rounded-md border px-3 text-sm md:col-span-2" value={examId} onChange={(e) => setExamId(e.target.value)}><option value="">Select exam</option>{visibleExams.map((e) => <option key={idOf(e)} value={idOf(e)}>{e.name} {e.classId?.name ? `- ${e.classId.name}` : ""}</option>)}</select></div></section>
    <section className="no-print rounded-lg border bg-card p-4 shadow-sm">
      <h2 className="font-semibold">Saved Routine List</h2>
      <p className="mb-3 text-xs text-muted-foreground">Preview button চাপলে dialog box-এ routine দেখা যাবে।</p>
          <ResponsiveTable
            columns={["Exam", "Class", "Date", "Subjects", "Routine", "Publish", "Action"]}
            rows={displaySaved.length === 0 ? [] : displaySaved.map((e) => ([
              <div key="exam" className="break-words font-medium">{e.name}<div className="text-xs text-muted-foreground">{e.type || 'term'}</div></div>,
              <div key="class">{e.classId?.name || e.className || '-'}</div>,
              <div key="date">{fmt(e.startDate)} {e.endDate ? `- ${fmt(e.endDate)}` : ''}</div>,
              <div key="subjects">{e.subjectMarks?.length || 0}</div>,
              <div key="routine"><Badge variant="outline" className={ready(e) ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}>{ready(e) ? 'Ready' : 'Incomplete'}</Badge></div>,
              <div key="publish"><Badge variant="outline" className={e.isPublished ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-slate-50 text-slate-600'}>{e.isPublished ? 'Public' : 'Private'}</Badge></div>,
              <div key="action" className="flex flex-wrap justify-end gap-2">{canManage && <Button size="sm" variant="outline" onClick={() => select(e)}>Edit</Button>}<Button size="sm" variant="outline" onClick={() => setPreview(e)}>Preview</Button>{canManage && <Button size="sm" variant={e.isPublished ? 'outline' : 'default'} disabled={saving} onClick={() => publish(e)}>{e.isPublished ? 'Unpublish' : 'Publish'}</Button>}<Button size="sm" variant="outline" onClick={() => download(e)}><Download className="mr-1 h-3.5 w-3.5" />Download</Button></div>,
            ]))}
            empty="No saved routine found."
          />
    </section>
    {canManage && <section className="no-print rounded-lg border bg-card p-4 shadow-sm"><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Edit Exam Routine</h2><Button size="sm" variant="outline" onClick={addRow}><Plus className="mr-2 h-4 w-4" />Add Subject Row</Button></div>
      <ResponsiveTable
        columns={["Subject", "Date", "Duration", "Full", "Pass", "Action"]}
        rows={rows.length === 0 ? [] : rows.map((r, i) => ([
          <select key="subject" className="h-9 min-w-[220px] rounded-md border px-2" value={r.subjectId} onChange={(ev) => { const s = classSubjects.find((x: any) => x._id === ev.target.value); setRows((a) => a.map((row, j) => j === i ? { ...row, subjectId: ev.target.value, subjectName: s?.name || row.subjectName, subjectCode: s?.code || row.subjectCode } : row)); }}><option value="">Select subject</option>{classSubjects.map((s: any) => <option key={s._id} value={s._id}>{s.name}</option>)}</select>,
          <input key="date" type="date" className="h-9 rounded-md border px-2" value={r.date} onChange={(ev) => setRows((a) => a.map((row, j) => j === i ? { ...row, date: ev.target.value } : row))} />,
          <input key="duration" type="number" className="h-9 w-24 rounded-md border px-2" value={r.duration} onChange={(ev) => setRows((a) => a.map((row, j) => j === i ? { ...row, duration: Number(ev.target.value) } : row))} />,
          <input key="full" type="number" className="h-9 w-24 rounded-md border px-2" value={r.totalMarks} onChange={(ev) => setRows((a) => a.map((row, j) => j === i ? { ...row, totalMarks: Number(ev.target.value) } : row))} />,
          <input key="pass" type="number" className="h-9 w-24 rounded-md border px-2" value={r.passingMarks} onChange={(ev) => setRows((a) => a.map((row, j) => j === i ? { ...row, passingMarks: Number(ev.target.value) } : row))} />,
          <Button key="action" size="sm" variant="destructive" onClick={() => setRows((a) => a.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>,
        ]))}
        empty="No subject routine found."
      />
    </section>}
    <Paper refEl={printRef} exam={selectedExam} rows={rows.length ? rows : rowsFrom(selectedExam)} />
    <Dialog open={Boolean(preview)} onOpenChange={(open) => !open && setPreview(null)}><DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto"><DialogHeader><DialogTitle>Routine Preview</DialogTitle></DialogHeader><Paper exam={preview} rows={rowsFrom(preview)} /><DialogFooter><Button variant="outline" onClick={() => setPreview(null)}>Close</Button>{preview && <Button variant="outline" onClick={() => download(preview)}><Download className="mr-2 h-4 w-4" />Download</Button>}{canManage && preview && <Button onClick={() => publish(preview)}>{preview.isPublished ? "Unpublish" : "Publish"}</Button>}</DialogFooter></DialogContent></Dialog>
  </div>;
}

function Paper({ refEl, exam, rows }: { refEl?: any; exam: any; rows: Row[] }) {
  return <div className="overflow-x-auto rounded-lg border bg-slate-50 p-2"><div ref={refEl} id={refEl ? "exam-routine-print" : undefined} className="mx-auto w-[1050px] min-w-[1050px] rounded-lg border bg-white p-6 text-black shadow-sm"><div className="border-b-2 border-black pb-3 text-center"><h1 className="text-xl font-bold">{exam?.name || "Exam Routine"}</h1><p>Class: {exam?.classId?.name || exam?.className || "-"}</p></div><table className="mt-5 w-full table-fixed border-collapse text-center text-sm"><thead><tr><th className="w-[190px] border border-black p-2">Date & Day</th><th className="w-[260px] border border-black p-2">Subject</th><th className="w-[120px] border border-black p-2">Code</th><th className="w-[150px] border border-black p-2">Duration</th><th className="w-[120px] border border-black p-2">Full</th><th className="w-[120px] border border-black p-2">Pass</th></tr></thead><tbody>{rows.length === 0 ? <tr><td className="border border-black p-6" colSpan={6}>Subject/date add করুন।</td></tr> : rows.map((r, i) => <tr key={i}><td className="border border-black p-2">{fmt(r.date)}</td><td className="break-words border border-black p-2 font-medium">{r.subjectName}</td><td className="border border-black p-2">{r.subjectCode || "-"}</td><td className="border border-black p-2">{r.duration} min</td><td className="border border-black p-2">{r.totalMarks}</td><td className="border border-black p-2">{r.passingMarks}</td></tr>)}</tbody></table><div className="mt-16 flex justify-end"><div className="border-t border-black px-8 pt-2 text-center text-sm">Head Teacher Signature</div></div></div></div>;
}
