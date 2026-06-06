'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, Building2, GraduationCap, Loader2, Printer, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { getSubdomain } from '@/lib/utils';
import SchoolNotFound from '@/components/SchoolNotFound';

export default function PublicResultPage() {
  const [isSubdomain, setIsSubdomain] = useState(false);
  const [subdomainName, setSubdomainName] = useState('');
  const [isValidSubdomain, setIsValidSubdomain] = useState(true);
  const [schools, setSchools] = useState<any[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<any>(null);
  const [schoolSearchQuery, setSchoolSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [classes, setClasses] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [year, setYear] = useState('');
  const [examId, setExamId] = useState('');
  const [roll, setRoll] = useState('');
  const [reg, setReg] = useState('');
  const [studentName, setStudentName] = useState('');
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const selectedClassItem = useMemo(() => classes.find((c) => String(c._id) === String(selectedClass)), [classes, selectedClass]);
  const sections = useMemo(() => (selectedClassItem?.sections || []).filter((s: any) => s?.isActive !== false), [selectedClassItem]);
  const filteredExams = useMemo(() => exams.filter((e) => !selectedClass || String(e.classId?._id || e.classId) === String(selectedClass)), [exams, selectedClass]);
  const activeExam = result?.exams?.[0] || { results: result?.results || [], summary: result?.summary || {} };

  useEffect(() => {
    const loadSchools = async () => {
      try {
        const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'easyschool.live';
        const sub = hostname ? getSubdomain(hostname, mainDomain) : '';
        if (sub) {
          setIsSubdomain(true);
          setSubdomainName(sub);
          const res: any = await api.publicResults.schools({ subdomain: sub, domain: hostname });
          const list = res.schools || [];
          if (!list.length) setIsValidSubdomain(false);
          else {
            setSelectedSchool(list[0]);
            setSchoolSearchQuery(list[0].name || '');
          }
        } else {
          const res: any = await api.publicResults.schools({ domain: hostname });
          const list = res.schools || [];
          setSchools(list);
          if (list.length === 1 && res.locked) {
            setSelectedSchool(list[0]);
            setSchoolSearchQuery(list[0].name || '');
          }
        }
      } finally {
        setInitialLoading(false);
      }
    };
    loadSchools();
  }, [hostname]);

  useEffect(() => {
    if (isSubdomain) return;
    if (selectedSchool && selectedSchool.name === schoolSearchQuery) return;
    const timer = setTimeout(async () => {
      const res: any = await api.publicResults.schools({ search: schoolSearchQuery, domain: hostname });
      setSchools(res.schools || []);
    }, 300);
    return () => clearTimeout(timer);
  }, [hostname, isSubdomain, schoolSearchQuery, selectedSchool]);

  const loadOptions = async (extra: any = {}) => {
    if (!selectedSchool) return;
    const res: any = await api.publicResults.options({ institutionId: selectedSchool._id, classId: selectedClass || undefined, year: year || undefined, subdomain: subdomainName || undefined, domain: hostname, ...extra });
    setClasses(res.classes || []);
    setExams(res.exams || []);
    setYears((res.years || []).map((y: any) => Number(y)).filter(Boolean));
  };

  useEffect(() => {
    if (!selectedSchool) return;
    setSelectedClass('');
    setSelectedSection('');
    setYear('');
    setExamId('');
    loadOptions().catch(() => {});
  }, [selectedSchool]);

  useEffect(() => {
    setSelectedSection('');
    setExamId('');
    if (selectedSchool) loadOptions({ classId: selectedClass || undefined }).catch(() => {});
  }, [selectedClass]);

  useEffect(() => {
    setExamId('');
    if (selectedSchool) loadOptions({ year: year || undefined }).catch(() => {});
  }, [year]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('');
    setResult(null);
    if (!selectedSchool) return setStatus('Please select school.');
    if (!selectedClass) return setStatus('Please select Class Name.');
    if (!year) return setStatus('Please select Year.');
    if (!examId) return setStatus('Please select Exam Name.');
    if (!roll.trim() && !reg.trim() && !studentName.trim()) return setStatus('Provide Roll, Registration No or Student Name.');
    setLoading(true);
    try {
      const data: any = await api.publicResults.lookup({ institutionId: selectedSchool._id, classId: selectedClass, sectionId: selectedSection || undefined, year, examId, rollNumber: roll.trim() || undefined, regNumber: reg.trim() || undefined, studentName: studentName.trim() || undefined, subdomain: subdomainName || undefined, domain: hostname });
      setResult(data);
    } catch (error: any) {
      setStatus(error?.message || 'Published result not found.');
    } finally {
      setLoading(false);
    }
  };

  if (!initialLoading && isSubdomain && !isValidSubdomain) return <SchoolNotFound subdomain={subdomainName} />;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800">
      <style>{`@media print{body *{visibility:hidden!important}#print-result,#print-result *{visibility:visible!important}#print-result{position:absolute;left:0;top:0;width:100%;padding:18px;background:white}.no-print{display:none!important}table{width:100%;border-collapse:collapse}th,td{border:1px solid #cbd5e1;padding:6px 8px;color:black}}`}</style>
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="no-print flex items-center justify-between border-b pb-4">
          <div><h1 className="text-xl font-black text-indigo-950">{selectedSchool?.name || 'EasySchool Result Portal'}</h1><p className="text-xs font-semibold text-slate-500">Published Result Search</p></div>
          <Link href="/" className="text-xs font-bold text-indigo-700"><ArrowLeft className="mr-1 inline h-4 w-4" />Back</Link>
        </div>
        {status && <div className="no-print flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700"><AlertTriangle className="h-5 w-5" />{status}</div>}
        {initialLoading && <div className="rounded-3xl bg-white p-12 text-center shadow"><Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-700" /></div>}
        {!initialLoading && !result && <form onSubmit={handleSubmit} className="no-print overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-200">
          <div className="bg-indigo-950 p-5 text-center text-white"><GraduationCap className="mx-auto mb-2 h-8 w-8" /><h2 className="text-xl font-black">Search Published Result</h2></div>
          <div className="space-y-4 p-6">
            <div className="grid gap-2 md:grid-cols-12 md:items-center"><label className="text-xs font-black uppercase md:col-span-4">School</label><div className="relative md:col-span-8">{isSubdomain ? <input value={selectedSchool?.name || ''} disabled readOnly className="w-full rounded-xl border bg-slate-100 px-4 py-3 text-sm font-bold" /> : <><input value={schoolSearchQuery} onChange={(e) => { setSchoolSearchQuery(e.target.value); setDropdownOpen(true); setSelectedSchool(null); }} onFocus={() => setDropdownOpen(true)} placeholder="Search school name or EIIN" className="w-full rounded-xl border px-4 py-3 text-sm font-semibold" /><Building2 className="absolute right-3 top-3.5 h-4 w-4 text-slate-400" />{dropdownOpen && <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border bg-white shadow-xl">{schools.length ? schools.map((s) => <button key={s._id} type="button" className="block w-full px-4 py-3 text-left text-sm hover:bg-indigo-50" onClick={() => { setSelectedSchool(s); setSchoolSearchQuery(s.name || ''); setDropdownOpen(false); }}><b>{s.name}</b><span className="block text-xs text-slate-500">{s.eiin ? `EIIN: ${s.eiin}` : ''}</span></button>) : <div className="p-4 text-center text-xs font-bold text-slate-500">No school found</div>}</div>}</>}</div></div>
            <div className="grid gap-2 md:grid-cols-12 md:items-center"><label className="text-xs font-black uppercase md:col-span-4">Class Name</label><select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} required className="rounded-xl border px-4 py-3 text-sm font-semibold md:col-span-8"><option value="">Select Class Name</option>{classes.map((c) => <option key={c._id} value={c._id}>{c.name}{c.academicYear ? ` (${c.academicYear})` : ''}</option>)}</select></div>
            <div className="grid gap-2 md:grid-cols-12 md:items-center"><label className="text-xs font-black uppercase md:col-span-4">Year</label><select value={year} onChange={(e) => setYear(e.target.value)} required className="rounded-xl border px-4 py-3 text-sm font-semibold md:col-span-8"><option value="">Select Year</option>{(years.length ? years : Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i)).map((y) => <option key={y} value={String(y)}>{y}</option>)}</select></div>
            <div className="grid gap-2 md:grid-cols-12 md:items-center"><label className="text-xs font-black uppercase md:col-span-4">Exam Name</label><select value={examId} onChange={(e) => setExamId(e.target.value)} required className="rounded-xl border px-4 py-3 text-sm font-semibold md:col-span-8"><option value="">Select Exam Name</option>{filteredExams.map((e) => <option key={e._id} value={e._id}>{e.name}</option>)}</select></div>
            <div className="grid gap-2 md:grid-cols-12 md:items-center"><label className="text-xs font-black uppercase md:col-span-4">Section</label><select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} className="rounded-xl border px-4 py-3 text-sm font-semibold md:col-span-8"><option value="">All / No Section</option>{sections.map((s: any) => <option key={s._id} value={s._id}>{s.name}</option>)}</select></div>
            <div className="grid gap-3 md:grid-cols-3"><input value={roll} onChange={(e) => setRoll(e.target.value)} placeholder="Roll" className="rounded-xl border px-4 py-3 text-sm font-semibold" /><input value={reg} onChange={(e) => setReg(e.target.value)} placeholder="Registration No" className="rounded-xl border px-4 py-3 text-sm font-semibold" /><input value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="Student Name" className="rounded-xl border px-4 py-3 text-sm font-semibold" /></div>
            <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-700 px-6 py-3 text-sm font-black text-white">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}View Result</button>
          </div>
        </form>}
        {result && <div className="space-y-4"><div className="no-print flex justify-center gap-3"><button onClick={() => setResult(null)} className="rounded-xl bg-slate-800 px-5 py-2 text-xs font-black text-white">Search Again</button><button onClick={() => window.print()} className="flex items-center gap-2 rounded-xl bg-indigo-700 px-5 py-2 text-xs font-black text-white"><Printer className="h-4 w-4" />Print / Save PDF</button></div><section id="print-result" className="rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-200"><div className="border-b pb-4 text-center"><h2 className="text-2xl font-black uppercase text-indigo-950">{result.institution?.name}</h2><p className="text-sm font-semibold text-slate-600">{result.institution?.address || ''}</p><p className="mt-2 text-sm font-black uppercase">{activeExam?.examName} Result - {activeExam?.examYear || year}</p></div><div className="mt-4 grid gap-2 text-sm md:grid-cols-2"><p><b>Name:</b> {result.student?.name}</p><p><b>Roll:</b> {result.student?.rollNumber}</p><p><b>Class:</b> {result.student?.className}</p><p><b>Section:</b> {result.student?.sectionName || '-'}</p><p><b>Year:</b> {activeExam?.examYear || year}</p><p><b>Registration No:</b> {result.student?.registrationNo || '-'}</p><p><b>Father:</b> {result.student?.fatherName || '-'}</p><p><b>Mother:</b> {result.student?.motherName || '-'}</p></div><div className="mt-5 overflow-x-auto"><table className="w-full border-collapse text-sm"><thead><tr className="bg-slate-100"><th className="border p-2 text-left">Subject</th><th className="border p-2 text-center">Full</th><th className="border p-2 text-center">Pass</th><th className="border p-2 text-center">Obtained</th><th className="border p-2 text-center">Grade</th><th className="border p-2 text-center">GPA</th></tr></thead><tbody>{(activeExam?.results || []).map((r: any, i: number) => <tr key={i}><td className="border p-2 font-semibold">{r.subjectName}</td><td className="border p-2 text-center">{r.fullMarks ?? '-'}</td><td className="border p-2 text-center">{r.passingMarks ?? '-'}</td><td className="border p-2 text-center">{r.marksObtained ?? '-'}</td><td className="border p-2 text-center font-black">{r.grade || '-'}</td><td className="border p-2 text-center">{r.gradePoint ?? '-'}</td></tr>)}</tbody></table></div><div className="mt-5 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm md:grid-cols-4"><p><b>Total:</b> {activeExam?.summary?.totalObtained ?? '-'} / {activeExam?.summary?.totalMarks ?? '-'}</p><p><b>Percentage:</b> {activeExam?.summary?.percentage ?? '-'}%</p><p><b>GPA:</b> {activeExam?.summary?.gpa || '-'}</p><p><b>Status:</b> {activeExam?.summary?.passed ? 'PASSED' : 'FAILED'}</p></div><div className="mt-12 grid grid-cols-3 gap-6 text-center text-xs font-bold"><div className="border-t pt-2">Class Teacher</div><div className="border-t pt-2">Head Teacher</div><div className="border-t pt-2">Published Date</div></div><p className="mt-6 text-center text-[11px] font-semibold text-slate-500">Generated by EasySchool</p></section></div>}
      </div>
    </main>
  );
}
