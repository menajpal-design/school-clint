"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api, apiClient } from "@/lib/api";
import { authManager } from "@/lib/auth";
import { User, UserRole } from "@/types";
import { useToast } from "@/hooks/useToast";

const demoRoles: UserRole[] = [
  'head',
  'assistant_head',
  'class_teacher',
  'subject_teacher',
  'teacher',
  'finance_officer',
  'staff',
  'student',
  'parent',
  'committee_member',
];

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
  student: "/attendance/my-attendance",
  parent: "/parent-portal",
  staff: "/profile",
  teacher: "/academic/results",
  committee_member: "/committee",
};

function getRoleRedirect(role?: UserRole) {
  if (!role) return "/dashboard";
  return roleRedirects[role] || "/dashboard";
}

function getLoginRedirect(user?: User | null) {
  if (!user) return "/dashboard";
  if (user.institution?.isActive === false && user.role === "head") return "/billing";
  return getRoleRedirect(user.role);
}

function getLoginFailureMessage(error: any): string {
  const validationErrors = error?.error?.errors;

  const status = error?.error?.status || error?.status || error?.response?.status;
  if ([500, 502, 503, 504].includes(Number(status))) {
    return 'সার্ভারে সমস্যা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।';
  }

  if (error?.message === 'Network Error' || error?.code === 'ERR_NETWORK') {
    return 'সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না। ইন্টারনেট বা সার্ভার চেক করুন।';
  }

  if (Array.isArray(validationErrors) && validationErrors.length) {
    const message = validationErrors
      .map((item: any) => {
        if (typeof item === 'string') return item;
        if (item?.message) return item.message;
        if (item?.field) return `${item.field}: ${item.message || 'ভুল ইনপুট'}`;
        return 'ভুল ইনপুট';
      })
      .filter(Boolean)
      .join(', ');

    return message || 'ইউজারনেম/ইমেইল/মোবাইল এবং পাসওয়ার্ড সঠিক দিন।';
  }

  const rawMessage = error?.error?.message || error?.message || '';
  const lowerMessage = String(rawMessage).toLowerCase();

  if (!rawMessage) return 'লগইন করা যাচ্ছে না। অনুগ্রহ করে আবার চেষ্টা করুন।';
  if (lowerMessage.includes('database is not connected')) return 'সার্ভারের ডাটাবেজ সংযুক্ত নয়। পরে আবার চেষ্টা করুন।';
  if (lowerMessage.includes('server error')) return 'সার্ভারে সমস্যা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।';
  if (lowerMessage.includes('user not found')) return 'এই ইউজার পাওয়া যায়নি। ইউজারনেম, ইমেইল বা মোবাইল নম্বর ঠিক আছে কিনা দেখুন।';
  if (lowerMessage.includes('incorrect password')) return 'পাসওয়ার্ড ভুল হয়েছে। আবার সঠিক পাসওয়ার্ড দিন।';
  if (lowerMessage.includes('validation failed')) return 'ফর্মের তথ্য ঠিক নয়। ইউজারনেম/ইমেইল/মোবাইল এবং পাসওয়ার্ড দিন।';
  if (lowerMessage.includes('invalid credentials')) return 'ইউজারনেম/ইমেইল/মোবাইল বা পাসওয়ার্ড সঠিক নয়।';

  return String(rawMessage);
}

