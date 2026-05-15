"use client";

import React, { FormEvent, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Database,
  FileText,
  GraduationCap,
  KeyRound,
  Landmark,
  Loader2,
  Lock,
  Plus,
  Settings,
  ShieldCheck,
  Upload,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingState } from "@/components/shared/LoadingState";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchFilterBar } from "@/components/shared/SearchFilterBar";
import { StatCard } from "@/components/shared/StatCard";
import { apiClient } from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";

interface RoutePageProps {
  title: string;
  description?: string;
}

type PageKind =
  | "academic"
  | "attendance"
  | "finance"
  | "documents"
  | "users"
  | "profile"
  | "settings"
  | "notices"
  | "committee"
  | "parent"
  | "generic";

type FieldConfig = {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  options?: string[];
  required?: boolean;
};

type PageConfig = {
  kind: PageKind;
  icon: React.ComponentType<{ className?: string }>;
  endpoint?: string;
  dataKey?: string;
  create?: {
    title: string;
    submitLabel: string;
    endpoint: string;
    method?: "post" | "put";
    fields: FieldConfig[];
    success: string;
  };
  actions: Array<{ label: string; href: string; icon?: React.ComponentType<{ className?: string }> }>;
  columns: Array<{ label: string; get: (item: any) => React.ReactNode }>;
  metrics: Array<{ label: string; get: (items: any[], raw: any) => React.ReactNode; icon: React.ComponentType<{ className?: string }> }>;
};

const money = (value: any) => formatCurrency(Number(value || 0));

const formatDate = (value: any) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString();
};

const pickName = (item: any) =>
  item?.name ||
  item?.title ||
  item?.userId?.name ||
  item?.studentId?.userId?.name ||
  item?.studentId?.guardianName ||
  item?.guardianName ||
  item?.rollNumber ||
  item?.email ||
  "Untitled";

const findArray = (raw: any, preferred?: string): any[] => {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== "object") return [];
  if (preferred && Array.isArray(raw[preferred])) return raw[preferred];
  const firstArray = Object.values(raw).find(Array.isArray);
  return Array.isArray(firstArray) ? firstArray : [];
};

const normalizeStatus = (item: any) => {
  if (item?.status) return item.status;
  if (item?.isActive === true) return "active";
  if (item?.isActive === false) return "inactive";
  return item?.priority || item?.type || "record";
};

