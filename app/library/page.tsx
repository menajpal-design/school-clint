"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BookMarked, BookOpen, Clock, Filter, Library, Search, ShieldCheck, Tags } from 'lucide-react';
import { libraryClient } from '@/lib/library-client';
import { PageHeader } from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';

const libraryManageRoles = ['head', 'assistant_head', 'admin', 'super_admin', 'librarian', 'staff'];
const teacherRoles = ['class_teacher', 'subject_teacher', 'teacher'];
const today = () => new Date().toISOString().slice(0, 10);

function toast(title: string, message: string, type: 'success' | 'error' | 'info' = 'success') {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('app-toast', { detail: { title, message, type, duration: type === 'error' ? 7000 : 4500 } }));
}

function statusBadge(book: any) {
  const available = Number(book.copiesAvailable || 0);
  if (book.status === 'archived') return { text: 'Archived', className: 'border-slate-200 bg-slate-50 text-slate-600' };
  if (available > 0) return { text: 'Available', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' };
  return { text: 'Unavailable', className: 'border-amber-200 bg-amber-50 text-amber-700' };
}

export default function LibraryPage() {
  const { user } = useAuth();
  const [books, setBooks] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ search: '', category: '', status: 'available' });

  const role = user?.role || '';
  const canManageLibrary = libraryManageRoles.includes(role);
  const isLearner = role === 'student' || role === 'parent';
  const isTeacher = teacherRoles.includes(role);
  const canSeeOwnLoans = canManageLibrary || isLearner || isTeacher;

  const filteredBooks = useMemo(() => books, [books]);
  const issuedLoans = useMemo(() => loans.filter((loan) => loan.status !== 'returned'), [loans]);
  const returnedLoans = useMemo(() => loans.filter((loan) => loan.status === 'returned'), [loans]);

  const stats = useMemo(() => {
    const available = books.reduce((sum, book) => sum + Number(book.copiesAvailable || 0), 0);
    const total = books.reduce((sum, book) => sum + Number(book.copiesTotal || 0), 0);
    const overdue = loans.filter((loan) => loan.status === 'overdue').length;
    return { totalBooks: books.length, available, totalCopies: total, issued: issuedLoans.length, overdue };
  }, [books, loans, issuedLoans.length]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.search.trim()) params.set('search', filters.search.trim());
      if (filters.category) params.set('category', filters.category);
      if (filters.status) params.set('status', filters.status);
      const suffix = params.toString() ? `?${params.toString()}` : '';
      const [bookData, loanData, categoryData] = await Promise.all([
        libraryClient.getBooks(suffix),
        canSeeOwnLoans ? libraryClient.getLoans() : Promise.resolve([]),
        libraryClient.getCategories(),
      ]);
      setBooks(Array.isArray(bookData) ? bookData : []);
      setLoans(Array.isArray(loanData) ? loanData : []);
      setCategories(Array.isArray(categoryData) ? categoryData : []);
    } catch (e: any) {
      const message = e?.message || 'Failed to load library dashboard';
      setError(message);
      toast('Library load failed', message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => undefined);
  }, [role]);

  const applyFilters = () => load().catch(() => undefined);
  const resetFilters = () => {
    setFilters({ search: '', category: '', status: 'available' });
    setTimeout(() => load().catch(() => undefined), 0);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Library"
        description={isLearner ? 'Browse available books and view only your own/child issued books.' : isTeacher ? 'Browse books and view your own issued/requested books.' : 'Manage books, categories, issue/return, and library status.'}
        icon={Library}
        status={<Badge variant="outline">{canManageLibrary ? 'Management access' : 'Read only'}</Badge>}
        actions={canManageLibrary ? [
          <Button key="books" asChild><Link href="/library/books"><BookOpen className="mr-2 h-4 w-4" />Manage Books</Link></Button>,
          <Button key="loans" variant="outline" asChild><Link href="/library/loans"><Clock className="mr-2 h-4 w-4" />Issue / Return</Link></Button>,
        ] : []}
      />

      <section className="rounded-2xl border bg-card p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-sky-700"><ShieldCheck className="h-4 w-4" />Role-based library access</div>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">{canManageLibrary ? 'Library control panel' : 'Library reading view'}</h2>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              {canManageLibrary ? 'Head/admin/librarian/staff can add, edit, delete, issue, return, and manage categories.' : 'Add, edit, delete, issue, and return actions are hidden for this role and blocked by backend.'}
            </p>
          </div>
          <Badge className="w-fit capitalize" variant="secondary">{role.replace('_', ' ') || 'user'}</Badge>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: 'Available Books', value: stats.available, icon: BookOpen },
          { label: 'Titles', value: stats.totalBooks, icon: BookMarked },
          { label: 'Total Copies', value: stats.totalCopies, icon: Library },
          { label: 'Issued Books', value: stats.issued, icon: Clock },
          { label: 'Categories', value: categories.length, icon: Tags },
        ].map((item) => {
          const Icon = item.icon;
          return <div key={item.label} className="rounded-2xl border bg-card p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{item.label}</p><Icon className="h-5 w-5 text-muted-foreground" /></div><p className="mt-2 text-3xl font-semibold">{item.value}</p></div>;
        })}
      </div>

      <section className="rounded-2xl border bg-card p-4 shadow-sm md:p-5">
        <div className="mb-4 flex items-center gap-2"><Filter className="h-5 w-5" /><h2 className="text-lg font-semibold">Search and filters</h2></div>
        <div className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Search</label>
            <div className="relative mt-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Title, author, ISBN, category" /></div>
          </div>
          <label className="space-y-1"><span className="text-sm font-medium">Category</span><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}><option value="">All categories</option>{categories.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}</select></label>
          <label className="space-y-1"><span className="text-sm font-medium">Book status</span><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="available">Available</option>{canManageLibrary && <option value="unavailable">Unavailable</option>}{canManageLibrary && <option value="archived">Archived</option>}<option value="">All</option></select></label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2"><Button onClick={applyFilters}>Apply filters</Button><Button variant="outline" onClick={resetFilters}>Reset</Button></div>
      </section>

      {loading && <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">Loading library data...</div>}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <section className="rounded-2xl border bg-card p-4 shadow-sm md:p-5">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-semibold">Available Books</h2><p className="text-sm text-muted-foreground">Read-only for student/parent. Management buttons are only on manager pages.</p></div>{canManageLibrary && <Button variant="outline" asChild><Link href="/library/books">Open book manager</Link></Button>}</div>
          <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
            {filteredBooks.map((book) => {
              const badge = statusBadge(book);
              return <article key={book._id} className="rounded-xl border p-4 transition hover:shadow-sm"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-slate-950">{book.title}</h3><p className="text-sm text-muted-foreground">{book.author || 'Unknown author'}</p></div><Badge variant="outline" className={badge.className}>{badge.text}</Badge></div><div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground"><span className="rounded-full bg-slate-100 px-2 py-1">{book.category || 'Uncategorized'}</span>{book.isbn && <span className="rounded-full bg-slate-100 px-2 py-1">ISBN {book.isbn}</span>}<span className="rounded-full bg-slate-100 px-2 py-1">{book.copiesAvailable || 0}/{book.copiesTotal || 0} copies</span></div>{canManageLibrary && <div className="mt-4 flex gap-2"><Button size="sm" variant="outline" asChild><Link href="/library/books">Edit</Link></Button><Button size="sm" variant="outline" asChild><Link href="/library/loans">Issue</Link></Button></div>}</article>;
            })}
            {!filteredBooks.length && !loading && <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground sm:col-span-2">No books found for selected filters.</div>}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl border bg-card p-4 shadow-sm md:p-5"><h2 className="mb-3 text-lg font-semibold">Categories</h2><div className="space-y-2">{categories.slice(0, 10).map((item) => <button key={item.name} onClick={() => setFilters({ ...filters, category: item.name })} className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm hover:bg-slate-50"><span>{item.name}</span><span className="text-muted-foreground">{item.available}/{item.total}</span></button>)}{!categories.length && <p className="text-sm text-muted-foreground">No categories yet.</p>}</div>{canManageLibrary && <Button className="mt-4 w-full" variant="outline" asChild><Link href="/library/books">Manage categories</Link></Button>}</section>

          <section className="rounded-2xl border bg-card p-4 shadow-sm md:p-5"><h2 className="mb-3 text-lg font-semibold">Issued Books</h2><p className="mb-3 text-sm text-muted-foreground">{canManageLibrary ? 'Recent issued books across this institution.' : role === 'parent' ? "Linked child's issued/requested books only." : 'Your own issued/requested books only.'}</p><div className="space-y-3">{issuedLoans.slice(0, 8).map((loan) => <div key={loan._id} className="rounded-xl border p-3"><div className="flex items-start justify-between gap-2"><div><p className="font-medium">{loan.book?.title || 'Unknown book'}</p><p className="text-xs text-muted-foreground">{loan.user?.name || loan.user?.email || 'Borrower'}</p></div><Badge variant="outline">{loan.status}</Badge></div><p className="mt-2 text-xs text-muted-foreground">Due {loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : 'N/A'}{loan.fine ? ` • Fine ${loan.fine}` : ''}</p>{canManageLibrary && <Button className="mt-3" size="sm" variant="outline" asChild><Link href="/library/loans">Return / manage</Link></Button>}</div>)}{!issuedLoans.length && <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">No issued/requested books found.</p>}</div></section>

          {canManageLibrary && <section className="rounded-2xl border bg-card p-4 shadow-sm md:p-5"><h2 className="mb-3 text-lg font-semibold">Returned / History</h2><div className="space-y-2">{returnedLoans.slice(0, 5).map((loan) => <div key={loan._id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm"><p className="font-medium">{loan.book?.title || 'Book'}</p><p className="text-xs text-muted-foreground">Returned {loan.returnedAt ? new Date(loan.returnedAt).toLocaleDateString() : today()}</p></div>)}{!returnedLoans.length && <p className="text-sm text-muted-foreground">No returned history yet.</p>}</div></section>}
        </aside>
      </div>
    </div>
  );
}
