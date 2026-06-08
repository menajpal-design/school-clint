"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, LockKeyhole, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { API_URL, apiClient, api } from "@/lib/api";
import { authManager } from "@/lib/auth";
import { User, UserRole } from "@/types";
import { useToast } from "@/hooks/useToast";
import { getSubdomain } from "@/lib/utils";
import SchoolNotFound from "@/components/SchoolNotFound";

const loginSchema = z.object({
  identifier: z.string().min(2, "Username, email or mobile number is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().default(true),
});

type LoginForm = z.infer<typeof loginSchema>;

const roleRedirects: Partial<Record<UserRole, string>> = {
  admin: "/admin",
  super_admin: "/admin",
  head: "/dashboard",
  assistant_head: "/dashboard",
  class_teacher: "/attendance/mark",
  subject_teacher: "/academic/results",
  finance_officer: "/finance",
  student: "/dashboard",
  parent: "/dashboard",
  staff: "/profile",
  teacher: "/academic/results",
  committee_member: "/committee",
};

function getRoleRedirect(role?: UserRole) {
  return role ? roleRedirects[role] || "/dashboard" : "/dashboard";
}

function getLoginRedirect(user?: User | null) {
  if (!user) return "/dashboard";
  if (user.institution?.isActive === false && user.role === "head") return "/billing";
  return getRoleRedirect(user.role);
}

function getLoginFailureMessage(error: any): string {
  const validationErrors = error?.error?.errors;
  const status = error?.error?.status || error?.status || error?.response?.status;
  if ([500, 502, 503, 504].includes(Number(status))) return "সার্ভারে সমস্যা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।";
  if (error?.message === "Network Error" || error?.code === "ERR_NETWORK") return "সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না। ইন্টারনেট বা সার্ভার চেক করুন।";
  if (Array.isArray(validationErrors) && validationErrors.length) {
    const message = validationErrors.map((item: any) => {
      if (typeof item === "string") return item;
      if (item?.message) return item.message;
      if (item?.field) return `${item.field}: ${item.message || "ভুল ইনপুট"}`;
      return "ভুল ইনপুট";
    }).filter(Boolean).join(", ");
    return message || "ইউজারনেম/ইমেইল/মোবাইল এবং পাসওয়ার্ড সঠিক দিন।";
  }
  const rawMessage = error?.error?.message || error?.message || "";
  const lowerMessage = String(rawMessage).toLowerCase();
  if (!rawMessage) return "লগইন করা যাচ্ছে না। অনুগ্রহ করে আবার চেষ্টা করুন।";
  if (lowerMessage.includes("database is not connected")) return "সার্ভারের ডাটাবেজ সংযুক্ত নয়। পরে আবার চেষ্টা করুন।";
  if (lowerMessage.includes("server error")) return "সার্ভারে সমস্যা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।";
  if (lowerMessage.includes("user not found")) return "এই ইউজার পাওয়া যায়নি। ইউজারনেম, ইমেইল বা মোবাইল নম্বর ঠিক আছে কিনা দেখুন।";
  if (lowerMessage.includes("incorrect password")) return "পাসওয়ার্ড ভুল হয়েছে। আবার সঠিক পাসওয়ার্ড দিন।";
  if (lowerMessage.includes("validation failed")) return "ফর্মের তথ্য ঠিক নয়। ইউজারনেম/ইমেইল/মোবাইল এবং পাসওয়ার্ড দিন।";
  if (lowerMessage.includes("invalid credentials")) return "ইউজারনেম/ইমেইল/মোবাইল বা পাসওয়ার্ড সঠিক নয়।";
  return String(rawMessage);
}

function showToast(addToast: ReturnType<typeof useToast>["addToast"], toast: { title: string; message: string; type: "success" | "error" | "info" | "warning"; duration?: number }) {
  addToast(toast);
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("app-toast", { detail: toast }));
}

async function readJsonOrText(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return { message: text }; }
}

async function fetchCsrfToken() {
  try {
    const response = await fetch(`${API_URL}/csrf/token`, { method: "GET", credentials: "include" });
    if (!response.ok) return "";
    const data = await readJsonOrText(response);
    return data?.csrfToken || "";
  } catch { return ""; }
}

async function loginSafely(payload: { identifier: string; password: string }) {
  const csrfToken = await fetchCsrfToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (csrfToken) headers[process.env.NEXT_PUBLIC_CSRF_HEADER_NAME || "x-csrf-token"] = csrfToken;
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify(payload),
  });
  const data = await readJsonOrText(response);
  if (!response.ok) {
    throw {
      message: data?.message || response.statusText || "Login failed",
      status: response.status,
      error: { ...(typeof data === "object" && data ? data : {}), status: response.status },
    };
  }
  return data as { token: string; user: User };
}

export default function LoginPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isSubdomain, setIsSubdomain] = useState(false);
  const [subdomainName, setSubdomainName] = useState("");
  const [isValidSubdomain, setIsValidSubdomain] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || "easyschool.live";
      const sub = getSubdomain(hostname, mainDomain);
      if (sub) {
        setIsSubdomain(true);
        setSubdomainName(sub);
        api.admissions.schools({ subdomain: sub, domain: hostname })
          .then((res: any) => setIsValidSubdomain((res.schools || []).length > 0))
          .catch(() => setIsValidSubdomain(false))
          .finally(() => setIsChecking(false));
        return;
      }
    }
    const user = authManager.getUser();
    if (authManager.isAuthenticated()) {
      router.replace(getLoginRedirect(user));
      return;
    }
    setIsChecking(false);
  }, [router]);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "", rememberMe: true },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setLoginError("");
    try {
      const response = await loginSafely({ identifier: data.identifier.trim(), password: data.password });
      apiClient.setToken(response.token, data.rememberMe);
      authManager.setUser(response.user, data.rememberMe);
      if (typeof window !== "undefined") {
        if (response.user.institutionId) localStorage.setItem("selectedInstitutionId", String(response.user.institutionId));
        if (response.user.institution?.name) localStorage.setItem("selectedInstitutionName", response.user.institution.name);
      }
      showToast(addToast, { title: "Login successful", message: "Redirecting to your workspace.", type: "success", duration: 1800 });
      router.replace(getLoginRedirect(response.user));
    } catch (error: any) {
      const detailMessage = getLoginFailureMessage(error);
      setLoginError(detailMessage);
      showToast(addToast, { title: "লগইন ব্যর্থ", message: detailMessage, type: "error", duration: 6000 });
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;
  }
  if (isSubdomain && !isValidSubdomain) return <SchoolNotFound subdomain={subdomainName} />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-indigo-600">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center"><span className="text-white font-bold">E</span></div>
            EasySchool
          </Link>
          <p className="mt-2 text-sm text-gray-600">Multi-tenant School Management Platform</p>
        </div>
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
            <CardDescription>Enter your credentials to access your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {loginError && <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" /><span>{loginError}</span></div>}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Username, Email or Mobile</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input {...register("identifier")} placeholder="Enter username, email or mobile" className="pl-10" disabled={isLoading} />
                </div>
                {errors.identifier && <p className="text-sm text-red-600">{errors.identifier.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input {...register("password")} type={showPassword ? "text" : "password"} placeholder="Enter password" className="pl-10 pr-10" disabled={isLoading} />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" disabled={isLoading}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                </div>
                {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</> : <>Sign in<ArrowRight className="ml-2 h-4 w-4" /></>}
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="mt-6 text-center text-sm text-gray-600">Don&apos;t have an account? <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">Register your school</Link></p>
      </div>
    </div>
  );
}
