'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, Building2, GraduationCap, Loader2, Printer, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { downloadElementPdf } from '@/lib/export-utils';
import { getSubdomain } from '@/lib/utils';
import SchoolNotFound from '@/components/SchoolNotFound';

type AnyRecord = Record<string, any>;

export default function PublicResultPage() {
  const [host, setHost] = useState('');
  const [isSubdomain, setIsSubdomain] = useState(false);
  const [subdomainName, setSubdomainName] = useState('');
  const [isValidSubdomain, setIsValidSubdomain] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);

  const [schools, setSchools] = useState<AnyRecord[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<AnyRecord | null>(null);
  const [schoolSearchQuery, setSchoolSearchQuery] = useState('');
  const [schoolDropdownOpen, setSchoolDropdownOpen] = useState(false);

  const [classes, setClasses] = useState<AnyRecord[]>([]);
  const [exams, setExams] = useState<AnyRecord[]>([]);
  const [years, setYears] = useState<number[]>([]);

  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [year, setYear] = useState('');
  const [examId, setExamId] = useState('');
  const [roll, setRoll] = useState('');
  const [registrationNo, setRegistrationNo] = useState('');
  const [studentName, setStudentName] = useState('');

  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnyRecord | null>(null);

  const selectedClass = useMemo(() => classes.find((item) => String(item._id) === String(classId)), [classes, classId]);
  const sections = useMemo(() => (selectedClass?.sections || []).filter((item: AnyRecord) => item?.isActive !== false), [selectedClass]);
  const examOptions = useMemo(() => exams.filter((item) => !classId || String(item.classId?._id || item.classId) === String(classId)), [exams, classId]);
  const activeExam = result?.exams?.[0] || { examName: result?.summary?.examName || '', examYear: result?.summary?.examYear || year, summary: result?.summary || {}, results: result?.results || [] };

  useEffect(() => { if (typeof window !== 'undefined') setHost(window.location.hostname); }, []);

  useEffect(() => {
    if (!host) return;
    const loadInitialSchool = async () => {
      try {
        const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'easyschool.live';
        const sub = getSubdomain(host, mainDomain);
        if (sub) {
          setIsSubdomain(true);
          setSubdomainName(sub);
          const response: AnyRecord = await api.publicResults.schools({ subdomain: sub, domain: host });
          const list = response.schools || [];
          if (!list.length) { setIsValidSubdomain(false); return; }
          setSelectedSchool(list[0]);
          setSchoolSearchQuery(list[0].name || '');
          setSchools(list);
          return;
        }
        const response: AnyRecord = await api.publicResults.schools({ domain: host });
        const list = response.schools || [];
        setSchools(list);
        if (response.locked && list.length === 1) { setSelectedSchool(list[0]); setSchoolSearchQuery(list[0].name || ''); }
      } catch {
        if (isSubdomain) setIsValidSubdomain(false);
      } finally { setInitialLoading(false); }
    };
    loadInitialSchool();
  }, [host, isSubdomain]);

  useEffect(() => {
    if (!host || isSubdomain) return;
    if (selectedSchool && schoolSearchQuery === selectedSchool.name) return;
    const timer = window.setTimeout(async () => {
      try {
        const response: AnyRecord = await api.publicResults.schools({ search: schoolSearchQuery, domain: host });
        setSchools(response.schools || []);
      } catch { setSchools([]); }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [host, isSubdomain, selectedSchool, schoolSearchQuery]);

  const loadResultOptions = async (overrides: AnyRecord = {}) => {
    if (!selectedSchool) return;
    const response: AnyRecord = await api.publicResults.options({
      institutionId: selectedSchool._id,
      classId: (overrides.classId ?? classId) || undefined,
      year: (overrides.year ?? year) || undefined,
      subdomain: subdomainName || undefined,
      domain: host || undefined,
    });
    setClasses(response.classes || []);
    setExams(response.exams || []);
    setYears((response.years || []).map((item: any) => Number(item)).filter(Boolean));
  };

  useEffect(() => {
    if (!selectedSchool) return;
    setClassId(''); setSectionId(''); setYear(''); setExamId(''); setResult(null);
    loadResultOptions().catch(() => { setClasses([]); setExams([]); setYears([]); });
  }, [selectedSchool]);

  useEffect(() => { setSectionId(''); setExamId(''); if (selectedSchool) loadResultOptions({ classId }).catch(() => undefined); }, [classId]);
  useEffect(() => { setExamId(''); if (selectedSchool) loadResultOptions({ year }).catch(() => undefined); }, [year]);

  const submitSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus(''); setResult(null);
    if (!selectedSchool) return setStatus('Please select school.');
    if (!classId) return setStatus('Please select Class Name.');
    if (!year) return setStatus('Please select Year.');
    if (!examId) return setStatus('Please select Exam Name.');
    if (!roll.trim() && !registrationNo.trim() && !studentName.trim()) return setStatus('Provide Roll, Registration No or Student Name.');
    setLoading(true);
    try {
      const response: AnyRecord = await api.publicResults.lookup({ institutionId: selectedSchool._id, classId, sectionId: sectionId || undefined, year, examId, rollNumber: roll.trim() || undefined, regNumber: registrationNo.trim() || undefined, studentName: studentName.trim() || undefined, subdomain: subdomainName || undefined, domain: host || undefined });
      setResult(response);
    } catch (error: any) {
      setStatus(error?.message || 'Published result not found for this information.');
    } finally { setLoading(false); }
  };

  if (!initialLoading && isSubdomain && !isValidSubdomain) return <SchoolNotFound subdomain={subdomainName} />;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800">
      <style>{`
        .input { width: 100%; border: 1px solid #cbd5e1; border-radius: 0.75rem; padding: 0.75rem 1rem; font-size: 0.875rem; font-weight: 600; background: #fff; outline: none; }
        .input:focus { border-color: #4f46e5; box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.12); }
        @media print {
          body * { visibility: hidden !important; }
          #print-result, #print-result * { visibility: visible !important; }
          #print-result { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; padding: 18px !important; background: #fff !important; color: #000 !important; box-shadow: none !important; }
          .no-print { display: none !important; }
          table { width: 100% !important; border-collapse: collapse !important; }
          tr { page-break-inside: avoid !important; }
          th, td { border: 1px solid #cbd5e1 !important; padding: 6px 8px !important; color: #000 !important; }
        }
      `}</style>
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="no-print flex items-center justify-between border-b border-slate-200 pb-4"><div><h1 className="text-xl font-black text-indigo-950">{selectedSchool?.name || 'EasySchool Result Portal'}</h1><p className="text-xs font-semibold text-slate-500">Published result search</p></div><Link href="/" className="text-xs font-bold text-indigo-700 hover:underline"><ArrowLeft className="mr-1 inline h-4 w-4" /> Back</Link></div>
        {status && <div className="no-print flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700"><AlertTriangle className="h-5 w-5" /> {status}</div>}
        {initialLoading && <div className="rounded-3xl bg-white p-12 text-center shadow"><Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-700" /></div>}
        {!initialLoading && !result && <form onSubmit={submitSearch} className="no-print overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-200"><div className="bg-indigo-950 p-5 text-center text-white"><GraduationCap className="mx-auto mb-2 h-8 w-8" /><h2 className="text-xl font-black">Search Published Result</h2><p className="text-xs text-indigo-100">Select Class Name, Year, Exam Name and student details.</p></div><div className="space-y-4 p-6"><FieldRow label="School">{isSubdomain ? <input value={selectedSchool?.name || ''} disabled readOnly className="input bg-slate-100 font-bold text-slate-500" /> : <div className="relative"><input value={schoolSearchQuery} onFocus={() => setSchoolDropdownOpen(true)} onChange={(event) => { setSchoolSearchQuery(event.target.value); setSchoolDropdownOpen(true); setSelectedSchool(null); }} placeholder="Search school name or EIIN" className="input pr-10" /><Building2 className="absolute right-3 top-3.5 h-4 w-4 text-slate-400" />{schoolDropdownOpen && <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border bg-white shadow-xl">{schools.length ? schools.map((school) => <button key={school._id} type="button" className="block w-full px-4 py-3 text-left text-sm hover:bg-indigo-50" onClick={() => { setSelectedSchool(school); setSchoolSearchQuery(school.name || ''); setSchoolDropdownOpen(false); }}><b>{school.name}</b><span className="block text-xs text-slate-500">{school.eiin ? `EIIN: ${school.eiin}` : ''}</span></button>) : <div className="p-4 text-center text-xs font-bold text-slate-500">No school found</div>}</div>}</div>}</FieldRow><FieldRow label="Class Name"><select value={classId} onChange={(event) => setClassId(event.target.value)} required className="input"><option value="">Select Class Name</option>{classes.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select></FieldRow><FieldRow label="Year"><select value={year} onChange={(event) => setYear(event.target.value)} required className="input"><option value="">Select Year</option>{(years.length ? years : Array.from({ length: 10 }, (_, index) => new Date().getFullYear() - index)).map((item) => <option key={item} value={String(item)}>{item}</option>)}</select></FieldRow><FieldRow label="Exam Name"><select value={examId} onChange={(event) => setExamId(event.target.value)} required className="input"><option value="">Select Exam Name</option>{examOptions.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select></FieldRow><FieldRow label="Section"><select value={sectionId} onChange={(event) => setSectionId(event.target.value)} className="input"><option value="">All / No Section</option>{sections.map((item: AnyRecord) => <option key={item._id} value={item._id}>{item.name}</option>)}</select></FieldRow><div className="grid gap-3 md:grid-cols-3"><input value={roll} onChange={(event) => setRoll(event.target.value)} placeholder="Roll" className="input" /><input value={registrationNo} onChange={(event) => setRegistrationNo(event.target.value)} placeholder="Registration No" className="input" /><input value={studentName} onChange={(event) => setStudentName(event.target.value)} placeholder="Student Name" className="input" /></div><button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-700 px-6 py-3 text-sm font-black text-white hover:bg-indigo-900 disabled:opacity-60">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} View Result</button></div></form>}
        {result && <div className="space-y-4"><div className="no-print flex justify-center gap-3"><button onClick={() => setResult(null)} className="rounded-xl bg-slate-800 px-5 py-2 text-xs font-black text-white">Search Again</button><button onClick={() => downloadElementPdf(document.getElementById('print-result'), `result-${result.student?.rollNumber || result.student?.name || 'student'}.pdf`)} className="flex items-center gap-2 rounded-xl bg-indigo-700 px-5 py-2 text-xs font-black text-white"><Printer className="h-4 w-4" /> Print / Save PDF</button></div><section id="print-result" className="rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-200"><div className="border-b pb-4 text-center"><h2 className="text-2xl font-black uppercase text-indigo-950">{result.institution?.name}</h2><p className="text-sm font-semibold text-slate-600">{result.institution?.address || ''}</p><p className="mt-2 text-sm font-black uppercase">{activeExam.examName} Result - {activeExam.examYear || year}</p></div><div className="mt-4 grid gap-2 text-sm md:grid-cols-2"><p><b>Name:</b> {result.student?.name}</p><p><b>Roll:</b> {result.student?.rollNumber}</p><p><b>Class:</b> {result.student?.className}</p><p><b>Section:</b> {result.student?.sectionName || '-'}</p><p><b>Year:</b> {activeExam.examYear || year}</p><p><b>Registration No:</b> {result.student?.registrationNo || '-'}</p><p><b>Father:</b> {result.student?.fatherName || '-'}</p><p><b>Mother:</b> {result.student?.motherName || '-'}</p></div><div className="mt-5 overflow-x-auto"><table className="w-full border-collapse text-sm"><thead><tr className="bg-slate-100"><th className="border p-2 text-left">Subject</th><th className="border p-2 text-center">Full</th><th className="border p-2 text-center">Pass</th><th className="border p-2 text-center">Obtained</th><th className="border p-2 text-center">Grade</th><th className="border p-2 text-center">GPA</th></tr></thead><tbody>{(activeExam.results || []).map((row: AnyRecord, index: number) => <tr key={index}><td className="border p-2 font-semibold">{row.subjectName}</td><td className="border p-2 text-center">{row.fullMarks ?? '-'}</td><td className="border p-2 text-center">{row.passingMarks ?? '-'}</td><td className="border p-2 text-center">{row.marksObtained ?? '-'}</td><td className="border p-2 text-center font-black">{row.grade || '-'}</td><td className="border p-2 text-center">{row.gradePoint ?? '-'}</td></tr>)}</tbody></table></div><div className="mt-5 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm md:grid-cols-4"><p><b>Total:</b> {activeExam.summary?.totalObtained ?? '-'} / {activeExam.summary?.totalMarks ?? '-'}</p><p><b>Percentage:</b> {activeExam.summary?.percentage ?? '-'}%</p><p><b>GPA:</b> {activeExam.summary?.gpa || '-'}</p><p><b>Status:</b> {activeExam.summary?.passed ? 'PASSED' : 'FAILED'}</p></div><div className="mt-12 grid grid-cols-3 gap-6 text-center text-xs font-bold"><div className="border-t pt-2">Class Teacher</div><div className="border-t pt-2">Head Teacher</div><div className="border-t pt-2">Published Date</div></div><p className="mt-6 text-center text-[11px] font-semibold text-slate-500">Generated by EasySchool</p></section></div>}
      </div>
    </main>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid gap-2 md:grid-cols-12 md:items-center"><label className="text-xs font-black uppercase text-slate-700 md:col-span-4">{label}</label><div className="md:col-span-8">{children}</div></div>;
}
