"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpenCheck, Download, Plus, Printer, RefreshCw, Save, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, apiClient } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { printHtml } from "@/lib/export-utils";

const manageRoles = ["head", "assistant_head", "admin", "super_admin", "subject_teacher", "class_teacher"];
const SYLLABUS_CACHE_KEY = "easy-school-syllabus-cache-v2";
const CLASS_CACHE_KEY = "easy-school-syllabus-class-cache-v1";
const SUBJECT_CACHE_KEY = "easy-school-subject-cache-v2";
const termOptions = [
  { value: "full_year", label: "Full Year" },
  { value: "first_term", label: "First Term" },
  { value: "half_yearly", label: "Half Yearly" },
  { value: "second_term", label: "Second Term" },
  { value: "annual", label: "Annual" },
  { value: "custom", label: "Custom" },
];

const emptyForm = {
  title: "",
  classId: "",
  sectionId: "",
  subjectId: "",
  academicYear: String(new Date().getFullYear()),
  term: "full_year",
  objectives: "",
  instructions: "",
  attachmentUrl: "",
  status: "draft",
  chapters: [{ title: "", topics: "", weeks: "", marks: 0 }],
};

const esc = (value: unknown) => String(value ?? "-").replace(/[&<>'\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char] || char));
const toast = (title: string, message: string, type: "success" | "error" | "info" = "success") => {
  if (typeof window === "undefined") return;
  window.appToast?.({ title, message, type, duration: type === "success" ? 5500 : 7500 });
  window.dispatchEvent(new CustomEvent("app-toast", { detail: { title, message, type, duration: type === "success" ? 5500 : 7500 } }));
};
const readJson = (key: string) => {
  if (typeof window === "undefined") return [] as any[];
  try { const items = JSON.parse(localStorage.getItem(key) || "[]"); return Array.isArray(items) ? items : []; } catch { return []; }
};
const writeJson = (key: string, items: any[]) => {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify(items)); } catch { /* ignore */ }
};
const readCache = () => readJson(SYLLABUS_CACHE_KEY);
const writeCache = (items: any[]) => writeJson(SYLLABUS_CACHE_KEY, items);
const readSubjectCache = () => {
  const main = readJson(SUBJECT_CACHE_KEY);
  if (main.length) return main;
  return readJson("easy-school-syllabus-subject-cache-v1");
};
const normalizeItem = (item: any, classes: any[], subjects: any[]) => {
  const classId = String(item.classId?._id || item.classId || "");
  const subjectId = String(item.subjectId?._id || item.subjectId || "");
  const classObj = classes.find((x) => String(x._id) === classId);
  const subjectObj = subjects.find((x) => String(x._id) === subjectId);
  return {
    ...item,
    _id: String(item._id || `local-${Date.now()}-${Math.random().toString(36).slice(2)}`),
    title: item.title || "Untitled Syllabus",
    classId: typeof item.classId === "object" && item.classId?.name ? item.classId : classObj || item.classId,
    subjectId: typeof item.subjectId === "object" && item.subjectId?.name ? item.subjectId : subjectObj || item.subjectId,
    academicYear: item.academicYear || String(new Date().getFullYear()),
    term: item.term || "full_year",
    status: item.status || "draft",
    chapters: Array.isArray(item.chapters) && item.chapters.length ? item.chapters : [{ title: "Chapter 1", topics: "", weeks: "", marks: 0 }],
  };
};

