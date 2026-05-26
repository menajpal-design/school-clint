"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, CalendarDays, Plus, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const canManageHomework = (role?: string) => ['head', 'assistant_head', 'class_teacher', 'subject_teacher', 'teacher'].includes(role || '');

export default function HomeworkPage() {
  const { user } = useAuth();
  const [homework, setHomework] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', subject: '', classId: '', dueDate: '' });

  const canManage = useMemo(() => canManageHomework(user?.role), [user?.role]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [homeworkResponse, classResponse] = await Promise.all([
        api.homework.getAll() as Promise<any>,
        api.academic.classes.getAll() as Promise<any>,
      ]);

      setHomework(homeworkResponse?.homework || []);
      setClasses(classResponse?.classes || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load homework');
      setHomework([]);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData().catch(() => undefined);
  }, []);

  const submit = async () => {
    if (!form.title || !form.classId || !form.dueDate) {
      setError('Please fill title, class, and due date.');
      return;
    }

    try {
      setError(null);
      await api.homework.create({
        title: form.title,
        description: form.description,
        subject: form.subject,
        classId: form.classId,
        dueDate: form.dueDate,
      });
      setOpen(false);
      setForm({ title: '', description: '', subject: '', classId: '', dueDate: '' });
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to create homework');
    }
  };

  const remove = async (id: string) => {
    try {
      await api.homework.delete(id);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete homework');
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Homework"
        description="Create and manage homework assignments for classes, and let students and parents review them from one place."
        icon={BookOpen}
        actions={canManage ? [{ label: 'Create Homework', icon: Plus, onClick: () => setOpen(true) }] : []}
      />

      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {loading ? (
        <div className="rounded-lg border border-border bg-card p-10 text-sm text-muted-foreground">Loading homework…</div>
      ) : homework.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-10 text-center text-muted-foreground">
          {canManage ? 'No homework created yet. Add your first assignment.' : 'No homework is available for your class right now.'}
        </div>
      ) : (
        <div className="grid gap-4">
          {homework.map((item) => (
            <article key={item._id} className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-slate-950">{item.title}</h2>
                    <Badge variant="outline">{item.classId?.name || 'Class'}</Badge>
                    {item.subject && <Badge variant="secondary">{item.subject}</Badge>}
                  </div>
                  <p className="max-w-3xl text-sm leading-6 text-slate-600">{item.description || 'No description added.'}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                    <span className="inline-flex items-center gap-1"><CalendarDays className="h-4 w-4" />Due {formatDate(item.dueDate)}</span>
                    <span className="inline-flex items-center gap-1"><BookOpen className="h-4 w-4" />{item.createdBy?.name || 'Teacher'}</span>
                  </div>
                </div>
                {canManage && (
                  <Button variant="outline" size="sm" onClick={() => remove(item._id)}>
                    <Trash2 className="mr-2 h-4 w-4" />Delete
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Homework</DialogTitle>
            <DialogDescription>Set the title, class, subject, and due date for the assignment.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Write assignment title" />
            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Mathematics" />
            </div>
            <div>
              <Label htmlFor="classId">Class</Label>
              <select id="classId" value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select class</option>
                {classes.map((item) => (
                  <option key={item._id} value={item._id}>{item.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="dueDate">Due date</Label>
              <Input id="dueDate" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <textarea id="description" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Add homework details or instructions" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit}>Save Homework</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
