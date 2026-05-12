'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import type React from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, CreditCard, UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';

const admissionSchema = z.object({
  name: z.string().min(2, 'Student name is required'),
  email: z.string().trim().optional().refine((v) => !v || v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
    message: 'Valid email is required',
  }),
  phone: z.string().optional(),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  bloodGroup: z.string().optional(),
  address: z.string().min(5, 'Address is required'),
  className: z.string().min(1, 'Class is required'),
  sectionName: z.string().min(1, 'Section is required'),
  rollNumber: z.string().min(1, 'Roll is required'),
  admissionDate: z.string().min(1, 'Admission date is required'),
  guardianName: z.string().min(2, 'Guardian name is required'),
  guardianPhone: z.string().min(5, 'Guardian phone is required'),
  guardianEmail: z.string().trim().optional().refine((v) => !v || v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
    message: 'Valid guardian email is required',
  }),
  autoParentAccount: z.boolean(),
  autoIdCard: z.boolean(),
});

type AdmissionValues = z.infer<typeof admissionSchema>;

const steps = ['Student personal info', 'Academic info', 'Parent/guardian info', 'Auto account and ID card'];

export default function InstitutionAdmissionPage() {
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState('');
  const [applications, setApplications] = useState<any[]>([]);
  const form = useForm<AdmissionValues>({
    resolver: zodResolver(admissionSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      bloodGroup: '',
      address: '',
      className: '',
      sectionName: '',
      rollNumber: '',
      admissionDate: new Date().toISOString().slice(0, 10),
      guardianName: '',
      guardianPhone: '',
      guardianEmail: '',
      autoParentAccount: true,
      autoIdCard: true,
    },
  });

  const loadApplications = () => {
    api.admissions.getAll().then((data: any) => setApplications(data.applications || [])).catch(() => setApplications([]));
  };

  useEffect(loadApplications, []);

  const next = async () => {
    const fields: (keyof AdmissionValues)[][] = [
      ['name', 'dateOfBirth', 'address'],
      ['className', 'sectionName', 'rollNumber', 'admissionDate'],
      ['guardianName', 'guardianPhone', 'guardianEmail'],
      ['autoParentAccount', 'autoIdCard'],
    ];
    const valid = await form.trigger(fields[step]);
    if (valid) setStep((current) => Math.min(current + 1, steps.length - 1));
  };

  const onSubmit = async (data: AdmissionValues) => {
    setStatus('Submitting admission...');
    try {
      const payload = {
        ...data,
        email: data.email?.trim() || undefined,
      };
      const result = await api.students.create(payload) as any;
      const username = result?.credentials?.username;
      const password = result?.credentials?.password;
      setStatus(
        username && password
          ? `Student admitted. Auto username/password generated: ${username} / ${password}`
          : 'Student admitted. Username and password were generated automatically.'
      );
      form.reset();
      setStep(0);
      loadApplications();
    } catch (error: any) {
      setStatus(error?.message || 'Admission API failed.');
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Student Admission</h1>
        <p className="text-sm text-muted-foreground">Multi-step intake flow connected to POST /api/students.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Steps</CardTitle>
            <CardDescription>Complete each admission section.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {steps.map((label, index) => (
              <button
                key={label}
                type="button"
                onClick={() => setStep(index)}
                className={`flex w-full items-center gap-3 rounded-md border p-3 text-left text-sm ${index === step ? 'border-primary bg-primary/5 text-primary' : 'hover:bg-muted'}`}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold">{index + 1}</span>
                <span>{label}</span>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>{steps[step]}</CardTitle>
                <CardDescription>Step {step + 1} of {steps.length}</CardDescription>
              </div>
              <Badge variant="secondary">{Math.round(((step + 1) / steps.length) * 100)}%</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {step === 0 && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field form={form} name="name" label="Student Name" />
                    <Field form={form} name="email" label="Student Email (Optional)" type="email" />
                    <Field form={form} name="phone" label="Phone" />
                    <Field form={form} name="dateOfBirth" label="Date of Birth" type="date" />
                    <FormField control={form.control} name="bloodGroup" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Blood Group</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select blood group" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((group) => <SelectItem key={group} value={group}>{group}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="address" render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Address</FormLabel>
                        <FormControl><Textarea {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                )}

                {step === 1 && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field form={form} name="className" label="Class" />
                    <Field form={form} name="sectionName" label="Section" />
                    <Field form={form} name="rollNumber" label="Roll" />
                    <Field form={form} name="admissionDate" label="Admission Date" type="date" />
                  </div>
                )}

                {step === 2 && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field form={form} name="guardianName" label="Guardian Name" />
                    <Field form={form} name="guardianPhone" label="Guardian Phone" />
                    <Field form={form} name="guardianEmail" label="Guardian Email (Optional)" type="email" />
                  </div>
                )}

                {step === 3 && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <ToggleField form={form} name="autoParentAccount" label="Auto parent account generation" icon={<UserPlus className="h-5 w-5" />} />
                    <ToggleField form={form} name="autoIdCard" label="Auto ID card generation" icon={<CreditCard className="h-5 w-5" />} />
                  </div>
                )}

                <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">{status}</p>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setStep((current) => Math.max(current - 1, 0))} disabled={step === 0}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    {step < steps.length - 1 ? (
                      <Button type="button" onClick={next}>
                        Next
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button type="submit">
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Submit Admission
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Public Admission Applications</CardTitle>
          <CardDescription>Teacher or higher role can accept. Student admission auto-generates username and password after submission.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {applications.map((application) => (
            <div key={application._id} className="grid gap-3 rounded-md border p-4 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <div className="font-medium">{application.studentName} · Class {application.requestedClass}</div>
                <div className="text-sm text-muted-foreground">{application.guardianName} · {application.guardianPhone}</div>
                <div className="text-sm text-muted-foreground">Previous: {application.previousSchool || 'N/A'} · Result: {application.previousResult || 'N/A'} · Status: {application.status}</div>
              </div>
              {application.status === 'pending' && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={async () => {
                    const result = await api.admissions.accept(application._id, { className: application.requestedClass }) as any;
                    setStatus(`Accepted. Username: ${result.credentials?.username}, Password: ${result.credentials?.password}`);
                    loadApplications();
                  }}>Accept</Button>
                  <Button size="sm" variant="outline" onClick={async () => { await api.admissions.reject(application._id); loadApplications(); }}>Reject</Button>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ form, name, label, type = 'text' }: { form: any; name: keyof AdmissionValues; label: string; type?: string }) {
  return (
    <FormField control={form.control} name={name as any} render={({ field }) => (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <FormControl><Input type={type} {...field} /></FormControl>
        <FormMessage />
      </FormItem>
    )} />
  );
}

function ToggleField({ form, name, label, icon }: { form: any; name: keyof AdmissionValues; label: string; icon: React.ReactNode }) {
  return (
    <FormField control={form.control} name={name as any} render={({ field }) => (
      <FormItem className="rounded-md border p-4">
        <div className="flex items-center gap-3">
          {icon}
          <FormLabel className="flex-1">{label}</FormLabel>
          <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
        </div>
        <FormMessage />
      </FormItem>
    )} />
  );
}