export default function AcademicSyllabusPage() {
  const { user } = useAuth();
  const canManage = manageRoles.includes(user?.role || "");
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [syllabus, setSyllabus] = useState<any[]>([]);
  const [form, setForm] = useState<any>(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const showSuccess = useCallback((text: string, title = "Syllabus success / কাজ হয়েছে") => { setMessage(text); setError(""); toast(title, text, "success"); }, []);
  const showError = useCallback((text: string, title = "Syllabus error / কাজ হয়নি") => { setError(text); setMessage(""); toast(title, text, "error"); }, []);
  const showInfo = useCallback((text: string, title = "Syllabus info") => { setMessage(text); setError(""); toast(title, text, "info"); }, []);

  const filteredSubjects = useMemo(() => {
    if (!form.classId) return subjects;
    const matched = subjects.filter((item: any) => String(item.classId?._id || item.classId || "") === String(form.classId));
    return matched.length ? matched : subjects;
  }, [subjects, form.classId]);

  const mergeAndSetSyllabus = useCallback((items: any[], classItems = classes, subjectItems = subjects) => {
    const normalized = items.map((item) => normalizeItem(item, classItems, subjectItems));
    setSyllabus(normalized);
    writeCache(normalized);
    return normalized;
  }, [classes, subjects]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [classRes, subjectRes] = await Promise.all([
        api.academic.classes.getAll().catch(() => ({ classes: readJson(CLASS_CACHE_KEY) })) as Promise<any>,
        api.academic.subjects.getAll().catch(() => ({ subjects: readSubjectCache() })) as Promise<any>,
      ]);
      const nextClasses = Array.isArray(classRes.classes) && classRes.classes.length ? classRes.classes : readJson(CLASS_CACHE_KEY);
      const nextSubjects = Array.isArray(subjectRes.subjects) && subjectRes.subjects.length ? subjectRes.subjects : readSubjectCache();
      setClasses(nextClasses);
      setSubjects(nextSubjects);
      writeJson(CLASS_CACHE_KEY, nextClasses);
      writeJson(SUBJECT_CACHE_KEY, nextSubjects);

      let liveList: any[] = [];
      try {
        const syllabusRes: any = await apiClient.get("/syllabus");
        liveList = Array.isArray(syllabusRes?.syllabus) ? syllabusRes.syllabus : [];
      } catch {
        liveList = [];
      }

      const finalList = liveList.length ? liveList : readCache();
      const normalized = finalList.map((item) => normalizeItem(item, nextClasses, nextSubjects));
      setSyllabus(normalized);
      writeCache(normalized);
      setForm((current: any) => ({ ...current, classId: current.classId || nextClasses?.[0]?._id || "" }));
      if (nextClasses.length || nextSubjects.length) showSuccess(`✅ Class/Subject loaded. Class: ${nextClasses.length}, Subject: ${nextSubjects.length}.`, "Class subject loaded / লোড হয়েছে");
      if (normalized.length) showSuccess(`✅ Syllabus list loaded successfully. মোট ${normalized.length}টি syllabus পাওয়া গেছে।`, "Syllabus loaded / লোড হয়েছে");
      else if (!nextClasses.length) showInfo("ℹ️ Class পাওয়া যায়নি। আগে Academic > Classes থেকে class তৈরি করুন, তারপর syllabus add করুন।");
      else if (!nextSubjects.length) showInfo("ℹ️ Subject পাওয়া যায়নি। আগে Academic > Subjects থেকে subject তৈরি করুন, অথবা All subjects দিয়ে syllabus save করুন।");
      else showInfo("ℹ️ এখনো কোনো syllabus নেই। Add Syllabus form থেকে নতুন syllabus তৈরি করুন।");
    } catch (err: any) {
      const cached = readCache();
      if (cached.length) {
        setSyllabus(cached);
        showInfo(`ℹ️ Live API থেকে syllabus আসেনি, cached ${cached.length}টি syllabus দেখানো হচ্ছে।`, "Syllabus cache loaded");
      } else {
        showError(`❌ Syllabus/class/subject load হয়নি। কারণ: ${err?.message || "Failed to load syllabus."}`);
      }
    } finally {
      setLoading(false);
    }
  }, [showError, showInfo, showSuccess]);

  useEffect(() => { load().catch(() => undefined); }, [load]);

  const updateChapter = (index: number, key: string, value: any) => {
    setForm((current: any) => ({ ...current, chapters: current.chapters.map((chapter: any, i: number) => i === index ? { ...chapter, [key]: value } : chapter) }));
  };

  const addChapter = () => setForm((current: any) => ({ ...current, chapters: [...current.chapters, { title: "", topics: "", weeks: "", marks: 0 }] }));
  const removeChapter = (index: number) => setForm((current: any) => ({ ...current, chapters: current.chapters.filter((_: any, i: number) => i !== index) }));

  const resetForm = () => { setEditingId(""); setForm({ ...emptyForm, classId: classes[0]?._id || "" }); };

  const editItem = (item: any) => {
    setEditingId(item._id);
    setForm({
      title: item.title || "",
      classId: item.classId?._id || item.classId || "",
      sectionId: item.sectionId?._id || item.sectionId || "",
      subjectId: item.subjectId?._id || item.subjectId || "",
      academicYear: item.academicYear || String(new Date().getFullYear()),
      term: item.term || "full_year",
      objectives: item.objectives || "",
      instructions: item.instructions || "",
      attachmentUrl: item.attachmentUrl || "",
      status: item.status || "draft",
      chapters: item.chapters?.length ? item.chapters : [{ title: "", topics: "", weeks: "", marks: 0 }],
    });
  };

  const upsertLocal = (item: any) => {
    const normalized = normalizeItem(item, classes, subjects);
    setSyllabus((current) => {
      const map = new Map(current.map((entry) => [String(entry._id), entry]));
      map.set(String(normalized._id), normalized);
      const next = Array.from(map.values()).sort((a: any, b: any) => String(b._id).localeCompare(String(a._id)));
      writeCache(next);
      return next;
    });
    return normalized;
  };

  const save = async () => {
    setMessage(""); setError("");
    try {
      if (!form.title || !form.classId) throw new Error("Title and class are required.");
      const payload = { ...form, chapters: form.chapters.filter((chapter: any) => chapter.title || chapter.topics) };
      let response: any;
      if (editingId) response = await apiClient.put(`/syllabus/${editingId}`, payload);
      else response = await apiClient.post("/syllabus", payload);
      const saved = upsertLocal(response?.syllabus || { ...payload, _id: editingId || `local-${Date.now()}` });
      showSuccess(editingId ? `✅ Syllabus update হয়েছে: ${saved.title}. List update হয়েছে।` : `✅ Syllabus add হয়েছে: ${saved.title}. List update হয়েছে।`, editingId ? "Syllabus updated / আপডেট হয়েছে" : "Syllabus added / যোগ হয়েছে");
      resetForm();
      load().catch(() => undefined);
    } catch (err: any) { showError(`❌ Syllabus save হয়নি। কারণ: ${err?.message || "Failed to save syllabus."}`); }
  };

  const publish = async (item: any) => {
    setMessage(""); setError("");
    try {
      const status = item.status === "published" ? "draft" : "published";
      const response: any = await apiClient.patch(`/syllabus/${item._id}/publish`, { status });
      const saved = upsertLocal(response?.syllabus || { ...item, status });
      showSuccess(status === "published" ? `✅ Syllabus published হয়েছে: ${saved.title}.` : `✅ Syllabus unpublished/draft হয়েছে: ${saved.title}.`, "Syllabus status updated");
      load().catch(() => undefined);
    } catch (err: any) { showError(`❌ Syllabus publish/update হয়নি। কারণ: ${err?.message || "Failed to publish syllabus."}`); }
  };

  const remove = async (id: string) => {
    setMessage(""); setError("");
    try {
      await apiClient.delete(`/syllabus/${id}`);
      const deletedTitle = syllabus.find((item) => item._id === id)?.title || "Syllabus";
      const next = syllabus.filter((item) => item._id !== id);
      setSyllabus(next); writeCache(next);
      showSuccess(`✅ Syllabus delete হয়েছে: ${deletedTitle}.`, "Syllabus deleted / ডিলিট হয়েছে");
      load().catch(() => undefined);
    } catch (err: any) { showError(`❌ Syllabus delete হয়নি। কারণ: ${err?.message || "Failed to delete syllabus."}`); }
  };

  const printItem = async (item: any) => {
    const rows = (item.chapters || []).map((chapter: any, index: number) => `<tr><td>${index + 1}</td><td>${esc(chapter.title)}</td><td>${esc(chapter.topics)}</td><td>${esc(chapter.weeks)}</td><td>${esc(chapter.marks || "-")}</td></tr>`).join("");
    const body = `<main class="print-card"><h1>Academic Syllabus</h1><p><b>${esc(item.title)}</b></p><p>Class: ${esc(item.classId?.name || item.className)} | Subject: ${esc(item.subjectId?.name || "All Subjects")} | Year: ${esc(item.academicYear)}</p><h2>Objectives</h2><p>${esc(item.objectives)}</p><table><thead><tr><th>SL</th><th>Chapter</th><th>Topics</th><th>Weeks</th><th>Marks</th></tr></thead><tbody>${rows}</tbody></table><h2>Instructions</h2><p>${esc(item.instructions)}</p></main>`;
    const styles = `.print-card{border:1px solid #cbd5e1;border-radius:12px;padding:24px}h1{font-size:28px;margin:0 0 8px}h2{font-size:16px;margin:20px 0 8px}table{width:100%;border-collapse:collapse;margin-top:14px}th{background:#0f172a;color:#fff}th,td{border:1px solid #cbd5e1;padding:8px;font-size:12px}`;
    await printHtml(`Syllabus - ${item.title}`, body, styles, JSON.stringify({ type: "syllabus", id: item._id, title: item.title }));
  };

  return <div className="space-y-5">
    <PageHeader
      title="Academic Syllabus"
      description="Class and subject-wise syllabus create, publish, view, print and download."
      icon={BookOpenCheck}
      status={<Badge variant="outline">{syllabus.length} syllabus</Badge>}
      actions={[<Button key="refresh" size="sm" variant="outline" onClick={load}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>]}
    />

    {message && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">{message}</div>}
    {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</div>}

    {canManage && <section className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">{editingId ? "Edit Syllabus" : "Add Syllabus"}</h2>{editingId && <Button size="sm" variant="outline" onClick={resetForm}>Cancel Edit</Button>}</div>
      <div className="grid gap-3 md:grid-cols-3">
        <input className="h-10 rounded-md border px-3 text-sm" placeholder="Syllabus title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <select className="h-10 rounded-md border px-3 text-sm" value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value, subjectId: "" })}><option value="">Select class</option>{classes.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select>
        <select className="h-10 rounded-md border px-3 text-sm" value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}><option value="">All subjects</option>{filteredSubjects.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select>
        <input className="h-10 rounded-md border px-3 text-sm" placeholder="Academic year" value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} />
        <select className="h-10 rounded-md border px-3 text-sm" value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })}>{termOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
        <select className="h-10 rounded-md border px-3 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="draft">Draft</option><option value="published">Published</option></select>
      </div>
      <textarea className="mt-3 min-h-20 w-full rounded-md border p-3 text-sm" placeholder="Objectives" value={form.objectives} onChange={(e) => setForm({ ...form, objectives: e.target.value })} />
      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between"><h3 className="font-medium">Chapters / Topics</h3><Button size="sm" variant="outline" onClick={addChapter}><Plus className="mr-2 h-4 w-4" />Add Chapter</Button></div>
        {form.chapters.map((chapter: any, index: number) => <div key={index} className="grid gap-2 rounded-md border p-3 md:grid-cols-[1fr_1.6fr_120px_90px_auto]">
          <input className="h-10 rounded-md border px-3 text-sm" placeholder="Chapter" value={chapter.title} onChange={(e) => updateChapter(index, "title", e.target.value)} />
          <input className="h-10 rounded-md border px-3 text-sm" placeholder="Topics" value={chapter.topics} onChange={(e) => updateChapter(index, "topics", e.target.value)} />
          <input className="h-10 rounded-md border px-3 text-sm" placeholder="Weeks" value={chapter.weeks} onChange={(e) => updateChapter(index, "weeks", e.target.value)} />
          <input type="number" className="h-10 rounded-md border px-3 text-sm" placeholder="Marks" value={chapter.marks} onChange={(e) => updateChapter(index, "marks", Number(e.target.value))} />
          <Button variant="destructive" size="sm" onClick={() => removeChapter(index)}><Trash2 className="h-4 w-4" /></Button>
        </div>)}
      </div>
      <textarea className="mt-3 min-h-20 w-full rounded-md border p-3 text-sm" placeholder="Instructions" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
      <input className="mt-3 h-10 w-full rounded-md border px-3 text-sm" placeholder="Attachment URL / PDF link" value={form.attachmentUrl} onChange={(e) => setForm({ ...form, attachmentUrl: e.target.value })} />
      <Button className="mt-4" onClick={save} disabled={loading}><Save className="mr-2 h-4 w-4" />{editingId ? "Update Syllabus" : "Save Syllabus"}</Button>
    </section>}

    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {loading ? <div className="rounded-lg border p-6 text-muted-foreground">Loading syllabus...</div> : syllabus.length === 0 ? <div className="rounded-lg border p-6 text-muted-foreground">No syllabus found. Add a syllabus from the form above.</div> : syllabus.map((item) => <article key={item._id} className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold">{item.title}</h2><p className="mt-1 text-sm text-muted-foreground">{item.classId?.name || "Class"} • {item.subjectId?.name || "All subjects"} • {item.academicYear}</p></div><Badge variant={item.status === "published" ? "default" : "outline"}>{item.status}</Badge></div>
        {item.objectives && <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{item.objectives}</p>}
        <div className="mt-3 rounded-md border p-3 text-sm"><b>{item.chapters?.length || 0}</b> chapters/topics</div>
        <div className="mt-4 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => printItem(item)}><Printer className="mr-2 h-4 w-4" />Print/PDF</Button>{item.attachmentUrl && <Button size="sm" variant="outline" asChild><a href={item.attachmentUrl} target="_blank" rel="noreferrer"><Download className="mr-2 h-4 w-4" />Attachment</a></Button>}{canManage && <><Button size="sm" variant="outline" onClick={() => editItem(item)}>Edit</Button><Button size="sm" variant="outline" onClick={() => publish(item)}>{item.status === "published" ? "Unpublish" : "Publish"}</Button><Button size="sm" variant="destructive" onClick={() => remove(item._id)}><Trash2 className="h-4 w-4" /></Button></>}</div>
      </article>)}
    </section>
  </div>;
}
