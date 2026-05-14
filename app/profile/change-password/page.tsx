"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/useToast";
import { api } from "@/lib/api";

const schema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof schema>;

export default function ChangePasswordPage() {
  const { addToast } = useToast();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const submit = async (values: FormValues) => {
    try {
      await api.auth.changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword });
      addToast({ title: "Password changed", message: "Your password was updated successfully.", type: "success", duration: 4000 });
      reset();
    } catch (error: any) {
      addToast({ title: "Change failed", message: error?.message || "Unable to change password.", type: "error", duration: 5000 });
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Change Password" description="Update your account password securely." icon={KeyRound} />
      <form onSubmit={handleSubmit(submit)} className="max-w-xl space-y-4 rounded-lg border border-border bg-card p-5 shadow-sm">
        <Field label="Current password" error={errors.currentPassword?.message}><Input type="password" {...register("currentPassword")} /></Field>
        <Field label="New password" error={errors.newPassword?.message}><Input type="password" {...register("newPassword")} /></Field>
        <Field label="Confirm password" error={errors.confirmPassword?.message}><Input type="password" {...register("confirmPassword")} /></Field>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Updating..." : "Change Password"}</Button>
      </form>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <div><Label className="mb-2 block">{label}</Label>{children}{error && <p className="mt-1 text-sm text-rose-600">{error}</p>}</div>;
}
