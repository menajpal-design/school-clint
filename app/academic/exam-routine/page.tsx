"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Download, Languages, Printer, RefreshCw, Save } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, apiClient } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/lib/utils";

type Lang = "bn" | "en";
type EditRow = { subjectId: string; subjectName: string; subjectCode?: string; date: string; duration: number; totalMarks: number; passingMarks: number };
type ExamRoutine = { _id?: string; id?: string; name: string; type?: string; classId?: any; sectionId?: any; startDate?: string; endDate?: string; status?: string; isPublished?: boolean; subjectMarks?: any[]; instructions?: string; syllabus?: string; approvalRequired?: boolean };

const manageRoles = ["head", "assistant_head", "admin", "super_admin", "subject_teacher"];
const t = {
  bn: { title: "পরীক্ষার রুটিন", source: "সূত্র", date: "তারিখ", class: "শ্রেণি", exam: "পরীক্ষা", dateDay: "তারিখ ও বার", subject: "বিষয়", code: "বিষয় কোড", time: "সময়", full: "পূর্ণমান", pass: "পাস নম্বর", instruction: "নির্দেশনা", syllabus: "সিলেবাস", sign: "প্রধান শিক্ষকের স্বাক্ষর", empty: "Exam Management-এ subject/date add করুন।", logo: "লোগো", seal: "সিল/স্বাক্ষর" },
  en: { title: "Exam Routine", source: "Ref", date: "Date", class: "Class", exam: "Exam", dateDay: "Date & Day", subject: "Subject", code: "Subject Code", time: "Duration", full: "Full Marks", pass: "Pass Marks", instruction: "Instructions", syllabus: "Syllabus", sign: "Head Teacher Signature", empty: "Add subject/date from Exam Management.", logo: "LOGO", seal: "Seal / Signature" },
};
const dayName = (date?: string, lang: Lang = "bn") => {
  if (!date) return "-";
  try { return new Date(date).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-US", { weekday: "long" }); } catch { return "-"; }
};
const localDate = (date?: string, lang: Lang = "bn") => {
  if (!date) return "-";
  try { return new Date(date).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-US"); } catch { return formatDate(date); }
};
const toInputDate = (date?: string) => date ? new Date(date).toISOString().slice(0, 10) : "";
const minutesText = (mins?: number, lang: Lang = "bn") => {
  if (!mins) return "-";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return lang === "bn" ? `${h} ঘন্টা${m ? ` ${m} মিনিট` : ""}` : `${h} hour${h > 1 ? "s" : ""}${m ? ` ${m} min` : ""}`;
};
const normalizeSubjectId = (item: any) => String(item.subjectId?._id || item.subjectId || "");

export default function ExamRoutinePage() {
  const { user } = useAuth();
  const canManage = manageRoles.includes(user?.role || "");
  const [classes, setClasses] = useState<any[]>([]);
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
  const visibleExams = useMemo(() => exams.filter((exam: any) => !classId || String(exam.classId?._id || exam.classId) === String(classId)), [exams, classId]);
  const selectedExam = useMemo(() => visibleExams.find((exam: any) => String(exam._id || exam.id) === String(examId)) || visibleExams[0] || exams[0], [visibleExams, exams, examId]);
  const selectedClass = classes.find((item) => item._id === classId) || selectedExam?.classId;

  const routineRows = useMemo(() => {
    const source = canManage && editRows.length ? editRows : (selectedExam?.subjectMarks || []).map((item: any) => ({
      subjectId: normalizeSubjectId(item),
      subjectName: item.subjectId?.name || item.subjectName || "-",
      subjectCode: item.subjectId?.code || item.subjectCode || "",
      date: toInputDate(item.date),
      duration: Number(item.duration || 120),
      totalMarks: Number(item.totalMarks || 100),
      passingMarks: Number(item.passingMarks || 33),
    }));
    return [...source].sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());
  }, [selectedExam, editRows, canManage]);

  const syncEditor = (exam: any) => {
    setEditRows((exam?.subjectMarks || []).map((item: any) => ({
      subjectId: normalizeSubjectId(item),
      subjectName: item.subjectId?.name || item.subjectName || "-",
      subjectCode: item.subjectId?.code || item.subjectCode || "",
      date: toInputDate(item.date),
      duration: Number(item.duration || 120),
      totalMarks: Number(item.totalMarks || 100),
      passingMarks: Number(item.passingMarks || 33),
    })));
  };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      if (canManage) {
        const [classRes, examRes, profileRes] = await Promise.all([api.academic.classes.getAll() as Promise<any>, api.academic.exams.getAll() as Promise<any>, api.institution.profile().catch(() => null) as Promise<any>]);
        const nextClasses = classRes.classes || [];
        const nextExams = examRes.exams || [];
        setClasses(nextClasses);
        setExams(nextExams);
        setInstitution(profileRes?.institution || profileRes?.profile || null);
        const nextClassId = classId || nextClasses[0]?._id || "";
        const nextExam = nextExams.find((exam: any) => String(exam._id) === String(examId)) || nextExams.find((exam: any) => !nextClassId || String(exam.classId?._id || exam.classId) === String(nextClassId)) || nextExams[0];
        setClassId(nextClassId);
        setExamId(nextExam?._id || "");
        syncEditor(nextExam);
      } else {
        const params = new URLSearchParams();
        if ((user as any)?.institutionId) params.set("institutionId", String((user as any).institutionId));
        const data = await apiClient.get(`/academic/public/exam-routines?${params.toString()}`) as any;
        const nextExams = (data.routines || []).map((item: any) => ({ ...item, _id: item.id, isPublished: true }));
        setInstitution(data.institution || null);
        setExams(nextExams);
        setExamId((current) => current || nextExams[0]?._id || "");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load exam routine.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load().catch(() => undefined); }, [canManage]);
  useEffect(() => { if (selectedExam && canManage) syncEditor(selectedExam); }, [examId]);

  const updateRow = (index: number, key: keyof EditRow, value: any) => setEditRows((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row));

  const saveRoutine = async () => {
    if (!selectedExam) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const subjectMarks = editRows.filter((row) => row.subjectId && row.date).map((row) => ({ subjectId: row.subjectId, date: row.date, duration: Number(row.duration) || 120, totalMarks: Number(row.totalMarks) || 100, passingMarks: Number(row.passingMarks) || 33 }));
      if (!subjectMarks.length) throw new Error("At least one subject/date is required.");
      const firstDate = subjectMarks[0].date;
      const lastDate = subjectMarks[subjectMarks.length - 1].date;
      const payload = { name: selectedExam.name, type: selectedExam.type || "term", classId: selectedExam.classId?._id || selectedExam.classId || classId, sectionId: selectedExam.sectionId?._id || selectedExam.sectionId || undefined, startDate: selectedExam.startDate || firstDate, endDate: selectedExam.endDate || lastDate, approvalRequired: selectedExam.approvalRequired === true, status: selectedExam.status || "scheduled", isPublished: selectedExam.isPublished === true, instructions: selectedExam.instructions || "", syllabus: selectedExam.syllabus || "", subjectMarks };
      await api.academic.exams.update(String(selectedExam._id || selectedExam.id), payload);
      setMessage("Exam routine updated. Exam Management route-এর একই exam data-ও update হয়েছে।");
      await load();
    } catch (err: any) {
      setError(err?.message || "Failed to save exam routine.");
    } finally {
      setSaving(false);
    }
  };

  const publishRoutine = async (publish: boolean) => {
    if (!selectedExam) return;
    setError("");
    setMessage("");
    try {
      await apiClient.patch(`/academic/exams/${selectedExam._id || selectedExam.id}/public-routine`, { isPublished: publish });
      setMessage(publish ? "Exam routine published for students/parents." : "Exam routine unpublished.");
      await load();
    } catch (err: any) { setError(err?.message || "Failed to update exam routine publish status."); }
  };

  return (
    <div className="space-y-5">
      <style jsx global>{`@media print { body * { visibility: hidden !important; } #exam-routine-print, #exam-routine-print * { visibility: visible !important; } #exam-routine-print { position: absolute; left: 0; top: 0; width: 100%; padding: 18px; background: #fff; color: #000; box-shadow: none !important; border: 0 !important; } .no-print { display: none !important; } @page { size: A4 portrait; margin: 12mm; } }`}</style>

      <PageHeader
        title="Exam Routine"
        description="এখানে routine edit করলে Academic → Exams route-এর exam data-ও update হবে। Routine Bangla/English দুই ভাষায় print/PDF করা যাবে।"
        icon={CalendarDays}
        status={<Badge variant="outline">{routineRows.length} subjects</Badge>}
        actions={[
          <Button key="lang" size="sm" variant="outline" onClick={() => setLanguage(language === "bn" ? "en" : "bn")}><Languages className="mr-2 h-4 w-4" />{language === "bn" ? "English" : "বাংলা"}</Button>,
          <Button key="refresh" size="sm" variant="outline" onClick={load}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>,
          canManage && <Button key="save" size="sm" disabled={saving || !selectedExam} onClick={saveRoutine}><Save className="mr-2 h-4 w-4" />{saving ? "Saving..." : "Save Routine"}</Button>,
          <Button key="print" size="sm" variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print</Button>,
          <Button key="pdf" size="sm" variant="outline" onClick={() => window.print()}><Download className="mr-2 h-4 w-4" />PDF</Button>,
          canManage && selectedExam && <Button key="publish" size="sm" variant="outline" onClick={() => publishRoutine(!selectedExam.isPublished)}><CheckCircle2 className="mr-2 h-4 w-4" />{selectedExam.isPublished ? "Unpublish" : "Publish"}</Button>,
        ].filter(Boolean) as any}
      />

      {message && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <section className="no-print rounded-lg border bg-card p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          {canManage && <label className="space-y-2"><span className="text-sm font-medium">Class</span><select className="h-10 w-full rounded-md border px-3 text-sm" value={classId} onChange={(e) => { setClassId(e.target.value); setExamId(""); }}><option value="">All classes</option>{classes.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select></label>}
          <label className="space-y-2 md:col-span-2"><span className="text-sm font-medium">Exam</span><select className="h-10 w-full rounded-md border px-3 text-sm" value={examId} onChange={(e) => setExamId(e.target.value)}>{visibleExams.map((exam: any) => <option key={exam._id || exam.id} value={exam._id || exam.id}>{exam.name} {exam.classId?.name ? `- ${exam.classId.name}` : exam.className ? `- ${exam.className}` : ""}</option>)}</select></label>
        </div>
      </section>

      {canManage && <section className="no-print rounded-lg border bg-card p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Edit Exam Routine</h2><p className="text-xs text-muted-foreground">Save করলে Exam route-এর subjectMarks/date/duration/marks update হবে।</p></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead><tr className="border-b text-left"><th className="p-2">Subject</th><th className="p-2">Date</th><th className="p-2">Duration</th><th className="p-2">Full Marks</th><th className="p-2">Pass Marks</th></tr></thead>
            <tbody>{editRows.length === 0 ? <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No subject routine found. First add subjectMarks in Exam Management.</td></tr> : editRows.map((row, index) => <tr key={`${row.subjectId}-${index}`} className="border-b"><td className="p-2"><div className="font-medium">{row.subjectName}</div><div className="text-xs text-muted-foreground">{row.subjectCode}</div></td><td className="p-2"><input type="date" className="h-9 rounded-md border px-2" value={row.date} onChange={(e) => updateRow(index, "date", e.target.value)} /></td><td className="p-2"><input type="number" className="h-9 w-24 rounded-md border px-2" value={row.duration} onChange={(e) => updateRow(index, "duration", Number(e.target.value))} /></td><td className="p-2"><input type="number" className="h-9 w-24 rounded-md border px-2" value={row.totalMarks} onChange={(e) => updateRow(index, "totalMarks", Number(e.target.value))} /></td><td className="p-2"><input type="number" className="h-9 w-24 rounded-md border px-2" value={row.passingMarks} onChange={(e) => updateRow(index, "passingMarks", Number(e.target.value))} /></td></tr>)}</tbody>
          </table>
        </div>
      </section>}

      <div id="exam-routine-print" className="mx-auto max-w-4xl rounded-lg border bg-white p-6 text-black shadow-sm">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center border-b-2 border-black pb-3">
          <div className="text-left text-sm leading-tight"><h2 className="text-lg font-bold">{institution?.name || (language === "bn" ? "প্রতিষ্ঠানের নাম" : "School Name")}</h2><p>{institution?.address || (language === "bn" ? "প্রতিষ্ঠানের ঠিকানা" : "Address")}</p><p>EIIN: {institution?.eiin || "-"}</p><p>E-mail: {institution?.email || "-"}</p><p>{institution?.website || ""}</p></div>
          <div className="flex h-16 w-20 items-center justify-center border text-xs font-bold">{label.logo}</div>
          <div className="text-right text-sm leading-tight"><h2 className="text-lg font-bold uppercase">{institution?.name || "SCHOOL NAME"}</h2><p>{institution?.address || "Address"}</p><p>EIIN: {institution?.eiin || "-"}</p><p>E-mail: {institution?.email || "-"}</p><p>{institution?.website || ""}</p></div>
        </div>

        <div className="mt-4 flex justify-between text-sm"><p>{label.source}:</p><p>{label.date}: {localDate(new Date().toISOString(), language)}</p></div>
        <div className="mt-2 text-center"><h1 className="text-xl font-bold underline">{selectedExam?.name || label.title}</h1><p className="text-sm">{label.class}: {selectedClass?.name || selectedExam?.classId?.name || selectedExam?.className || "-"} {selectedExam?.type ? `• ${selectedExam.type}` : ""}</p></div>

        <table className="mt-5 w-full border-collapse text-center text-sm"><thead><tr><th className="border border-black p-2">{label.dateDay}</th><th className="border border-black p-2">{label.subject}</th><th className="border border-black p-2">{label.code}</th><th className="border border-black p-2">{label.time}</th><th className="border border-black p-2">{label.full}</th><th className="border border-black p-2">{label.pass}</th></tr></thead><tbody>{routineRows.length === 0 ? <tr><td className="border border-black p-6" colSpan={6}>{label.empty}</td></tr> : routineRows.map((row, index) => <tr key={index}><td className="border border-black p-2">{localDate(row.date, language)}<br />{dayName(row.date, language)}</td><td className="border border-black p-2 font-medium">{row.subjectName}</td><td className="border border-black p-2">{row.subjectCode || "-"}</td><td className="border border-black p-2">{minutesText(row.duration, language)}</td><td className="border border-black p-2">{row.totalMarks || "-"}</td><td className="border border-black p-2">{row.passingMarks || "-"}</td></tr>)}</tbody></table>

        {(selectedExam?.instructions || selectedExam?.syllabus) && <div className="mt-4 rounded border border-black p-3 text-sm">{selectedExam?.instructions && <p><strong>{label.instruction}:</strong> {selectedExam.instructions}</p>}{selectedExam?.syllabus && <p><strong>{label.syllabus}:</strong> {selectedExam.syllabus}</p>}</div>}
        <div className="mt-16 flex justify-end"><div className="text-center text-sm"><div className="mb-2 h-16 w-36 rounded-full border border-dashed border-black text-xs leading-[4rem]">{label.seal}</div><div className="border-t border-black px-4 pt-1 font-semibold">{label.sign}</div></div></div>
      </div>
    </div>
  );
}
