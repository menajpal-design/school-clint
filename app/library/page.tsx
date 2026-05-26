"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { libraryClient } from '@/lib/library-client';
import { PieChartCard } from '@/components/charts/PieChartCard';

export default function LibraryPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
        const [bookData, loanData] = await Promise.all([libraryClient.getBooks(), libraryClient.getLoans()]);
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
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-wide text-sky-700">Library Management</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Books, loans, issue and return</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Manage the school library from one place. Add books, issue them to users, track due dates, and record returns with fines.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/library/books" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">Books</Link>
          <Link href="/library/loans" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">Loans</Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Books', value: stats.totalBooks },
          { label: 'Copies available', value: stats.available },
          { label: 'Copies total', value: stats.totalCopies },
          { label: 'Overdue loans', value: stats.overdueLoans },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <PieChartCard
          title="Library Copies"
          data={[
            { name: 'Available', value: stats.available || 0 },
            { name: 'Loaned', value: Math.max(0, (stats.totalCopies || 0) - (stats.available || 0)) },
          ]}
        />
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-500 shadow-sm">
          Library usage summary will appear here.
        </div>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading library data...</p>}
      {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Recent books</h2>
            <Link href="/library/books" className="text-sm font-medium text-sky-700">Open books page</Link>
          </div>
          <div className="mt-4 space-y-3">
            {books.slice(0, 5).map((book) => (
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

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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
        </section>
      </div>
    </div>
  );
}
