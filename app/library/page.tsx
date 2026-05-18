import React from 'react';
import Link from 'next/link';

export default function LibraryPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold mb-4">Library</h1>
      <p className="mb-4">Library module: manage books and loans.</p>
      <div className="space-x-3">
        <Link href="/library/books" className="btn">Books</Link>
        <Link href="/library/loans" className="btn">Loans</Link>
      </div>
    </div>
  );
}
