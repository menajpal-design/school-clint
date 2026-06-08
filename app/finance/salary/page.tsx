"use client";

import { useEffect, useMemo, useState } from "react";
import { Calculator, FileText, Landmark, RefreshCw } from "lucide-react";

import { RoleGuard } from "@/components/RoleGuard";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { printHtml } from "@/lib/export-utils";
import { formatCurrency } from "@/lib/utils";

const PAGE_SIZE = 5;

export default function SalaryPage() {
  const now = new Date();
  const [employees, setEmployees] = useState<any[]>([]);
  const [salaries, setSalaries] = useState<any[]>([]);
  const [month, setMonth] = useState(now.toLocaleString("en", { month: "long" }));
  const [year, setYear] = useState(now.getFullYear());
  const [drafts, setDrafts] = useState<Record<string, any>>({});
  const [previews, setPreviews] = useState<Record<string, any>>({});
  const [employeePage, setEmployeePage] = useState(1);
  const [salaryPage, setSalaryPage] = useState(1);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.finance.salary() as any;
      setEmployees(data.employees || []);
      setSalaries(data.salaries || []);
      setEmployeePage(1);
      setSalaryPage(1);
    } catch (err: any) {
      setError(err?.message || "বেতনের তথ্য লোড করতে ব্যর্থ হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load().catch(() => undefined); }, []);

  const employeeTotalPages = Math.max(1, Math.ceil(employees.length / PAGE_SIZE));
  const salaryTotalPages = Math.max(1, Math.ceil(salaries.length / PAGE_SIZE));
  const pagedEmployees = useMemo(() => employees.slice((employeePage - 1) * PAGE_SIZE, employeePage * PAGE_SIZE), [employees, employeePage]);
  const pagedSalaries = useMemo(() => salaries.slice((salaryPage - 1) * PAGE_SIZE, salaryPage * PAGE_SIZE), [salaries, salaryPage]);

  const value = (employee: any, key: string, fallback = 0) => drafts[employee._id]?.[key] ?? (key === "basicSalary" ? employee.salary || fallback : fallback);
  const setValue = (id: string, key: string, val: number) => setDrafts((d) => ({ ...d, [id]: { ...d[id], [key]: Math.max(0, val || 0) } }));
  const rowKey = (employee: any) => `${employee.employeeType}-${employee._id}`;

  const previewSalary = async (employee: any) => {
    const key = rowKey(employee);
    if (Number(value(employee, "basicSalary")) <= 0) return setError("মূল বেতন অবশ্যই শূন্য থেকে বেশি হতে হবে।");
    setLoadingId(key);
    setError("");
    setMessage("");
    try {
      const data = await api.payroll.previewAttendanceSalary({
        employeeId: employee._id,
        employeeType: employee.employeeType,
        month,
        year: String(year),
        basicSalary: String(value(employee, "basicSalary")),
        deduction: String(value(employee, "deduction")),
        bonus: String(value(employee, "bonus")),
      }) as any;
      setPreviews((prev) => ({ ...prev, [key]: data }));
      setMessage(`${employee.userId?.name || "শিক্ষক/কর্মচারী"}-এর বেতনের প্রিভিউ প্রস্তুত।`);
    } catch (err: any) {
      setError(err?.message || "বেতনের প্রিভিউ তৈরি করতে ব্যর্থ হয়েছে।");
    } finally {
      setLoadingId(null);
    }
  };

  const process = async (employee: any) => {
    const key = rowKey(employee);
    if (Number(value(employee, "basicSalary")) <= 0) return setError("মূল বেতন অবশ্যই শূন্য থেকে বেশি হতে হবে।");
    setLoadingId(key);
    setError("");
    setMessage("");
    try {
      const data = await api.payroll.processAttendanceSalary({
        employeeId: employee._id,
        employeeType: employee.employeeType,
        month,
        year,
        basicSalary: value(employee, "basicSalary"),
        deduction: value(employee, "deduction"),
        bonus: value(employee, "bonus"),
      }) as any;
      setPreviews((prev) => ({ ...prev, [key]: data.preview || data }));
      setMessage(`${employee.userId?.name || "শিক্ষক/কর্মচারী"}-এর বেতন প্রসেস করা সম্পন্ন হয়েছে।`);
      await load();
    } catch (err: any) {
      setError(err?.message || "বেতন প্রসেস করতে ব্যর্থ হয়েছে।");
    } finally {
      setLoadingId(null);
    }
  };

  const printSlip = (employee: any) => {
    const preview = previews[rowKey(employee)];
    const basic = Number(preview?.basicSalary ?? value(employee, "basicSalary"));
    const bonus = Number(preview?.bonus ?? value(employee, "bonus"));
    const manualDeduction = Number(preview?.manualDeduction ?? value(employee, "deduction"));
    const attendanceDeduction = Number(preview?.attendanceSummary?.attendanceDeduction || 0);
    const net = Number(preview?.netSalary ?? basic + bonus - manualDeduction - attendanceDeduction);
    printSalaryReceipt({
      title: "Salary Slip",
      employeeName: employee.userId?.name || "-",
      employeeId: employee.employeeId || employee.userId?.email || "-",
      employeeType: employee.employeeType,
      month,
      year,
      grossSalary: basic + bonus,
      basicSalary: basic,
      bonus,
      manualDeduction,
      attendanceDeduction,
      netSalary: net,
      presentDays: preview?.attendanceSummary?.presentDays ?? "-",
      absentDays: preview?.attendanceSummary?.absentDays ?? "-",
      lateDays: preview?.attendanceSummary?.lateDays ?? "-",
      leaveDays: preview?.attendanceSummary?.leaveDays ?? "-",
      status: preview?.status || "preview",
    });
  };

  const printHistoryReceipt = (salary: any) => {
    printSalaryReceipt({
      title: "Processed Salary Receipt",
      employeeName: salary.employeeId?.userId?.name || salary.employeeId?.name || salary.employeeName || salary.userId?.name || "-",
      employeeId: salary.employeeId?.employeeId || salary.employeeCode || salary.employeeId?._id || salary.employeeId || "-",
      employeeType: salary.employeeType,
      month: salary.month,
      year: salary.year,
      grossSalary: Number(salary.grossSalary || salary.basicSalary || 0),
      basicSalary: Number(salary.basicSalary || salary.grossSalary || 0),
      bonus: Number(salary.bonus || salary.allowances?.bonus || 0),
      manualDeduction: Number(salary.deductions?.manual || salary.manualDeduction || 0),
      attendanceDeduction: Number(salary.deductions?.attendance || salary.attendanceDeduction || 0),
      netSalary: Number(salary.netSalary || 0),
      presentDays: salary.attendanceSummary?.presentDays ?? salary.presentDays ?? "-",
      absentDays: salary.attendanceSummary?.absentDays ?? salary.absentDays ?? "-",
      lateDays: salary.attendanceSummary?.lateDays ?? salary.lateDays ?? "-",
      leaveDays: salary.attendanceSummary?.leaveDays ?? salary.leaveDays ?? "-",
      status: salary.status || "processed",
      receiptNo: salary.receiptNumber || salary.receiptNo || `SAL-${String(salary._id || Date.now()).slice(-8).toUpperCase()}`,
      paidAt: salary.paymentDate || salary.paidAt || salary.createdAt,
    });
  };

  return (
    <RoleGuard roles={["head"]} fallback={<div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">বেতনের তথ্য শুধুমাত্র প্রধান শিক্ষকের জন্য দৃশ্যমান।</div>}>
      <div className="space-y-5">
        <PageHeader title="বেতন প্রসেসিং (Salary Processing)" description="প্রধান শিক্ষক শিক্ষক ও কর্মচারীদের বেতন নির্ধারণ এবং উপস্থিতিজনিত কর্তন হিসাব করে পে-রোল প্রসেস করতে পারেন।" icon={Landmark} />
        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {message && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}
        <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-3">
            <label className="space-y-2"><span className="text-sm font-medium">মাস</span><input className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={month} onChange={(e) => setMonth(e.target.value)} placeholder="মাস, যেমন: May" /></label>
            <label className="space-y-2"><span className="text-sm font-medium">বছর</span><Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} /></label>
            <div className="flex items-end"><Button variant="outline" onClick={() => load().catch(() => undefined)} disabled={loading} className="w-full"><RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />{loading ? "লোড হচ্ছে..." : "কর্মচারী তালিকা রিলোড"}</Button></div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">নিয়ম: অনুপস্থিত দিনগুলোর জন্য প্রতিদিনের হিসেবে বেতন কর্তন করা হবে। বিলম্ব এবং ছুটির দিনগুলো পর্যালোচনার জন্য দেখানো হয়েছে, তবে স্বয়ংক্রিয়ভাবে কর্তন করা হবে না।</p>
        </section>

        <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b p-4">
            <div><h2 className="text-lg font-semibold">শিক্ষক/কর্মচারী বেতন প্রসেসিং</h2><p className="text-sm text-muted-foreground">৫টির বেশি row হলে নিচে page option দেখাবে।</p></div>
            {employees.length > PAGE_SIZE && <span className="text-xs text-muted-foreground">Page {employeePage} of {employeeTotalPages}</span>}
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead>শিক্ষক/কর্মচারী</TableHead><TableHead>ধরণ</TableHead><TableHead>মূল বেতন</TableHead><TableHead>ম্যানুয়াল কর্তন</TableHead><TableHead>বোনাস</TableHead><TableHead>উপস্থিতি</TableHead><TableHead>নেট বেতন</TableHead><TableHead>অ্যাকশন</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={8} className="h-28 text-center text-slate-500">কর্মচারী তালিকা লোড করা হচ্ছে...</TableCell></TableRow> : employees.length === 0 ? <TableRow><TableCell colSpan={8} className="h-28 text-center text-slate-500">কোনো শিক্ষক বা কর্মচারী পাওয়া যায়নি।</TableCell></TableRow> : pagedEmployees.map((e) => {
                const key = rowKey(e);
                const preview = previews[key];
                const attendanceDeduction = Number(preview?.attendanceSummary?.attendanceDeduction || 0);
                const net = Number(preview?.netSalary ?? Number(value(e,"basicSalary")) + Number(value(e,"bonus")) - Number(value(e,"deduction")) - attendanceDeduction);
                const isLoading = loadingId === key;
                return <TableRow key={key}>
                  <TableCell><div className="font-medium">{e.userId?.name || "-"}</div><div className="text-xs text-muted-foreground">{e.employeeId || e.userId?.email || "-"}</div></TableCell>
                  <TableCell className="capitalize">{e.employeeType === 'teacher' ? 'শিক্ষক' : e.employeeType === 'staff' ? 'কর্মচারী' : e.employeeType}</TableCell>
                  <TableCell><Input className="w-full min-w-[7rem] md:w-28" min={0} type="number" value={value(e,"basicSalary")} onChange={(ev) => setValue(e._id,"basicSalary",Number(ev.target.value))} /></TableCell>
                  <TableCell><Input className="w-full min-w-[7rem] md:w-28" min={0} type="number" value={value(e,"deduction")} onChange={(ev) => setValue(e._id,"deduction",Number(ev.target.value))} /></TableCell>
                  <TableCell><Input className="w-full min-w-[7rem] md:w-28" min={0} type="number" value={value(e,"bonus")} onChange={(ev) => setValue(e._id,"bonus",Number(ev.target.value))} /></TableCell>
                  <TableCell>{preview ? <div className="space-y-1 text-xs"><div className="flex flex-wrap gap-1"><Badge variant="outline">উপস্থিত {preview.attendanceSummary?.presentDays || 0}</Badge><Badge variant="outline">অনুপস্থিত {preview.attendanceSummary?.absentDays || 0}</Badge></div><div>বিলম্ব: {preview.attendanceSummary?.lateDays || 0} | ছুটি: {preview.attendanceSummary?.leaveDays || 0}</div><div className="font-medium text-red-600">কর্তন: {formatCurrency(attendanceDeduction)}</div></div> : <span className="text-xs text-muted-foreground">প্রিভিউ ক্লিক করুন</span>}</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(net)}</TableCell>
                  <TableCell><div className="grid gap-2 sm:flex sm:flex-wrap"><Button size="sm" variant="outline" disabled={isLoading} onClick={() => previewSalary(e)}><Calculator className="mr-2 h-4 w-4" />{isLoading ? "অপেক্ষা করুন" : "প্রিভিউ"}</Button><Button size="sm" disabled={isLoading} onClick={() => process(e)}>প্রসেস</Button><Button size="sm" variant="outline" onClick={() => printSlip(e)}><FileText className="mr-2 h-4 w-4" />স্লিপ</Button></div></TableCell>
                </TableRow>;
              })}
            </TableBody>
          </Table>
          {employees.length > PAGE_SIZE && <Pager page={employeePage} totalPages={employeeTotalPages} onPage={setEmployeePage} />}
        </section>

        <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b p-4">
            <div><h2 className="text-lg font-semibold">প্রসেসকৃত বেতনের ইতিহাস (Processed Salary History)</h2><p className="text-sm text-muted-foreground">উপস্থিতি সংযুক্ত পে-রোল সহ বেতনের সর্বশেষ তথ্য। রশিদ আকারে প্রিন্ট করা যাবে।</p></div>
            {salaries.length > PAGE_SIZE && <span className="text-xs text-muted-foreground">Page {salaryPage} of {salaryTotalPages}</span>}
          </div>
          <Table>
            <TableHeader><TableRow className="bg-muted hover:bg-muted"><TableHead>মাস</TableHead><TableHead>ধরণ</TableHead><TableHead>মোট বেতন (Gross)</TableHead><TableHead>উপস্থিতিজনিত কর্তন</TableHead><TableHead>নেট বেতন (Net)</TableHead><TableHead>অবস্থা (Status)</TableHead><TableHead className="text-right">রশিদ</TableHead></TableRow></TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={7} className="h-24 text-center text-slate-500">বেতনের ইতিহাস লোড করা হচ্ছে...</TableCell></TableRow> : salaries.length === 0 ? <TableRow><TableCell colSpan={7} className="h-24 text-center text-slate-500">এখনো কোনো বেতন প্রসেস করা হয়নি।</TableCell></TableRow> : pagedSalaries.map((salary: any) => (
                <TableRow key={salary._id}>
                  <TableCell>{salary.month} {salary.year}</TableCell>
                  <TableCell className="capitalize">{salary.employeeType === 'teacher' ? 'শিক্ষক' : salary.employeeType === 'staff' ? 'কর্মচারী' : salary.employeeType}</TableCell>
                  <TableCell>{formatCurrency(salary.grossSalary || 0)}</TableCell>
                  <TableCell>{formatCurrency(salary.deductions?.attendance || 0)}</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(salary.netSalary || 0)}</TableCell>
                  <TableCell><Badge variant={salary.status === "paid" ? "default" : "outline"}>{salary.status === 'paid' ? 'পরিশোধিত' : salary.status}</Badge></TableCell>
                  <TableCell className="text-right"><Button size="sm" variant="outline" onClick={() => printHistoryReceipt(salary)}><FileText className="mr-2 h-4 w-4" />রশিদ প্রিন্ট</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {salaries.length > PAGE_SIZE && <Pager page={salaryPage} totalPages={salaryTotalPages} onPage={setSalaryPage} />}
        </section>
      </div>
    </RoleGuard>
  );
}

