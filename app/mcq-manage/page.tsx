'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, Printer, ScanLine, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const letters = ['A', 'B', 'C', 'D'];
const makeQuestions = (count: number, subject: string, syllabus: string) => Array.from({ length: count }).map((_, i) => ({ id: i + 1, q: `${subject || 'Subject'} - ${syllabus || 'সিলেবাস'} থেকে প্রশ্ন ${i + 1}?`, options: ['Option A', 'Option B', 'Option C', 'Option D'], answer: letters[i % 4] }));

export default function McqManagePage() {
  const [form, setForm] = useState({ className: 'Class 10', subject: 'Science', syllabus: '', count: '25', setName: 'MCQ Test 1' });
  const [roll, setRoll] = useState('');
  const [studentAnswers, setStudentAnswers] = useState('');
  const questions = useMemo(() => makeQuestions(Number(form.count) || 25, form.subject, form.syllabus), [form]);
  const update = (key: string, value: string) => setForm((c) => ({ ...c, [key]: value }));
  const answerKey = questions.map((q) => `${q.id}${q.answer}`).join(', ');
  const parsed = studentAnswers.toUpperCase().split(/[\s,;]+/).filter(Boolean);
  const score = questions.reduce((sum, q) => sum + (parsed.includes(`${q.id}${q.answer}`) || parsed.includes(`${q.id}.${q.answer}`) ? 1 : 0), 0);
  const savePractice = () => { localStorage.setItem('easy_mcq_latest', JSON.stringify({ ...form, questions, createdAt: new Date().toISOString() })); alert('MCQ saved for practice on this browser.'); };
  return <div className="space-y-6 p-4 md:p-6">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><h1 className="text-3xl font-bold tracking-tight">MCQ Manage</h1><p className="text-sm text-muted-foreground">Teacher/Head MCQ বানাবে, A4 print করবে, roll add করবে এবং scanned answer থেকে auto marking করবে।</p></div><Badge>Not for Student</Badge></div>
    <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
      <Card><CardHeader><CardTitle>MCQ Setup</CardTitle><CardDescription>Class/subject/syllabus অনুযায়ী MCQ বানান।</CardDescription></CardHeader><CardContent className="space-y-3">
        <Input value={form.setName} onChange={(e) => update('setName', e.target.value)} placeholder="Test name" />
        <Input value={form.className} onChange={(e) => update('className', e.target.value)} placeholder="Class" />
        <Input value={form.subject} onChange={(e) => update('subject', e.target.value)} placeholder="Subject" />
        <Input value={form.count} onChange={(e) => update('count', e.target.value)} placeholder="MCQ count" />
        <textarea className="min-h-28 w-full rounded-md border p-3 text-sm" value={form.syllabus} onChange={(e) => update('syllabus', e.target.value)} placeholder="Syllabus / chapter" />
        <Input value={roll} onChange={(e) => setRoll(e.target.value)} placeholder="Roll field for print sheet" />
        <div className="flex flex-wrap gap-2"><Button onClick={savePractice}><Save className="mr-2 h-4 w-4" />Save for Practice</Button><Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />A4 Print</Button></div>
      </CardContent></Card>
      <div className="space-y-4">
        <Card className="print:shadow-none print:border-0"><CardHeader><CardTitle>{form.setName}</CardTitle><CardDescription>{form.className} · {form.subject} · Roll: {roll || '________'}</CardDescription></CardHeader><CardContent><div className="grid gap-3 print:text-black">
          {questions.map((q) => <div key={q.id} className="rounded-md border p-3 break-inside-avoid"><p className="font-medium">{q.id}. {q.q}</p><div className="mt-2 grid gap-1 sm:grid-cols-2 text-sm">{q.options.map((op, i) => <span key={op}>{letters[i]}) {op}</span>)}</div></div>)}
        </div><p className="mt-4 text-xs text-muted-foreground print:hidden">Answer key: {answerKey}</p></CardContent></Card>
        <Card className="print:hidden"><CardHeader><CardTitle className="flex items-center gap-2"><ScanLine className="h-5 w-5" />Scanner / Auto Marking</CardTitle><CardDescription>OMR/camera OCR result বা barcode scanner text paste করুন। Format: 1A 2B 3C</CardDescription></CardHeader><CardContent className="space-y-3"><textarea className="min-h-24 w-full rounded-md border p-3 text-sm" value={studentAnswers} onChange={(e) => setStudentAnswers(e.target.value)} placeholder="1A 2B 3C 4D ..." /><div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-600" /><b>Score: {score}/{questions.length}</b></div></CardContent></Card>
      </div>
    </div>
    <style jsx global>{`@media print{body{background:white}.sidebar,.navbar,button{display:none!important}@page{size:A4;margin:12mm}}`}</style>
  </div>;
}
