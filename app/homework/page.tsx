"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, CalendarDays, Filter, Plus, RefreshCw, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { apiClient } from "@/lib/api";
import { canPerformAction, normalizeUserRole } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const today = () => new Date().toISOString().slice(0, 10);
const toast = (title: string, message: string, type: "success" | "error" | "info" = "success") => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("app-toast", { detail: { title, message, type, duration: type === "error" ? 7000 : 4500 } }));
};

export default function HomeworkPage() {
  const { user } = useAuth();
  const role = normalizeUserRole(user?.role) || "";
  const [homework, setHomework] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ date: role === "student" ? today() : "", subject: "", classId: "", sectionId: "" });
  const [form, setForm] = useState({ title: "", description: "", subject: "", classId: "", sectionId: "", dueDate: today(), assignedDate: today() });

  const canManage = useMemo(() => canPerformAction(role, "homework:create"), [role]);
  const isLearnerView = role === "student" || role === "parent";
  const selectedClass = classes.find((item) => item._id === form.classId || item._id === filters.classId);
  const sectionOptions = selectedClass?.sections?.filter((section: any) => section.isActive !== false) || [];

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (filters.date) params.set("date", filters.date);
    if (filters.subject.trim()) params.set("subject", filters.subject.trim());
    if (canManage && filters.classId) params.set("classId", filters.classId);
    if (canManage && filters.sectionId) params.set("sectionId", filters.sectionId);
    const query = params.toString();
    return query ? `?${query}` : "";
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const homeworkResponse = await apiClient.get(`/homework${buildQuery()}`) as any;
      setHomework(homeworkResponse?.homework || []);
      if (canManage) {
        const classResponse = await api.academic.classes.getAll() as any;
        setClasses(classResponse?.classes || []);
      }
    } catch (err: any) {
      const message = err?.message || "Failed to load homework";
      setError(message);
      setHomework([]);
      setClasses([]);
      toast("Homework load failed", message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setFilters((prev) => ({ ...prev, date: role === "student" ? prev.date || today() : prev.date }));
  }, [role]);

  useEffect(() => {
    if (user) loadData().catch(() => undefined);
  }, [user, role, canManage]);

  const submit = async () => {
    if (!canManage) return;
    if (!form.title.trim() || !form.classId || !form.dueDate) {
      setError("Please fill title, class, and due date.");
      toast("Missing information", "Please fill title, class, and due date.", "error");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const response: any = await apiClient.post("/homework", {
        title: form.title,
        description: form.description,
        subject: form.subject,
        classId: form.classId,
        sectionId: form.sectionId || undefined,
        dueDate: form.dueDate,
        assignedDate: form.assignedDate,
      });
      toast("Homework created", response?.message || "Homework created successfully.", "success");
      setOpen(false);
      setForm({ title: "", description: "", subject: "", classId: "", sectionId: "", dueDate: today(), assignedDate: today() });
      await loadData();
    } catch (err: any) {
      const message = err?.message || "Failed to create homework";
      setError(message);
      toast("Homework create failed", message, "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!canManage) return;
    try {
      setSaving(true);
      const response: any = await apiClient.delete(`/homework/${id}`);
      toast("Homework deleted", response?.message || "Homework deleted", "success");
      await loadData();
    } catch (err: any) {
      const message = err?.message || "Failed to delete homework";
      setError(message);
      toast("Homework delete failed", message, "error");
    } finally {
      setSaving(false);
    }
  };

  const visibleHomework = homework;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Homework"
        description={isLearnerView ? "Read-only homework for your own class or linked child class." : "Create, filter, and manage homework for allowed classes."}
        icon={BookOpen}
        status={<Badge variant="outline">{visibleHomework.length} homework</Badge>}
        actions={canManage ? [
          <Button key="create" onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />Create Homework</Button>,
          <Button key="refresh" variant="outline" onClick={() => loadData().catch(() => undefined)}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>,
        ] : [<Button key="refresh" variant="outline" onClick={() => loadData().catch(() => undefined)}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>]}
      />

      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {isLearnerView && (
        <section className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 shadow-sm">
          <strong>Read only:</strong> You can only view homework assigned to your own class/section or linked child. Add, edit, and delete actions are hidden and blocked by backend.
        </section>
      )}

      <section className="rounded-2xl border bg-card p-4 shadow-sm md:p-5">
        <div className="mb-3 flex items-center gap-2"><Filter className="h-5 w-5" /><h2 className="text-lg font-semibold">Filters</h2></div>
        <div className="grid gap-3 md:grid-cols-4">
          <label className="space-y-2"><span className="text-sm font-medium">Date</span><Input type="date" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} /></label>
          <label className="space-y-2"><span className="text-sm font-medium">Subject</span><Input value={filters.subject} onChange={(e) => setFilters({ ...filters, subject: e.target.value })} placeholder="Math, English..." /></label>
          {canManage && <label className="space-y-2"><span className="text-sm font-medium">Class</span><select className="h-10 w-full rounded-md border px-3 text-sm" value={filters.classId} onChange={(e) => setFilters({ ...filters, classId: e.target.value, sectionId: "" })}><option value="">All allowed classes</option>{classes.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select></label>}
          {canManage && <label className="space-y-2"><span className="text-sm font-medium">Section</span><select className="h-10 w-full rounded-md border px-3 text-sm" value={filters.sectionId} onChange={(e) => setFilters({ ...filters, sectionId: e.target.value })}><option value="">All sections</option>{sectionOptions.map((item: any) => <option key={item._id} value={item._id}>{item.name}</option>)}</select></label>}
        </div>
        <div className="mt-4 flex flex-wrap gap-2"><Button onClick={() => loadData().catch(() => undefined)}>Apply filters</Button><Button variant="outline" onClick={() => { setFilters({ date: role === "student" ? today() : "", subject: "", classId: "", sectionId: "" }); setTimeout(() => loadData().catch(() => undefined), 0); }}>Reset</Button></div>
      </section>

      {loading ? (
        <div className="rounded-lg border border-border bg-card p-10 text-sm text-muted-foreground">Loading homework…</div>
      ) : visibleHomework.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-10 text-center text-muted-foreground">
          {canManage ? "No homework created yet. Add your first assignment." : filters.date ? "No homework found for the selected date." : "No homework is available for your class right now."}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleHomework.map((item) => (
            <article key={item._id} className="rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-slate-950">{item.title}</h2>
                  <Badge variant="outline">{item.classId?.name || "Class"}</Badge>
                  {item.sectionId?.name && <Badge variant="outline">Section {item.sectionId.name}</Badge>}
                  {item.subject && <Badge variant="secondary">{item.subject}</Badge>}
                </div>
                <p className="text-sm leading-6 text-slate-600">{item.description || "No description added."}</p>
                <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-1"><CalendarDays className="h-4 w-4" />Due {formatDate(item.dueDate)}</span>
                  <span className="inline-flex items-center gap-1"><BookOpen className="h-4 w-4" />{item.createdBy?.name || "Teacher"}</span>
                </div>
                {canManage && (
                  <Button variant="outline" size="sm" onClick={() => remove(item._id)} disabled={saving}>
                    <Trash2 className="mr-2 h-4 w-4" />Delete
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {canManage && <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Homework</DialogTitle>
            <DialogDescription>Set the title, class, section, subject, assigned date, and due date for the assignment.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div><Label htmlFor="title">Title</Label><Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Write assignment title" /></div>
            <div><Label htmlFor="subject">Subject</Label><Input id="subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Mathematics" /></div>
            <div className="grid gap-3 md:grid-cols-2">
              <div><Label htmlFor="classId">Class</Label><select id="classId" value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value, sectionId: "" })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="">Select class</option>{classes.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select></div>
              <div><Label htmlFor="sectionId">Section</Label><select id="sectionId" value={form.sectionId} onChange={(e) => setForm({ ...form, sectionId: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="">All sections</option>{sectionOptions.map((item: any) => <option key={item._id} value={item._id}>{item.name}</option>)}</select></div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div><Label htmlFor="assignedDate">Assigned date</Label><Input id="assignedDate" type="date" value={form.assignedDate} onChange={(e) => setForm({ ...form, assignedDate: e.target.value })} /></div>
              <div><Label htmlFor="dueDate">Due date</Label><Input id="dueDate" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></div>
            </div>
            <div><Label htmlFor="description">Description</Label><textarea id="description" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Add homework details or instructions" /></div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={saving}>{saving ? "Saving..." : "Save Homework"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>}
    </div>
  );
}