function getPageConfig(pathname: string, title: string): PageConfig {
  const baseActions = [{ label: "Dashboard", href: "/dashboard", icon: BarChart3 }];

  if (pathname.startsWith("/academic")) {
    const map: Record<string, Partial<PageConfig>> = {
      "/academic/classes": {
        endpoint: "/academic/classes",
        dataKey: "classes",
        create: {
          title: "Add Class",
          submitLabel: "Save class",
          endpoint: "/academic/classes",
          fields: [
            { name: "name", label: "Class name", placeholder: "Class Six", required: true },
            { name: "grade", label: "Grade", placeholder: "6" },
            { name: "section", label: "Section", placeholder: "A" },
          ],
          success: "Class saved successfully.",
        },
      },
      "/academic/subjects": {
        endpoint: "/academic/subjects",
        dataKey: "subjects",
        create: {
          title: "Add Subject",
          submitLabel: "Save subject",
          endpoint: "/academic/subjects",
          fields: [
            { name: "name", label: "Subject name", placeholder: "Mathematics", required: true },
            { name: "code", label: "Subject code", placeholder: "MATH-101" },
            { name: "description", label: "Description", placeholder: "Core subject" },
          ],
          success: "Subject saved successfully.",
        },
      },
      "/academic/exams": { endpoint: "/academic/exams", dataKey: "exams" },
      "/academic/results": { endpoint: "/academic/results", dataKey: "results" },
      "/academic/report-card": { endpoint: "/academic/report-card", dataKey: "subjects" },
    };

    return {
      kind: "academic",
      icon: BookOpen,
      endpoint: "/academic",
      dataKey: "classes",
      actions: [
        { label: "Classes", href: "/academic/classes", icon: GraduationCap },
        { label: "Subjects", href: "/academic/subjects", icon: BookOpen },
        { label: "Exams", href: "/academic/exams", icon: ClipboardList },
        { label: "Results", href: "/academic/results", icon: CheckCircle2 },
      ],
      columns: [
        { label: "Name", get: pickName },
        { label: "Details", get: (item) => item?.grade || item?.code || item?.type || item?.marksObtained || "Academic record" },
        { label: "Updated", get: (item) => formatDate(item?.updatedAt || item?.createdAt) },
        { label: "Status", get: (item) => <StatusBadge value={normalizeStatus(item)} /> },
      ],
      metrics: [
        { label: "Records", get: (items) => items.length, icon: Database },
        { label: "Published", get: (items) => items.filter((item) => item?.isPublished || item?.status === "published").length, icon: CheckCircle2 },
        { label: "Recent", get: (items) => items.slice(0, 7).length, icon: CalendarCheck },
      ],
      ...map[pathname],
    };
  }

  if (pathname.startsWith("/attendance")) {
    const specific: Partial<PageConfig> =
      pathname === "/attendance/reports"
        ? { endpoint: "/attendance/reports", dataKey: "reports" }
        : pathname === "/attendance/my-attendance"
          ? { endpoint: "/attendance/me", dataKey: "attendance" }
          : pathname === "/attendance/mark"
            ? {
                endpoint: "/attendance",
                dataKey: "attendance",
                create: {
                  title: "Mark Attendance",
                  submitLabel: "Save attendance",
                  endpoint: "/attendance/mark",
                  fields: [
                    { name: "studentId", label: "Student ID", placeholder: "Mongo student id", required: true },
                    { name: "classId", label: "Class ID", placeholder: "Class id" },
                    { name: "date", label: "Date", type: "date", required: true },
                    { name: "status", label: "Status", options: ["present", "absent", "late", "excused"], required: true },
                  ],
                  success: "Attendance marked successfully.",
                },
              }
            : {};

    return {
      kind: "attendance",
      icon: CalendarCheck,
      endpoint: "/attendance",
      dataKey: "attendance",
      actions: [
        { label: "Mark", href: "/attendance/mark", icon: Plus },
        { label: "Reports", href: "/attendance/reports", icon: BarChart3 },
        { label: "My Attendance", href: "/attendance/my-attendance", icon: Users },
      ],
      columns: [
        { label: "Student", get: pickName },
        { label: "Class", get: (item) => item?.classId?.name || item?.class || "N/A" },
        { label: "Date", get: (item) => formatDate(item?.date || item?.createdAt) },
        { label: "Status", get: (item) => <StatusBadge value={item?.status || `${item?.percentage || 0}%`} /> },
      ],
      metrics: [
        { label: "Records", get: (items) => items.length, icon: Database },
        { label: "Present", get: (items) => items.filter((item) => item?.status === "present").length, icon: CheckCircle2 },
        { label: "Absent", get: (items) => items.filter((item) => item?.status === "absent").length, icon: AlertCircle },
      ],
      ...specific,
    };
  }

  if (pathname.startsWith("/finance")) {
    const map: Record<string, Partial<PageConfig>> = {
      "/finance/fees": { endpoint: "/finance/fees", dataKey: "fees" },
      "/finance/collections": { endpoint: "/finance/collections", dataKey: "collections" },
      "/finance/salary": { endpoint: "/finance/salary", dataKey: "salaries" },
      "/finance/reports": { endpoint: "/finance/reports", dataKey: "reports" },
      "/finance/my-fees": { endpoint: "/finance/my-fees", dataKey: "myFees" },
    };

    return {
      kind: "finance",
      icon: Landmark,
      endpoint: "/finance",
      dataKey: "fees",
      actions: [
        { label: "Fees", href: "/finance/fees", icon: CreditCard },
        { label: "Collections", href: "/finance/collections", icon: CheckCircle2 },
        { label: "Reports", href: "/finance/reports", icon: BarChart3 },
      ],
      columns: [
        { label: "Name", get: pickName },
        { label: "Amount", get: (item) => money(item?.amount || item?.paidAmount || item?.salaryAmount || item?.total) },
        { label: "Date", get: (item) => formatDate(item?.paymentDate || item?.dueDate || item?.createdAt) },
        { label: "Status", get: (item) => <StatusBadge value={normalizeStatus(item)} /> },
      ],
      metrics: [
        { label: "Records", get: (items) => items.length, icon: Database },
        { label: "Total", get: (items) => money(items.reduce((sum, item) => sum + Number(item?.amount || item?.paidAmount || item?.salaryAmount || 0), 0)), icon: Landmark },
        { label: "Pending", get: (items) => items.filter((item) => item?.status === "pending" || item?.status === "overdue").length, icon: AlertCircle },
      ],
      ...map[pathname],
    };
  }

  if (pathname.startsWith("/documents")) {
    return {
      kind: "documents",
      icon: FileText,
      endpoint: "/documents",
      dataKey: "documents",
      create: pathname === "/documents/upload" ? {
        title: "Upload Document",
        submitLabel: "Save document",
        endpoint: "/documents/upload",
        fields: [
          { name: "title", label: "Title", placeholder: "Exam routine", required: true },
          { name: "type", label: "Type", options: ["notice", "routine", "result", "certificate", "other"], required: true },
          { name: "fileUrl", label: "File URL", placeholder: "https://..." },
          { name: "fileName", label: "File name", placeholder: "routine.pdf" },
        ],
        success: "Document saved successfully.",
      } : undefined,
      actions: [
        { label: "Upload", href: "/documents/upload", icon: Upload },
        { label: "Manage", href: "/documents/manage", icon: Settings },
      ],
      columns: [
        { label: "Document", get: pickName },
        { label: "Type", get: (item) => item?.type || item?.mimeType || "Document" },
        { label: "Uploaded by", get: (item) => item?.uploadedBy?.name || "N/A" },
        { label: "Status", get: (item) => <StatusBadge value={item?.isPublic ? "public" : "private"} /> },
      ],
      metrics: [
        { label: "Documents", get: (items) => items.length, icon: FileText },
        { label: "Public", get: (items) => items.filter((item) => item?.isPublic).length, icon: CheckCircle2 },
        { label: "Private", get: (items) => items.filter((item) => !item?.isPublic).length, icon: Lock },
      ],
    };
  }

  if (pathname.startsWith("/users-roles")) {
    return {
      kind: "users",
      icon: ShieldCheck,
      endpoint: pathname === "/users-roles/permissions" ? "/users/permissions" : "/users",
      dataKey: pathname === "/users-roles/permissions" ? "permissions" : "users",
      actions: [
        { label: "All Users", href: "/users-roles/all", icon: Users },
        { label: "Permissions", href: "/users-roles/permissions", icon: KeyRound },
      ],
      columns: [
        { label: "User", get: pickName },
        { label: "Role", get: (item) => (typeof item === "string" ? item : item?.role || "Permission") },
        { label: "Email", get: (item) => item?.email || "N/A" },
        { label: "Status", get: (item) => <StatusBadge value={typeof item === "string" ? "enabled" : normalizeStatus(item)} /> },
      ],
      metrics: [
        { label: "Entries", get: (items) => items.length, icon: Users },
        { label: "Active", get: (items) => items.filter((item) => item?.isActive !== false).length, icon: CheckCircle2 },
        { label: "Roles", get: (items) => new Set(items.map((item) => item?.role || item)).size, icon: ShieldCheck },
      ],
    };
  }

  if (pathname === "/notices") {
    return {
      kind: "notices",
      icon: ClipboardList,
      endpoint: "/notices",
      dataKey: "notices",
      actions: baseActions,
      columns: [
        { label: "Notice", get: pickName },
        { label: "Category", get: (item) => item?.category || "General" },
        { label: "Published", get: (item) => formatDate(item?.publishedAt || item?.createdAt) },
        { label: "Status", get: (item) => <StatusBadge value={item?.isPublished ? "published" : "draft"} /> },
      ],
      metrics: [
        { label: "Notices", get: (items) => items.length, icon: ClipboardList },
        { label: "Published", get: (items) => items.filter((item) => item?.isPublished).length, icon: CheckCircle2 },
        { label: "High Priority", get: (items) => items.filter((item) => item?.priority === "high").length, icon: AlertCircle },
      ],
    };
  }

  if (pathname === "/committee") {
    return {
      kind: "committee",
      icon: Users,
      endpoint: "/committee",
      dataKey: "committee",
      actions: baseActions,
      columns: [
        { label: "Committee", get: pickName },
        { label: "Chairman", get: (item) => item?.chairmanId?.name || "N/A" },
        { label: "Members", get: (item) => item?.members?.length || 0 },
        { label: "Status", get: (item) => <StatusBadge value={normalizeStatus(item)} /> },
      ],
      metrics: [
        { label: "Committees", get: (items) => items.length, icon: Users },
        { label: "Members", get: (items) => items.reduce((sum, item) => sum + (item?.members?.length || 0), 0), icon: ShieldCheck },
        { label: "Active", get: (items) => items.filter((item) => item?.isActive !== false).length, icon: CheckCircle2 },
      ],
    };
  }

  if (pathname === "/parent-portal") {
    return {
      kind: "parent",
      icon: Users,
      endpoint: "/parent/portal",
      dataKey: "children",
      actions: [{ label: "Notices", href: "/notices", icon: ClipboardList }, { label: "My Fees", href: "/finance/my-fees", icon: CreditCard }],
      columns: [
        { label: "Student", get: pickName },
        { label: "Class", get: (item) => item?.classId?.name || "N/A" },
        { label: "Roll", get: (item) => item?.rollNumber || "N/A" },
        { label: "Status", get: (item) => <StatusBadge value={normalizeStatus(item)} /> },
      ],
      metrics: [
        { label: "Children", get: (items) => items.length, icon: Users },
        { label: "Announcements", get: (_items, raw) => raw?.portal?.announcements?.length || 0, icon: ClipboardList },
        { label: "Linked", get: (items) => items.filter((item) => item?.userId).length, icon: CheckCircle2 },
      ],
    };
  }

  return {
    kind: pathname.startsWith("/profile") ? "profile" : pathname.startsWith("/settings") ? "settings" : "generic",
    icon: pathname.startsWith("/settings") ? Settings : Users,
    actions: pathname.startsWith("/profile")
      ? [{ label: "Change Password", href: "/profile/change-password", icon: KeyRound }]
      : baseActions,
    columns: [
      { label: "Area", get: () => title },
      { label: "Details", get: () => "Ready for configuration" },
      { label: "Updated", get: () => "Today" },
      { label: "Status", get: () => <StatusBadge value="ready" /> },
    ],
    metrics: [
      { label: "Status", get: () => "Ready", icon: CheckCircle2 },
      { label: "Security", get: () => "Enabled", icon: ShieldCheck },
      { label: "Actions", get: () => "Available", icon: Settings },
    ],
  };
}

