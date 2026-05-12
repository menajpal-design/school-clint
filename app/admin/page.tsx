'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Building2, CheckCircle2, Clock, ShieldCheck, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminPage() {
  const [schools, setSchools] = useState<any[]>([]);

  useEffect(() => {
    api.admin.schools().then((data: any) => setSchools(data.schools || [])).catch(() => setSchools([]));
  }, []);

  const stats = useMemo(() => ({
    total: schools.length,
    active: schools.filter((s) => s.isActive).length,
    pending: schools.filter((s) => !s.isActive).length,
    users: schools.reduce((sum, s) => sum + Number(s.counts?.users || 0), 0),
  }), [schools]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage schools, subscriptions, payments and platform users.</p>
        </div>
        <Button asChild><Link href="/admin/schools">Manage Schools</Link></Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Schools', stats.total, Building2],
          ['Active', stats.active, CheckCircle2],
          ['Pending/Suspended', stats.pending, Clock],
          ['Users', stats.users, Users],
        ].map(([label, value, Icon]: any) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">{label}</CardTitle><Icon className="h-4 w-4 text-muted-foreground" /></CardHeader>
            <CardContent><div className="text-2xl font-bold">{Number(value).toLocaleString()}</div></CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> Admin Tools</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <Button asChild variant="outline" className="justify-start"><Link href="/admin/schools">School Manage</Link></Button>
          <Button asChild variant="outline" className="justify-start"><Link href="/admin/select-school">Select School</Link></Button>
          <Button asChild variant="outline" className="justify-start"><Link href="/admin/users">Manage Users</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}
