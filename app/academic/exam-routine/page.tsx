"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, CheckCircle2, Download, Languages, Plus, Printer, RefreshCw, Save, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, apiClient } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { downloadElementPdf } from "@/lib/export-utils";
import { formatDate } from "@/lib/utils";

type Lang = "bn" | "en";
type EditRow = { subjectId: string; subjectName: string; subjectCode?: string; date: string; duration: number; totalMarks: number; passingMarks: number };
type ExamRoutine = { _id?: string; id?: string; name: string; type?: string; classId?: any; className?: string; sectionId?: any; startDate?: string; endDate?: string; status?: string; isPublished?: boolean; subjectMarks?: any[]; instructions?: string; syllabus?: string; approvalRequired?: boolean };

const manageRoles = ["head", "assistant_head", "admin", "super_admin", "subject_teacher", "class_teacher"];
const CLASS_CACHE_KEY = "easy-school-syllabus-class-cache-v1";
const SUBJECT_CACHE_KEY = "easy-school-subject-cache-v2";
const EXAM_CACHE_KEY = "easy-school-exam-routine-exams-v2";
const t = {
  bn: { title: "পরীক্ষার রুটিন", source: "সূত্র", date: "তারিখ", class: "শ্রেণি", exam: "পরীক্ষা", dateDay: "তারিখ ও বার", subject: "বিষয়", code: "বিষয় কোড", time: "সময়", full: "পূর্ণমান", pass: "পাস নম্বর", instruction: "নির্দেশনা", syllabus: "সিলেবাস", sign: "প্রধান শিক্ষকের স্বাক্ষর", empty: "Subject/date add করুন।", logo: "লোগো", seal: "সিল/স্বাক্ষর" },
  en: { title: "Exam Routine", source: "Ref", date: "Date", class: "Class", exam: "Exam", dateDay: "Date & Day", subject: "Subject", code: "Subject Code", time: "Duration", full: "Full Marks", pass: "Pass Marks", instruction: "Instructions", syllabus: "Syllabus", sign: "Head Teacher Signature", empty: "Add subject/date first.", logo: "LOGO", seal: "Seal / Signature" },
};

