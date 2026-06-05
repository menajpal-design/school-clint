"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BookMarked, BookOpen, Clock, Library, ShieldCheck } from 'lucide-react';
import { libraryClient } from '@/lib/library-client';
import { PieChartCard } from '@/components/charts/PieChartCard';
import { PageHeader } from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const libraryManageRoles = ['head', 'assistant_head', 'staff'];
const teacherRoles = ['class_teacher', 'subject_teacher', 'teacher'];

export default function LibraryPage() {
  const { user } = useAuth();
  const [books, setBooks] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canManageLibrary = libraryManageRoles.includes(user?.role || '');
  const canViewLoans = canManageLibrary;
  const isLearner = user?.role === 'student' || user?.role === 'parent';
  const isTeacher = teacherRoles.includes(user?.role || '');

  const stats = useMemo(() => {
    const available = books.reduce((sum, book) => sum + Number(book.copiesAvailable || 0), 0);
    const total = books.reduce((sum, book) => sum + Number(book.copiesTotal || 0), 0);
    const overdue = loans.filter((loan) => loan.status === 'overdue').length;
    return { totalBooks: books.length, available, totalCopies: total, overdueLoans: overdue };
  }, [books, loans]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const bookData = await libraryClient.getBooks();
        const loanData = canViewLoans ? await libraryClient.getLoans() : [];
        if (mounted) {
          setBooks(Array.isArray(bookData) ? bookData : []);
          setLoans(Array.isArray(loanData) ? loanData : []);
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Failed to load library dashboard');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [canViewLoans]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Library"
        description={isLearner ? 'Students and parents can browse available books only.' : isTeacher ? 'Teachers can browse books for class support. Library issuing is handled by staff/head.' : 'Manage books, availability, issue/return, and overdue tracking.'}
        icon={Library}
        status={<Badge variant="outline">{canManageLibrary ? 'Manage access' : 'View only'}</Badge>}
        actions={canManageLibrary ? [
          <Button key="books" asChild><Link href="/library/books"><BookOpen className="mr-2 h-4 w-4" />Manage Books</Link></Button>,
          <Button key="loans" variant="outline" asChild><Link href="/library/loans"><Clock className="mr-2 h-4 w-4" />Loans</Link></Button>,
        ] : [
          <Button key="books" variant="outline" asChild><Link href="/library/books"><BookOpen className="mr-2 h-4 w-4" />Browse Books</Link></Button>,
        ]}
      />

      <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-sky-50 p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-sky-700">Role based library access</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">{canManageLibrary ? 'Library control panel' : 'Library reading view'}</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              {canManageLibrary
                ? 'Head, Assistant Head, and staff can manage books and loans. Students and parents cannot issue, return, edit, or delete from this page.'
                : 'You can view book availability. Add, edit, issue, return, and loan records are hidden for this role.'}
            </p>
          </div>
          <div className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">
            {user?.role?.replace('_', ' ') || 'user'}
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Books', value: stats.totalBooks, icon: BookMarked },
          { label: 'Copies available', value: stats.available, icon: BookOpen },
          { label: 'Copies total', value: stats.totalCopies, icon: Library },
          { label: canManageLibrary ? 'Overdue loans' : 'Management hidden', value: canManageLibrary ? stats.overdueLoans : '—', icon: ShieldCheck },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-slate-500">{item.label}</p>
                <Icon className="h-5 w-5 text-slate-400" />
              </div>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{item.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <PieChartCard
          title="Library Copies"
          data={[
            { name: 'Available', value: stats.available || 0 },
            { name: 'Loaned', value: Math.max(0, (stats.totalCopies || 0) - (stats.available || 0)) },
          ]}
        />
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-600 shadow-sm">
          <h3 className="mb-2 font-semibold text-slate-900">Access rules</h3>
          <p>Student/parent: book view only.</p>
          <p>Teacher/class teacher: book view for teaching support.</p>
          <p>Head/assistant head/staff: books and loan management.</p>
        </div>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading library data...</p>}
      {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className={`grid gap-6 ${canViewLoans ? 'lg:grid-cols-2' : ''}`}>
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Recent books</h2>
            <Link href="/library/books" className="text-sm font-medium text-sky-700">Open books page</Link>
          </div>
          <div className="mt-4 space-y-3">
            {books.slice(0, 8).map((book) => (
              <div key={book._id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{book.title}</p>
                    <p className="text-sm text-slate-600">{book.author}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                    {book.copiesAvailable}/{book.copiesTotal}
                  </span>
                </div>
              </div>
            ))}
            {!books.length && !loading && <p className="text-sm text-slate-500">No books found yet.</p>}
          </div>
        </section>

        {canViewLoans && <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Recent loans</h2>
            <Link href="/library/loans" className="text-sm font-medium text-sky-700">Open loans page</Link>
          </div>
          <div className="mt-4 space-y-3">
            {loans.slice(0, 5).map((loan) => (
              <div key={loan._id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{loan.book?.title || 'Unknown book'}</p>
                    <p className="text-sm text-slate-600">{loan.user?.name || loan.user?.email || 'Unknown user'}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{loan.status}</span>
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  Due {loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : 'N/A'}
                  {loan.fine ? ` • Fine ${loan.fine}` : ''}
                </p>
              </div>
            ))}
            {!loans.length && !loading && <p className="text-sm text-slate-500">No loans found yet.</p>}
          </div>
        </section>}
      </div>
    </div>
  );
}
