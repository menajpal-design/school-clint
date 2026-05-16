"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Bell, BookOpen, CalendarDays, CreditCard, FileText, GraduationCap, HeartHandshake, IdCard, RefreshCw, UserRound } from "lucide-react";

import { IDCardPreview } from "@/components/id-cards/IDCardPreview";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function ParentPortalPage() {
  const [portal, setPortal] = useState<any>({ children: [], announcements: [], featureLinks: [], summary: {} });
  const [selectedChildId, setSelectedChildId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.parent.portal() as any;
      const portalData = data.portal || { children: [] };
      setPortal(portalData);
      setSelectedChildId((current) => current || portalData.children?.[0]?._id || "");
    } catch (err: any) {
      setError(err?.message || "Failed to load child facilities.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load().catch(() => undefined); }, []);

  const child = useMemo(() => portal.children?.find((item: any) => item._id === selectedChildId) || portal.children?.[0], [portal.children, selectedChildId]);
  const childAttendance = child?.attendance || [];
  const childResults = child?.results || [];
  const childFees = child?.fees || [];
  const childPayments = child?.payments || [];
  const childRoutine = child?.routine || [];
  const childLeaves = child?.leaves || [];
  const childDocuments = child?.documents || [];
  const dueAmount = childFees.filter((fee: any) => fee.status !== "paid").reduce((sum: number, fee: any) => sum + Number(fee.amount || 0), 0);
  const present = childAttendance.filter((item: any) => item.status === "present").length;
  const absent = childAttendance.filter((item: any) => item.status === "absent").length;
  const leave = childAttendance.filter((item: any) => item.status === "leave").length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Parent Child Facilities"
        description="পিতামাতা তাদের সন্তানের attendance, result, fee, routine, leave, notice, document এবং ID card এক জায়গা থেকে দেখতে পারবে।"
        icon={UserRound}
        actions={[<Button key="refresh" variant="outline" size="sm" onClick={load}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>]}
      />

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[320px_1fr] md:items-center">
          <div>
            <p className="mb-2 text-sm font-medium">Select Child</p>
            <Select value={selectedChildId} onValueChange={setSelectedChildId}>
              <SelectTrigger><SelectValue placeholder="Select child" /></SelectTrigger>
              <SelectContent>{(portal.children || []).map((item: any) => <SelectItem key={item._id} value={item._id}>{item.userId?.name || item.rollNumber}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {(portal.featureLinks || []).map((link: any) => <Button key={link.href} asChild variant="outline" className="justify-start"><Link href={link.href}>{link.label}</Link></Button>)}
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Attendance" value={`${present}/${childAttendance.length || 0}`} icon={GraduationCap} tone="blue" />
        <StatCard label="Absent / Leave" value={`${absent} / ${leave}`} icon={HeartHandshake} tone="rose" />
        <StatCard label="Fee Due" value={formatCurrency(dueAmount)} icon={CreditCard} tone="amber" />
        <StatCard label="Published Results" value={childResults.length || 0} icon={BookOpen} tone="emerald" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <section className="space-y-5">
          <Panel title="Child Profile">
            <div className="space-y-2 text-sm">
              <Row label="Name" value={child?.userId?.name || "-"} />
              <Row label="Roll" value={child?.rollNumber || "-"} />
              <Row label="Class" value={child?.classId?.name || child?.classId?.grade || "-"} />
              <Row label="Section" value={child?.sectionId?.name || "-"} />
              <Row label="Guardian" value={child?.guardianName || "-"} />
              <Row label="Phone" value={child?.guardianPhone || "-"} />
            </div>
          </Panel>
          <Panel title="Child ID Card">
            <IDCardPreview type="student" name={child?.userId?.name || "Student"} id={child?.rollNumber || "ID"} qrData={child?.idCard?.qrCodeData || child?.rollNumber || ""} barcode={child?.idCard?.barcodeData || child?.rollNumber || ""} />
            <div className="mt-3"><Button asChild size="sm" variant="outline"><Link href="/id-cards/my-card"><IdCard className="mr-2 h-4 w-4" />Open ID Card</Link></Button></div>
          </Panel>
        </section>

        <section className="space-y-5">
          <Panel title="Attendance History">
            <ResponsiveTable empty="No attendance found." columns={["Date", "Status", "Marked By"]} rows={childAttendance.slice(0, 10).map((item: any) => [item.date ? formatDate(item.date) : "-", <Badge key="status" variant="outline" className="capitalize">{item.status}</Badge>, item.markedBy?.name || "-"])} />
          </Panel>

          <Panel title="Published Result / Report Card">
            <ResponsiveTable empty="No published results found." columns={["Exam", "Subject", "Marks", "Grade"]} rows={childResults.slice(0, 10).map((item: any) => [item.examId?.name || "-", item.subjectId?.name || "-", `${item.marksObtained ?? "-"}/${item.totalMarks ?? "-"}`, item.grade || item.status || "-"])} />
            <div className="mt-3"><Button asChild size="sm" variant="outline"><Link href="/academic/report-card">Open Report Card</Link></Button></div>
          </Panel>

          <Panel title="Fees & Payment History">
            <ResponsiveTable empty="No fee records found." columns={["Type", "Amount", "Status", "Due Date"]} rows={childFees.slice(0, 10).map((fee: any) => [fee.type || "Fee", formatCurrency(fee.amount || 0), <Badge key="status" variant="outline" className="capitalize">{fee.status}</Badge>, fee.dueDate ? formatDate(fee.dueDate) : "-"])} />
            <div className="mt-4"><ResponsiveTable empty="No payments found." columns={["Receipt", "Amount", "Method", "Date"]} rows={childPayments.slice(0, 6).map((payment: any) => [payment.receiptNumber || "-", formatCurrency(payment.amount || 0), payment.paymentMethod || "-", payment.paymentDate ? formatDate(payment.paymentDate) : "-"])} /></div>
            <div className="mt-3"><Button asChild size="sm" variant="outline"><Link href="/finance/my-fees">Open Fees</Link></Button></div>
          </Panel>

          <Panel title="Class Routine">
            <ResponsiveTable empty="No published routine found." columns={["Day", "Period", "Subject", "Time"]} rows={childRoutine.slice(0, 12).map((routine: any) => [routine.dayOfWeek, routine.periodName, routine.subjectId?.name || routine.note || "-", `${routine.startTime} - ${routine.endTime}`])} />
            <div className="mt-3"><Button asChild size="sm" variant="outline"><Link href="/academic/class-routine"><CalendarDays className="mr-2 h-4 w-4" />Open Routine</Link></Button></div>
          </Panel>

          <Panel title="Leave Applications">
            <ResponsiveTable empty="No leave applications found." columns={["From", "To", "Status", "Reason"]} rows={childLeaves.slice(0, 10).map((leaveItem: any) => [leaveItem.startDate ? formatDate(leaveItem.startDate) : "-", leaveItem.endDate ? formatDate(leaveItem.endDate) : "-", <Badge key="status" variant="outline" className="capitalize">{leaveItem.status}</Badge>, leaveItem.reason || "-"])} />
            <div className="mt-3"><Button asChild size="sm" variant="outline"><Link href="/leaves">Apply / View Leave</Link></Button></div>
          </Panel>

          <Panel title="Documents">
            <ResponsiveTable empty="No documents found." columns={["Title", "Type", "File"]} rows={childDocuments.slice(0, 10).map((doc: any) => [doc.title || "-", doc.type || "-", doc.fileUrl ? <a key="file" href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-primary underline"><FileText className="mr-1 inline h-4 w-4" />Open</a> : "-"])} />
          </Panel>

          <Panel title="Notices">
            <div className="space-y-3">{(portal.announcements || []).length === 0 ? <p className="text-sm text-muted-foreground">No notices found.</p> : (portal.announcements || []).map((notice: any) => <div key={notice._id} className="rounded-md border border-border p-3"><div className="flex flex-wrap items-center gap-2"><span className="font-medium">{notice.title}</span><Badge variant="outline">{notice.category}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{notice.publishedAt ? formatDate(notice.publishedAt) : "Published"}</p></div>)}</div>
          </Panel>
        </section>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex justify-between gap-4"><span className="text-muted-foreground">{label}</span><span className="font-medium text-foreground">{value}</span></div>;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="rounded-lg border border-border bg-card p-5 shadow-sm"><h2 className="mb-4 font-semibold text-foreground">{title}</h2>{children}</div>;
}

function ResponsiveTable({ columns, rows, empty }: { columns: string[]; rows: React.ReactNode[][]; empty: string }) {
  if (!rows.length) return <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">{empty}</p>;
  return <div className="overflow-x-auto"><Table><TableHeader><TableRow>{columns.map((col) => <TableHead key={col}>{col}</TableHead>)}</TableRow></TableHeader><TableBody>{rows.map((row, index) => <TableRow key={index}>{row.map((cell, cellIndex) => <TableCell key={cellIndex}>{cell}</TableCell>)}</TableRow>)}</TableBody></Table></div>;
}
