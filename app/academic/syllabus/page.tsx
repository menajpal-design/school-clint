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

  const filteredSubjects = useMemo(() => {
    if (!form.classId) return subjects;
    return subjects.filter((item: any) => String(item.classId?._id || item.classId) === String(form.classId));
  }, [subjects, form.classId]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [syllabusRes, classRes, subjectRes] = await Promise.all([
        apiClient.get("/syllabus") as Promise<any>,
        canManage ? api.academic.classes.getAll().catch(() => ({ classes: [] })) as Promise<any> : Promise.resolve({ classes: [] }),
        canManage ? api.academic.subjects.getAll().catch(() => ({ subjects: [] })) as Promise<any> : Promise.resolve({ subjects: [] }),
      ]);
      setSyllabus(syllabusRes.syllabus || []);
      setClasses(classRes.classes || []);
      setSubjects(subjectRes.subjects || []);
      setForm((current: any) => ({ ...current, classId: current.classId || classRes.classes?.[0]?._id || "" }));
    } catch (err: any) {
      setError(err?.message || "Failed to load syllabus.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load().catch(() => undefined); }, []);

  const updateChapter = (index: number, key: string, value: any) => {
    setForm((current: any) => ({ ...current, chapters: current.chapters.map((chapter: any, i: number) => i === index ? { ...chapter, [key]: value } : chapter) }));
  };

  const addChapter = () => setForm((current: any) => ({ ...current, chapters: [...current.chapters, { title: "", topics: "", weeks: "", marks: 0 }] }));
  const removeChapter = (index: number) => setForm((current: any) => ({ ...current, chapters: current.chapters.filter((_: any, i: number) => i !== index) }));

  const resetForm = () => { setEditingId(""); setForm(emptyForm); };

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

  const save = async () => {
    setMessage(""); setError("");
    try {
      if (!form.title || !form.classId) throw new Error("Title and class are required.");
      const payload = { ...form, chapters: form.chapters.filter((chapter: any) => chapter.title || chapter.topics) };
      if (editingId) await apiClient.put(`/syllabus/${editingId}`, payload);
      else await apiClient.post("/syllabus", payload);
      setMessage(editingId ? "Syllabus updated." : "Syllabus created.");
      resetForm();
      await load();
    } catch (err: any) { setError(err?.message || "Failed to save syllabus."); }
  };

  const publish = async (item: any) => {
    setMessage(""); setError("");
    try {
      const status = item.status === "published" ? "draft" : "published";
      await apiClient.patch(`/syllabus/${item._id}/publish`, { status });
      setMessage(status === "published" ? "Syllabus published." : "Syllabus unpublished.");
      await load();
    } catch (err: any) { setError(err?.message || "Failed to publish syllabus."); }
  };

  const remove = async (id: string) => {
    setMessage(""); setError("");
    try {
      await apiClient.delete(`/syllabus/${id}`);
      setMessage("Syllabus deleted.");
      await load();
    } catch (err: any) { setError(err?.message || "Failed to delete syllabus."); }
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

    {message && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}
    {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

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
      <Button className="mt-4" onClick={save}><Save className="mr-2 h-4 w-4" />{editingId ? "Update Syllabus" : "Save Syllabus"}</Button>
    </section>}

    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {loading ? <div className="rounded-lg border p-6 text-muted-foreground">Loading...</div> : syllabus.length === 0 ? <div className="rounded-lg border p-6 text-muted-foreground">No syllabus found.</div> : syllabus.map((item) => <article key={item._id} className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold">{item.title}</h2><p className="mt-1 text-sm text-muted-foreground">{item.classId?.name || "Class"} • {item.subjectId?.name || "All subjects"} • {item.academicYear}</p></div><Badge variant={item.status === "published" ? "default" : "outline"}>{item.status}</Badge></div>
        {item.objectives && <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{item.objectives}</p>}
        <div className="mt-3 rounded-md border p-3 text-sm"><b>{item.chapters?.length || 0}</b> chapters/topics</div>
        <div className="mt-4 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => printItem(item)}><Printer className="mr-2 h-4 w-4" />Print/PDF</Button>{item.attachmentUrl && <Button size="sm" variant="outline" asChild><a href={item.attachmentUrl} target="_blank" rel="noreferrer"><Download className="mr-2 h-4 w-4" />Attachment</a></Button>}{canManage && <><Button size="sm" variant="outline" onClick={() => editItem(item)}>Edit</Button><Button size="sm" variant="outline" onClick={() => publish(item)}>{item.status === "published" ? "Unpublish" : "Publish"}</Button><Button size="sm" variant="destructive" onClick={() => remove(item._id)}><Trash2 className="h-4 w-4" /></Button></>}</div>
      </article>)}
    </section>
  </div>;
}
