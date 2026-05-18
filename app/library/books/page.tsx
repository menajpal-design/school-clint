'use client';
"use client";

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function BooksPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await api.library.books.getAll();
        if (mounted) setBooks(Array.isArray(data) ? data : []);
      } catch (e: any) {
        setError(e?.message || 'Failed to load books');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold mb-4">Books</h1>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && (
        <div className="space-y-3">
          {books.length === 0 && <p>No books found.</p>}
          {books.map((b) => (
            <div key={b._id} className="rounded border p-3">
              <div className="font-medium">{b.title}</div>
              <div className="text-sm text-muted-foreground">{b.author} — {b.isbn}</div>
              <div className="text-sm">Available: {b.copiesAvailable}/{b.copiesTotal}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

