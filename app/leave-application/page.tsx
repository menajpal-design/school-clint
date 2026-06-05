"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Send, XCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

const approvalRoles = ["head", "assistant_head", "class_teacher", "admin", "super_admin"];
const applicantRoles = ["student", "parent", "teacher", "subject_teacher", "class_teacher", "staff", "finance_officer", "librarian"];
const employeeLeaveRoles = ["teacher", "subject_teacher", "class_teacher", "staff", "finance_officer", "librarian"];
const statusClass: Record<string, string> = { pending: "border-amber-200 bg-amber-50 text-amber-700", approved: "border-sky-200 bg-sky-50 text-sky-700", rejected: "border-red-200 bg-red-50 text-red-700" };
const today = () => new Date().toISOString().slice(0, 10);
const dayCount = (start: string, end: string) => { if (!start || !end) return 0; const s = new Date(start); const e = new Date(end); if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || e < s) return 0; return Math.floor((e.getTime() - s.getTime()) / 86400000) + 1; };
const idOf = (value: any) => String(value?._id || value?.id || value || "");

export default function LeaveApplicationPage() {
  const { user } = useAuth();
  const canReview = approvalRoles.includes(user?.role || "");
  const canApply = applicantRoles.includes(user?.role || "");
  const isEmployeeLeave = employeeLeaveRoles.includes(user?.role || "");
  const [leaves, setLeaves] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [form, setForm] = useState({ studentId: "", startDate: today(), endDate: today(), reason: "", guardianNote: "" });
  const [reviewNote, setReviewNote] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const totalDays = useMemo(() => dayCount(form.startDate, form.endDate), [form.startDate, form.endDate]);

  const load = async () => {
    setLoading(true); setError("");
    try {
      const data = await apiClient.get("/leaves") as any;
      setLeaves(data.leaves || []);
      if (canReview && !isEmployeeLeave) {
        const people = await apiClient.get("/attendance/people?personType=student") as any;
        setStudents(people.people || []);
      } else if (user?.role === "parent") {
        const parentData = await apiClient.get("/parent/portal") as any;
        setStudents(parentData.portal?.children || []);
      }
    } catch (err: any) { setError(err?.message || "Failed to load leave applications."); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (user) load().catch(() => undefined); }, [user?.role]);

  const submit = async () => {
    setSaving(true); setError(""); setMessage("");
    try {
      const payload = isEmployeeLeave ? { startDate: form.startDate, endDate: form.endDate, reason: form.reason, guardianNote: form.guardianNote } : form;
      await apiClient.post("/leaves", payload);
      setMessage(isEmployeeLeave ? "Own leave application submitted to school leadership." : "Leave application submitted.");
      setForm({ studentId: "", startDate: today(), endDate: today(), reason: "", guardianNote: "" });
      await load();
    } catch (err: any) { setError(err?.message || "Failed to submit leave application."); }
    finally { setSaving(false); }
  };

  const isOwnLeave = (leave: any) => idOf(leave.userId) === idOf(user?._id || user?.id);
  const review = async (leaveId: string, status: "approved" | "rejected" | "pending") => {
    setSaving(true); setError(""); setMessage("");
    try {
      await apiClient.patch(`/leaves/${leaveId}/review`, { status, reviewNote: reviewNote[leaveId] || "" });
      setMessage(status === "approved" ? "Leave approved. Attendance calendar will show Leave status." : status === "rejected" ? "Leave rejected." : "Leave returned to pending.");
      await load();
    } catch (err: any) { setError(err?.message || "Failed to review leave."); }
    finally { setSaving(false); }
  };

  return <div className="space-y-5"><PageHeader title="Leave Application" description="Students, parents, teachers and staff can apply. Self approval is blocked." icon={CalendarDays} status={<Badge variant="outline">{leaves.length} applications</Badge>} />{error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}{message && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}{canApply && <section className="rounded-2xl border bg-card p-4 shadow-sm md:p-5"><h2 className="mb-3 text-lg font-semibold">{isEmployeeLeave ? "Apply for Own Leave" : "Apply for Leave"}</h2><div className="grid gap-3 md:grid-cols-2">{user?.role === "parent" && <label className="space-y-2"><span className="text-sm font-medium">Student</span><select className="h-10 w-full rounded-md border px-3 text-sm" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} required><option value="">Select student</option>{students.map((student: any) => <option key={student._id} value={student._id}>{student.userId?.name || student.name || "Student"} — Roll {student.rollNumber || "-"}</option>)}</select></label>}<label className="space-y-2"><span className="text-sm font-medium">Start Date</span><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></label><label className="space-y-2"><span className="text-sm font-medium">End Date</span><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></label><div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-800">Requested leave: <strong>{totalDays}</strong> day{totalDays === 1 ? "" : "s"}</div><label className="space-y-2 md:col-span-2"><span className="text-sm font-medium">Why leave is needed</span><textarea className="min-h-28 w-full rounded-md border px-3 py-2 text-sm" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Example: illness, family matter, urgent work..." /></label><label className="space-y-2 md:col-span-2"><span className="text-sm font-medium">Note / optional</span><Input value={form.guardianNote} onChange={(e) => setForm({ ...form, guardianNote: e.target.value })} /></label></div><div className="mt-4"><Button disabled={saving || !form.startDate || !form.endDate || form.reason.trim().length < 5 || (user?.role === "parent" && !form.studentId)} onClick={submit}><Send className="mr-2 h-4 w-4" />{saving ? "Submitting..." : "Submit Application"}</Button></div></section>}<section className="rounded-2xl border bg-card p-4 shadow-sm md:p-5"><h2 className="mb-3 text-lg font-semibold">Leave Applications</h2>{loading ? <p className="py-8 text-center text-muted-foreground">Loading...</p> : leaves.length === 0 ? <p className="py-8 text-center text-muted-foreground">No leave applications found.</p> : <div className="grid gap-3">{leaves.map((leave) => { const own = isOwnLeave(leave); return <div key={leave._id} className="rounded-xl border bg-white p-4 shadow-sm"><div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div><div className="font-semibold">{leave.studentId?.userId?.name || leave.userId?.name || "Applicant"}</div><div className="text-sm text-muted-foreground">Type: {leave.applicantType || "student"} · Roll: {leave.studentId?.rollNumber || "-"} · Class: {leave.classId?.name || "-"}</div><div className="mt-1 text-sm">{new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()} · {leave.totalDays} day(s)</div><p className="mt-2 text-sm text-slate-700">{leave.reason}</p>{leave.reviewNote && <p className="mt-1 text-sm text-slate-500">Review: {leave.reviewNote}</p>}{own && canReview && <p className="mt-1 text-xs text-amber-700">You cannot approve your own leave.</p>}</div><Badge variant="outline" className={statusClass[leave.status] || ""}>{leave.status}</Badge></div>{canReview && !own && <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]"><Input placeholder="Review note" value={reviewNote[leave._id] || ""} onChange={(e) => setReviewNote({ ...reviewNote, [leave._id]: e.target.value })} /><div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => review(leave._id, "approved")} disabled={saving}><CheckCircle2 className="mr-2 h-4 w-4" />Approve</Button><Button size="sm" variant="destructive" onClick={() => review(leave._id, "rejected")} disabled={saving}><XCircle className="mr-2 h-4 w-4" />Reject</Button><Button size="sm" variant="outline" onClick={() => review(leave._id, "pending")} disabled={saving}>Pending</Button></div></div>}</div>; })}</div>}</section></div>;
}
