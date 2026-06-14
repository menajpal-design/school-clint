"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Shield,
  Sparkles,
  Users,
  Key,
  Settings,
  Info,
  Grid,
  Activity,
  CheckCircle2,
  Search,
  Save,
  RefreshCw,
  AlertCircle,
  Check,
  X,
  Lock,
  Unlock,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp
} from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const operations = ["dashboard", "academic", "attendance", "finance", "documents", "id_cards", "notices", "users", "settings"];
const platformRoles = ["admin", "super_admin"];
const allRoles = ["admin", "super_admin", "head", "assistant_head", "class_teacher", "subject_teacher", "teacher", "finance_officer", "staff", "student", "parent", "committee_member"];
const schoolManagedRoles = ["assistant_head", "class_teacher", "subject_teacher", "teacher", "finance_officer", "staff", "student", "parent", "committee_member"];

const roleMeta: Record<string, { titleEn: string; titleBn: string; descEn: string; descBn: string; color: string; bg: string; border: string; icon: string }> = {
  admin: {
    titleEn: "Platform Admin",
    titleBn: "প্লাটফর্ম এডমিন",
    descEn: "Full system administration and database controls.",
    descBn: "সিস্টেমের সামগ্রিক নিয়ন্ত্রণ ও ডেটাবেস পরিচালনাকারী।",
    color: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
    icon: "ShieldAlert"
  },
  super_admin: {
    titleEn: "Super Admin",
    titleBn: "সুপার এডমিন",
    descEn: "Owner/Developer root access and global configuration.",
    descBn: "ডেভেলপার রুট অ্যাক্সেস এবং গ্লোবাল কনফিগারেশন ম্যানেজার।",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    icon: "Sparkles"
  },
  head: {
    titleEn: "Head Teacher / Principal",
    titleBn: "প্রধান শিক্ষক / অধ্যক্ষ",
    descEn: "Full management of all departments, finances, and reports.",
    descBn: "সকল বিভাগ, আর্থিক হিসাব ও রিপোর্টের সম্পূর্ণ অ্যাক্সেসাধিকারী।",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: "Shield"
  },
  assistant_head: {
    titleEn: "Assistant Headmaster",
    titleBn: "সহকারী প্রধান শিক্ষক",
    descEn: "Assists the Principal in academic and operations management.",
    descBn: "একাডেমিক কার্যক্রম ও নোটিশবোর্ড তদারকি করার ক্ষমতা।",
    color: "text-teal-700",
    bg: "bg-teal-50",
    border: "border-teal-200",
    icon: "Shield"
  },
  class_teacher: {
    titleEn: "Class Teacher",
    titleBn: "শ্রেণি শিক্ষক",
    descEn: "Manages class details, student attendance, and homework.",
    descBn: "নির্দিষ্ট শ্রেণির শিক্ষার্থীদের উপস্থিতি, রেজাল্ট ও হোমওয়ার্ক পরিচালনা।",
    color: "text-indigo-700",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    icon: "Users"
  },
  subject_teacher: {
    titleEn: "Subject Teacher",
    titleBn: "বিষয় শিক্ষক",
    descEn: "Enters marks and schedules routines for assigned subjects.",
    descBn: "নির্দিষ্ট বিষয়ের রেজাল্ট শিট প্রিপারেশন ও পরীক্ষার সিলেবাস এন্ট্রি।",
    color: "text-violet-700",
    bg: "bg-violet-50",
    border: "border-violet-200",
    icon: "Users"
  },
  teacher: {
    titleEn: "General Teacher",
    titleBn: "সাধারণ শিক্ষক",
    descEn: "General academic duties and viewing student directory.",
    descBn: "একাডেমিক রুটিন দেখা ও শিক্ষার্থীদের সাধারণ তথ্য দেখার অনুমতি।",
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-200",
    icon: "Users"
  },
  finance_officer: {
    titleEn: "Finance Officer",
    titleBn: "হিসাবরক্ষক",
    descEn: "Collects student fees, pays salaries, and manages ledgers.",
    descBn: "বেতন সংগ্রহ, আয়-ব্যয় ট্র্যাকিং এবং আর্থিক রিপোর্ট ব্যবস্থাপনা।",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: "Key"
  },
  staff: {
    titleEn: "Office Staff",
    titleBn: "অফিস স্টাফ",
    descEn: "Notice board, document uploads, and student ID scanning.",
    descBn: "সাধারণ নোটিশ বোর্ড পরিচালনা, ডকুমেন্ট আপলোড ও কার্ড স্ক্যানিং।",
    color: "text-slate-700",
    bg: "bg-slate-50",
    border: "border-slate-200",
    icon: "Settings"
  },
  student: {
    titleEn: "Student",
    titleBn: "শিক্ষার্থী",
    descEn: "View homework, syllabus, class routines, and results.",
    descBn: "নিজের প্রোফাইল, হোমওয়ার্ক, লাইব্রেরি ও পরীক্ষার রেজাল্ট দেখা।",
    color: "text-cyan-700",
    bg: "bg-cyan-50",
    border: "border-cyan-200",
    icon: "Users"
  },
  parent: {
    titleEn: "Parent / Guardian",
    titleBn: "অভিভাবক",
    descEn: "Tracks child progress, pays fees, and requests leaves.",
    descBn: "সন্তানের উপস্থিতি, পরীক্ষার নম্বর ও পেমেন্ট হিস্টোরি ট্র্যাকিং।",
    color: "text-sky-700",
    bg: "bg-sky-50",
    border: "border-sky-200",
    icon: "Users"
  },
  committee_member: {
    titleEn: "Committee Member",
    titleBn: "কমিটি সদস্য",
    descEn: "Access to school financial statements and notices.",
    descBn: "প্রতিষ্ঠানের সাধারণ নোটিশ ও বার্ষিক অডিট হিসেব অ্যাক্সেস।",
    color: "text-fuchsia-700",
    bg: "bg-fuchsia-50",
    border: "border-fuchsia-200",
    icon: "Info"
  }
};

