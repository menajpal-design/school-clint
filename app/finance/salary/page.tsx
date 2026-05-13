"use client";

import { useEffect, useState } from "react";
import { FileText, Landmark } from "lucide-react";

import { RoleGuard } from "@/components/RoleGuard";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { printHtml } from "@/lib/export-utils";
import { formatCurrency } from "@/lib/utils";

export default function SalaryPage() {
  const now = new Date();
  const [employees, setEmployees] = useState<any[]>([]);
  const [salaries, setSalaries] = useState<any[]>([]);
  const [month, setMonth] = useState(now.toLocaleString("en", { month: "long" }));
  const [year, setYear] = useState(now.getFullYear());
  const [drafts, setDrafts] = useState<Record<string, any>>({});
  const load = async () => { const data = await api.finance.salary() as any; setEmployees(data.employees || []); setSalaries(data.salaries || []); };
  useEffect(() => { load().catch(() => undefined); }, []);
  const value = (employee: any, key: string, fallback = 0) => drafts[employee._id]?.[key] ?? (key === "basicSalary" ? employee.salary || fallback : fallback);
  const setValue = (id: string, key: string, val: number) => setDrafts((d) => ({ ...d, [id]: { ...d[id], [key]: val } }));
  const process = async (employee: any) => { await api.finance.processSalary({ employeeId: employee._id, employeeType: employee.employeeType, month, year, basicSalary: value(employee, "basicSalary"), deduction: value(employee, "deduction"), bonus: value(employee, "bonus") }); await load(); };
  const printSlip = (employee: any) => {
    const basic = Number(value(employee, "basicSalary"));
    const deduction = Number(value(employee, "deduction"));
    const bonus = Number(value(employee, "bonus"));
    const net = basic + bonus - deduction;
    printHtml("Salary Slip", `
      <main class="print-card">
        <p class="print-title">Salary Slip</p>
        <p class="print-muted">Period: ${month} ${year}</p>
        <div class="print-grid">
          <div class="print-row"><strong>Employee</strong>${employee.userId?.name || "-"}</div>
          <div class="print-row"><strong>Type</strong>${employee.employeeType || "-"}</div>
          <div class="print-row"><strong>Basic Salary</strong>${formatCurrency(basic)}</div>
          <div class="print-row"><strong>Bonus</strong>${formatCurrency(bonus)}</div>
          <div class="print-row"><strong>Deduction</strong>${formatCurrency(deduction)}</div>
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
        <PageHeader title="Salary Processing" description="Process teacher and staff salaries. Visible to the Head only." icon={Landmark} />
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"><div className="grid gap-3 md:grid-cols-2"><input className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={month} onChange={(e) => setMonth(e.target.value)} /><Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} /></div></section>
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"><Table><TableHeader><TableRow className="bg-slate-50 hover:bg-slate-50"><TableHead>Employee</TableHead><TableHead>Type</TableHead><TableHead>Attendance Days</TableHead><TableHead>Basic</TableHead><TableHead>Deduction</TableHead><TableHead>Bonus</TableHead><TableHead>Net</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader><TableBody>
          {employees.map((e) => { const net = Number(value(e,"basicSalary")) + Number(value(e,"bonus")) - Number(value(e,"deduction")); return <TableRow key={`${e.employeeType}-${e._id}`}><TableCell>{e.userId?.name}</TableCell><TableCell className="capitalize">{e.employeeType}</TableCell><TableCell>26</TableCell><TableCell><Input className="w-28" type="number" value={value(e,"basicSalary")} onChange={(ev) => setValue(e._id,"basicSalary",Number(ev.target.value))} /></TableCell><TableCell><Input className="w-28" type="number" value={value(e,"deduction")} onChange={(ev) => setValue(e._id,"deduction",Number(ev.target.value))} /></TableCell><TableCell><Input className="w-28" type="number" value={value(e,"bonus")} onChange={(ev) => setValue(e._id,"bonus",Number(ev.target.value))} /></TableCell><TableCell>{formatCurrency(net)}</TableCell><TableCell><div className="flex gap-2"><Button size="sm" onClick={() => process(e)}>Process</Button><Button size="sm" variant="outline" onClick={() => printSlip(e)}><FileText className="mr-2 h-4 w-4" />Slip</Button></div></TableCell></TableRow>; })}
        </TableBody></Table></section>
      </div>
    </RoleGuard>
  );
}
