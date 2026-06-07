"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, RefreshCw, Search, XCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiClient } from "@/lib/api";

type Application = {
  _id: string;
  studentName: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail?: string;
  dateOfBirth?: string;
  address?: string;
  previousSchool?: string;
  previousResult?: string;
  requestedClass?: string;
  status: "pending" | "accepted" | "rejected";
  createdAt?: string;
};

export default function PendingAdmissionsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data: any = await apiClient.get("/admissions");
      setApplications(data.applications || []);
    } catch (error: any) {
      setStatus(error?.message || "Admission list load failed.");
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return applications.filter((item) => {
      const haystack = [item.studentName, item.guardianName, item.guardianPhone, item.guardianEmail, item.requestedClass, item.previousSchool, item.status].join(" ").toLowerCase();
      return !term || haystack.includes(term);
    });
  }, [applications, search]);

  const pendingCount = applications.filter((item) => item.status === "pending").length;

  const accept = async (item: Application) => {
    if (!confirm(`Approve admission for ${item.studentName}?`)) return;
    setBusyId(item._id);
    setStatus("Approving admission...");
    try {
      const data: any = await apiClient.post(`/admissions/${item._id}/accept`, {
        className: item.requestedClass,
        sectionName: "A",
      });
      setStatus(`Admission approved. Student username: ${data?.credentials?.username || "created"}`);
      await load();
    } catch (error: any) {
      setStatus(error?.message || "Approve failed.");
    } finally {
      setBusyId("");
    }
  };

  const reject = async (item: Application) => {
    if (!confirm(`Reject admission for ${item.studentName}?`)) return;
    setBusyId(item._id);
    setStatus("Rejecting admission...");
    try {
      await apiClient.post(`/admissions/${item._id}/reject`, {});
      setStatus("Admission rejected.");
      await load();
    } catch (error: any) {
      setStatus(error?.message || "Reject failed.");
    } finally {
      setBusyId("");
    }
  };

  return <div className="space-y-5">
    <PageHeader title="Pending Admissions" description="Public admission applications review and approval." icon={Clock} status={<Badge variant="outline">{pendingCount} pending</Badge>} actions={[<Button key="refresh" size="sm" variant="outline" onClick={load}><RefreshCw className="mr-2 h-4 w-4" />Reload</Button>]} />
    {status && <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700 whitespace-pre-wrap">{status}</div>}
    <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Search className="h-4 w-4" />Search Applications</CardTitle></CardHeader><CardContent><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, guardian, phone, class, status" /></CardContent></Card>
    <Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Requested Class</TableHead><TableHead>Guardian</TableHead><TableHead>Previous</TableHead><TableHead>Address</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader><TableBody>{loading ? <TableRow><TableCell colSpan={7} className="h-24 text-center">Loading applications...</TableCell></TableRow> : filtered.length === 0 ? <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No admission applications found.</TableCell></TableRow> : filtered.map((item) => <TableRow key={item._id}><TableCell><div className="font-medium">{item.studentName}</div><div className="text-xs text-muted-foreground">DOB: {item.dateOfBirth ? item.dateOfBirth.slice(0, 10) : "-"}</div><div className="text-xs text-muted-foreground">Applied: {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-"}</div></TableCell><TableCell>{item.requestedClass || "-"}</TableCell><TableCell><div>{item.guardianName}</div><div className="text-xs text-muted-foreground">{item.guardianPhone}</div><div className="text-xs text-muted-foreground">{item.guardianEmail || ""}</div></TableCell><TableCell><div className="text-xs">School: {item.previousSchool || "-"}</div><div className="text-xs">Result: {item.previousResult || "-"}</div></TableCell><TableCell className="max-w-[180px] text-xs">{item.address || "-"}</TableCell><TableCell><Badge variant={item.status === "pending" ? "default" : "outline"}>{item.status}</Badge></TableCell><TableCell><div className="flex justify-end gap-2">{item.status === "pending" ? <><Button size="sm" onClick={() => accept(item)} disabled={busyId === item._id}><CheckCircle2 className="mr-2 h-4 w-4" />Approve</Button><Button size="sm" variant="destructive" onClick={() => reject(item)} disabled={busyId === item._id}><XCircle className="mr-2 h-4 w-4" />Reject</Button></> : <span className="text-xs text-muted-foreground">Processed</span>}</div></TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
  </div>;
}
