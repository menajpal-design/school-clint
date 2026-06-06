"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BookMarked, BookOpen, Clock, Filter, Library, Search, ShieldCheck, Tags, XCircle, Info, CheckCircle2, HelpCircle } from 'lucide-react';
import { libraryClient } from '@/lib/library-client';
import { PageHeader } from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { normalizeUserRole } from '@/lib/permissions';

const libraryManageRoles = ['head', 'assistant_head', 'admin', 'super_admin', 'librarian', 'staff'];
const teacherRoles = ['class_teacher', 'subject_teacher', 'teacher'];
const today = () => new Date().toISOString().slice(0, 10);

function toast(title: string, message: string, type: 'success' | 'error' | 'info' = 'success') {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('app-toast', { detail: { title, message, type, duration: type === 'error' ? 7000 : 4500 } }));
}

function statusBadge(book: any) {
  const available = Number(book.copiesAvailable || 0);
  if (book.status === 'archived') return { text: 'Archived', className: 'border-slate-200 bg-slate-100 text-slate-600' };
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
  const [activeTab, setActiveTab] = useState<'catalog' | 'loans' | 'access'>('catalog');

  const role = normalizeUserRole(user?.role) || user?.role || '';
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
    <div className="space-y-6 max-w-7xl mx-auto px-4 md:px-6 py-4">
      <PageHeader
        title="School Library Portal"
        description={isLearner ? 'Browse catalog books, search publications, and view your own/child loan history.' : isTeacher ? 'Browse books and view your borrow log records.' : 'Administrative system to manage book collections, logs, issue and return.'}
        icon={Library}
        status={<Badge variant="outline" className="border-sky-300 bg-sky-50 text-sky-700 font-semibold">{canManageLibrary ? 'Librarian Mode' : 'Reader Mode'}</Badge>}
        actions={canManageLibrary ? [
          <Button key="books" asChild className="bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-sm"><Link href="/library/books"><BookOpen className="mr-2 h-4 w-4" />Manage Inventory</Link></Button>,
          <Button key="loans" variant="outline" asChild className="rounded-xl border-sky-200 hover:bg-sky-50 hover:text-sky-800"><Link href="/library/loans"><Clock className="mr-2 h-4 w-4" />Issue / Return Center</Link></Button>,
        ] : []}
      />

      {/* Top Banner with Glassmorphism */}
      <section className="relative overflow-hidden rounded-3xl border border-sky-100 bg-gradient-to-r from-sky-50/70 via-indigo-50/40 to-transparent p-6 shadow-sm backdrop-blur-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-sky-700">
              <ShieldCheck className="h-4 w-4 text-sky-600" />
              Role Verified Portal
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">
              Welcome to the Library Hub
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
              Use the tab controls below to search the catalog, view your active borrows, or review access rules.
            </p>
          </div>
          <Badge className="w-fit border-indigo-200 bg-indigo-50 text-indigo-700 px-4 py-1.5 font-bold uppercase tracking-wider text-xs rounded-xl" variant="outline">
            {role.replace('_', ' ') || 'user'}
          </Badge>
        </div>
      </section>

      {/* Statistics Cards Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statsList.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className={`rounded-2xl border bg-white/90 p-5 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between ${item.borderColor}`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{item.label}</p>
                <span className={`p-2 rounded-xl ${item.textColor} ${item.bgColor}`}>
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-4 text-3xl font-extrabold tracking-tight text-slate-800">{item.value}</p>
            </div>
          );
        })}
      </div>

      {/* Custom Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-4 mt-8">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all px-2 flex items-center gap-2 ${
            activeTab === 'catalog'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookMarked className="h-4 w-4" />
          Browse Catalog ({books.length})
        </button>
        <button
          onClick={() => setActiveTab('loans')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all px-2 flex items-center gap-2 ${
            activeTab === 'loans'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="h-4 w-4" />
          {canManageLibrary ? 'Active Loans' : 'My Borrow Logs'} ({issuedLoans.length})
        </button>
        <button
          onClick={() => setActiveTab('access')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all px-2 flex items-center gap-2 ${
            activeTab === 'access'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <HelpCircle className="h-4 w-4" />
          Access & Permissions Guide
        </button>
      </div>

      {/* Active Tab View */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          {/* Search Card */}
          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2"><Filter className="h-5 w-5 text-sky-600" /><h2 className="text-lg font-bold text-slate-800">Filter Publications</h2></div>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Search Title, Author or ISBN</label>
                <div className="relative mt-1.5"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9 h-10 rounded-xl" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Search by title, author, ISBN..." /></div>
              </div>
              <label className="flex flex-col gap-1.5"><span className="text-xs font-bold uppercase tracking-wider text-slate-500">Category</span><select className="h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-sky-500" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}><option value="">All categories</option>{categories.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}</select></label>
              <label className="flex flex-col gap-1.5"><span className="text-xs font-bold uppercase tracking-wider text-slate-500">Book Status</span><select className="h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-sky-500" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="available">Available</option>{canManageLibrary && <option value="unavailable">Unavailable</option>}{canManageLibrary && <option value="archived">Archived</option>}<option value="">All Statuses</option></select></label>
            </div>
            <div className="mt-5 flex flex-wrap gap-2.5"><Button className="rounded-xl px-5 bg-slate-900 hover:bg-slate-800 text-white" onClick={applyFilters}>Search</Button><Button className="rounded-xl px-5" variant="outline" onClick={resetFilters}>Reset</Button></div>
          </section>

          {loading && <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground text-center">Loading publications catalog...</div>}
          {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

          <div className="grid gap-6 xl:grid-cols-[2.2fr_1fr]">
            <section className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-800">Available Books Directory</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Contact the library reception desk to request or borrow any publication.</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {filteredBooks.map((book) => {
                  const badge = statusBadge(book);
                  return (
                    <article key={book._id} className="rounded-xl border border-slate-100 bg-slate-50/20 p-4 transition-all duration-300 hover:shadow-sm hover:border-slate-200/80 flex flex-col justify-between hover:scale-[1.01]">
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
                      <span className="font-semibold text-slate-700">{item.name}</span>
                      <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-200 animate-none" variant="secondary">
                        {item.available}/{item.total}
                      </Badge>
                    </button>
                  ))}
                  {!categories.length && <p className="text-sm text-slate-500 italic p-2">No categories cataloged yet.</p>}
                </div>
              </section>
            </aside>
          </div>
        </div>
      )}

      {activeTab === 'loans' && (
        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold tracking-tight text-slate-800 mb-1">
              {canManageLibrary ? 'Active Loan Logs' : 'My Issued & Borrowed Books'}
            </h2>
            <p className="mb-4 text-xs text-slate-500">
              {canManageLibrary 
                ? 'Active book loans across all users.' 
                : role === 'parent' 
                  ? "Your child's active borrow logs only." 
                  : 'Your active borrow logs only.'}
            </p>
            <div className="space-y-3">
              {issuedLoans.map((loan) => (
                <div key={loan._id} className="rounded-xl border border-slate-100 p-4 bg-slate-50/30 transition hover:shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <p className="font-bold text-slate-800 text-base">{loan.book?.title || 'Unknown book'}</p>
                      <p className="text-xs text-slate-500">Borrower: <span className="font-semibold text-slate-700">{loan.user?.name || loan.user?.email || 'Student'}</span></p>
                      {loan.book?.author && <p className="text-xs text-slate-500">Author: {loan.book.author}</p>}
                    </div>
                    <Badge variant="outline" className={`rounded-xl px-3 py-1 font-bold uppercase tracking-wider text-xs border ${
                      loan.status === 'overdue' 
                        ? 'border-red-200 bg-red-50 text-red-700' 
                        : 'border-blue-200 bg-blue-50 text-blue-700'
                    }`}>
                      {loan.status}
                    </Badge>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                    <span>Borrowed On: {loan.issuedAt ? new Date(loan.issuedAt).toLocaleDateString() : '-'}</span>
                    <span className="font-semibold text-slate-700">Due Date: {loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : 'N/A'}</span>
                    {loan.fine > 0 && <Badge className="bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-100 font-bold" variant="outline">Fine: ৳{loan.fine}</Badge>}
                  </div>
                  {canManageLibrary && (
                    <Button className="mt-3 w-full h-9 rounded-xl text-xs bg-slate-900 text-white hover:bg-slate-800" variant="outline" asChild>
                      <Link href="/library/loans">Process Return</Link>
                    </Button>
                  )}
                </div>
              ))}
              {!issuedLoans.length && (
                <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-400">
                  No active borrows or loans found.
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-2xl border bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold tracking-tight text-slate-800 mb-3">Return History</h2>
              <p className="text-xs text-slate-500 mb-4">Recently completed book returns.</p>
              <div className="space-y-3">
                {returnedLoans.slice(0, 8).map((loan) => (
                  <div key={loan._id} className="rounded-xl bg-slate-50/50 border border-slate-100/80 p-3 text-xs">
                    <p className="font-bold text-slate-700 truncate">{loan.book?.title || 'Book'}</p>
                    <p className="text-[10px] text-slate-500 mt-1">Borrower: {loan.user?.name || 'Student'}</p>
                    <p className="text-[10px] text-emerald-700 font-semibold mt-1">Returned On: {loan.returnedAt ? new Date(loan.returnedAt).toLocaleDateString() : today()}</p>
                  </div>
                ))}
                {!returnedLoans.length && (
                  <p className="text-xs text-slate-400 text-center p-4 border border-dashed border-slate-100 rounded-xl">No returned history recorded.</p>
                )}
              </div>
            </section>
          </aside>
        </div>
      )}

      {activeTab === 'access' && (
        <section className="rounded-2xl border bg-white p-6 shadow-sm space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              Library Access Rules & Permission Matrix
            </h2>
            <p className="text-sm text-slate-500">Every member role has custom read/write catalog permissions and borrow limit settings.</p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                  <th className="p-3.5">User Role</th>
                  <th className="p-3.5">Browse Catalog</th>
                  <th className="p-3.5">Borrow Logs</th>
                  <th className="p-3.5">Add / Edit Book</th>
                  <th className="p-3.5">Issue & Return</th>
                  <th className="p-3.5">Borrow Limit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                <tr className="hover:bg-slate-50/40">
                  <td className="p-3.5 font-bold text-slate-800">Librarian / Staff / Head</td>
                  <td className="p-3.5 text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Full Access</td>
                  <td className="p-3.5">All Records</td>
                  <td className="p-3.5 text-emerald-600 font-semibold">Allowed</td>
                  <td className="p-3.5 text-emerald-600 font-semibold">Allowed</td>
                  <td className="p-3.5 text-slate-400">N/A</td>
                </tr>
                <tr className="hover:bg-slate-50/40">
                  <td className="p-3.5 font-bold text-slate-800">Teachers</td>
                  <td className="p-3.5 text-sky-600 font-semibold flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> View Only</td>
                  <td className="p-3.5">Own Borrow logs</td>
                  <td className="p-3.5 text-rose-600 font-semibold flex items-center gap-1"><XCircle className="h-4 w-4" /> Blocked</td>
                  <td className="p-3.5 text-rose-600 font-semibold flex items-center gap-1"><XCircle className="h-4 w-4" /> Blocked</td>
                  <td className="p-3.5 font-medium">5 Books / 30 Days</td>
                </tr>
                <tr className="hover:bg-slate-50/40">
                  <td className="p-3.5 font-bold text-slate-800">Students / Parents</td>
                  <td className="p-3.5 text-sky-600 font-semibold flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> View Only</td>
                  <td className="p-3.5">Own / Child Borrow logs</td>
                  <td className="p-3.5 text-rose-600 font-semibold flex items-center gap-1"><XCircle className="h-4 w-4" /> Blocked</td>
                  <td className="p-3.5 text-rose-600 font-semibold flex items-center gap-1"><XCircle className="h-4 w-4" /> Blocked</td>
                  <td className="p-3.5 font-medium">3 Books / 15 Days</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-4 text-xs text-sky-800 flex items-start gap-2">
            <Info className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Important Borrow Note:</p>
              <p>Borrowed books must be returned within the specified period. Late returns will accumulate an automatic fine of ৳5 per overdue day.</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
