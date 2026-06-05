"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { libraryClient } from '@/lib/library-client';
import { useAuth } from '@/hooks/useAuth';
import { XCircle } from 'lucide-react';

const issueInitial = {
  bookId: '',
  userId: '',
  days: '14',
};

const returnInitial = {
  loanId: '',
};

export default function LoansPage() {
  const { user } = useAuth();
  const canManage = useMemo(() => ['head', 'assistant_head', 'admin', 'super_admin', 'librarian', 'staff'].includes(user?.role || ''), [user]);
  const [books, setBooks] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [issueForm, setIssueForm] = useState(issueInitial);
  const [returnForm, setReturnForm] = useState(returnInitial);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [bookData, loanData] = await Promise.all([libraryClient.getBooks(), libraryClient.getLoans()]);
      setBooks(Array.isArray(bookData) ? bookData : []);
      setLoans(Array.isArray(loanData) ? loanData : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load loans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canManage) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManage]);

  const submitIssue = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await libraryClient.issueBook({
        bookId: issueForm.bookId,
        userId: issueForm.userId,
        days: Number(issueForm.days || 14),
      });
      setIssueForm(issueInitial);
      setSuccess('Book issued successfully');
      await loadData();
    } catch (e: any) {
      setError(e?.message || 'Failed to issue book');
    } finally {
      setSaving(false);
    }
  };

  const submitReturn = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await libraryClient.returnBook({ loanId: returnForm.loanId });
      setReturnForm(returnInitial);
      setSuccess('Book returned successfully');
      await loadData();
    } catch (e: any) {
      setError(e?.message || 'Failed to return book');
    } finally {
      setSaving(false);
    }
  };

  if (!canManage) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6 text-center bg-slate-50">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 max-w-md shadow-sm">
          <XCircle className="mx-auto h-12 w-12 text-red-600 mb-3" />
          <h2 className="text-xl font-bold text-red-950">Access Denied</h2>
          <p className="mt-2 text-sm text-red-700">You do not have permission to manage library loans.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-900">Loans</h1>
        <p className="mt-2 text-sm text-slate-600">Issue books to users and record returns with fines.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={submitIssue} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Issue a book</h2>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Book</span>
            <select
              value={issueForm.bookId}
              onChange={(e) => setIssueForm((prev) => ({ ...prev, bookId: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500"
              required
            >
              <option value="">Select book</option>
              {books.map((book) => (
                <option key={book._id} value={book._id}>
                  {book.title} ({book.copiesAvailable}/{book.copiesTotal})
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">User ID</span>
            <input
              value={issueForm.userId}
              onChange={(e) => setIssueForm((prev) => ({ ...prev, userId: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500"
              placeholder="User ObjectId"
              required
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Due days</span>
            <input
              value={issueForm.days}
              onChange={(e) => setIssueForm((prev) => ({ ...prev, days: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500"
              type="number"
              min="1"
              required
            />
          </label>
          <button type="submit" disabled={saving} className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60">
            {saving ? 'Processing...' : 'Issue book'}
          </button>
        </form>

        <form onSubmit={submitReturn} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Return a book</h2>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Loan ID</span>
            <input
              value={returnForm.loanId}
              onChange={(e) => setReturnForm((prev) => ({ ...prev, loanId: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500"
              placeholder="Loan ObjectId"
              required
            />
          </label>
          <button type="submit" disabled={saving} className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60">
            {saving ? 'Processing...' : 'Return book'}
          </button>
        </form>
      </div>

      {success && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{success}</p>}
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Loan records</h2>
          <button onClick={loadData} className="text-sm font-medium text-sky-700">Refresh</button>
        </div>
        {loading && <p className="mt-4 text-sm text-slate-500">Loading loans...</p>}
        {!loading && !loans.length && <p className="mt-4 text-sm text-slate-500">No loans found.</p>}
        <div className="mt-4 space-y-3">
          {loans.map((loan) => (
            <div key={loan._id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">{loan.book?.title || 'Unknown book'}</p>
                  <p className="text-sm text-slate-600">User: {loan.user?.name || loan.user?.email || loan.user}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{loan.status}</span>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Issued {loan.issuedAt ? new Date(loan.issuedAt).toLocaleDateString() : 'N/A'} • Due {loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : 'N/A'}
                {loan.returnedAt ? ` • Returned ${new Date(loan.returnedAt).toLocaleDateString()}` : ''}
                {loan.fine ? ` • Fine ${loan.fine}` : ''}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
