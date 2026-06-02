'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Send, GraduationCap, Building2, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { getSubdomain } from '@/lib/utils';
import AdmissionFields from '@/components/admission/AdmissionFields';
import SchoolNotFound from '@/components/SchoolNotFound';

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
  const [isSubdomain, setIsSubdomain] = useState(false);
  const [subdomainName, setSubdomainName] = useState('');
  const [isValidSubdomain, setIsValidSubdomain] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);

  const loadSchools = useCallback(async () => {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    const params: any = { search, domain: hostname };
    if (isSubdomain && subdomainName) params.subdomain = subdomainName;
    const data = await api.admissions.schools(params) as { schools: School[] };
    const list = data.schools || [];
    setSchools(list);
    if (list.length === 1) setSelectedSchool(list[0]);
  }, [search, isSubdomain, subdomainName]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hostname = window.location.hostname;
    const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'easyschool.live';
    const sub = getSubdomain(hostname, mainDomain);
    if (sub) {
      setIsSubdomain(true);
      setSubdomainName(sub);
      api.admissions.schools({ subdomain: sub, domain: hostname })
        .then((res: any) => { 
          const list = res.schools || [];
          setSchools(list); 
          if (list.length > 0) { 
            setSelectedSchool(list[0]); 
            setIsValidSubdomain(true);
          } else {
            setIsValidSubdomain(false);
          }
        })
        .catch(() => {
          setIsValidSubdomain(false);
        })
        .finally(() => setInitialLoading(false));
    } else {
      api.admissions.schools({ domain: hostname })
        .then((res: any) => { setSchools(res.schools || []); if ((res.schools || []).length === 1) setSelectedSchool((res.schools || [])[0]); })
        .catch(() => {})
        .finally(() => setInitialLoading(false));
    }
  }, []);

  const update = (key: keyof typeof emptyForm, value: string) => setForm((c) => ({ ...c, [key]: value }));

  const submit = async () => {
    if (!selectedSchool) { setStatus('Select a school first.'); return; }
    setStatus('Submitting application...');
    try {
      await api.admissions.apply({ ...form, institutionId: selectedSchool._id });
      setStatus('Application submitted successfully. You will receive an SMS after approval.');
      setForm(emptyForm);
    } catch (err: any) {
      setStatus(err?.message || 'Submission failed.');
    }
  };

  if (!initialLoading && isSubdomain && !isValidSubdomain) {
    return <SchoolNotFound subdomain={subdomainName} />;
  }

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4 font-sans text-slate-800">
      <div className="w-full max-w-5xl space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-650 to-indigo-900 text-white rounded-2xl h-12 w-12 flex items-center justify-center font-extrabold text-lg shadow-lg">EA</div>
            <div>
              <h1 className="text-lg md:text-xl font-black text-indigo-950 tracking-tight leading-tight">Admission Application</h1>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Search a registered school and apply for admission</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs font-bold text-slate-600 hover:text-slate-900 transition flex items-center gap-1.5 hover:underline"><ArrowLeft className="h-3.5 w-3.5" />Back to Portal</Link>
            <Button asChild variant="outline" className="border-slate-350 text-slate-700 hover:bg-slate-50 font-bold rounded-xl shadow-sm text-xs px-4"><Link href="/login">LOGIN</Link></Button>
          </div>
        </header>

        {initialLoading && (
          <div className="flex flex-col items-center justify-center py-20 bg-white/70 backdrop-blur-md rounded-3xl border border-slate-200/60 shadow-lg">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-650 mb-3" />
            <p className="text-sm font-bold text-slate-500 tracking-wide">Resolving school portal details...</p>
          </div>
        )}

        {!initialLoading && (
          <div className={`grid gap-6 ${isSubdomain || selectedSchool ? 'grid-cols-1' : 'lg:grid-cols-[0.9fr_1.1fr]'}`}>
            {!isSubdomain && !selectedSchool && (
              <Card className="rounded-3xl overflow-hidden shadow-xl border border-slate-200 bg-white">
                <CardHeader className="bg-gradient-to-r from-indigo-950 to-slate-900 text-white px-5 py-4">
                  <div className="flex items-center gap-2"><Building2 className="h-5 w-5 text-indigo-300" /><CardTitle className="text-sm font-bold tracking-wide">Registered Schools</CardTitle></div>
                  <CardDescription className="text-indigo-200/80 text-[10px] uppercase font-semibold mt-1">Select the school where you want to apply</CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="flex gap-2">
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search school, address or EIIN" className="w-full px-4 py-2.5 border border-slate-355 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white text-sm" />
                    <Button onClick={loadSchools} className="bg-indigo-650 hover:bg-indigo-850 text-white font-bold rounded-xl shadow-md"><Search className="h-4 w-4" /></Button>
                  </div>
                  <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                    {schools.length === 0 ? (<p className="text-center py-10 text-slate-400 font-bold text-sm">No registered schools found.</p>) : (
                      schools.map((school) => (
                        <button key={school._id} onClick={() => setSelectedSchool(school)} className={`w-full rounded-xl border p-4 text-left text-sm transition-all duration-200 ${(selectedSchool as any)?._id === school._id ? 'border-indigo-500 bg-indigo-50/40 shadow-md ring-2 ring-indigo-550/10' : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}>
                          <div className="font-extrabold text-slate-800 uppercase tracking-wide">{school.name}</div>
                          <div className="mt-1 text-xs text-slate-500 font-medium">{school.address}</div>
                          <div className="mt-1 text-[10px] text-slate-400 font-semibold">EIIN: {school.eiin || 'N/A'}</div>
                        </button>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className={`rounded-3xl overflow-hidden shadow-xl border border-slate-200 bg-white ${(isSubdomain || selectedSchool) ? 'max-w-2xl mx-auto w-full' : ''}`}>
              <CardHeader className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white px-5 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-indigo-300" /><CardTitle className="text-sm font-bold tracking-wide">{selectedSchool ? `Apply to ${selectedSchool.name}` : 'Application Details'}</CardTitle></div>
                  {!isSubdomain && selectedSchool && (<Button variant="ghost" size="sm" className="text-indigo-200 hover:text-white border border-indigo-800 hover:bg-indigo-900/50 text-[10px] font-bold h-7 rounded-lg px-2.5" onClick={() => setSelectedSchool(null)}>Change School</Button>)}
                </div>
                <CardDescription className="text-indigo-200/80 text-[10px] uppercase font-semibold mt-1">Provide student, guardian, previous school and result information</CardDescription>
              </CardHeader>
              <CardContent className="p-6 md:p-8 space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <AdmissionFields values={form as any} onChange={(k, v) => update(k as any, v)} />
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Full Address</span>
                  <Textarea value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="Street, City, State, Zip Code" className="w-full px-4 py-2.5 border border-slate-350 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white text-sm font-medium transition min-h-[90px]" />
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                  <p className={`text-xs font-bold ${status.includes('successfully') ? 'text-emerald-700' : 'text-slate-600'}`}>{status}</p>
                  <Button onClick={submit} className="w-full sm:w-auto bg-indigo-650 hover:bg-indigo-850 text-white font-extrabold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 px-6 py-2.5"><Send className="h-4 w-4" />Submit Application</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
