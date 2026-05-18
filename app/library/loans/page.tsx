"use client";

import React, { useEffect, useState } from 'react';

const fetchLoans = async () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const selectedInstitutionId = typeof window !== 'undefined' ? localStorage.getItem('selectedInstitutionId') : null;
  const res = await fetch('/api/library/loans', {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(selectedInstitutionId ? { 'x-institution-id': selectedInstitutionId } : {}),
    },
    credentials: 'include',
  });
  const text = await res.text();
  const data = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null;
  if (!res.ok) throw new Error((data as any)?.message || res.statusText || 'Failed to load loans');
  return Array.isArray(data) ? data : [];
};

export default function LoansPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchLoans();
        if (mounted) setLoans(Array.isArray(data) ? data : []);
      } catch (e: any) {
        setError(e?.message || 'Failed to load loans');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold mb-4">Loans</h1>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && (
        <div className="space-y-3">
          {loans.length === 0 && <p>No loans found.</p>}
          {loans.map((l) => (
            <div key={l._id} className="rounded border p-3">
              <div className="font-medium">{l.book?.title || 'Unknown book'}</div>
              <div className="text-sm text-muted-foreground">User: {l.user?.name || l.user}</div>
              <div className="text-sm">Issued: {new Date(l.issuedAt).toLocaleDateString()} — Due: {new Date(l.dueDate).toLocaleDateString()}</div>
              <div className="text-sm">Status: {l.status} {l.fine ? `— Fine: ${l.fine}` : ''}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

