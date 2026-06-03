'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Home, TriangleAlert } from 'lucide-react';

export default function SchoolNotFoundPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [secondsLeft, setSecondsLeft] = useState(5);

  const subdomain = searchParams.get('subdomain') || '';

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          router.replace('/');
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [router]);

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-300">
          <TriangleAlert className="h-8 w-8" />
        </div>
        <h1 className="text-center text-3xl font-black tracking-tight">School not found</h1>
        <p className="mt-3 text-center text-sm leading-6 text-slate-300">
          {subdomain ? `The subdomain ${subdomain}.localhost is not registered.` : 'This school is not registered.'}
        </p>
        <p className="mt-2 text-center text-sm text-slate-300">আপনার প্রতিষ্ঠানের সাথে যোগাযোগ করুন।</p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/" className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100">
            <Home className="h-4 w-4" />
            Main page
          </Link>
          <button
            type="button"
            onClick={() => router.replace('/')}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Go back
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">Main page redirect in {secondsLeft} seconds.</p>
      </div>
    </main>
  );
}