'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function SelectSchoolPage() {
  const [schools, setSchools] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string>(() => typeof window === 'undefined' ? '' : localStorage.getItem('selectedInstitutionId') || '');

  const load = () => api.admin.schools(search ? { search } : undefined).then((data: any) => setSchools(data.schools || []));
  useEffect(() => { load().catch(() => setSchools([])); }, []);

  const selectSchool = async (school: any) => {
    await api.admin.selectSchool(school._id);
    localStorage.setItem('selectedInstitutionId', school._id);
    localStorage.setItem('selectedInstitutionName', school.name);
    setSelectedId(school._id);
  };

  const clear = () => {
    localStorage.removeItem('selectedInstitutionId');
    localStorage.removeItem('selectedInstitutionName');
    setSelectedId('');
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Select School</h1>
          <p className="mt-1 text-sm text-muted-foreground">Admin can enter any school context and view that school dashboard/data.</p>
        </div>
        <div className="flex gap-2">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search school" />
          <Button onClick={load}><Search className="h-4 w-4" /></Button>
          <Button variant="outline" onClick={clear}>Clear</Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {schools.map((school) => (
          <Card key={school._id} className={selectedId === school._id ? 'border-blue-500' : ''}>
            <CardContent className="space-y-4 p-4">
              <div className="flex gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100"><Building2 className="h-5 w-5" /></div>
                <div>
                  <h2 className="font-semibold">{school.name}</h2>
                  <p className="text-sm text-muted-foreground">{school.email}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant={school.isActive ? 'default' : 'secondary'}>{school.isActive ? 'Active' : 'Pending'}</Badge>
                <Badge variant="outline">{school.counts?.students || 0} students</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => selectSchool(school)}>{selectedId === school._id ? 'Selected' : 'Select'}</Button>
                <Button asChild variant="outline"><Link href="/dashboard">Open Dashboard</Link></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
