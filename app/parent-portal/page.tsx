"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, CreditCard, GraduationCap, UserRound } from "lucide-react";

import { IDCardPreview } from "@/components/id-cards/IDCardPreview";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function ParentPortalPage() {
  const [portal, setPortal] = useState<any>({ children: [], announcements: [] });
  const [attendance, setAttendance] = useState<any>({ summary: {} });
  const [fees, setFees] = useState<any>({ myFees: [], payments: [] });
  const [selectedChildId, setSelectedChildId] = useState("");

  useEffect(() => {
    Promise.allSettled([api.parent.portal(), api.attendance.getMine(), api.finance.myFees()])
      .then(([portalResult, attendanceResult, feeResult]) => {
        const portalData = portalResult.status === "fulfilled" ? (portalResult.value as any).portal || {} : {};
        setPortal(portalData);
        setSelectedChildId(portalData.children?.[0]?._id || "");
        if (attendanceResult.status === "fulfilled") setAttendance(attendanceResult.value as any);
        if (feeResult.status === "fulfilled") setFees(feeResult.value as any);
      });
  }, []);

  const child = useMemo(() => portal.children?.find((item: any) => item._id === selectedChildId) || portal.children?.[0], [portal.children, selectedChildId]);
  const childFees = (fees.myFees || []).filter((fee: any) => !child?._id || String(fee.studentId?._id || fee.studentId) === String(child._id));
  const childPayments = (fees.payments || []).filter((payment: any) => !child?._id || String(payment.studentId?._id || payment.studentId) === String(child._id));
  const dueAmount = childFees.filter((fee: any) => fee.status !== "paid").reduce((sum: number, fee: any) => sum + Number(fee.amount || 0), 0);

  return (
    <div className="space-y-5">
      <PageHeader title="Parent Portal" description="Track child profile, ID card, attendance, results, fees and notices." icon={UserRound} />

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="max-w-sm">
          <Select value={selectedChildId} onValueChange={setSelectedChildId}>
            <SelectTrigger><SelectValue placeholder="Select child" /></SelectTrigger>
            <SelectContent>{(portal.children || []).map((item: any) => <SelectItem key={item._id} value={item._id}>{item.userId?.name || item.rollNumber}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Attendance" value={`${attendance.summary?.present || 0}/${attendance.summary?.total || 0}`} icon={GraduationCap} tone="blue" />
        <StatCard label="Absent" value={attendance.summary?.absent || 0} icon={GraduationCap} tone="rose" />
        <StatCard label="Fee Due" value={formatCurrency(dueAmount)} icon={CreditCard} tone="amber" />
        <StatCard label="Notices" value={portal.announcements?.length || 0} icon={Bell} tone="emerald" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <section className="space-y-5">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-950">Child Profile</h2>
            <div className="mt-4 space-y-2 text-sm">
              <Row label="Name" value={child?.userId?.name || "-"} />
              <Row label="Roll" value={child?.rollNumber || "-"} />
              <Row label="Class" value={child?.classId?.name || child?.classId?.grade || "-"} />
              <Row label="Guardian" value={child?.guardianName || "-"} />
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-semibold text-slate-950">Child ID Card</h2>
            <IDCardPreview type="student" name={child?.userId?.name || "Student"} id={child?.rollNumber || "ID"} qrData={child?.rollNumber || ""} barcode={child?.rollNumber || ""} />
          </div>
        </section>

        <section className="space-y-5">
          <Panel title="Result Summary"><p className="text-sm text-slate-500">Recent result summary will appear after published exam records are available.</p></Panel>
          <Panel title="Fee Payment History">
            <Table><TableHeader><TableRow><TableHead>Receipt</TableHead><TableHead>Amount</TableHead><TableHead>Method</TableHead><TableHead>Date</TableHead></TableRow></TableHeader><TableBody>
              {childPayments.length === 0 ? <TableRow><TableCell colSpan={4} className="h-20 text-center text-slate-500">No payments found.</TableCell></TableRow> : childPayments.map((payment: any) => <TableRow key={payment._id}><TableCell>{payment.receiptNumber || "-"}</TableCell><TableCell>{formatCurrency(payment.amount || 0)}</TableCell><TableCell className="capitalize">{payment.paymentMethod || "-"}</TableCell><TableCell>{payment.paymentDate ? formatDate(payment.paymentDate) : "-"}</TableCell></TableRow>)}
            </TableBody></Table>
          </Panel>
          <Panel title="Parent Notices">
            <div className="space-y-3">{(portal.announcements || []).map((notice: any) => <div key={notice._id} className="rounded-md border border-slate-200 p-3"><div className="flex items-center gap-2"><span className="font-medium">{notice.title}</span><Badge variant="outline">{notice.category}</Badge></div><p className="mt-1 text-xs text-slate-500">{notice.publishedAt ? formatDate(notice.publishedAt) : "Published"}</p></div>)}</div>
          </Panel>
        </section>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex justify-between gap-4"><span className="text-slate-500">{label}</span><span className="font-medium text-slate-900">{value}</span></div>;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-4 font-semibold text-slate-950">{title}</h2>{children}</div>;
}
