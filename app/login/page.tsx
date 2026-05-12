"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff, Loader2, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api, apiClient } from "@/lib/api";
import { authManager } from "@/lib/auth";
import { User, UserRole } from "@/types";
import { useToast } from "@/hooks/useToast";

const loginSchema = z.object({
  identifier: z.string().min(2, "Username, email or mobile number is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().default(true),
});

type LoginForm = z.infer<typeof loginSchema>;

const roleRedirects: Partial<Record<UserRole, string>> = {
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

export default function LoginPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

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
    try {
      const payload = {
        identifier: data.identifier,
        password: data.password,
      };
      const response = await api.auth.login(payload) as { token: string; user: User };

      apiClient.setToken(response.token);
      authManager.setUser(response.user);

      if (!data.rememberMe && typeof window !== "undefined") {
        sessionStorage.setItem("token", response.token);
        sessionStorage.setItem("user", JSON.stringify(response.user));
      }

      addToast({
        title: "Login successful",
        message: "Redirecting to your workspace.",
        type: "success",
        duration: 1800,
      });

      router.replace(getLoginRedirect(response.user));
    } catch (error: any) {
      addToast({
        title: "Login failed",
        message: error?.message || "Please check your credentials and try again.",
        type: "error",
        duration: 3500,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-7 w-7 animate-spin text-slate-700" />
      </main>
    );
  }

  return (
    <main className="grid min-h-screen bg-slate-50 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="hidden border-r border-slate-200 bg-white px-10 py-12 lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
            D
          </div>
          <div>
            <p className="font-semibold leading-none text-slate-950">DRMS</p>
            <p className="mt-1 text-xs text-slate-500">School/Madrasah Management</p>
          </div>
        </Link>

        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            Secure role-based access
          </div>
          <h1 className="mt-6 max-w-xl text-4xl font-semibold tracking-tight text-slate-950">
            Run every school operation from one professional dashboard.
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-7 text-slate-600">
            Manage academics, attendance, finance, ID cards, notices, documents and parent communication with clean permissions for every role.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 text-sm">
          {["Academic", "Finance", "ID Cards"].map((item) => (
            <div key={item} className="rounded-lg border border-slate-200 p-3 font-medium text-slate-700">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md border-slate-200 bg-white shadow-sm">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">Login to DRMS</CardTitle>
            <CardDescription>Use your username, email or mobile number and password to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <label className="space-y-1 text-sm font-medium text-slate-700">
                <span>Username, email or mobile</span>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
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
                    className="absolute right-2 top-2 rounded-md p-1 text-slate-500 hover:bg-slate-100"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <span className="text-xs font-medium text-red-600">{errors.password.message}</span>}
              </label>

              <div className="flex items-center justify-between gap-3 text-sm">
                <label className="flex items-center gap-2 text-slate-600">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-slate-900"
                    {...register("rememberMe")}
                  />
                  Remember me
                </label>
                <Link href="/profile/change-password" className="font-medium text-slate-900 hover:underline">
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

            <div className="mt-6 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
              New institution or account?{" "}
              <Link href="/register" className="font-semibold text-slate-950 hover:underline">
                Register here
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