const operationMeta: Record<string, { titleEn: string; titleBn: string; descEn: string; descBn: string; icon: string }> = {
  dashboard: {
    titleEn: "Dashboard Summary",
    titleBn: "ড্যাশবোর্ড ওভারভিউ",
    descEn: "View overview cards, charts, and statistics.",
    descBn: "সামগ্রিক তথ্য বিশ্লেষণের চার্ট ও লাইভ স্ট্যাটাস দেখা।",
    icon: "Grid"
  },
  academic: {
    titleEn: "Academic Workflows",
    titleBn: "একাডেমিক কার্যক্রম",
    descEn: "Manage class routines, syllabus, exams, and promotion.",
    descBn: "শ্রেণি রুটিন, সিলেবাস, পরীক্ষা ও প্রমোশন সংক্রান্ত কাজ।",
    icon: "Activity"
  },
  attendance: {
    titleEn: "Attendance Tracking",
    titleBn: "উপস্থিতি ও হাজিরা",
    descEn: "Mark student and staff attendance and view summaries.",
    descBn: "দৈনিক হাজিরা নেওয়া, রিপোর্ট এবং ড্যাশবোর্ড আপডেট।",
    icon: "CheckCircle2"
  },
  finance: {
    titleEn: "Financial Accounts",
    titleBn: "অর্থ ও বেতন ব্যবস্থাপনা",
    descEn: "Manage collections, fees structure, and teacher salaries.",
    descBn: "বেতন সংগ্রহ, রসিদ জেনারেট এবং আয়-ব্যয়ের হিসাব রাখা।",
    icon: "Key"
  },
  documents: {
    titleEn: "Documents Library",
    titleBn: "নথিপত্র ও ফাইল লাইব্রেরি",
    descEn: "Upload and download official institutional documents.",
    descBn: "পরীক্ষার প্রশ্ন, সিলেবাস ফাইল ও প্রাতিষ্ঠানিক ডকুমেন্টস আপলোড।",
    icon: "Settings"
  },
  id_cards: {
    titleEn: "Smart ID Cards",
    titleBn: "আইডি ও স্মার্ট কার্ড",
    descEn: "Generate and print school ID cards and admit cards.",
    descBn: "ডিজিটাল আইডি কার্ড ও পরীক্ষার এডমিট কার্ড প্রিন্ট ও QR স্ক্যান।",
    icon: "Users"
  },
  notices: {
    titleEn: "Notices & Announcements",
    titleBn: "নোটিশ ও ঘোষণা",
    descEn: "Publish announcements and send automated notice SMS.",
    descBn: "জরুরি নোটিশ প্রকাশ, গ্রুপ এসএমএস ও পুশ বিজ্ঞপ্তি।",
    icon: "ShieldAlert"
  },
  users: {
    titleEn: "User Profiles",
    titleBn: "শিক্ষক ও শিক্ষার্থী তালিকা",
    descEn: "Manage teacher, student, parent, and committee profiles.",
    descBn: "শিক্ষক-শিক্ষার্থী ও স্টাফদের ডাটাবেজ তৈরি ও আপডেট করা।",
    icon: "Users"
  },
  settings: {
    titleEn: "System Settings",
    titleBn: "সিস্টেম সেটিংস",
    descEn: "Manage institution details, SMS balance, and backup settings.",
    descBn: "ছুটি কনফিগারেশন, এসএমএস প্রোভাইডার ও সিকিউরিটি ব্যাকআপ।",
    icon: "Settings"
  }
};

