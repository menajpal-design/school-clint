"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BookMarked, BookOpen, Clock, Filter, Library, Search, ShieldCheck, Tags, XCircle } from 'lucide-react';
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

  const statsList = useMemo(() => {
    if (isLearner) {
      const activeLoans = loans.filter(l => l.status === 'issued' || l.status === 'overdue').length;
      const overdueLoans = loans.filter(l => l.status === 'overdue').length;
      return [
        { label: 'Available Books', value: stats.available, icon: BookOpen, textColor: 'text-sky-600', bgColor: 'bg-sky-50', borderColor: 'border-sky-100' },
        { label: 'Book Titles', value: stats.totalBooks, icon: BookMarked, textColor: 'text-slate-600', bgColor: 'bg-slate-50', borderColor: 'border-slate-100' },
        { label: 'My Active Loans', value: activeLoans, icon: Clock, textColor: 'text-indigo-600', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-100' },
        { label: 'My Overdue Loans', value: overdueLoans, icon: XCircle, textColor: overdueLoans > 0 ? 'text-rose-600' : 'text-slate-600', bgColor: overdueLoans > 0 ? 'bg-rose-50' : 'bg-slate-50', borderColor: overdueLoans > 0 ? 'border-rose-100' : 'border-slate-100' },
        { label: 'Categories', value: categories.length, icon: Tags, textColor: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-100' },
      ];
    }
    return [
      { label: 'Available Books', value: stats.available, icon: BookOpen, textColor: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-100' },
      { label: 'Book Titles', value: stats.totalBooks, icon: BookMarked, textColor: 'text-sky-600', bgColor: 'bg-sky-50', borderColor: 'border-sky-100' },
      { label: 'Total Copies', value: stats.totalCopies, icon: Library, textColor: 'text-violet-600', bgColor: 'bg-violet-50', borderColor: 'border-violet-100' },
      { label: 'Total Issued', value: stats.issued, icon: Clock, textColor: 'text-indigo-600', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-100' },
      { label: 'Overdue Books', value: stats.overdue, icon: XCircle, textColor: stats.overdue > 0 ? 'text-rose-600' : 'text-slate-600', bgColor: stats.overdue > 0 ? 'bg-rose-50' : 'bg-slate-50', borderColor: stats.overdue > 0 ? 'border-rose-100' : 'border-slate-100' },
    ];
  }, [isLearner, stats, categories.length, loans]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      <section className="relative overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50/50 via-indigo-50/30 to-transparent p-6 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-700">
              <ShieldCheck className="h-4 w-4 text-sky-600" />
              Role-Based Portal Access
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">
              {canManageLibrary ? 'Library Management Panel' : 'School Library Directory'}
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
              {canManageLibrary 
                ? 'Review and manage catalog items, register new acquisitions, process book returns, and track active loan records across the institution.' 
                : 'Browse through the catalog of available publications. You can search by title, author, category or ISBN code and monitor your ongoing loans.'}
            </p>
          </div>
          <Badge className="w-fit border-indigo-200 bg-indigo-50 text-indigo-700 px-3 py-1 font-semibold uppercase tracking-wider text-xs" variant="outline">
            {role.replace('_', ' ') || 'user'}
          </Badge>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {statsList.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className={`rounded-2xl border backdrop-blur-md bg-white/75 p-5 transition-all duration-300 hover:shadow-md hover:translate-y-[-2px] flex flex-col justify-between ${item.borderColor}`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{item.label}</p>
                <span className={`p-2 rounded-xl ${item.textColor} ${item.bgColor}`}>
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-4 text-3xl font-bold tracking-tight text-slate-800">{item.value}</p>
            </div>
          );
        })}
      </div>

      <section className="rounded-2xl border bg-white/80 p-5 shadow-sm backdrop-blur-sm">
        <div className="mb-4 flex items-center gap-2"><Filter className="h-5 w-5 text-sky-600" /><h2 className="text-lg font-semibold text-slate-800">Search and filters</h2></div>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Search Catalog</label>
            <div className="relative mt-1.5"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9 h-10 rounded-xl" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Search by title, author, ISBN..." /></div>
          </div>
          <label className="flex flex-col gap-1.5"><span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Category</span><select className="h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-sky-500" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}><option value="">All categories</option>{categories.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}</select></label>
          <label className="flex flex-col gap-1.5"><span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Book Status</span><select className="h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-sky-500" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="available">Available</option>{canManageLibrary && <option value="unavailable">Unavailable</option>}{canManageLibrary && <option value="archived">Archived</option>}<option value="">All Statuses</option></select></label>
        </div>
        <div className="mt-5 flex flex-wrap gap-2.5"><Button className="rounded-xl px-5" onClick={applyFilters}>Apply filters</Button><Button className="rounded-xl px-5" variant="outline" onClick={resetFilters}>Reset</Button></div>
      </section>

      {loading && <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">Loading library data...</div>}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-800">Available Publications</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {canManageLibrary 
                  ? 'Manage catalog inventory records. Click Edit or Issue buttons to proceed.' 
                  : 'Browse catalog collections. Contact the librarian to request or borrow any book.'}
              </p>
            </div>
            {canManageLibrary && (
              <Button variant="outline" className="rounded-xl" asChild>
                <Link href="/library/books">Open book manager</Link>
              </Button>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {filteredBooks.map((book) => {
              const badge = statusBadge(book);
              return (
                <article key={book._id} className="rounded-xl border border-slate-100 bg-slate-50/30 p-4 transition-all duration-300 hover:shadow-sm hover:border-slate-200/80 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-slate-800 leading-tight">{book.title}</h3>
                        <p className="text-xs text-slate-500 mt-1">by {book.author || 'Unknown author'}</p>
                      </div>
                      <Badge variant="outline" className={`rounded-full px-2.5 py-0.5 font-medium text-[10px] uppercase tracking-wider ${badge.className}`}>
                        {badge.text}
                      </Badge>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-1.5 text-[10px] font-semibold font-sans">
                      <span className="rounded-full bg-slate-100/80 text-slate-600 px-2.5 py-1">{book.category || 'General'}</span>
                      {book.isbn && <span className="rounded-full bg-slate-100/80 text-slate-600 px-2.5 py-1">ISBN: {book.isbn}</span>}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100/70 pt-3 text-xs text-slate-500">
                    <span>{book.copiesAvailable || 0} / {book.copiesTotal || 0} copies ready</span>
                    {canManageLibrary && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" className="h-8 rounded-lg text-xs" asChild>
                          <Link href="/library/books">Edit</Link>
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs border-sky-100 hover:bg-sky-50 text-sky-700" asChild>
                          <Link href="/library/loans">Issue</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
            {!filteredBooks.length && !loading && (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 sm:col-span-2">
                No matching publications found in catalog.
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold tracking-tight text-slate-800 mb-3">Popular Categories</h2>
            <div className="space-y-2">
              {categories.slice(0, 8).map((item) => (
                <button 
                  key={item.name} 
                  onClick={() => setFilters({ ...filters, category: item.name })} 
                  className="flex w-full items-center justify-between rounded-xl border border-slate-100/85 px-4 py-2.5 text-left text-sm transition hover:bg-slate-50/80 hover:border-slate-200/60"
                >
                  <span className="font-medium text-slate-700">{item.name}</span>
                  <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-25 animate-none" variant="secondary">
                    {item.available}/{item.total}
                  </Badge>
                </button>
              ))}
              {!categories.length && <p className="text-sm text-slate-500 italic p-2">No categories cataloged yet.</p>}
            </div>
            {canManageLibrary && (
              <Button className="mt-4 w-full rounded-xl" variant="outline" asChild>
                <Link href="/library/books">Manage categories</Link>
              </Button>
            )}
          </section>

          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold tracking-tight text-slate-800 mb-1 font-sans">
              {isLearner ? 'My Issued Books' : 'Active Loans'}
            </h2>
            <p className="mb-4 text-xs text-slate-500">
              {canManageLibrary 
                ? 'Active book loans across the school.' 
                : role === 'parent' 
                  ? "Your child's active borrow logs only." 
                  : 'Your active borrow logs only.'}
            </p>
            <div className="space-y-3">
              {issuedLoans.slice(0, 8).map((loan) => (
                <div key={loan._id} className="rounded-xl border border-slate-100 p-3.5 bg-slate-50/20">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">{loan.book?.title || 'Unknown book'}</p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">Borrower: {loan.user?.name || loan.user?.email || 'Student'}</p>
                    </div>
                    <Badge variant="outline" className={`rounded-full px-2 py-0 text-[9px] font-semibold uppercase tracking-wider ${
                      loan.status === 'overdue' 
                        ? 'border-red-200 bg-red-50 text-red-700' 
                        : 'border-blue-200 bg-blue-50 text-blue-700'
                    }`}>
                      {loan.status}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100/50 pt-2.5 text-[10px] text-slate-500 font-medium">
                    <span>Due Date: {loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : 'N/A'}</span>
                    {loan.fine > 0 && <span className="text-red-600 font-bold">Fine: ৳{loan.fine}</span>}
                  </div>
                  {canManageLibrary && (
                    <Button className="mt-3 w-full h-8 rounded-lg text-xs" variant="outline" asChild>
                      <Link href="/library/loans">Return / Manage</Link>
                    </Button>
                  )}
                </div>
              ))}
              {!issuedLoans.length && (
                <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-xs text-slate-400">
                  No active loans recorded.
                </div>
              )}
            </div>
          </section>

          {canManageLibrary && (
            <section className="rounded-2xl border bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold tracking-tight text-slate-800 mb-3 font-sans">Recent Returns</h2>
              <div className="space-y-2.5">
                {returnedLoans.slice(0, 5).map((loan) => (
                  <div key={loan._id} className="rounded-xl bg-slate-50/50 border border-slate-100/80 px-3.5 py-2.5 text-xs">
                    <p className="font-semibold text-slate-700 truncate">{loan.book?.title || 'Book'}</p>
                    <p className="text-[10px] text-slate-500 mt-1">Returned: {loan.returnedAt ? new Date(loan.returnedAt).toLocaleDateString() : today()}</p>
                  </div>
                ))}
                {!returnedLoans.length && <p className="text-xs text-slate-500 italic p-1">No returned history recorded.</p>}
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
