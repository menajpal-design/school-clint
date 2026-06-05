"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Filter, RefreshCw, Send, XCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api";
import { normalizeUserRole } from "@/lib/permissions";
import { useAuth } from "@/hooks/useAuth";

const reviewRoles = ["head", "assistant_head", "class_teacher"];
const applicantRoles = ["student", "parent"];
const statusClass: Record<string, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  approved: "border-sky-200 bg-sky-50 text-sky-700",
  rejected: "border-red-200 bg-red-50 text-red-700",
};

const today = () => new Date().toISOString().slice(0, 10);
const dayCount = (start: string, end: string) => {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || e < s) return 0;
  return Math.floor((e.getTime() - s.getTime()) / 86400000) + 1;
};
const toast = (title: string, message: string, type: "success" | "error" | "info" = "success") => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("app-toast", { detail: { title, message, type, duration: type === "error" ? 7000 : 4500 } }));
};

export default function LeaveApplicationPage() {
  const { user } = useAuth();
  const role = normalizeUserRole(user?.role) || "";
  const canReview = reviewRoles.includes(role);
  const canApply = applicantRoles.includes(role);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [form, setForm] = useState({ studentId: "", startDate: today(), endDate: today(), reason: "", attachmentUrl: "", guardianNote: "" });
  const [filters, setFilters] = useState({ status: "pending", classId: "", sectionId: "", startDate: "", endDate: "" });
  const [reviewNote, setReviewNote] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const totalDays = useMemo(() => dayCount(form.startDate, form.endDate), [form.startDate, form.endDate]);
  const classOptions = useMemo(() => {
    const map = new Map<string, any>();
    [...students.map((student: any) => student.classId).filter(Boolean), ...leaves.map((leave) => leave.classId).filter(Boolean)].forEach((item: any) => {
      const id = String(item?._id || item || "");
      if (id) map.set(id, item);
    });
    return Array.from(map.values());
  }, [students, leaves]);
  const selectedClass = classOptions.find((item: any) => String(item?._id || item) === filters.classId);
  const sectionOptions = selectedClass?.sections?.filter((item: any) => item.isActive !== false) || leaves.map((leave) => leave.sectionId).filter(Boolean).filter((item, index, arr) => arr.findIndex((x) => String(x?._id || x) === String(item?._id || item)) === index);

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (canReview && filters.status) params.set("status", filters.status);
    if (canReview && filters.classId) params.set("classId", filters.classId);
    if (canReview && filters.sectionId) params.set("sectionId", filters.sectionId);
    if (canReview && filters.startDate) params.set("startDate", filters.startDate);
    if (canReview && filters.endDate) params.set("endDate", filters.endDate);
    const query = params.toString();
    return query ? `?${query}` : "";
  };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiClient.get(`/leaves${buildQuery()}`) as any;
      setLeaves(data.leaves || []);
      if (canReview) {
        const people = await apiClient.get("/attendance/people?personType=student") as any;
        setStudents(people.people || []);
      } else if (role === "parent") {
        const parentData = await apiClient.get("/parent/portal") as any;
        setStudents(parentData.portal?.children || []);
      }
    } catch (err: any) {
      const text = err?.message || "Failed to load leave applications.";
      setError(text);
      toast("Leave load failed", text, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) load().catch(() => undefined);
  }, [user, role, canReview]);

  const submit = async () => {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response: any = await apiClient.post("/leaves", form);
      const text = response?.message || "Leave application submitted.";
      setMessage(text);
      toast("Leave submitted", text, "success");
      setForm({ studentId: "", startDate: today(), endDate: today(), reason: "", attachmentUrl: "", guardianNote: "" });
      await load();
    } catch (err: any) {
      const text = err?.message || "Failed to submit leave application.";
      setError(text);
      toast("Leave submit failed", text, "error");
    } finally {
      setSaving(false);
    }
  };

  const review = async (leaveId: string, status: "approved" | "rejected" | "pending") => {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response: any = await apiClient.patch(`/leaves/${leaveId}/review`, { status, reviewNote: reviewNote[leaveId] || "", rejectedReason: status === "rejected" ? reviewNote[leaveId] || "" : undefined });
      const text = response?.message || (status === "approved" ? "Leave approved and attendance marked as leave." : status === "rejected" ? "Leave rejected." : "Leave returned to pending.");
      setMessage(text);
      toast("Leave reviewed", text, "success");
      await load();
    } catch (err: any) {
      const text = err?.message || "Failed to review leave.";
      setError(text);
      toast("Leave review failed", text, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Leave Application"
        description={canApply ? "Apply for leave and track pending, approved, or rejected status." : "Review leave applications. Approved leave appears as Leave in attendance and does not count as Present or normal Absent."}
        icon={CalendarDays}
        status={<Badge variant="outline">{leaves.length} applications</Badge>}
        actions={[<Button key="refresh" size="sm" variant="outline" onClick={() => load().catch(() => undefined)}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>]}
      />

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {message && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}

      {canReview && (
        <section className="rounded-2xl border bg-card p-4 shadow-sm md:p-5">
          <div className="mb-3 flex items-center gap-2"><Filter className="h-5 w-5" /><h2 className="text-lg font-semibold">Review filters</h2></div>
          <div className="grid gap-3 md:grid-cols-5">
            <label className="space-y-2"><span className="text-sm font-medium">Status</span><select className="h-10 w-full rounded-md border px-3 text-sm" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="">All</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></label>
            <label className="space-y-2"><span className="text-sm font-medium">Class</span><select className="h-10 w-full rounded-md border px-3 text-sm" value={filters.classId} onChange={(e) => setFilters({ ...filters, classId: e.target.value, sectionId: "" })}><option value="">All classes</option>{classOptions.map((item: any) => <option key={String(item?._id || item)} value={String(item?._id || item)}>{item?.name || "Class"}</option>)}</select></label>
            <label className="space-y-2"><span className="text-sm font-medium">Section</span><select className="h-10 w-full rounded-md border px-3 text-sm" value={filters.sectionId} onChange={(e) => setFilters({ ...filters, sectionId: e.target.value })}><option value="">All sections</option>{sectionOptions.map((item: any) => <option key={String(item?._id || item)} value={String(item?._id || item)}>{item?.name || "Section"}</option>)}</select></label>
            <label className="space-y-2"><span className="text-sm font-medium">From</span><Input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} /></label>
            <label className="space-y-2"><span className="text-sm font-medium">To</span><Input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} /></label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2"><Button onClick={() => load().catch(() => undefined)}>Apply filters</Button><Button variant="outline" onClick={() => { setFilters({ status: "pending", classId: "", sectionId: "", startDate: "", endDate: "" }); setTimeout(() => load().catch(() => undefined), 0); }}>Reset</Button></div>
        </section>
      )}

      {canApply && (
        <section className="rounded-2xl border bg-card p-4 shadow-sm md:p-5">
          <h2 className="mb-3 text-lg font-semibold">{role === "parent" ? "Apply for Child Leave" : "Apply for Leave"}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {role === "parent" && (
              <label className="space-y-2">
                <span className="text-sm font-medium">Student</span>
                <select className="h-10 w-full rounded-md border px-3 text-sm" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} required>
                  <option value="">Select student</option>
                  {students.map((student: any) => <option key={student._id} value={student._id}>{student.userId?.name || student.name || "Student"} — Roll {student.rollNumber || "-"}</option>)}
                </select>
              </label>
            )}
            <label className="space-y-2"><span className="text-sm font-medium">Start Date</span><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></label>
            <label className="space-y-2"><span className="text-sm font-medium">End Date</span><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></label>
            <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-800">Requested leave: <strong>{totalDays}</strong> day{totalDays === 1 ? "" : "s"}</div>
            <label className="space-y-2 md:col-span-2"><span className="text-sm font-medium">Why leave is needed</span><textarea className="min-h-28 w-full rounded-md border px-3 py-2 text-sm" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Example: illness, family matter, urgent work..." /></label>
            <label className="space-y-2 md:col-span-2"><span className="text-sm font-medium">Attachment URL / optional</span><Input value={form.attachmentUrl} onChange={(e) => setForm({ ...form, attachmentUrl: e.target.value })} placeholder="Medical document or proof URL" /></label>
            <label className="space-y-2 md:col-span-2"><span className="text-sm font-medium">Guardian note / optional</span><Input value={form.guardianNote} onChange={(e) => setForm({ ...form, guardianNote: e.target.value })} /></label>
          </div>
          <div className="mt-4"><Button disabled={saving || !form.startDate || !form.endDate || form.reason.trim().length < 5 || (role === "parent" && !form.studentId)} onClick={submit}><Send className="mr-2 h-4 w-4" />{saving ? "Submitting..." : "Submit Application"}</Button></div>
        </section>
      )}

      <section className="rounded-2xl border bg-card p-4 shadow-sm md:p-5">
        <h2 className="mb-3 text-lg font-semibold">{canReview ? "Applications to Review" : role === "parent" ? "Child Applications" : "My Applications"}</h2>
        {loading ? <p className="py-8 text-center text-muted-foreground">Loading...</p> : leaves.length === 0 ? <p className="py-8 text-center text-muted-foreground">No leave applications found.</p> : <div className="grid gap-3">
          {leaves.map((leave) => <div key={leave._id} className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="font-semibold">{leave.studentId?.userId?.name || leave.userId?.name || "Student"}</div>
                <div className="text-sm text-muted-foreground">Roll: {leave.studentId?.rollNumber || "-"} · Class: {leave.classId?.name || "-"}{leave.sectionId?.name ? ` · Section: ${leave.sectionId.name}` : ""}</div>
                <div className="mt-1 text-sm">{new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()} · {leave.totalDays} day(s)</div>
                <div className="mt-1 text-xs text-muted-foreground capitalize">Applicant: {leave.applicantType || "student"}</div>
                <p className="mt-2 text-sm text-slate-700">{leave.reason}</p>
                {leave.attachmentUrl && <a className="mt-1 block text-sm text-blue-700 underline" href={leave.attachmentUrl} target="_blank" rel="noreferrer">View attachment</a>}
                {leave.reviewNote && <p className="mt-1 text-sm text-slate-500">Review: {leave.reviewNote}</p>}
                {leave.rejectedReason && <p className="mt-1 text-sm text-red-600">Rejected reason: {leave.rejectedReason}</p>}
                {leave.approvedBy && <p className="mt-1 text-xs text-muted-foreground">Approved by {leave.approvedBy?.name || "reviewer"}{leave.approvedAt ? ` on ${new Date(leave.approvedAt).toLocaleDateString()}` : ""}</p>}
              </div>
              <Badge variant="outline" className={statusClass[leave.status] || ""}>{leave.status}</Badge>
            </div>
            {canReview && <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]">
              <Input placeholder="Review note / rejected reason" value={reviewNote[leave._id] || ""} onChange={(e) => setReviewNote({ ...reviewNote, [leave._id]: e.target.value })} />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => review(leave._id, "approved")} disabled={saving}><CheckCircle2 className="mr-2 h-4 w-4" />Approve</Button>
                <Button size="sm" variant="destructive" onClick={() => review(leave._id, "rejected")} disabled={saving}><XCircle className="mr-2 h-4 w-4" />Reject</Button>
                <Button size="sm" variant="outline" onClick={() => review(leave._id, "pending")} disabled={saving}>Pending</Button>
              </div>
            </div>}
          </div>)}
        </div>}
      </section>
    </div>
  );
}
