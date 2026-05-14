'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';

type School = { _id: string; name: string; type: string; eiin?: string; address: string; phone?: string; email?: string };

const emptyForm = {
  studentName: '',
  guardianName: '',
  guardianPhone: '',
  guardianEmail: '',
  dateOfBirth: '',
  address: '',
  previousSchool: '',
  previousResult: '',
  requestedClass: '',
};

export default function PublicAdmissionPage() {
  const [search, setSearch] = useState('');
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState('');

  const loadSchools = async () => {
    const data = await api.admissions.schools({ search }) as { schools: School[] };
    setSchools(data.schools || []);
  };

  useEffect(() => { loadSchools().catch(() => setSchools([])); }, []);

  const update = (key: keyof typeof emptyForm, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async () => {
    if (!selectedSchool) {
      setStatus('Select a school first.');
      return;
    }
    setStatus('Submitting application...');
    try {
      await api.admissions.apply({ ...form, institutionId: selectedSchool._id });
      setStatus('Application submitted. You will receive SMS after approval.');
      setForm(emptyForm);
    } catch (error: any) {
      setStatus(error?.message || 'Submission failed.');
    }
  };

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-950">Admission Application</h1>
            <p className="mt-1 text-sm text-slate-600">Search a registered school and apply for admission.</p>
          </div>
          <Button asChild variant="outline"><Link href="/login">Login</Link></Button>
        </header>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Registered Schools</CardTitle>
              <CardDescription>Select the school where you want to apply.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search school, address or EIIN" />
                <Button onClick={loadSchools}><Search className="h-4 w-4" /></Button>
              </div>
              <div className="space-y-2">
                {schools.map((school) => (
                  <button
                    key={school._id}
                    onClick={() => setSelectedSchool(school)}
                    className={`w-full rounded-md border p-3 text-left text-sm ${selectedSchool?._id === school._id ? 'border-primary bg-popover' : 'bg-background hover:bg-muted'}`}
                  >
                    <div className="font-medium text-slate-950">{school.name}</div>
                    <div className="mt-1 text-xs text-slate-500">{school.address}</div>
                    <div className="mt-1 text-xs text-slate-500">EIIN: {school.eiin || 'N/A'}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{selectedSchool ? `Apply to ${selectedSchool.name}` : 'Application Details'}</CardTitle>
              <CardDescription>Provide student, guardian, previous school and result information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Student Name" value={form.studentName} onChange={(v) => update('studentName', v)} />
                <Field label="Class for Admission" value={form.requestedClass} onChange={(v) => update('requestedClass', v)} />
                <Field label="Date of Birth" type="date" value={form.dateOfBirth} onChange={(v) => update('dateOfBirth', v)} />
                <Field label="Guardian Name" value={form.guardianName} onChange={(v) => update('guardianName', v)} />
                <Field label="Guardian Phone" value={form.guardianPhone} onChange={(v) => update('guardianPhone', v)} />
                <Field label="Guardian Email" type="email" value={form.guardianEmail} onChange={(v) => update('guardianEmail', v)} />
                <Field label="Previous School" value={form.previousSchool} onChange={(v) => update('previousSchool', v)} />
                <Field label="Previous Result" value={form.previousResult} onChange={(v) => update('previousResult', v)} />
              </div>
              <Textarea value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="Full address" />
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-slate-600">{status}</p>
                <Button onClick={submit}><Send className="mr-2 h-4 w-4" />Submit</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={label} />;
}