function StatusBadge({ value }: { value: string }) {
  const normalized = String(value || "record").toLowerCase();
  const good = ["active", "present", "paid", "published", "enabled", "ready", "public"];
  const warning = ["pending", "late", "draft", "overdue"];
  return (
    <Badge
      variant="outline"
      className={cn(
        "capitalize",
        good.includes(normalized) && "border-emerald-200 bg-emerald-50 text-emerald-700",
        warning.includes(normalized) && "border-amber-200 bg-amber-50 text-amber-700",
        ["inactive", "absent", "private"].includes(normalized) && "border-slate-200 bg-slate-50 text-slate-700"
      )}
    >
      {value}
    </Badge>
  );
}

function DataForm({ config, onSaved }: { config: NonNullable<PageConfig["create"]>; onSaved: () => void }) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(config.fields.map((field) => [field.name, field.type === "date" ? new Date().toISOString().slice(0, 10) : field.options?.[0] || ""]))
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await apiClient.post(config.endpoint, values);
      setMessage(config.success);
      onSaved();
    } catch (error: any) {
      setMessage(error?.message || "Could not save this record.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-base">{config.title}</CardTitle>
        <CardDescription>Required fields are enough to create a working record.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
          {config.fields.map((field) => (
            <label key={field.name} className="space-y-1 text-sm font-medium text-slate-700">
              <span>{field.label}</span>
              {field.options ? (
                <select
                  value={values[field.name] || ""}
                  required={field.required}
                  onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {field.options.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              ) : (
                <Input
                  type={field.type || "text"}
                  value={values[field.name] || ""}
                  required={field.required}
                  placeholder={field.placeholder}
                  onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                />
              )}
            </label>
          ))}
          <div className="flex items-end gap-3 md:col-span-2">
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              {config.submitLabel}
            </Button>
            {message && <p className="text-sm text-slate-600">{message}</p>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function RoutePage({ title, description }: RoutePageProps) {
  const pathname = usePathname();
  const config = useMemo(() => getPageConfig(pathname, title), [pathname, title]);
  const Icon = config.icon;
  const [raw, setRaw] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(Boolean(config.endpoint));
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let mounted = true;
    if (!config.endpoint) {
      setItems([{}]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    apiClient
      .get(config.endpoint)
      .then((data: any) => {
        if (!mounted) return;
        const source = pathname === "/parent-portal" ? data?.portal : data;
        setRaw(data);
        setItems(findArray(source, config.dataKey));
      })
      .catch((err) => {
        if (!mounted) return;
        setRaw(null);
        setItems([]);
        setError(err?.message || "Could not load records.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [config.endpoint, config.dataKey, pathname, refreshToken]);

  const filteredItems = items.filter((item) =>
    JSON.stringify(item || {}).toLowerCase().includes(query.toLowerCase())
  );

  const overviewText = description || "Live records, actions, and management tools for this section.";

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        title={title}
        description={overviewText}
        icon={Icon}
        status={<StatusBadge value={error ? "offline" : "active"} />}
        actions={config.actions.map((action) => ({ ...action, active: pathname === action.href }))}
      />

      <div className="grid gap-4 md:grid-cols-3">
        {config.metrics.map((metric) => (
          <StatCard
            key={metric.label}
            label={metric.label}
            value={metric.get(items, raw)}
            icon={metric.icon}
            loading={loading}
          />
        ))}
      </div>

      {config.create && <DataForm config={config.create} onSaved={() => setRefreshToken((current) => current + 1)} />}

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-lg">Records</CardTitle>
            <CardDescription>{error ? "Showing local empty state because the server request failed." : "Database records for this page."}</CardDescription>
          </div>
          <SearchFilterBar
            value={query}
            onChange={setQuery}
            onRefresh={() => setRefreshToken((current) => current + 1)}
          />
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingState />
          ) : error ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              {error}
            </div>
          ) : filteredItems.length === 0 ? (
            <EmptyState />
          ) : (
            <DataTable
              data={filteredItems.slice(0, 25)}
              columns={config.columns.map((column) => ({
                label: column.label,
                render: (item: any) => column.get(item),
              }))}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