const getIcon = (name: string, className = "h-4 w-4") => {
  switch (name) {
    case "ShieldAlert": return <ShieldAlert className={className} />;
    case "Sparkles": return <Sparkles className={className} />;
    case "Shield": return <Shield className={className} />;
    case "Users": return <Users className={className} />;
    case "Key": return <Key className={className} />;
    case "Settings": return <Settings className={className} />;
    case "Info": return <Info className={className} />;
    case "Grid": return <Grid className={className} />;
    case "Activity": return <Activity className={className} />;
    case "CheckCircle2": return <CheckCircle2 className={className} />;
    default: return <Shield className={className} />;
  }
};

export default function PermissionsPage() {
  const { language } = useLanguage();
  const { addToast } = useToast();
  
  const [matrix, setMatrix] = useState<Record<string, string[]>>({});
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"matrix" | "cards">("matrix");
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ role: string; operation: string } | null>(null);

  const loadData = () => {
    setLoading(true);
    Promise.allSettled([api.users.permissions(), api.auth.profile()])
      .then(([permissionsResult, profileResult]) => {
        if (permissionsResult.status === "fulfilled") setMatrix((permissionsResult.value as any).matrix || {});
        if (profileResult.status === "fulfilled") setProfile((profileResult.value as any).user);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const roles = useMemo(() => {
    const allowed = platformRoles.includes(profile?.role) ? allRoles : schoolManagedRoles;
    const dynamic = Object.keys(matrix).filter((role) => allowed.includes(role));
    return dynamic.length ? dynamic : allowed;
  }, [matrix, profile?.role]);

  const filteredOperations = useMemo(() => {
    return operations.filter((op) => {
      const meta = operationMeta[op];
      const matchText = `${op} ${meta?.titleEn} ${meta?.titleBn} ${meta?.descEn} ${meta?.descBn}`.toLowerCase();
      return matchText.includes(searchQuery.toLowerCase());
    });
  }, [searchQuery]);

  const canEdit = useMemo(() => ["admin", "super_admin", "head"].includes(profile?.role), [profile?.role]);

  const toggle = (role: string, operation: string, checked: boolean) => {
    setMatrix((current) => {
      const set = new Set(current[role] || []);
      checked ? set.add(operation) : set.delete(operation);
      return { ...current, [role]: [...set] };
    });
  };

  const grantAll = (role: string) => {
    if (!canEdit) return;
    setMatrix((current) => ({
      ...current,
      [role]: [...operations]
    }));
    addToast({
      title: language === "bn" ? "সব পারমিশন দেওয়া হয়েছে" : "All Permissions Granted",
      message: language === "bn" ? "এই রোলের সব পারমিশন অন করা হয়েছে।" : "Granted all access permissions for this role.",
      type: "info"
    });
  };

  const revokeAll = (role: string) => {
    if (!canEdit) return;
    setMatrix((current) => ({
      ...current,
      [role]: []
    }));
    addToast({
      title: language === "bn" ? "সব পারমিশন বাতিল করা হয়েছে" : "All Permissions Revoked",
      message: language === "bn" ? "এই রোলের সব পারমিশন অফ করা হয়েছে।" : "Revoked all access permissions for this role.",
      type: "warning"
    });
  };

  const save = async () => {
    if (!canEdit) return;
    setSaving(true);
    try {
      await api.users.updatePermissions(matrix);
      addToast({
        title: language === "bn" ? "অনুমতি সংরক্ষিত হয়েছে" : "Permissions Saved",
        message: language === "bn" ? "রোল ভিত্তিক পারমিশন ম্যাট্রিক্স সফলভাবে আপডেট করা হয়েছে।" : "The role permission matrix has been successfully updated.",
        type: "success"
      });
    } catch (err: any) {
      addToast({
        title: language === "bn" ? "সংরক্ষণ ব্যর্থ" : "Save Failed",
        message: err?.message || (language === "bn" ? "পারমিশন সংরক্ষণ করা যায়নি।" : "Failed to save permissions"),
        type: "error"
      });
    } finally {
      setSaving(false);
    }
  };

  // Helper to compute stats
  const stats = useMemo(() => {
    let totalAssigned = 0;
    const roleStats = roles.map((role) => {
      const count = (matrix[role] || []).length;
      totalAssigned += count;
      return { role, count };
    });
    return {
      totalAssigned,
      average: roles.length ? Math.round(totalAssigned / roles.length) : 0,
      roleStats
    };
  }, [matrix, roles]);

  return (
    <div className="space-y-6 pb-12">
      <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-gradient-to-tr from-slate-900 via-slate-800 to-indigo-950 p-6 text-white shadow-xl">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl" />
        
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm border border-white/10">
              <ShieldCheck className="h-8 w-8 text-indigo-300 animate-pulse" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                {language === "bn" ? "পারমিশন কন্ট্রোল প্যানেল" : "Permissions Control Panel"}
              </h1>
              <p className="mt-1 text-sm text-slate-300 max-w-2xl">
                {language === "bn" 
                  ? "বিভিন্ন রোল অনুযায়ী মডিউলের অ্যাক্সেস কন্ট্রোল করুন। আপনার সিদ্ধান্ত অনুযায়ী সংশ্লিষ্ট ইউজাররা মডিউল দেখার অধিকার পাবেন।" 
                  : "Manage access controls across different roles. Assigned permissions dynamically reflect in user menus and dashboards."}
              </p>
            </div>
          </div>
          {canEdit && (
            <Button 
              onClick={save} 
              disabled={saving} 
              className="w-full md:w-auto bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold hover:from-indigo-600 hover:to-violet-700 shadow-md h-12 rounded-xl transition-all"
            >
              {saving ? (
                <>
                  <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                  {language === "bn" ? "সংরক্ষণ হচ্ছে..." : "Saving..."}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" />
                  {language === "bn" ? "পারমিশন সেভ করুন" : "Save Permissions"}
                </>
              )}
            </Button>
          )}
        </div>

        {/* Dynamic Stats Row inside Header Container */}
        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/10 pt-6 md:grid-cols-4">
          <div>
            <div className="text-xs text-slate-400 uppercase font-semibold tracking-wider">
              {language === "bn" ? "মোট রোল সংখ্যা" : "Total Roles"}
            </div>
            <div className="text-2xl font-extrabold text-white mt-1">{roles.length}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase font-semibold tracking-wider">
              {language === "bn" ? "মোট মডিউল" : "Total Modules"}
            </div>
            <div className="text-2xl font-extrabold text-white mt-1">{operations.length}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase font-semibold tracking-wider">
              {language === "bn" ? "অ্যাসাইনড পারমিশন" : "Assigned Rules"}
            </div>
            <div className="text-2xl font-extrabold text-indigo-300 mt-1">{stats.totalAssigned}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase font-semibold tracking-wider">
              {language === "bn" ? "গড় এক্সেস" : "Average Access"}
            </div>
            <div className="text-2xl font-extrabold text-emerald-300 mt-1">
              {stats.average} / {operations.length}
            </div>
          </div>
        </div>
      </div>

      {!canEdit && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-800 shadow-sm backdrop-blur-sm">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <span className="font-semibold">{language === "bn" ? "রিড-অনলি মোড:" : "Read-only Mode:"}</span>{" "}
            {language === "bn" 
              ? "শুধুমাত্র প্রধান শিক্ষক বা এডমিনরাই পারমিশন পরিবর্তন করতে পারবেন।" 
              : "Only Head or Admin users are authorized to update permissions."}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        {/* Toggle Switches */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-fit border shadow-sm">
          <button
            onClick={() => setViewMode("matrix")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all",
              viewMode === "matrix" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
            )}
          >
            <Grid className="h-4 w-4" />
            {language === "bn" ? "ম্যাট্রিক্স ভিউ" : "Matrix View"}
          </button>
          <button
            onClick={() => setViewMode("cards")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all",
              viewMode === "cards" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
            )}
          >
            <Users className="h-4 w-4" />
            {language === "bn" ? "রোল ভিত্তিক ভিউ" : "Role Detail View"}
          </button>
        </div>

        {/* Search Operations */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={language === "bn" ? "মডিউল সার্চ করুন..." : "Search operations..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50/50"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-3xl shadow-sm">
          <RefreshCw className="h-10 w-10 text-indigo-500 animate-spin" />
          <p className="mt-4 text-slate-500 text-sm">
            {language === "bn" ? "পারমিশন ডাটা লোড হচ্ছে..." : "Loading permissions matrix..."}
          </p>
        </div>
      ) : (
        <>
          {/* MATRIX VIEW */}
          {viewMode === "matrix" && (
            <div className="overflow-hidden bg-white rounded-3xl border border-slate-100 shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70">
                      <th className="p-4 text-sm font-bold text-slate-700 min-w-[200px]">
                        {language === "bn" ? "মডিউলসমূহ" : "Operations"}
                      </th>
                      {roles.map((role) => {
                        const meta = roleMeta[role];
                        return (
                          <th 
                            key={role} 
                            className={cn(
                              "p-4 text-center text-xs font-bold uppercase tracking-wider transition-all duration-200",
                              hoveredCell?.role === role ? "bg-indigo-50/30 text-indigo-800" : "text-slate-600"
                            )}
                          >
                            <div className="flex flex-col items-center gap-1">
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "font-bold py-1 px-2.5 rounded-lg border",
                                  meta?.color || "text-slate-700 bg-slate-50 border-slate-200"
                                )}
                              >
                                {language === "bn" ? meta?.titleBn || role : meta?.titleEn || role}
                              </Badge>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOperations.map((op) => {
                      const meta = operationMeta[op];
                      return (
                        <tr 
                          key={op} 
                          className={cn(
                            "hover:bg-slate-50/50 transition-all",
                            hoveredCell?.operation === op && "bg-indigo-50/20"
                          )}
                        >
                          <td className="p-4 align-middle">
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 rounded-lg bg-indigo-50 p-2 text-indigo-600 shrink-0">
                                {getIcon(meta.icon, "h-4 w-4")}
                              </div>
                              <div>
                                <div className="font-bold text-slate-800 text-sm capitalize">
                                  {language === "bn" ? meta.titleBn : meta.titleEn}
                                </div>
                                <div className="text-xs text-slate-400 mt-0.5">
                                  {language === "bn" ? meta.descBn : meta.descEn}
                                </div>
                              </div>
                            </div>
                          </td>
                          {roles.map((role) => {
                            const isChecked = (matrix[role] || []).includes(op);
                            const isHovered = hoveredCell?.role === role && hoveredCell?.operation === op;
                            return (
                              <td 
                                key={role} 
                                onMouseEnter={() => setHoveredCell({ role, operation: op })}
                                onMouseLeave={() => setHoveredCell(null)}
                                className={cn(
                                  "p-4 text-center align-middle transition-all duration-200",
                                  hoveredCell?.role === role && hoveredCell?.operation !== op && "bg-indigo-50/10",
                                  isHovered && "bg-indigo-100/40"
                                )}
                              >
                                <div className="flex items-center justify-center">
                                  <Checkbox 
                                    checked={isChecked} 
                                    disabled={!canEdit} 
                                    onCheckedChange={(checked) => toggle(role, op, checked === true)} 
                                    className="h-5 w-5 border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 rounded"
                                  />
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filteredOperations.length === 0 && (
                <div className="p-8 text-center text-sm text-slate-500">
                  {language === "bn" ? "কোনো মডিউল খুঁজে পাওয়া যায়নি।" : "No operations match your search filter."}
                </div>
              )}
            </div>
          )}

          {/* CARD DECK VIEW */}
          {viewMode === "cards" && (
            <div className="grid gap-6 md:grid-cols-2">
              {roles.map((role) => {
                const meta = roleMeta[role];
                const allowedOps = matrix[role] || [];
                const percent = Math.round((allowedOps.length / operations.length) * 100);
                const isExpanded = expandedRole === role;

                return (
                  <Card 
                    key={role} 
                    className={cn(
                      "overflow-hidden border border-slate-100 shadow-md hover:shadow-lg transition-all rounded-3xl",
                      isExpanded && "ring-2 ring-indigo-500/50"
                    )}
                  >
                    <CardHeader className="bg-gradient-to-r from-slate-50 to-white pb-4 border-b border-slate-100">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={cn("rounded-2xl p-3 border", meta?.bg || "bg-slate-50", meta?.border || "border-slate-200")}>
                            {getIcon(meta?.icon || "Shield", cn("h-6 w-6", meta?.color || "text-slate-600"))}
                          </div>
                          <div>
                            <CardTitle className="text-lg font-bold text-slate-800">
                              {language === "bn" ? meta?.titleBn || role : meta?.titleEn || role}
                            </CardTitle>
                            <CardDescription className="text-xs text-slate-500 mt-0.5">
                              {language === "bn" ? meta?.descBn : meta?.descEn}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge 
                          variant={percent === 100 ? "default" : percent > 0 ? "secondary" : "outline"}
                          className="font-bold shrink-0"
                        >
                          {percent === 100 
                            ? (language === "bn" ? "ফুল অ্যাক্সেস" : "Full Access") 
                            : percent === 0 
                            ? (language === "bn" ? "নো অ্যাক্সেস" : "No Access") 
                            : `${allowedOps.length} / ${operations.length}`}
                        </Badge>
                      </div>

                      {/* Access Progress Indicator */}
                      <div className="mt-4 space-y-1.5">
                        <div className="flex justify-between text-[11px] font-bold text-slate-500">
                          <span>{language === "bn" ? "অ্যাক্সেস লেভেল" : "Access Level"}</span>
                          <span>{percent}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              percent === 100 ? "bg-emerald-500" : percent > 40 ? "bg-indigo-500" : percent > 0 ? "bg-amber-500" : "bg-slate-200"
                            )} 
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setExpandedRole(isExpanded ? null : role)}
                          className="font-bold text-xs rounded-xl h-9 hover:bg-slate-50"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="mr-1 h-4 w-4" />
                              {language === "bn" ? "তালিকা বন্ধ করুন" : "Hide Operations"}
                            </>
                          ) : (
                            <>
                              <ChevronDown className="mr-1 h-4 w-4" />
                              {language === "bn" ? "অনুমতি তালিকা দেখুন" : "View Permissions"}
                            </>
                          )}
                        </Button>

                        {canEdit && isExpanded && (
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => grantAll(role)}
                              className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 text-xs font-bold px-2.5 h-8 rounded-lg"
                            >
                              {language === "bn" ? "সব দিন" : "Grant All"}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => revokeAll(role)}
                              className="text-rose-700 hover:text-rose-800 hover:bg-rose-50 text-xs font-bold px-2.5 h-8 rounded-lg"
                            >
                              {language === "bn" ? "সব অফ" : "Revoke All"}
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Expandable Switch Grid */}
                      {isExpanded && (
                        <div className="grid gap-3 sm:grid-cols-2 mt-4 border-t border-slate-100 pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                          {operations.map((op) => {
                            const meta = operationMeta[op];
                            const isChecked = allowedOps.includes(op);
                            return (
                              <div 
                                key={op} 
                                className="flex items-start justify-between p-3 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all"
                              >
                                <div className="space-y-0.5 pr-2">
                                  <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs capitalize">
                                    <span className="text-indigo-600">{getIcon(meta.icon, "h-3.5 w-3.5")}</span>
                                    {language === "bn" ? meta.titleBn : meta.titleEn}
                                  </div>
                                  <div className="text-[10px] text-slate-400 leading-normal">
                                    {language === "bn" ? meta.descBn : meta.descEn}
                                  </div>
                                </div>
                                <Switch
                                  checked={isChecked}
                                  disabled={!canEdit}
                                  onCheckedChange={(checked) => toggle(role, op, checked)}
                                  className="data-[state=checked]:bg-indigo-600"
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Sticky Bottom Save Bar (Visible only to admins and when screen is scrolled/on change) */}
      {canEdit && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <Button 
            onClick={save} 
            disabled={saving} 
            className="bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-2xl h-12 px-6 rounded-2xl border border-indigo-500/20"
          >
            {saving ? (
              <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Save className="mr-2 h-5 w-5" />
            )}
            {language === "bn" ? "পারমিশন সংরক্ষণ করুন" : "Save Changes"}
          </Button>
        </div>
      )}
    </div>
  );
}
