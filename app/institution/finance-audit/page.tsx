"use client";

import React, { useEffect, useState } from 'react';
import RoleGuard from '@/components/RoleGuard';
import { Button } from '@/components/ui/button';

export default function FinanceAuditPage() {
  const [report, setReport] = useState<any>(null);
  const [range, setRange] = useState({ start: '', end: '' });

  const load = async () => {
    const qs = new URLSearchParams();
    if (range.start) qs.set('start', range.start);
    if (range.end) qs.set('end', range.end);
    const res = await fetch('/api/finance/audit?' + qs.toString());
    const data = await res.json();
    setReport(data);
  };

  useEffect(() => { load(); }, []);

  return (
    <RoleGuard roles={["head", "assistant_head"]}>
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Finance Audit</h1>
        <div className="flex gap-2">
          <input type="date" value={range.start} onChange={(e) => setRange({ ...range, start: e.target.value })} />
          <input type="date" value={range.end} onChange={(e) => setRange({ ...range, end: e.target.value })} />
          <Button onClick={load}>Load</Button>
          <Button onClick={() => {
            const qs = new URLSearchParams(); if (range.start) qs.set('start', range.start); if (range.end) qs.set('end', range.end);
            window.location.assign('/api/finance/audit/export?format=csv&' + qs.toString());
          }}>Export CSV</Button>
        </div>
        {report && (
          <div>
            <h3 className="font-medium">Totals</h3>
            <div>Total Income: {report.totals?.totalIncome}</div>
            <div>Total Fees (created): {report.totals?.totalFees}</div>
            <div>Total Salaries: {report.totals?.totalSalaries}</div>
            <div>Total SMS Topups: {report.totals?.totalSms}</div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
