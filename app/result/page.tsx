'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';

export default function PublicResultPage() {
  const [schoolSearch, setSchoolSearch] = useState('');
  const [schools, setSchools] = useState<any[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [classId, setClassId] = useState('');
  const [examId, setExamId] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [result, setResult] = useState<any>(null);
  const [status, setStatus] = useState('');

  const filteredExams = useMemo(
    () => exams.filter((exam) => !classId || String(exam.classId) === String(classId)),
    [classId, exams]
  );

  useEffect(() => {
    api.publicResults.schools().then((data: any) => setSchools(data.schools || [])).catch(() => undefined);
  }, []);

  const searchSchools = async () => {
    const data = await api.publicResults.schools({ search: schoolSearch }) as any;
    setSchools(data.schools || []);
  };

  const chooseSchool = async (school: any) => {
    setSelectedSchool(school);
    setResult(null);
    setStatus('');
    const data = await api.publicResults.options({ institutionId: school._id }) as any;
    setClasses(data.classes || []);
    setExams(data.exams || []);
    setClassId('');
    setExamId('');
  };

  const lookup = async () => {
    if (!selectedSchool || !rollNumber.trim()) {
      setStatus('Select school and enter roll number.');
      return;
    }
    setStatus('Searching...');
    setResult(null);
    try {
      const data = await api.publicResults.lookup({
        institutionId: selectedSchool._id,
        classId,
        examId,
        rollNumber: rollNumber.trim(),
      }) as any;
      setResult(data);
      setStatus('');
    } catch (error: any) {
      setStatus(error?.message || 'Result not found.');
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-950">Public Result</h1>
            <p className="mt-1 text-sm text-slate-600">Search school, select class and exam, then enter roll number.</p>
          </div>
          <Button asChild variant="outline"><Link href="/">Home</Link></Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>School</CardTitle>
              <CardDescription>Registered schools are shown here.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input value={schoolSearch} onChange={(event) => setSchoolSearch(event.target.value)} placeholder="School name or EIIN" />
                <Button type="button" onClick={searchSchools}><Search className="h-4 w-4" /></Button>
              </div>
              <div className="max-h-[420px] space-y-2 overflow-auto">
                {schools.map((school) => (
                  <button
                    key={school._id}
                    type="button"
                    onClick={() => chooseSchool(school)}
                    className={`w-full rounded-md border p-3 text-left text-sm ${selectedSchool?._id === school._id ? 'border-primary bg-popover' : 'border-border bg-card'}`}
                  >
                    <div className="font-semibold text-slate-950">{school.name}</div>
                    <div className="text-xs text-slate-500">EIIN {school.eiin || 'N/A'} · {school.address || ''}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Result Lookup</CardTitle>
                <CardDescription>{selectedSchool ? selectedSchool.name : 'Select a school first.'}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-4">
                <Select value={classId || 'all'} onValueChange={(value) => setClassId(value === 'all' ? '' : value)}>
                  <SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All classes</SelectItem>
                    {classes.map((item) => <SelectItem key={item._id} value={item._id}>{item.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={examId || 'all'} onValueChange={(value) => setExamId(value === 'all' ? '' : value)}>
                  <SelectTrigger><SelectValue placeholder="Exam" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All published exams</SelectItem>
                    {filteredExams.map((item) => <SelectItem key={item._id} value={item._id}>{item.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input value={rollNumber} onChange={(event) => setRollNumber(event.target.value)} placeholder="Roll number" />
                <Button type="button" onClick={lookup}>View Result</Button>
              </CardContent>
            </Card>

            {status && <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{status}</div>}

            {result && (
              <Card>
                <CardHeader>
                  <CardTitle>{result.student?.name}</CardTitle>
                  <CardDescription>{result.institution?.name} · Roll {result.student?.rollNumber} · {result.student?.className}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-3">
                    <Summary label="Total" value={`${result.summary.totalObtained}/${result.summary.totalMarks}`} />
                    <Summary label="Percentage" value={`${result.summary.percentage}%`} />
                    <Summary label="Status" value={result.summary.passed ? 'Passed' : 'Failed'} />
                  </div>
                  <div className="overflow-hidden rounded-md border">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-100 text-left">
                        <tr><th className="p-3">Exam</th><th className="p-3">Subject</th><th className="p-3">Marks</th><th className="p-3">Grade</th><th className="p-3">Status</th></tr>
                      </thead>
                      <tbody>
                        {result.results.map((item: any, index: number) => (
                          <tr key={`${item.subjectCode}-${index}`} className="border-t">
                            <td className="p-3">{item.examName}</td>
                            <td className="p-3">{item.subjectName}</td>
                            <td className="p-3">{item.marksObtained}</td>
                            <td className="p-3">{item.grade || '-'}</td>
                            <td className="p-3">{item.isPassed === false ? 'Failed' : 'Passed'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-950">{value}</div>
    </div>
  );
}
