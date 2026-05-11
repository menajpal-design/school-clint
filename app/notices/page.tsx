"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { CalendarClock, FileText, Megaphone, Paperclip, Plus } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

const categories = ["general", "academic", "finance", "event", "urgent"];
const audiences = ["all", "class", "role", "parent", "staff"];

export default function NoticesPage() {
  const [notices, setNotices] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [form, setForm] = useState({
    title: "",
    content: "",
    category: "general",
    priority: "medium",
    targetAudience: "all",
    schedulePublish: false,
    publishedAt: "",
    expiryDate: "",
    idCardRenewal: false,
  });

  const load = async () => {
    const data = await api.notices.getAll() as any;
    setNotices(data.notices || []);
  };

  useEffect(() => {
    load().catch(() => setNotices([]));
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => body.append(key, String(value)));
    body.append("targetRoles", form.idCardRenewal ? "all,id_card_renewal" : form.targetAudience);
    if (attachment) body.append("attachment", attachment);
    await api.notices.create(body);
    setOpen(false);
    setAttachment(null);
    setForm({ title: "", content: "", category: "general", priority: "medium", targetAudience: "all", schedulePublish: false, publishedAt: "", expiryDate: "", idCardRenewal: false });
    await load();
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Notice Board"
        description="Publish announcements, scheduled notices and ID card renewal reminders."
        icon={Megaphone}
        actions={[{ label: "Create Notice", icon: Plus, onClick: () => setOpen(true) }]}
      />

      <section className="grid gap-4">
        {notices.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">No notices published yet.</div>
        ) : notices.map((notice) => (
          <article key={notice._id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
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
              {notice.targetRoles?.includes("id_card_renewal") && <span className="inline-flex items-center gap-1"><FileText className="h-3.5 w-3.5" />ID card renewal</span>}
            </div>
          </article>
        ))}
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={submit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Create Notice</DialogTitle>
              <DialogDescription>Post immediately or schedule a notice for a selected audience.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Title" className="md:col-span-2"><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
              <Field label="Category"><Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{categories.map((item) => <SelectItem key={item} value={item} className="capitalize">{item}</SelectItem>)}</SelectContent></Select></Field>
              <Field label="Priority"><Select value={form.priority} onValueChange={(value) => setForm({ ...form, priority: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["low", "medium", "high"].map((item) => <SelectItem key={item} value={item} className="capitalize">{item}</SelectItem>)}</SelectContent></Select></Field>
              <Field label="Target audience"><Select value={form.targetAudience} onValueChange={(value) => setForm({ ...form, targetAudience: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{audiences.map((item) => <SelectItem key={item} value={item} className="capitalize">{item}</SelectItem>)}</SelectContent></Select></Field>
              <Field label="Attach file"><Input type="file" onChange={(event: ChangeEvent<HTMLInputElement>) => setAttachment(event.target.files?.[0] || null)} /></Field>
              <Field label="Content" className="md:col-span-2"><Textarea required value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></Field>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.schedulePublish} onChange={(e) => setForm({ ...form, schedulePublish: e.target.checked })} />Schedule publish</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.idCardRenewal} onChange={(e) => setForm({ ...form, idCardRenewal: e.target.checked })} />ID card renewal notice</label>
              {form.schedulePublish && <Field label="Publish at"><Input type="datetime-local" value={form.publishedAt} onChange={(e) => setForm({ ...form, publishedAt: e.target.value })} /></Field>}
              <Field label="Expiry date"><Input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} /></Field>
            </div>
            <DialogFooter><Button type="submit">Publish Notice</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return <div className={className}><Label className="mb-2 block">{label}</Label>{children}</div>;
}
