"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarDays, ClipboardList, Edit, Plus, UsersRound } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

const types = ["academic", "finance", "discipline", "sports", "cultural", "other"];

export default function CommitteePage() {
  const [committees, setCommittees] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", type: "academic", chairmanId: "", meetingSchedule: "", responsibilities: "", description: "" });

  const load = async () => {
    const [committeeData, userData] = await Promise.all([api.committee.getAll(), api.users.getAll()]);
    setCommittees((committeeData as any).committee || []);
    setUsers((userData as any).users || []);
  };

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  const meetings = useMemo(() => committees.slice(0, 3).map((item) => ({
    title: item.name,
    schedule: item.meetingSchedule || "Monthly review",
    attendance: item.members?.length ? `${Math.max(1, item.members.length - 1)}/${item.members.length} present` : "Attendance pending",
  })), [committees]);

  const startEdit = (committee?: any) => {
    setEditing(committee || null);
    setForm(committee ? {
      name: committee.name || "",
      type: committee.type || "academic",
      chairmanId: committee.chairmanId?._id || committee.chairmanId || "",
      meetingSchedule: committee.meetingSchedule || "",
      responsibilities: (committee.responsibilities || []).join(", "),
      description: committee.description || "",
    } : { name: "", type: "academic", chairmanId: "", meetingSchedule: "", responsibilities: "", description: "" });
    setOpen(true);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const payload = { ...form, members: form.chairmanId ? [form.chairmanId] : [], formationDate: new Date() };
    if (editing?._id) await api.committee.update(editing._id, payload);
    else await api.committee.create(payload);
    setOpen(false);
    await load();
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Committee Management" description="Manage members, schedules, agenda and meeting records." icon={UsersRound} actions={[{ label: "Add Member", icon: Plus, onClick: () => startEdit() }]} />

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <Table>
          <TableHeader><TableRow className="bg-slate-50 hover:bg-slate-50"><TableHead>Committee</TableHead><TableHead>Chairman</TableHead><TableHead>Members</TableHead><TableHead>Schedule</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {committees.length === 0 ? <TableRow><TableCell colSpan={6} className="h-28 text-center text-slate-500">No committee records found.</TableCell></TableRow> : committees.map((item) => (
              <TableRow key={item._id}>
                <TableCell><div className="font-medium text-slate-950">{item.name}</div><div className="text-xs capitalize text-slate-500">{item.type}</div></TableCell>
                <TableCell>{item.chairmanId?.name || "-"}</TableCell>
                <TableCell>{item.members?.length || 0}</TableCell>
                <TableCell>{item.meetingSchedule || "Not scheduled"}</TableCell>
                <TableCell><Badge variant="outline">{item.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                <TableCell><div className="flex justify-end"><Button size="sm" variant="outline" onClick={() => startEdit(item)}><Edit className="mr-2 h-4 w-4" />Edit</Button></div></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h2 className="flex items-center gap-2 font-semibold text-slate-950"><ClipboardList className="h-5 w-5" />Agenda and Meeting Minutes</h2>
          <div className="mt-4 space-y-3">
            {committees.slice(0, 4).map((item) => <div key={item._id} className="rounded-md border border-slate-200 p-4"><div className="font-medium">{item.name}</div><p className="mt-1 text-sm text-slate-500">{item.description || item.responsibilities?.join(", ") || "Agenda will be added before the next meeting."}</p></div>)}
            {committees.length === 0 && <p className="text-sm text-slate-500">No agenda or minutes available.</p>}
          </div>
        </section>
        <section className="space-y-3">
          {meetings.length === 0 ? <div className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground shadow-sm">No meeting schedules found.</div> : meetings.map((meeting) => (
            <div key={meeting.title} className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3"><h3 className="font-semibold text-slate-950">{meeting.title}</h3><CalendarDays className="h-5 w-5 text-slate-400" /></div>
              <p className="mt-2 text-sm text-slate-500">{meeting.schedule}</p>
              <Badge variant="outline" className="mt-3">{meeting.attendance}</Badge>
            </div>
          ))}
        </section>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form onSubmit={submit} className="space-y-4">
            <DialogHeader><DialogTitle>{editing ? "Edit Committee Member" : "Add Committee Member"}</DialogTitle></DialogHeader>
            <Field label="Committee name"><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Type"><Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{types.map((type) => <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Chairman / member"><Select value={form.chairmanId} onValueChange={(value) => setForm({ ...form, chairmanId: value })}><SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger><SelectContent>{users.map((user) => <SelectItem key={user._id} value={user._id}>{user.name} ({user.role})</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Meeting schedule"><Input value={form.meetingSchedule} onChange={(e) => setForm({ ...form, meetingSchedule: e.target.value })} placeholder="Every first Sunday, 10:00 AM" /></Field>
            <Field label="Responsibilities"><Input value={form.responsibilities} onChange={(e) => setForm({ ...form, responsibilities: e.target.value })} placeholder="Comma separated" /></Field>
            <Field label="Agenda / minutes"><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
            <DialogFooter><Button type="submit">Save</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label className="mb-2 block">{label}</Label>{children}</div>;
}
