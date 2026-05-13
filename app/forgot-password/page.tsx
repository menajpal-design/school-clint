"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, MailCheck, ShieldAlert } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/useToast";

const forgotPasswordSchema = z.object({
  identifier: z.string().min(2, "Email, username, or phone is required"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { identifier: "" },
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    try {
      const response = await api.auth.forgotPassword({ identifier: data.identifier.trim() }) as { message?: string };
      setSubmitted(true);
      addToast({
        title: "Reset request sent",
        message: response?.message || "Password reset instructions have been sent to your email address.",
        type: "success",
        duration: 5000,
      });
    } catch (error: any) {
      const message = error?.error?.message || error?.message || "Unable to process password reset request.";
      addToast({
        title: "Reset request failed",
        message,
        type: "error",
        duration: 6000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen bg-slate-50 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="hidden border-r border-slate-200 bg-white px-10 py-12 lg:flex lg:flex-col lg:justify-between">
        <Link href="/login" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">E</div>
          <div>
            <p className="font-semibold leading-none text-slate-950">EASY SCHOOL</p>
            <p className="mt-1 text-xs text-slate-500">School/Madrasah Management</p>
          </div>
        </Link>

        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
            <ShieldAlert className="h-3.5 w-3.5" />
            Public password recovery
          </div>
          <h1 className="mt-6 max-w-xl text-4xl font-semibold tracking-tight text-slate-950">
            Reset access without waiting for admin support.
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-7 text-slate-600">
            Enter your email, username, or phone number. We&apos;ll generate a temporary password and send it to the email on file.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          After logging in, change the temporary password immediately from your profile.
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md border-slate-200 bg-white shadow-sm">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">Forgot password?</CardTitle>
            <CardDescription>We&apos;ll send a temporary password to the email linked to your account.</CardDescription>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                  <div className="mb-2 flex items-center gap-2 font-semibold">
                    <MailCheck className="h-4 w-4" />
                    Request sent
                  </div>
                  Check your email for the temporary password, then sign in and change it right away.
                </div>
                <Button type="button" className="w-full" onClick={() => router.push('/login')}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <label className="space-y-1 text-sm font-medium text-slate-700">
                  <span>Email, username, or phone</span>
                  <Input
                    {...register("identifier")}
                    type="text"
                    autoComplete="username"
                    placeholder="student@demoschool.edu"
                  />
                  {errors.identifier && <span className="text-xs font-medium text-red-600">{errors.identifier.message}</span>}
                </label>

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending reset email
                    </>
                  ) : (
                    'Send reset email'
                  )}
                </Button>

                <div className="text-center text-sm text-slate-600">
                  Remembered your password?{' '}
                  <Link href="/login" className="font-semibold text-slate-950 hover:underline">
                    Back to login
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}