'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ArrowRight, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { api, apiClient } from '@/lib/api';
import { authManager } from '@/lib/auth';
import { useToast } from '@/hooks/useToast';
import { User } from '@/types';
import { calculatePlanDue, getPlanByCode } from '@/lib/plans';
import { formatCurrency } from '@/lib/utils';

const DEFAULT_INSTITUTION_ID = process.env.NEXT_PUBLIC_DEFAULT_INSTITUTION_ID || '';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  institutionName: z.string().min(2, 'Institution name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  role: z.enum(['head']).default('head'),
  planCode: z.string().optional(),
  billingCycle: z.enum(['monthly', 'yearly']).default('monthly'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlanCode, setSelectedPlanCode] = useState('students_100');
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isSubdomain, setIsSubdomain] = useState(false);
  const [subdomainName, setSubdomainName] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'head', planCode: 'students_100', billingCycle: 'monthly' },
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hostname = window.location.hostname;
    const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'easyschool.live';
    const isLocal = /^(localhost|127\.0\.0\.1)$/i.test(hostname);
    const hostParts = hostname.split('.').filter(Boolean);

    let sub = '';
    if (hostname.endsWith(mainDomain)) {
      const suffix = mainDomain.split('.').length;
      if (hostParts.length > suffix) {
        sub = hostParts.slice(0, hostParts.length - suffix).join('.');
      }
    } else if (isLocal) {
      if (hostParts.length > 1) {
        sub = hostParts.slice(0, hostParts.length - 1).join('.');
      }
    } else {
      if (hostParts.length >= 3) {
        sub = hostParts.slice(0, hostParts.length - 2).join('.');
      }
    }

    if (sub) {
      const norm = sub.toLowerCase();
      if (!['www', 'app', 'api', 'admin'].includes(norm)) {
        setIsSubdomain(true);
        setSubdomainName(norm);
      }
    }

    const params = new URLSearchParams(window.location.search);
    const planCode = params.get('plan') || 'students_100';
    const billingCycle = params.get('billingCycle') === 'yearly' ? 'yearly' : 'monthly';
    setSelectedPlanCode(planCode);
    setSelectedBillingCycle(billingCycle);
    setValue('planCode', planCode);
    setValue('billingCycle', billingCycle);
  }, [setValue]);

  const selectedPlan = getPlanByCode(selectedPlanCode);
  const due = calculatePlanDue(selectedPlanCode, selectedBillingCycle, true);

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      const response = await api.auth.register({
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone || '',
        role: data.role,
        planCode: data.planCode || selectedPlanCode,
        billingCycle: data.billingCycle || selectedBillingCycle,
        institutionName: data.institutionName,
        paymentGateway: 'popup',
        receivedAmount: 0,
        ...(DEFAULT_INSTITUTION_ID ? { institutionId: DEFAULT_INSTITUTION_ID } : {}),
      }) as { token?: string; user?: User; data?: { token: string; user: User } };

      const token = response.token || response.data?.token;
      const user = response.user || response.data?.user;
      if (token && user) {
        apiClient.setToken(token);
        authManager.setUser(user);
      }

      addToast({
        title: 'Success',
        message: 'Account created successfully. Please complete billing by popup payment.',
        type: 'success',
      });

      router.push('/billing');
    } catch (error: any) {
      addToast({
        title: 'Error',
        message: error?.message || 'Registration failed',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubdomain) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="w-full max-w-md bg-card rounded-lg shadow-xl overflow-hidden border border-border p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-800">নিবন্ধন অনুমোদিত নয়</h1>
            <p className="text-gray-600 text-sm">
              সাবডোমেন <code className="bg-slate-100 px-1 rounded font-semibold text-slate-800">{subdomainName}.easyschool.live</code> থেকে নতুন প্রতিষ্ঠান নিবন্ধন করা সম্ভব নয়।
            </p>
            <p className="text-gray-400 text-xs">
              (Registration is not allowed on subdomains. Please visit our main domain to register a new school.)
            </p>
          </div>
          <div>
            <a
              href="https://easyschool.live/register"
              className="inline-flex justify-center w-full py-2.5 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition"
            >
              প্রধান ডোমেইনে যান (Go to Main Domain)
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md bg-card rounded-lg shadow-xl overflow-hidden border border-border">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">EASY SCHOOL</h1>
          <p className="text-blue-100">School Management System</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Create Account</h2>
          <input type="hidden" {...register('planCode')} />
          <input type="hidden" {...register('billingCycle')} />

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">
            Selected plan: <span className="font-semibold">{selectedPlan.name}</span> · <span className="font-semibold capitalize">{selectedBillingCycle}</span>
            <div className="mt-1 font-semibold">Payable by popup after registration: {formatCurrency(due.total)}</div>
          </div>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <div className="flex items-center gap-2 font-semibold"><CreditCard className="h-4 w-4" /> Popup payment only</div>
            <p className="mt-1">Registration করার পরে Billing page থেকে শুধু popup payment হবে। Billing number, Transaction ID, Sender number বা Paid amount manually দিতে হবে না।</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input {...register('name')} type="text" placeholder="John Doe" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition" />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Institution Name</label>
            <input {...register('institutionName')} type="text" placeholder="Your school or madrasah" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition" />
            {errors.institutionName && <p className="text-red-500 text-sm mt-1">{errors.institutionName.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input {...register('email')} type="email" placeholder="user@example.com" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition" />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number (Optional)</label>
            <input {...register('phone')} type="tel" placeholder="+1234567890" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User Role</label>
            <select {...register('role')} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition">
              <option value="head">Institution Head</option>
            </select>
            {errors.role && <p className="text-red-500 text-sm mt-1">{errors.role.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input {...register('password')} type="password" autoComplete="new-password" placeholder="••••••••" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition" />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input {...register('confirmPassword')} type="password" autoComplete="new-password" placeholder="••••••••" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition" />
            {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>}
          </div>

          <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
            {isLoading ? (<><Loader2 className="animate-spin h-5 w-5" />Creating Account...</>) : (<>Create Account<ArrowRight className="h-5 w-5" /></>)}
          </button>

          <p className="text-center text-gray-600 text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold">Login here</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