function showToast(
  addToast: ReturnType<typeof useToast>['addToast'],
  toast: { title: string; message: string; type: 'success' | 'error' | 'info' | 'warning'; duration?: number }
) {
  addToast(toast);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app-toast', { detail: toast }));
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [demoRole, setDemoRole] = useState<UserRole>('head');
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    const user = authManager.getUser();
    if (authManager.isAuthenticated()) {
      router.replace(getLoginRedirect(user));
      return;
    }
    setIsChecking(false);
  }, [router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
      rememberMe: true,
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setLoginError("");
    try {
      const payload = {
        identifier: data.identifier.trim(),
        password: data.password,
      };
      const response = await api.auth.login(payload) as { token: string; user: User };

      apiClient.setToken(response.token);
      authManager.setUser(response.user);

      if (!data.rememberMe && typeof window !== "undefined") {
        sessionStorage.setItem("token", response.token);
        sessionStorage.setItem("user", JSON.stringify(response.user));
      }

      showToast(addToast, {
        title: "Login successful",
        message: "Redirecting to your workspace.",
        type: "success",
        duration: 1800,
      });

      router.replace(getLoginRedirect(response.user));
    } catch (error: any) {
      console.error('Login error:', error);
      console.error('Error response:', error?.error);

      const detailMessage = getLoginFailureMessage(error);

      setLoginError(detailMessage);
      showToast(addToast, {
        title: "লগইন ব্যর্থ",
        message: detailMessage,
        type: "error",
        duration: 6000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startDemoSession = () => {
    if (demoRole === 'admin' || demoRole === 'super_admin') {
      setDemoRole('head');
      showToast(addToast, {
        title: 'Demo role not available',
        message: 'Admin and Super Admin are not available in demo mode.',
        type: 'warning',
        duration: 2500,
      });
      return;
    }

    const user: User = {
      id: `demo-${demoRole}`,
      name: `${demoRole.replace(/_/g, ' ')} Demo`,
      email: `${demoRole}@demo.local`,
      role: demoRole,
      isActive: true,
      permissions: ['*'],
      institutionId: 'demo-institution',
    };

    authManager.setDemoUser(user);
    showToast(addToast, {
      title: 'Demo mode enabled',
      message: 'All data will stay in your browser only.',
      type: 'success',
      duration: 1800,
    });
    router.replace(getLoginRedirect(user));
  };

  if (isChecking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-7 w-7 animate-spin text-slate-700" />
      </main>
    );
  }

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[0.95fr_1.05fr]">
      <section className="hidden border-r border-border bg-background px-10 py-12 lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            E
          </div>
          <div>
            <p className="font-semibold leading-none text-slate-950">EASY SCHOOL</p>
            <p className="mt-1 text-xs text-slate-500">School/Madrasah Management</p>
          </div>
        </Link>

        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            Secure role-based access
          </div>
          <h1 className="mt-6 max-w-xl text-4xl font-semibold tracking-tight text-foreground">
            Run every school operation from one professional dashboard.
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-7 text-slate-600">
            Manage academics, attendance, finance, ID cards, notices, documents and parent communication with clean permissions for every role.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 text-sm">
          {["Academic", "Finance", "ID Cards"].map((item) => (
            <div key={item} className="rounded-lg border border-border p-3 font-medium text-muted-foreground">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md border-border bg-card shadow-sm">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">Login to EASY SCHOOL</CardTitle>
            <CardDescription>Use your username, email or mobile number and password to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <label className="space-y-1 text-sm font-medium text-slate-700">
                <span>Username, email or mobile</span>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...register("identifier")}
                    type="text"
                    autoComplete="username"
                    placeholder="username, you@example.com or 01XXXXXXXXX"
                    className="pl-9"
                  />
                </div>
                {errors.identifier && <span className="text-xs font-medium text-red-600">{errors.identifier.message}</span>}
              </label>

              <label className="space-y-1 text-sm font-medium text-slate-700">
                <span>Password</span>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="pl-9 pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground hover:bg-muted"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <span className="text-xs font-medium text-red-600">{errors.password.message}</span>}
              </label>

              {loginError && (
                <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
                  <span>{loginError}</span>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 text-sm">
                <label className="flex items-center gap-2 text-slate-600">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-slate-900"
                    {...register("rememberMe")}
                  />
                  Remember me
                </label>
                <Link href="/forgot-password" className="font-medium text-foreground hover:underline">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in
                  </>
                ) : (
                  <>
                    Login
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 rounded-lg bg-popover p-4 text-sm text-muted-foreground">
              New institution or account?{" "}
              <Link href="/register" className="font-semibold text-slate-950 hover:underline">
                Register here
              </Link>
            </div>

            <div className="mt-4 rounded-lg border border-red-200 bg-red-50/80 p-4">
              <div className="flex gap-2 text-sm text-blue-900">
                <span className="font-semibold">💡 Tip:</span>
                <p>
                  {loginError ? "Login failed? Try the demo mode below to explore the system as a student or teacher, or contact your administrator." : "Students and teachers can use the demo mode below to explore the system without credentials."}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2 rounded-lg border border-border bg-popover p-4">
              <p className="text-sm font-semibold text-foreground">Test Credentials (Development)</p>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div>
                  <p className="font-medium">📚 Student:</p>
                  <code className="font-mono bg-green-100 px-1">student@demoschool.edu</code> / <code className="font-mono bg-green-100 px-1">admin123</code>
                </div>
                <div>
                  <p className="font-medium">👨‍🏫 Teacher:</p>
                  <code className="font-mono bg-green-100 px-1">teacher@demoschool.edu</code> / <code className="font-mono bg-green-100 px-1">admin123</code>
                </div>
                <div>
                  <p className="font-medium">👔 Admin:</p>
                  <code className="font-mono bg-green-100 px-1">head@demoschool.edu</code> / <code className="font-mono bg-green-100 px-1">admin123</code>
                </div>
                <p className="text-xs italic text-green-700 pt-1">All credentials use password: <code className="font-mono bg-green-100 px-1">admin123</code></p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-dashed border-border bg-popover p-4">
              <div className="mb-3">
                <p className="text-sm font-semibold text-foreground">Demo login</p>
                <p className="text-xs text-muted-foreground">No server, no SMS, no mail, all data stays local.</p>
              </div>
              <label className="space-y-1 text-sm font-medium text-slate-700">
                <span>Demo role</span>
                <select
                  value={demoRole}
                  onChange={(event) => setDemoRole(event.target.value as UserRole)}
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                >
                  {demoRoles.map((role) => (
                    <option key={role} value={role}>{role.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </label>
              <Button type="button" onClick={startDemoSession} className="mt-3 w-full" variant="secondary">
                Enter demo mode
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