const toast = (title: string, message: string, type: "success" | "error" | "info" = "success") => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("app-toast", { detail: { title, message, type, duration: type === "success" ? 5500 : 7500 } }));
};
const readJson = (key: string) => { if (typeof window === "undefined") return [] as any[]; try { const value = JSON.parse(localStorage.getItem(key) || "[]"); return Array.isArray(value) ? value : []; } catch { return []; } };
const writeJson = (key: string, value: any[]) => { if (typeof window === "undefined") return; try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ } };
const idOf = (item: any) => String(item?._id || item?.id || item || "");
const normalizeClasses = (items: any[]) => items.map((item, index) => typeof item === "object" ? item : { _id: String(item || `class-${index}`), name: String(item || `Class ${index + 1}`) }).filter(Boolean).map((item, index) => ({ ...item, _id: String(item._id || item.id || `class-${index}`), name: item.name || item.className || `Class ${index + 1}` }));
const normalizeSubjects = (items: any[]) => items.map((item, index) => ({ ...item, _id: String(item._id || item.id || item.subjectId?._id || `subject-${index}`), name: item.name || item.subjectName || item.subjectId?.name || "Subject", code: item.code || item.subjectCode || item.subjectId?.code || "", classId: item.classId }));
const uniqueById = (items: any[]) => { const map = new Map<string, any>(); items.forEach((item) => { const id = idOf(item); if (id && !map.has(id)) map.set(id, item); }); return Array.from(map.values()); };
const dayName = (date?: string, lang: Lang = "bn") => { if (!date) return "-"; try { return new Date(date).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-US", { weekday: "long" }); } catch { return "-"; } };
const localDate = (date?: string, lang: Lang = "bn") => { if (!date) return "-"; try { return new Date(date).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-US"); } catch { return formatDate(date); } };
const toInputDate = (date?: string) => date ? new Date(date).toISOString().slice(0, 10) : "";
const minutesText = (mins?: number, lang: Lang = "bn") => { if (!mins) return "-"; const h = Math.floor(mins / 60); const m = mins % 60; return lang === "bn" ? `${h} ঘন্টা${m ? ` ${m} মিনিট` : ""}` : `${h} hour${h > 1 ? "s" : ""}${m ? ` ${m} min` : ""}`; };
const normalizeSubjectId = (item: any) => String(item.subjectId?._id || item.subjectId || "");

export default function ExamRoutinePage() {
  const { user } = useAuth();
  const role = user?.role || "";
  const canManage = manageRoles.includes(role);
  const printRef = useRef<HTMLDivElement | null>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [exams, setExams] = useState<ExamRoutine[]>([]);
  const [classId, setClassId] = useState("");
  const [examId, setExamId] = useState("");
  const [institution, setInstitution] = useState<any>(null);
  const [language, setLanguage] = useState<Lang>("bn");
  const [editRows, setEditRows] = useState<EditRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const label = t[language];
  const visibleExams = useMemo(() => exams.filter((exam: any) => !classId || String(exam.classId?._id || exam.classId || "") === String(classId)), [exams, classId]);
  const selectedExam = useMemo(() => visibleExams.find((exam: any) => String(exam._id || exam.id) === String(examId)) || visibleExams[0] || exams[0], [visibleExams, exams, examId]);
  const selectedClass = classes.find((item) => item._id === classId) || selectedExam?.classId;
  const classSubjects = useMemo(() => { const matched = subjects.filter((subject) => !classId || String(subject.classId?._id || subject.classId || "") === String(classId)); return matched.length ? matched : subjects; }, [subjects, classId]);
  const routineRows = useMemo(() => {
    const source = canManage ? editRows : (selectedExam?.subjectMarks || []).map((item: any) => ({ subjectId: normalizeSubjectId(item), subjectName: item.subjectId?.name || item.subjectName || "-", subjectCode: item.subjectId?.code || item.subjectCode || "", date: toInputDate(item.date), duration: Number(item.duration || 120), totalMarks: Number(item.totalMarks || 100), passingMarks: Number(item.passingMarks || 33) }));
    return [...source].sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());
  }, [selectedExam, editRows, canManage]);

  const showSuccess = (text: string, title = "Exam Routine") => { setMessage(text); setError(""); toast(title, text, "success"); };
  const showError = (text: string, title = "Exam Routine Error") => { setError(text); setMessage(""); toast(title, text, "error"); };
  const showInfo = (text: string, title = "Exam Routine") => { setMessage(text); setError(""); toast(title, text, "info"); };

  const syncEditor = (exam: any) => setEditRows((exam?.subjectMarks || []).map((item: any) => ({ subjectId: normalizeSubjectId(item), subjectName: item.subjectId?.name || item.subjectName || "-", subjectCode: item.subjectId?.code || item.subjectCode || "", date: toInputDate(item.date), duration: Number(item.duration || 120), totalMarks: Number(item.totalMarks || 100), passingMarks: Number(item.passingMarks || 33) })));

  const load = async () => {
    setLoading(true); setError("");
    try {
      const [classRes, subjectRes, examRes, profileRes] = await Promise.all([
        api.academic.classes.getAll().catch(() => ({ classes: readJson(CLASS_CACHE_KEY) })) as Promise<any>,
        api.academic.subjects.getAll().catch(() => ({ subjects: readJson(SUBJECT_CACHE_KEY) })) as Promise<any>,
        api.academic.exams.getAll().catch(() => ({ exams: readJson(EXAM_CACHE_KEY) })) as Promise<any>,
        api.institution.profile().catch(() => null) as Promise<any>,
      ]);
      const nextClasses = normalizeClasses(classRes.classes?.length ? classRes.classes : readJson(CLASS_CACHE_KEY));
      const nextSubjects = normalizeSubjects(subjectRes.subjects?.length ? subjectRes.subjects : readJson(SUBJECT_CACHE_KEY));
      const nextExams = Array.isArray(examRes.exams) && examRes.exams.length ? examRes.exams : readJson(EXAM_CACHE_KEY);
      setClasses(nextClasses); setSubjects(nextSubjects); setExams(nextExams);
      writeJson(CLASS_CACHE_KEY, nextClasses); writeJson(SUBJECT_CACHE_KEY, nextSubjects); writeJson(EXAM_CACHE_KEY, nextExams);
      setInstitution(profileRes?.institution || profileRes?.profile || null);
      const nextClassId = classId || nextClasses[0]?._id || "";
      const nextExam = nextExams.find((exam: any) => String(exam._id || exam.id) === String(examId)) || nextExams.find((exam: any) => !nextClassId || String(exam.classId?._id || exam.classId || "") === String(nextClassId)) || nextExams[0];
      setClassId(nextClassId); setExamId(nextExam?._id || nextExam?.id || ""); syncEditor(nextExam);
      if (!nextExams.length) showInfo("ℹ️ Exam পাওয়া যায়নি। আগে Academic > Exams থেকে exam তৈরি করুন।");
      else showSuccess(`✅ Exam routine data loaded. Exam: ${nextExams.length}, Subject: ${nextSubjects.length}.`, "Exam routine loaded");
    } catch (err: any) {
      showError(`❌ Exam routine load হয়নি। কারণ: ${err?.message || "Failed to load exam routine."}`);
    } finally { setLoading(false); }
  };

  useEffect(() => { load().catch(() => undefined); }, [role]);
  useEffect(() => { if (selectedExam) syncEditor(selectedExam); }, [examId]);

  const updateRow = (index: number, key: keyof EditRow, value: any) => setEditRows((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row));
  const addSubjectRow = (subject?: any) => {
    const used = new Set(editRows.map((row) => row.subjectId));
    const nextSubject = subject || classSubjects.find((item) => !used.has(item._id)) || classSubjects[0];
    if (!nextSubject) { showError("❌ Subject পাওয়া যায়নি। আগে Academic > Subjects থেকে subject add করুন।"); return; }
    setEditRows((rows) => [...rows, { subjectId: nextSubject._id, subjectName: nextSubject.name, subjectCode: nextSubject.code || "", date: "", duration: 120, totalMarks: 100, passingMarks: 33 }]);
  };
  const removeRow = (index: number) => setEditRows((rows) => rows.filter((_, rowIndex) => rowIndex !== index));
  const updateRowSubject = (index: number, subjectId: string) => {
    const subject = subjects.find((item) => item._id === subjectId) || classSubjects.find((item) => item._id === subjectId);
    setEditRows((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, subjectId, subjectName: subject?.name || row.subjectName, subjectCode: subject?.code || row.subjectCode } : row));
  };

  const saveRoutine = async () => {
    if (!selectedExam) return showError("❌ Exam select করা নেই।");
    setSaving(true); setError(""); setMessage("");
    try {
      const subjectMarks = editRows.filter((row) => row.subjectId && row.date).map((row) => ({ subjectId: row.subjectId, date: row.date, duration: Number(row.duration) || 120, totalMarks: Number(row.totalMarks) || 100, passingMarks: Number(row.passingMarks) || 33 }));
      if (!subjectMarks.length) throw new Error("At least one subject and date is required.");
      const sorted = [...subjectMarks].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const payload = { name: selectedExam.name, type: selectedExam.type || "term", classId: selectedExam.classId?._id || selectedExam.classId || classId, sectionId: selectedExam.sectionId?._id || selectedExam.sectionId || undefined, startDate: sorted[0].date, endDate: sorted[sorted.length - 1].date, approvalRequired: selectedExam.approvalRequired === true, status: selectedExam.status || "scheduled", isPublished: selectedExam.isPublished === true, instructions: selectedExam.instructions || "", syllabus: selectedExam.syllabus || "", subjectMarks: sorted };
      const result: any = await api.academic.exams.update(String(selectedExam._id || selectedExam.id), payload);
      const updatedExam = result?.exam || { ...selectedExam, ...payload, subjectMarks: editRows };
      setExams((current) => { const next = current.map((exam: any) => String(exam._id || exam.id) === String(selectedExam._id || selectedExam.id) ? updatedExam : exam); writeJson(EXAM_CACHE_KEY, next); return next; });
      showSuccess("✅ Exam routine save হয়েছে। Subject/date/marks update হয়েছে।", "Exam routine saved");
      await load();
    } catch (err: any) { showError(`❌ Exam routine save হয়নি। কারণ: ${err?.message || "Failed to save exam routine."}`); }
    finally { setSaving(false); }
  };

  const publishRoutine = async (publish: boolean) => {
    if (!selectedExam) return;
    setError(""); setMessage("");
    try {
      await apiClient.patch(`/academic/exams/${selectedExam._id || selectedExam.id}/public-routine`, { isPublished: publish });
      showSuccess(publish ? "✅ Exam routine published for students/parents." : "✅ Exam routine unpublished.", "Exam routine publish");
      await load();
    } catch (err: any) { showError(`❌ Publish update হয়নি। কারণ: ${err?.message || "Failed to update publish status."}`); }
  };

  const downloadPdf = async () => downloadElementPdf(printRef.current, `exam-routine-${selectedExam?.name || "routine"}.pdf`);

  return <div className="space-y-5">
    <style jsx global>{`@media print { body * { visibility: hidden !important; } #exam-routine-print, #exam-routine-print * { visibility: visible !important; } #exam-routine-print { position: absolute; left: 0; top: 0; width: 100%; padding: 18px; background: #fff; color: #000; box-shadow: none !important; border: 0 !important; } .no-print { display: none !important; } @page { size: A4 portrait; margin: 12mm; } }`}</style>
    <PageHeader title="Exam Routine" description="Exam routine create/edit/print/PDF. Save করলে Academic → Exams data update হবে।" icon={CalendarDays} status={<Badge variant="outline">{routineRows.length} subjects</Badge>} actions={[
      <Button key="lang" size="sm" variant="outline" onClick={() => setLanguage(language === "bn" ? "en" : "bn")}><Languages className="mr-2 h-4 w-4" />{language === "bn" ? "English" : "বাংলা"}</Button>,
      <Button key="refresh" size="sm" variant="outline" onClick={load}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>,
      canManage && <Button key="save" size="sm" disabled={saving || !selectedExam} onClick={saveRoutine}><Save className="mr-2 h-4 w-4" />{saving ? "Saving..." : "Save Routine"}</Button>,
      <Button key="print" size="sm" variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print</Button>,
      <Button key="pdf" size="sm" variant="outline" onClick={downloadPdf}><Download className="mr-2 h-4 w-4" />PDF</Button>,
      canManage && selectedExam && <Button key="publish" size="sm" variant="outline" onClick={() => publishRoutine(!selectedExam.isPublished)}><CheckCircle2 className="mr-2 h-4 w-4" />{selectedExam.isPublished ? "Unpublish" : "Publish"}</Button>,
    ].filter(Boolean) as any} />

    {message && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">{message}</div>}
    {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</div>}

    <section className="no-print rounded-lg border bg-card p-4 shadow-sm"><div className="grid gap-3 md:grid-cols-3"><label className="space-y-2"><span className="text-sm font-medium">Class</span><select className="h-10 w-full rounded-md border px-3 text-sm" value={classId} onChange={(e) => { setClassId(e.target.value); setExamId(""); }}><option value="">All classes</option>{classes.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select></label><label className="space-y-2 md:col-span-2"><span className="text-sm font-medium">Exam</span><select className="h-10 w-full rounded-md border px-3 text-sm" value={examId} onChange={(e) => setExamId(e.target.value)}><option value="">Select exam</option>{visibleExams.map((exam: any) => <option key={exam._id || exam.id} value={exam._id || exam.id}>{exam.name} {exam.classId?.name ? `- ${exam.classId.name}` : exam.className ? `- ${exam.className}` : ""}</option>)}</select></label></div></section>

    {canManage && <section className="no-print rounded-lg border bg-card p-4 shadow-sm"><div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold">Edit Exam Routine</h2><p className="text-xs text-muted-foreground">Subject row add করে date/marks set করুন, তারপর Save Routine চাপুন।</p></div><Button size="sm" variant="outline" onClick={() => addSubjectRow()}><Plus className="mr-2 h-4 w-4" />Add Subject Row</Button></div><div className="overflow-x-auto"><table className="w-full min-w-[860px] text-sm"><thead><tr className="border-b text-left"><th className="p-2">Subject</th><th className="p-2">Date</th><th className="p-2">Duration</th><th className="p-2">Full Marks</th><th className="p-2">Pass Marks</th><th className="p-2">Action</th></tr></thead><tbody>{editRows.length === 0 ? <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">No subject routine found. Add Subject Row দিয়ে শুরু করুন।</td></tr> : editRows.map((row, index) => <tr key={`${row.subjectId}-${index}`} className="border-b"><td className="p-2"><select className="h-9 min-w-[220px] rounded-md border px-2" value={row.subjectId} onChange={(e) => updateRowSubject(index, e.target.value)}><option value="">Select subject</option>{classSubjects.map((subject) => <option key={subject._id} value={subject._id}>{subject.name}</option>)}</select><div className="text-xs text-muted-foreground">{row.subjectCode}</div></td><td className="p-2"><input type="date" className="h-9 rounded-md border px-2" value={row.date} onChange={(e) => updateRow(index, "date", e.target.value)} /></td><td className="p-2"><input type="number" className="h-9 w-24 rounded-md border px-2" value={row.duration} onChange={(e) => updateRow(index, "duration", Number(e.target.value))} /></td><td className="p-2"><input type="number" className="h-9 w-24 rounded-md border px-2" value={row.totalMarks} onChange={(e) => updateRow(index, "totalMarks", Number(e.target.value))} /></td><td className="p-2"><input type="number" className="h-9 w-24 rounded-md border px-2" value={row.passingMarks} onChange={(e) => updateRow(index, "passingMarks", Number(e.target.value))} /></td><td className="p-2"><Button size="sm" variant="destructive" onClick={() => removeRow(index)}><Trash2 className="h-4 w-4" /></Button></td></tr>)}</tbody></table></div>{!classSubjects.length && <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">Subject পাওয়া যায়নি। আগে Academic &gt; Subjects থেকে subject add করুন।</div>}</section>}

    <div ref={printRef} id="exam-routine-print" className="mx-auto max-w-4xl rounded-lg border bg-white p-6 text-black shadow-sm"><div className="grid grid-cols-[1fr_auto_1fr] items-center border-b-2 border-black pb-3"><div className="text-left text-sm leading-tight"><h2 className="text-lg font-bold">{institution?.name || (language === "bn" ? "প্রতিষ্ঠানের নাম" : "School Name")}</h2><p>{institution?.address || (language === "bn" ? "প্রতিষ্ঠানের ঠিকানা" : "Address")}</p><p>EIIN: {institution?.eiin || "-"}</p><p>E-mail: {institution?.email || "-"}</p><p>{institution?.website || ""}</p></div><div className="flex h-16 w-20 items-center justify-center border text-xs font-bold">{label.logo}</div><div className="text-right text-sm leading-tight"><h2 className="text-lg font-bold uppercase">{institution?.name || "SCHOOL NAME"}</h2><p>{institution?.address || "Address"}</p><p>EIIN: {institution?.eiin || "-"}</p><p>E-mail: {institution?.email || "-"}</p><p>{institution?.website || ""}</p></div></div><div className="mt-4 flex justify-between text-sm"><p>{label.source}:</p><p>{label.date}: {localDate(new Date().toISOString(), language)}</p></div><div className="mt-2 text-center"><h1 className="text-xl font-bold underline">{selectedExam?.name || label.title}</h1><p className="text-sm">{label.class}: {selectedClass?.name || selectedExam?.classId?.name || selectedExam?.className || "-"} {selectedExam?.type ? `• ${selectedExam.type}` : ""}</p></div><table className="mt-5 w-full border-collapse text-center text-sm"><thead><tr><th className="border border-black p-2">{label.dateDay}</th><th className="border border-black p-2">{label.subject}</th><th className="border border-black p-2">{label.code}</th><th className="border border-black p-2">{label.time}</th><th className="border border-black p-2">{label.full}</th><th className="border border-black p-2">{label.pass}</th></tr></thead><tbody>{routineRows.length === 0 ? <tr><td className="border border-black p-6" colSpan={6}>{label.empty}</td></tr> : routineRows.map((row, index) => <tr key={index}><td className="border border-black p-2">{localDate(row.date, language)}<br />{dayName(row.date, language)}</td><td className="border border-black p-2 font-medium">{row.subjectName}</td><td className="border border-black p-2">{row.subjectCode || "-"}</td><td className="border border-black p-2">{minutesText(row.duration, language)}</td><td className="border border-black p-2">{row.totalMarks || "-"}</td><td className="border border-black p-2">{row.passingMarks || "-"}</td></tr>)}</tbody></table>{(selectedExam?.instructions || selectedExam?.syllabus) && <div className="mt-4 rounded border border-black p-3 text-sm">{selectedExam?.instructions && <p><strong>{label.instruction}:</strong> {selectedExam.instructions}</p>}{selectedExam?.syllabus && <p><strong>{label.syllabus}:</strong> {selectedExam.syllabus}</p>}</div>}<div className="mt-16 flex justify-end"><div className="text-center text-sm"><div className="mb-2 h-16 w-36 rounded-full border border-dashed border-black text-xs leading-[4rem]">{label.seal}</div><div className="border-t border-black px-4 pt-1 font-semibold">{label.sign}</div></div></div></div>
  </div>;
}
