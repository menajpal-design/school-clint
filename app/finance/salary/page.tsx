"use client";

import { useEffect, useState } from "react";
import { Calculator, FileText, Landmark, RefreshCw } from "lucide-react";

import { RoleGuard } from "@/components/RoleGuard";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api, apiClient } from "@/lib/api";
import { printHtml } from "@/lib/export-utils";
import { formatCurrency } from "@/lib/utils";

export default function SalaryPage() {
  const now = new Date();
  const [employees, setEmployees] = useState<any[]>([]);
  const [salaries, setSalaries] = useState<any[]>([]);
  const [month, setMonth] = useState(now.toLocaleString("en", { month: "long" }));
  const [year, setYear] = useState(now.getFullYear());
  const [drafts, setDrafts] = useState<Record<string, any>>({});
  const [previews, setPreviews] = useState<Record<string, any>>({});
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
    } catch (err: any) {
      setError(err?.message || "Failed to load salary information.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load().catch(() => undefined); }, []);

  const value = (employee: any, key: string, fallback = 0) => drafts[employee._id]?.[key] ?? (key === "basicSalary" ? employee.salary || fallback : fallback);
  const setValue = (id: string, key: string, val: number) => setDrafts((d) => ({ ...d, [id]: { ...d[id], [key]: Math.max(0, val || 0) } }));
  const rowKey = (employee: any) => `${employee.employeeType}-${employee._id}`;

  const previewSalary = async (employee: any) => {
    const key = rowKey(employee);
    if (Number(value(employee, "basicSalary")) <= 0) return setError("Basic salary must be greater than zero.");
    setLoadingId(key);
    setError("");
    setMessage("");
    try {
      const query = new URLSearchParams({
        employeeId: employee._id,
        employeeType: employee.employeeType,
        month,
        year: String(year),
        basicSalary: String(value(employee, "basicSalary")),
        deduction: String(value(employee, "deduction")),
        bonus: String(value(employee, "bonus")),
      });
      const data = await apiClient.get(`/payroll/salary-attendance/preview?${query.toString()}`) as any;
      setPreviews((prev) => ({ ...prev, [key]: data }));
      setMessage(`Preview ready for ${employee.userId?.name || "employee"}.`);
    } catch (err: any) {
      setError(err?.message || "Failed to preview salary.");
    } finally {
      setLoadingId(null);
    }
  };

  const process = async (employee: any) => {
    const key = rowKey(employee);
    if (Number(value(employee, "basicSalary")) <= 0) return setError("Basic salary must be greater than zero.");
    setLoadingId(key);
    setError("");
    setMessage("");
    try {
      const data = await apiClient.post('/payroll/salary-attendance/process', {
        employeeId: employee._id,
        employeeType: employee.employeeType,
        month,
        year,
        basicSalary: value(employee, "basicSalary"),
        deduction: value(employee, "deduction"),
        bonus: value(employee, "bonus"),
      }) as any;
      setPreviews((prev) => ({ ...prev, [key]: data.preview || data }));
      setMessage(`Salary processed for ${employee.userId?.name || "employee"}.`);
      await load();
    } catch (err: any) {
      setError(err?.message || "Failed to process salary.");
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
    printHtml("Salary Slip", `
      <main class="print-card">
        <p class="print-title">Salary Slip</p>
        <p class="print-muted">Period: ${month} ${year}</p>
        <div class="print-grid">
          <div class="print-row"><strong>Employee</strong>${employee.userId?.name || "-"}</div>
          <div class="print-row"><strong>Type</strong>${employee.employeeType || "-"}</div>
          <div class="print-row"><strong>Basic Salary</strong>${formatCurrency(basic)}</div>
          <div class="print-row"><strong>Bonus</strong>${formatCurrency(bonus)}</div>
          <div class="print-row"><strong>Manual Deduction</strong>${formatCurrency(manualDeduction)}</div>
          <div class="print-row"><strong>Attendance Deduction</strong>${formatCurrency(attendanceDeduction)}</div>
          <div class="print-row"><strong>Present Days</strong>${preview?.attendanceSummary?.presentDays ?? "-"}</div>
          <div class="print-row"><strong>Absent Days</strong>${preview?.attendanceSummary?.absentDays ?? "-"}</div>
          <div class="print-row"><strong>Net Salary</strong>${formatCurrency(net)}</div>
        </div>
        <div class="signature"><div>Prepared By</div><div>Employee Signature</div></div>
      </main>
    `, "", JSON.stringify({
      type: "salary_slip",
      employee: employee.userId?.name,
      employeeType: employee.employeeType,
      month,
      year,
      netSalary: net,
    }));
  };

  return (
    <RoleGuard roles={["head"]} fallback={<div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Salary information is visible to the Head only.</div>}>
      <div className="space-y-5">
        <PageHeader title="Salary Processing" description="Head can set salary and process teacher/staff payroll using attendance deduction." icon={Landmark} />
        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {message && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}
        <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-3">
            <label className="space-y-2"><span className="text-sm font-medium">Month</span><input className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={month} onChange={(e) => setMonth(e.target.value)} placeholder="Month, e.g. May" /></label>
            <label className="space-y-2"><span className="text-sm font-medium">Year</span><Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} /></label>
            <div className="flex items-end"><Button variant="outline" onClick={() => load().catch(() => undefined)} disabled={loading} className="w-full"><RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />{loading ? "Loading..." : "Reload Employees"}</Button></div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Rule: absent days are deducted by per-day salary. Late and leave days are shown for review but not deducted automatically.</p>
        </section>

        <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead>Employee</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Basic</TableHead>
                <TableHead>Manual Deduction</TableHead>
                <TableHead>Bonus</TableHead>
                <TableHead>Attendance</TableHead>
                <TableHead>Net</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={8} className="h-28 text-center text-slate-500">Loading employees...</TableCell></TableRow> : employees.length === 0 ? <TableRow><TableCell colSpan={8} className="h-28 text-center text-slate-500">No teacher or staff employee found.</TableCell></TableRow> : employees.map((e) => {
                const key = rowKey(e);
                const preview = previews[key];
                const attendanceDeduction = Number(preview?.attendanceSummary?.attendanceDeduction || 0);
                const net = Number(preview?.netSalary ?? Number(value(e,"basicSalary")) + Number(value(e,"bonus")) - Number(value(e,"deduction")) - attendanceDeduction);
                const isLoading = loadingId === key;
                return <TableRow key={key}>
                  <TableCell>
                    <div className="font-medium">{e.userId?.name || "-"}</div>
                    <div className="text-xs text-muted-foreground">{e.employeeId || e.userId?.email || "-"}</div>
                  </TableCell>
                  <TableCell className="capitalize">{e.employeeType}</TableCell>
                  <TableCell><Input className="w-full min-w-[7rem] md:w-28" min={0} type="number" value={value(e,"basicSalary")} onChange={(ev) => setValue(e._id,"basicSalary",Number(ev.target.value))} /></TableCell>
                  <TableCell><Input className="w-full min-w-[7rem] md:w-28" min={0} type="number" value={value(e,"deduction")} onChange={(ev) => setValue(e._id,"deduction",Number(ev.target.value))} /></TableCell>
                  <TableCell><Input className="w-full min-w-[7rem] md:w-28" min={0} type="number" value={value(e,"bonus")} onChange={(ev) => setValue(e._id,"bonus",Number(ev.target.value))} /></TableCell>
                  <TableCell>
                    {preview ? <div className="space-y-1 text-xs">
                      <div className="flex flex-wrap gap-1"><Badge variant="outline">P {preview.attendanceSummary?.presentDays || 0}</Badge><Badge variant="outline">A {preview.attendanceSummary?.absentDays || 0}</Badge></div>
                      <div>Late: {preview.attendanceSummary?.lateDays || 0} | Leave: {preview.attendanceSummary?.leaveDays || 0}</div>
                      <div className="font-medium text-red-600">Deduct: {formatCurrency(attendanceDeduction)}</div>
                    </div> : <span className="text-xs text-muted-foreground">Click Preview</span>}
                  </TableCell>
                  <TableCell className="font-semibold">{formatCurrency(net)}</TableCell>
                  <TableCell>
                    <div className="grid gap-2 sm:flex sm:flex-wrap">
                      <Button size="sm" variant="outline" disabled={isLoading} onClick={() => previewSalary(e)}><Calculator className="mr-2 h-4 w-4" />{isLoading ? "Wait" : "Preview"}</Button>
                      <Button size="sm" disabled={isLoading} onClick={() => process(e)}>Process</Button>
                      <Button size="sm" variant="outline" onClick={() => printSlip(e)}><FileText className="mr-2 h-4 w-4" />Slip</Button>
                    </div>
                  </TableCell>
                </TableRow>;
              })}
            </TableBody>
          </Table>
        </section>

        <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="border-b p-4">
            <h2 className="text-lg font-semibold">Processed Salary History</h2>
            <p className="text-sm text-muted-foreground">Latest salary records including attendance-linked payroll.</p>
          </div>
          <Table>
            <TableHeader><TableRow className="bg-muted hover:bg-muted"><TableHead>Month</TableHead><TableHead>Type</TableHead><TableHead>Gross</TableHead><TableHead>Attendance Deduction</TableHead><TableHead>Net</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={6} className="h-24 text-center text-slate-500">Loading salary history...</TableCell></TableRow> : salaries.length === 0 ? <TableRow><TableCell colSpan={6} className="h-24 text-center text-slate-500">No processed salary yet.</TableCell></TableRow> : salaries.slice(0, 12).map((salary: any) => (
                <TableRow key={salary._id}>
                  <TableCell>{salary.month} {salary.year}</TableCell>
                  <TableCell className="capitalize">{salary.employeeType}</TableCell>
                  <TableCell>{formatCurrency(salary.grossSalary || 0)}</TableCell>
                  <TableCell>{formatCurrency(salary.deductions?.attendance || 0)}</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(salary.netSalary || 0)}</TableCell>
                  <TableCell><Badge variant={salary.status === "paid" ? "default" : "outline"}>{salary.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      </div>
    </RoleGuard>
  );
}