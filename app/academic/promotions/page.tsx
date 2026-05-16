"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, GraduationCap, RefreshCw, ShieldCheck, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api, apiClient } from "@/lib/api";

type ClassItem = {
  _id: string;
  name: string;
  grade?: string;
  sections?: { _id: string; name: string; isActive?: boolean }[];
};

type ExamItem = {
  _id: string;
  name: string;
  type: string;
  classId?: { _id: string; name: string };
};

type PromotionRow = {
  studentId: string;
  studentName: string;
  rollNumber: string;
  fromSectionId?: string;
  sectionName?: string;
  resultCount: number;
  subjectCount: number;
  failedSubjects: number;
  failedSubjectNames: string[];
  missingSubjects: number;
  autoDecision: "promoted" | "failed";
  manualEligible: boolean;
  alreadyProcessed: boolean;
  processedDecision?: string;
};

export default function PromotionsPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [fromClassId, setFromClassId] = useState("");
  const [toClassId, setToClassId] = useState("");
  const [toSectionId, setToSectionId] = useState("");
  const [examId, setExamId] = useState("");
  const [rows, setRows] = useState<PromotionRow[]>([]);
  const [decisions, setDecisions] = useState<Record<string, { decision: "promoted" | "failed"; reason?: string }>>({});
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fromExams = useMemo(() => exams.filter((exam) => !fromClassId || exam.classId?._id === fromClassId), [exams, fromClassId]);
  const toClass = classes.find((item) => item._id === toClassId);
  const toSections = toClass?.sections?.filter((section) => section.isActive !== false) || [];

  const loadLookups = async () => {
    setLoading(true);
    setError("");
    try {
      const [classResponse, examResponse] = await Promise.all([
        api.academic.classes.getAll() as Promise<{ classes: ClassItem[] }>,
        api.academic.exams.getAll() as Promise<{ exams: ExamItem[] }>,
      ]);
      const nextClasses = classResponse.classes || [];
      const nextExams = examResponse.exams || [];
      setClasses(nextClasses);
      setExams(nextExams);
      const firstClass = nextClasses[0]?._id || "";
      setFromClassId((current) => current || firstClass);
      setToClassId((current) => current || nextClasses[1]?._id || firstClass);
      setExamId((current) => current || nextExams.find((exam) => exam.classId?._id === firstClass && ["final", "annual"].includes(exam.type))?._id || nextExams[0]?._id || "");
    } catch (err: any) {
      setError(err?.message || "Failed to load promotion filters");
    } finally {
      setLoading(false);
    }
  };

  const preview = async () => {
    if (!fromClassId || !examId) {
      setError("Please select from class and final/annual exam.");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const query = new URLSearchParams({ fromClassId, examId });
      const data = await apiClient.get(`/promotions/preview?${query.toString()}`) as any;
      const nextRows = data.rows || [];
      setRows(nextRows);
      setSummary(data.summary || {});
      const defaults: Record<string, { decision: "promoted" | "failed"; reason?: string }> = {};
      nextRows.forEach((row: PromotionRow) => {
        defaults[row.studentId] = { decision: row.autoDecision, reason: "" };
      });
      setDecisions(defaults);
    } catch (err: any) {
      setError(err?.message || "Failed to preview promotion");
    } finally {
      setLoading(false);
    }
  };

  const process = async () => {
    if (!fromClassId || !toClassId || !examId) {
      setError("Please select from class, next class and exam.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const payload = {
        fromClassId,
        toClassId,
        toSectionId: toSectionId || undefined,
        examId,
        decisions: rows.map((row) => ({
          studentId: row.studentId,
          decision: decisions[row.studentId]?.decision || row.autoDecision,
          reason: decisions[row.studentId]?.reason || "",
        })),
      };
      const data = await apiClient.post('/promotions/process', payload) as any;
      setMessage(`${data.message} Promoted: ${data.summary?.promoted || 0}, Failed: ${data.summary?.failed || 0}, Blocked: ${data.summary?.blocked || 0}`);
      await preview();
    } catch (err: any) {
      setError(err?.message || "Failed to process promotion");
    } finally {
      setSaving(false);
    }
  };

  const updateDecision = (studentId: string, decision: "promoted" | "failed") => {
    setDecisions((current) => ({ ...current, [studentId]: { ...current[studentId], decision } }));
  };

  const updateReason = (studentId: string, reason: string) => {
    setDecisions((current) => ({ ...current, [studentId]: { ...current[studentId], reason } }));
  };

  useEffect(() => {
    loadLookups();
  }, []);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight"><GraduationCap className="h-8 w-8" /> Final Exam Promotion</h1>
          <p className="mt-1 text-sm text-muted-foreground">Final/annual exam result থেকে promoted/failed decision দিন। Promoted হলে student auto next class data-তে add হবে।</p>
        </div>
        <Button asChild variant="outline"><Link href="/academic/results">Back to Results</Link></Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Promotion Setup</CardTitle>
          <CardDescription>যে ক্লাস থেকে পরবর্তী ক্লাসে promotion হবে সেটআপ করুন।</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-5">
          <Filter label="From Class" value={fromClassId} onChange={(value) => { setFromClassId(value); setRows([]); }}>
            <option value="">Select class</option>
            {classes.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
          </Filter>
          <Filter label="Final/Annual Exam" value={examId} onChange={setExamId}>
            <option value="">Select exam</option>
            {fromExams.map((item) => <option key={item._id} value={item._id}>{item.name} ({item.type})</option>)}
          </Filter>
          <Filter label="Next Class" value={toClassId} onChange={(value) => { setToClassId(value); setToSectionId(""); }}>
            <option value="">Select next class</option>
            {classes.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
          </Filter>
          <Filter label="Next Section" value={toSectionId} onChange={setToSectionId}>
            <option value="">No section / keep blank</option>
            {toSections.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
          </Filter>
          <div className="flex items-end gap-2">
            <Button className="w-full" onClick={preview} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />Preview
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {message && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}

      <div className="grid gap-4 md:grid-cols-4">
        <Metric title="Students" value={summary.totalStudents || rows.length} />
        <Metric title="Auto Promoted" value={summary.autoPromoted || 0} />
        <Metric title="Manual Eligible" value={summary.manualEligible || 0} />
        <Metric title="Processed" value={summary.processed || 0} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Promotion Decision</CardTitle>
          <CardDescription>২/৩ subject fail হলেও Head বা Class Teacher চাইলে Manual Promoted দিতে পারবে। ৩টির বেশি fail হলে system block করবে।</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/60">
                <th className="p-3">Roll</th>
                <th>Student</th>
                <th>Section</th>
                <th>Results</th>
                <th>Failed</th>
                <th>System Decision</th>
                <th>Final Decision</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={9} className="h-32 text-center text-muted-foreground">Select filters and click Preview.</td></tr>
              ) : rows.map((row) => {
                const selectedDecision = decisions[row.studentId]?.decision || row.autoDecision;
                const manualPromoted = row.autoDecision === 'failed' && selectedDecision === 'promoted';
                return (
                  <tr key={row.studentId} className="border-b last:border-0">
                    <td className="p-3 font-medium">{row.rollNumber}</td>
                    <td>{row.studentName}</td>
                    <td>{row.sectionName || "-"}</td>
                    <td>{row.resultCount}/{row.subjectCount}</td>
                    <td>
                      <div className="font-semibold">{row.failedSubjects}</div>
                      <div className="text-xs text-muted-foreground">Missing: {row.missingSubjects}</div>
                    </td>
                    <td><DecisionBadge decision={row.autoDecision} /></td>
                    <td>
                      <select
                        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                        value={selectedDecision}
                        disabled={row.failedSubjects > 3}
                        onChange={(event) => updateDecision(row.studentId, event.target.value as "promoted" | "failed")}
                      >
                        <option value="promoted">Promoted</option>
                        <option value="failed">Failed</option>
                      </select>
                      {manualPromoted && <div className="mt-1 text-xs font-medium text-blue-700">Manual promoted</div>}
                    </td>
                    <td><Input value={decisions[row.studentId]?.reason || ""} onChange={(event) => updateReason(row.studentId, event.target.value)} placeholder="Optional reason" /></td>
                    <td>
                      {row.alreadyProcessed ? <Badge className="bg-emerald-600">{row.processedDecision}</Badge> : row.failedSubjects > 3 ? <Badge variant="destructive">Blocked</Badge> : <Badge variant="outline">Pending</Badge>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <div className="flex justify-end">
          <Button onClick={process} disabled={saving || !toClassId} size="lg">
            <ShieldCheck className="mr-2 h-5 w-5" />
            {saving ? "Processing..." : "Process Promotion & Move Students"}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
}

function Filter({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
    </label>
  );
}

function Metric({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="mt-1 text-2xl font-bold">{Number(value || 0).toLocaleString()}</p>
      </CardContent>
    </Card>
  );
}

function DecisionBadge({ decision }: { decision: "promoted" | "failed" }) {
  if (decision === "promoted") return <Badge className="bg-emerald-600"><CheckCircle2 className="mr-1 h-3 w-3" />Promoted</Badge>;
  return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Failed</Badge>;
}
