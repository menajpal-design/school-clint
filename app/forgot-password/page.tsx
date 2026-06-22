"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, MailCheck, ShieldAlert, KeyRound, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import { getSubdomain } from "@/lib/utils";

const forgotPasswordSchema = z.object({
  identifier: z.string().min(2, "Email, username, or phone is required"),
});

const resetPasswordSchema = z.object({
  code: z.string().length(6, "Code must be exactly 6 digits"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;
type EmailError = { message: string; errorCode?: string; reason?: string; hint?: string };

const parseMaybeJson = (value: any) => {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const normalizeEmailError = (error: any): EmailError => {
  const candidates = [
    error?.error?.error,
    error?.error,
    error?.response?.data,
    error,
  ].map(parseMaybeJson).filter(Boolean);

  const pick = (key: 'message' | 'errorCode' | 'reason' | 'hint') => {
    for (const item of candidates) {
      if (item && typeof item === 'object' && typeof item[key] === 'string' && item[key].trim()) {
        return item[key].trim();
      }
    }
    return '';
  };

  const fallbackMessage = typeof error?.message === 'string'
    ? error.message
    : 'Unable to process password reset request.';

  return {
    message: pick('message') || fallbackMessage,
    errorCode: pick('errorCode'),
    reason: pick('reason'),
    hint: pick('hint'),
  };
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [identifier, setIdentifier] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // Structured error state — shown in a persistent on-screen box
  const [emailError, setEmailError] = useState<EmailError | null>(null);

  const {
    register: registerRequest,
    handleSubmit: handleSubmitRequest,
    formState: { errors: errorsRequest },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { identifier: "" },
  });

  const {
    register: registerReset,
    handleSubmit: handleSubmitReset,
    formState: { errors: errorsReset },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { code: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmitRequest = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    setEmailError(null);
    try {
      const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
      const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'easyschool.live';
      const subdomain = getSubdomain(hostname, mainDomain);

      const response = await api.auth.forgotPassword({ 
        identifier: data.identifier.trim(),
        subdomain: subdomain || undefined,
        domain: hostname || undefined,
      }) as { message?: string };
      
      setIdentifier(data.identifier.trim());
      setEmailError(null);
      setStep('verify');
      
      addToast({
        title: "Verification code sent",
        message: response?.message || "A 6-digit verification code has been sent to your email address.",
        type: "success",
        duration: 5000,
      });
    } catch (error: any) {
      setEmailError(normalizeEmailError(error));
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitReset = async (data: ResetPasswordForm) => {
    setIsLoading(true);
    try {
      const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
      const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'easyschool.live';
      const subdomain = getSubdomain(hostname, mainDomain);

      const response = await api.auth.resetPasswordWithCode({ 
        identifier,
        code: data.code.trim(),
        newPassword: data.newPassword.trim(),
        subdomain: subdomain || undefined,
        domain: hostname || undefined,
      }) as { message?: string };

      addToast({
        title: "Password reset successful",
        message: response?.message || "Your password has been changed successfully. You can now login.",
        type: "success",
        duration: 5000,
      });

      router.push('/login');
    } catch (error: any) {
      const message = error?.error?.message || error?.message || "Unable to reset password. Please check your verification code.";
      addToast({
        title: "Reset failed",
        message,
        type: "error",
        duration: 6000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    try {
      const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
      const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'easyschool.live';
      const subdomain = getSubdomain(hostname, mainDomain);

      const response = await api.auth.forgotPassword({ 
        identifier,
        subdomain: subdomain || undefined,
        domain: hostname || undefined,
      }) as { message?: string };
      
      addToast({
        title: "Verification code sent",
        message: response?.message || "A new 6-digit verification code has been sent to your email address.",
        type: "success",
        duration: 5000,
      });
    } catch (error: any) {
      const normalized = normalizeEmailError(error);
      const message = normalized.reason || normalized.message || "Unable to resend verification code.";
      addToast({
        title: "Resend failed",
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
      <section className="hidden border-r border-border bg-card px-10 py-12 lg:flex lg:flex-col lg:justify-between">
        <Link href="/login" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">E</div>
          <div>
            <p className="font-semibold leading-none text-slate-950">EASY SCHOOL</p>
            <p className="mt-1 text-xs text-slate-500">School/Madrasah Management</p>
          </div>
        </Link>

        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
            <ShieldAlert className="h-3.5 w-3.5" />
            Secure OTP Verification
          </div>
          <h1 className="mt-6 max-w-xl text-4xl font-semibold tracking-tight text-slate-950 leading-tight">
            Recover and reset your account password securely.
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-7 text-slate-600">
            Enter your email, username, or phone number. We will send a 6-digit verification code to your email address. Once verified, you can choose a new password instantly.
          </p>
        </div>

        <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 text-sm text-slate-600">
          <span className="font-semibold text-indigo-950">Did you know?</span> Verification codes expire after 15 minutes for your account&apos;s security.
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md border-border bg-card shadow-sm transition-all duration-300">
          {step === 'request' ? (
            <>
              <CardHeader className="space-y-2">
                <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">Forgot password?</CardTitle>
                <CardDescription className="text-slate-500">We will send a 6-digit code to the email linked to your account.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitRequest(onSubmitRequest)} className="space-y-4">

                  {/* ── Persistent Email Error Box ─────────────────────── */}
                  {emailError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 space-y-2">
                      <div className="flex items-start gap-2 font-semibold">
                        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                        <span>{emailError.message}</span>
                      </div>
                      {emailError.errorCode && (
                        <div className="ml-6 inline-flex rounded border border-red-200 bg-white px-2 py-1 text-xs font-semibold tracking-wide text-red-700">
                          {emailError.errorCode}
                        </div>
                      )}
                      {emailError.reason && (
                        <div className="ml-6 rounded bg-red-100 px-3 py-2 text-xs font-mono leading-relaxed text-red-900 whitespace-pre-wrap break-words">
                          {emailError.reason}
                        </div>
                      )}
                      {emailError.hint && (
                        <div className="ml-6 text-xs text-red-700">
                          💡 {emailError.hint}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-1">
                    <span className="text-sm font-medium text-slate-700">Email, username, or phone</span>
                    <Input
                      {...registerRequest("identifier")}
                      type="text"
                      autoComplete="username"
                      placeholder="student@demoschool.edu"
                      className="mt-1"
                    />
                    {errorsRequest.identifier && <span className="text-xs font-medium text-red-600">{errorsRequest.identifier.message}</span>}
                  </div>

                  <Button type="submit" disabled={isLoading} className="w-full mt-2">
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending Code...
                      </>
                    ) : (
                      'Send Verification Code'
                    )}
                  </Button>

                  <div className="text-center text-sm text-slate-600 mt-4">
                    Remembered your password?{' '}
                    <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-500 hover:underline">
                      Back to login
                    </Link>
                  </div>
                </form>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="space-y-2">
                <div className="flex items-center gap-2 text-indigo-600">
                  <MailCheck className="h-6 w-6" />
                  <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">Verify OTP Code</CardTitle>
                </div>
                <CardDescription className="text-slate-500">
                  Please enter the 6-digit code sent to your email and select your new password.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitReset(onSubmitReset)} className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-slate-700">6-Digit Code</span>
                    <Input
                      {...registerReset("code")}
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      className="mt-1 text-center text-lg font-bold tracking-widest placeholder:text-slate-300"
                    />
                    {errorsReset.code && <span className="text-xs font-medium text-red-600">{errorsReset.code.message}</span>}
                  </div>

                  <div className="space-y-1">
                    <span className="text-sm font-medium text-slate-700">New Password</span>
                    <div className="relative mt-1">
                      <Input
                        {...registerReset("newPassword")}
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errorsReset.newPassword && <span className="text-xs font-medium text-red-600">{errorsReset.newPassword.message}</span>}
                  </div>

                  <div className="space-y-1">
                    <span className="text-sm font-medium text-slate-700">Confirm New Password</span>
                    <div className="relative mt-1">
                      <Input
                        {...registerReset("confirmPassword")}
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errorsReset.confirmPassword && <span className="text-xs font-medium text-red-600">{errorsReset.confirmPassword.message}</span>}
                  </div>

                  <Button type="submit" disabled={isLoading} className="w-full mt-2">
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resetting password...
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </Button>

                  <div className="flex flex-col gap-2 mt-4 text-center text-sm">
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={handleResendCode}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 hover:underline disabled:opacity-50"
                    >
                      Didn&apos;t receive the code? Resend OTP
                    </button>
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => setStep('request')}
                      className="flex items-center justify-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
                    >
                      <ArrowLeft className="h-3 w-3" />
                      Back to step 1
                    </button>
                  </div>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </section>
    </main>
  );
}