function Pager({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (page: number) => void }) {
  return <div className="flex flex-wrap items-center justify-end gap-2 border-t p-3"><Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</Button>{Array.from({ length: totalPages }).slice(0, 8).map((_, i) => <Button key={i} size="sm" variant={page === i + 1 ? "default" : "outline"} onClick={() => onPage(i + 1)}>{i + 1}</Button>)}<Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>Next</Button></div>;
}

function printSalaryReceipt(data: any) {
  printHtml(data.title || "Salary Receipt", `
    <main class="salary-receipt">
      <section class="salary-header"><div><p class="eyebrow">Official Payroll Receipt</p><h1>${data.title || "Salary Receipt"}</h1><p>Period: ${data.month} ${data.year}</p></div><div class="stamp">${String(data.status || "processed").toUpperCase()}</div></section>
      <section class="summary"><div><span>Receipt No</span><b>${data.receiptNo || `SAL-${Date.now()}`}</b></div><div><span>Employee</span><b>${data.employeeName || "-"}</b></div><div><span>Employee ID</span><b>${data.employeeId || "-"}</b></div><div><span>Type</span><b>${data.employeeType || "-"}</b></div></section>
      <section class="salary-grid"><div class="box"><h3>Earnings</h3><p><b>Basic Salary</b><span>${formatCurrency(data.basicSalary || 0)}</span></p><p><b>Bonus</b><span>${formatCurrency(data.bonus || 0)}</span></p><p><b>Gross Salary</b><span>${formatCurrency(data.grossSalary || 0)}</span></p></div><div class="box"><h3>Deductions</h3><p><b>Manual Deduction</b><span>${formatCurrency(data.manualDeduction || 0)}</span></p><p><b>Attendance Deduction</b><span>${formatCurrency(data.attendanceDeduction || 0)}</span></p><p><b>Total Deduction</b><span>${formatCurrency(Number(data.manualDeduction || 0) + Number(data.attendanceDeduction || 0))}</span></p></div></section>
      <section class="attendance"><h3>Attendance Summary</h3><table><tr><th>Present</th><th>Absent</th><th>Late</th><th>Leave</th><th>Net Salary</th></tr><tr><td>${data.presentDays}</td><td>${data.absentDays}</td><td>${data.lateDays}</td><td>${data.leaveDays}</td><td><b>${formatCurrency(data.netSalary || 0)}</b></td></tr></table></section>
      <section class="net"><span>Net Payable Salary</span><b>${formatCurrency(data.netSalary || 0)}</b></section>
      <section class="signature"><div>Prepared By</div><div>Head Signature</div><div>Employee Signature</div></section>
    </main>
  `, `.salary-receipt{width:900px;min-width:900px;border:1px solid #d6b25e;border-radius:18px;overflow:hidden;background:#fff;color:#0f172a}.salary-header{display:flex;justify-content:space-between;gap:20px;padding:24px;background:linear-gradient(135deg,#052e2b,#0f766e,#d6b25e);color:#fff}.eyebrow{margin:0 0 6px;text-transform:uppercase;letter-spacing:.22em;font-size:10px;font-weight:900}.salary-header h1{margin:0;font-size:30px}.salary-header p{margin:5px 0 0}.stamp{align-self:center;border:4px double #fff;border-radius:999px;padding:12px 20px;font-weight:900;letter-spacing:.16em}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;padding:18px 24px}.summary div{border:1px solid #ead7a1;background:#fffbeb;border-radius:14px;padding:12px}.summary span{display:block;font-size:10px;text-transform:uppercase;color:#92400e;font-weight:900}.summary b{display:block;margin-top:5px}.salary-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:0 24px 18px}.box{border:1px solid #cbd5e1;border-radius:16px;padding:16px}.box h3,.attendance h3{margin:0 0 12px;color:#0f766e;text-transform:uppercase;letter-spacing:.12em;font-size:13px}.box p{display:flex;justify-content:space-between;border-bottom:1px dashed #e2e8f0;margin:0;padding:8px 0}.attendance{padding:0 24px 18px}.attendance table{width:100%;border-collapse:collapse}.attendance th{background:#052e2b;color:#fff}.attendance th,.attendance td{border:1px solid #cbd5e1;padding:10px;text-align:center}.net{margin:0 24px 18px;background:#f0fdfa;border:1px solid #99f6e4;border-radius:14px;padding:16px;display:flex;justify-content:space-between;font-size:18px}.net b{font-size:24px;color:#0f766e}.signature{display:grid;grid-template-columns:repeat(3,1fr);gap:34px;padding:55px 24px 24px}.signature div{text-align:center;border-top:1px solid #334155;padding-top:8px;font-size:12px}`,
  JSON.stringify({ type: "salary_receipt", employee: data.employeeName, month: data.month, year: data.year, netSalary: data.netSalary }));
}
