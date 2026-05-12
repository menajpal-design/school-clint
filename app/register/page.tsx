'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { api, apiClient } from '@/lib/api';
import { authManager } from '@/lib/auth';
import { useToast } from '@/hooks/useToast';
import { User } from '@/types';

const DEFAULT_INSTITUTION_ID = process.env.NEXT_PUBLIC_DEFAULT_INSTITUTION_ID || '6a02bd07535ddb19281c62c9';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  institutionName: z.string().min(2, 'Institution name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  role: z.enum(['head', 'student', 'parent', 'subject_teacher', 'staff']),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      const response = await api.auth.register({
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone || '',
        role: data.role,
        institutionId: DEFAULT_INSTITUTION_ID,
      }) as { token?: string; user?: User; data?: { token: string; user: User } };

      const token = response.token || response.data?.token;
      const user = response.user || response.data?.user;
      if (token && user) {
        apiClient.setToken(token);
        authManager.setUser(user);
      }

      addToast({
        title: 'Success',
        message: 'Account created successfully.',
        type: 'success',
      });

      router.push('/dashboard');
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">DRMS</h1>
          <p className="text-blue-100">School Management System</p>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Create Account</h2>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              {...register('name')}
              type="text"
              placeholder="John Doe"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Institution Name
            </label>
            <input
              {...register('institutionName')}
              type="text"
              placeholder="Your school or madrasah"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
            {errors.institutionName && <p className="text-red-500 text-sm mt-1">{errors.institutionName.message}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              {...register('email')}
              type="email"
              placeholder="user@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number (Optional)
            </label>
            <input
              {...register('phone')}
              type="tel"
              placeholder="+1234567890"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User Role
            </label>
            <select
              {...register('role')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            >
              <option value="">Select Role</option>
              <option value="head">Institution Head</option>
              <option value="student">Student</option>
              <option value="parent">Parent</option>
              <option value="subject_teacher">Teacher</option>
              <option value="staff">Staff</option>
            </select>
            {errors.role && <p className="text-red-500 text-sm mt-1">{errors.role.message}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              {...register('password')}
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              {...register('confirmPassword')}
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
            {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5" />
                Creating Account...
              </>
            ) : (
              <>
                Create Account
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>

          {/* Login Link */}
          <p className="text-center text-gray-600 text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
              Login here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
