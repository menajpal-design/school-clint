"use client";

import { ChangeEvent, FormEvent, ReactNode, useEffect, useState } from "react";
import { CalendarClock, Edit3, FileText, Megaphone, Paperclip, Plus, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

const categories = ["general", "academic", "finance", "event", "urgent"];
const audiences = ["all", "class", "role", "parent", "staff"];

const initialForm = {
  title: "",
  content: "",
  category: "general",
  priority: "medium",
  targetAudience: "all",
  schedulePublish: false,
  publishedAt: "",
  expiryDate: "",
  idCardRenewal: false,
};

export default function NoticesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { addToast } = useToast();

  const [notices, setNotices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [open, setOpen] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [editingNotice, setEditingNotice] = useState<any | null>(null);
  const [form, setForm] = useState(initialForm);

  const canManageNotices = !authLoading && !!user && (
    ["admin", "super_admin", "head", "assistant_head", "staff", "committee_member"].includes(user.role)
    || (Array.isArray(user.permissions) && user.permissions.includes("post:notice"))
  );

  const load = async () => {
    setIsLoading(true);
    setStatus(null);
    try {
      const data = await api.notices.getAll() as any;
      setNotices(data.notices || []);
    } catch (error: any) {
      setNotices([]);
      const message = error?.message || "Notice board load failed.";
      setStatus({ type: "error", message });
      addToast({ title: "Notice Board", message, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  const resetForm = () => {
    setForm(initialForm);
    setAttachment(null);
    setEditingNotice(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setOpen(true);
  };

  const openEditDialog = (notice: any) => {
    setEditingNotice(notice);
    setForm({
      title: notice.title || "",
      content: notice.content || "",
      category: notice.category || "general",
      priority: notice.priority || "medium",
      targetAudience: notice.targetAudience || "all",
      schedulePublish: !notice.isPublished,
      publishedAt: notice.publishedAt ? new Date(notice.publishedAt).toISOString().slice(0, 16) : "",
      expiryDate: notice.expiryDate ? new Date(notice.expiryDate).toISOString().slice(0, 10) : "",
      idCardRenewal: Array.isArray(notice.targetRoles) ? notice.targetRoles.includes("id_card_renewal") : false,
    });
    setAttachment(null);
    setOpen(true);
  };

  const handleDelete = async (notice: any) => {
    if (!canManageNotices) return;
    if (!window.confirm(`Delete notice "${notice.title}"?`)) return;

    try {
      setStatus({ type: "info", message: "Deleting notice..." });
      await api.notices.delete(notice._id);
      addToast({ title: "Notice deleted", message: `${notice.title} removed successfully.`, type: "success" });
      setStatus({ type: "success", message: "Notice deleted successfully." });
      await load();
    } catch (error: any) {
      const message = error?.message || "Delete failed.";
      setStatus({ type: "error", message });
      addToast({ title: "Delete failed", message, type: "error" });
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canManageNotices) return;

    setIsSaving(true);
    setStatus({ type: "info", message: editingNotice ? "Updating notice..." : "Publishing notice..." });

    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => body.append(key, String(value)));
      body.append("targetRoles", form.idCardRenewal ? "all,id_card_renewal" : form.targetAudience);
      if (attachment) body.append("attachment", attachment);

      if (editingNotice) {
        await api.notices.update(editingNotice._id, body);
        addToast({ title: "Notice updated", message: `${form.title} updated successfully.`, type: "success" });
        setStatus({ type: "success", message: "Notice updated successfully." });
      } else {
        await api.notices.create(body);
        addToast({ title: "Notice published", message: `${form.title} is now available.`, type: "success" });
        setStatus({ type: "success", message: "Notice published successfully." });
      }

      setOpen(false);
      resetForm();
      await load();
    } catch (error: any) {
      const message = error?.message || (editingNotice ? "Update failed." : "Publish failed.");
      setStatus({ type: "error", message });
      addToast({ title: editingNotice ? "Update failed" : "Publish failed", message, type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Notice Board"
        description="Publish announcements, scheduled notices, and school updates in one place."
        icon={Megaphone}
        actions={canManageNotices ? [{ label: "Create Notice", icon: Plus, onClick: openCreateDialog }] : []}
      />

      {status && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${status.type === "error" ? "border-red-200 bg-red-50 text-red-700" : status.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-blue-200 bg-blue-50 text-blue-700"}`}>
          {status.message}
        </div>
      )}

      {!canManageNotices && (
        <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          Read-only view. Only authorized staff can create or manage notices.
        </div>
      )}

      <section className="grid gap-4">
        {isLoading ? (
          <div className="rounded-lg border border-border bg-card p-10 text-center text-muted-foreground shadow-sm">Loading notices...</div>
        ) : notices.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-10 text-center text-muted-foreground shadow-sm">No notices published yet.</div>
        ) : notices.map((notice) => (
          <article key={notice._id} className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-slate-950">{notice.title}</h2>
                  <Badge variant="outline" className="capitalize">{notice.category}</Badge>
                  {(notice.priority === "high" || notice.category === "urgent") && <Badge className="bg-rose-600 text-white">Urgent</Badge>}
                </div>
                <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">{notice.content}</p>
              </div>
              <div className="text-sm text-slate-500">{notice.publishedAt ? formatDate(notice.publishedAt) : "Scheduled"}</div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" />{notice.isPublished ? "Published" : "Scheduled"}</span>
              {notice.attachments?.length > 0 && <span className="inline-flex items-center gap-1"><Paperclip className="h-3.5 w-3.5" />{notice.attachments.length} attachment</span>}
              {Array.isArray(notice.targetRoles) && notice.targetRoles.includes("id_card_renewal") && <span className="inline-flex items-center gap-1"><FileText className="h-3.5 w-3.5" />ID card renewal</span>}
            </div>

            {canManageNotices && (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => openEditDialog(notice)}>
                  <Edit3 className="mr-2 h-4 w-4" />Edit
                </Button>
                <Button type="button" variant="destructive" size="sm" onClick={() => handleDelete(notice)}>
                  <Trash2 className="mr-2 h-4 w-4" />Delete
                </Button>
              </div>
            )}
          </article>
        ))}
      </section>

      <Dialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          if (!value) resetForm();
        }}
      >
        <DialogContent className="max-w-2xl">
          <form onSubmit={submit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{editingNotice ? "Edit Notice" : "Create Notice"}</DialogTitle>
              <DialogDescription>{editingNotice ? "Update the notice details and visibility settings." : "Post immediately or schedule a notice for a selected audience."}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Title" className="md:col-span-2">
                <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </Field>
              <Field label="Category">
                <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((item) => (
                      <SelectItem key={item} value={item} className="capitalize">{item}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Priority">
                <Select value={form.priority} onValueChange={(value) => setForm({ ...form, priority: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['low', 'medium', 'high'].map((item) => (
                      <SelectItem key={item} value={item} className="capitalize">{item}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Target audience">
                <Select value={form.targetAudience} onValueChange={(value) => setForm({ ...form, targetAudience: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {audiences.map((item) => (
                      <SelectItem key={item} value={item} className="capitalize">{item}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Attach file">
                <Input type="file" onChange={(event: ChangeEvent<HTMLInputElement>) => setAttachment(event.target.files?.[0] || null)} />
              </Field>
              <Field label="Content" className="md:col-span-2">
                <Textarea required value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.schedulePublish} onChange={(e) => setForm({ ...form, schedulePublish: e.target.checked })} />
                Schedule publish
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.idCardRenewal} onChange={(e) => setForm({ ...form, idCardRenewal: e.target.checked })} />
                ID card renewal notice
              </label>
              {form.schedulePublish && (
                <Field label="Publish at">
                  <Input type="datetime-local" value={form.publishedAt} onChange={(e) => setForm({ ...form, publishedAt: e.target.value })} />
                </Field>
              )}
              <Field label="Expiry date">
                <Input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
              </Field>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : editingNotice ? "Update Notice" : "Publish Notice"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div className={className}>
      <Label className="mb-2 block">{label}</Label>
      {children}
    </div>
  );
}
