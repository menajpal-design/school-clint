"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { libraryClient } from '@/lib/library-client';

const emptyForm = {
  title: '',
  author: '',
  isbn: '',
  publisher: '',
  category: '',
  location: '',
  copiesTotal: '1',
  tags: '',
};

export default function BooksPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const bookCount = useMemo(() => books.length, [books]);

  const loadBooks = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await libraryClient.getBooks();
      setBooks(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await libraryClient.createBook({
        ...form,
        copiesTotal: Number(form.copiesTotal || 1),
        copiesAvailable: Number(form.copiesTotal || 1),
        tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      });
      setForm(emptyForm);
      setSuccess('Book created successfully');
      await loadBooks();
    } catch (e: any) {
      setError(e?.message || 'Failed to save book');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!window.confirm('Delete this book?')) return;
    setError(null);
    try {
      await libraryClient.deleteBook(id);
      await loadBooks();
    } catch (e: any) {
      setError(e?.message || 'Failed to delete book');
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-900">Books</h1>
        <p className="mt-2 text-sm text-slate-600">Create, list, and remove library books.</p>
        <p className="mt-2 text-sm text-slate-500">Total books: {bookCount}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <form onSubmit={onSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Add new book</h2>
          {[
            ['title', 'Title'],
            ['author', 'Author'],
            ['isbn', 'ISBN'],
            ['publisher', 'Publisher'],
            ['category', 'Category'],
            ['location', 'Location'],
            ['copiesTotal', 'Total copies'],
            ['tags', 'Tags (comma separated)'],
          ].map(([key, label]) => (
            <label key={key} className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">{label}</span>
              <input
                value={(form as any)[key]}
                onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500"
                required={['title', 'author', 'copiesTotal'].includes(key)}
              />
            </label>
          ))}
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Create book'}
          </button>
          {success && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{success}</p>}
          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        </form>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Library inventory</h2>
            <button onClick={loadBooks} className="text-sm font-medium text-sky-700">Refresh</button>
          </div>

          {loading && <p className="mt-4 text-sm text-slate-500">Loading books...</p>}
          {!loading && !books.length && <p className="mt-4 text-sm text-slate-500">No books found.</p>}

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {books.map((book) => (
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
                <p className="mt-2 text-sm text-slate-500">{book.category || 'General'} {book.location ? `• ${book.location}` : ''}</p>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <p className="text-xs text-slate-400">{book.isbn || 'No ISBN'}</p>
                  <button onClick={() => onDelete(book._id)} className="text-sm font-medium text-red-600">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
