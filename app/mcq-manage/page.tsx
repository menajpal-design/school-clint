'use client';

import { useMemo, useState } from 'react';
import { Camera, CheckCircle2, Loader2, Printer, Save, Send, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api';
import { WebcamScanner } from '@/components/id-cards/WebcamScanner';

const letters = ['A', 'B', 'C', 'D'];
const toast = (title: string, message: string, type: 'success' | 'error' | 'info' = 'success') => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('app-toast', { detail: { title, message, type, duration: 4500 } }));
};
const makeQuestions = (count: number, subject: string, syllabus: string) => Array.from({ length: Math.max(1, Math.min(100, count || 25)) }).map((_, i) => ({ id: i + 1, type: 'mcq', question: `${subject || 'Subject'} - ${syllabus || 'সিলেবাস'} থেকে প্রশ্ন ${i + 1}?`, options: ['Option A', 'Option B', 'Option C', 'Option D'], answer: letters[i % 4], marks: 1 }));

export default function McqManagePage() {
  const [form, setForm] = useState({ title: 'MCQ Test 1', className: 'Class 10', subjectName: 'Science', syllabus: '', count: '25', duration: '30 minutes', totalMarks: '25' });
  const [roll, setRoll] = useState('');
  const [studentAnswers, setStudentAnswers] = useState('');
  const [questions, setQuestions] = useState<any[]>(() => makeQuestions(25, 'Science', ''));
  const [setId, setSetId] = useState('');
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [marking, setMarking] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [serverResult, setServerResult] = useState<any>(null);

  const update = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const answerKey = useMemo(() => questions.map((q, index) => `${index + 1}${q.answer || 'A'}`).join(' '), [questions]);
  const parsed = studentAnswers.toUpperCase().split(/[\s,;]+/).filter(Boolean);
  const localScore = questions.reduce((sum, q, index) => sum + (parsed.includes(`${index + 1}${q.answer}`) || parsed.includes(`${index + 1}.${q.answer}`) ? Number(q.marks || 1) : 0), 0);

  const generate = async () => {
    setGenerating(true);
    try {
      const data: any = await apiClient.post('/question-bank/generate', { ...form, subject: form.subjectName, mode: 'mcq', count: Number(form.count) });
      const next = Array.isArray(data?.questions) && data.questions.length ? data.questions.map((q: any, i: number) => ({ id: i + 1, type: 'mcq', question: q.question, options: q.options?.length ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'], answer: q.answer || 'A', marks: Number(q.marks || 1) })) : makeQuestions(Number(form.count), form.subjectName, form.syllabus);
      setQuestions(next);
      toast('MCQ generated', `${next.length} MCQ ready.`, 'success');
    } catch (error: any) {
      setQuestions(makeQuestions(Number(form.count), form.subjectName, form.syllabus));
      toast('Fallback generated', error?.message || 'Server generator failed.', 'info');
    } finally {
      setGenerating(false);
    }
  };

  const saveSet = async (publish = false) => {
    setSaving(true);
    try {
      const data: any = await apiClient.post('/question-bank/sets', { ...form, mode: 'mcq', subject: form.subjectName, isPublished: publish, totalMarks: Number(form.totalMarks || questions.length), rollRequired: true, questions });
      setSetId(data?.set?._id || data?.set?.id || '');
      localStorage.setItem('easy_mcq_latest', JSON.stringify({ ...form, questions, createdAt: new Date().toISOString() }));
      toast('MCQ saved', publish ? 'MCQ saved and published for students.' : 'MCQ saved to server.', 'success');
    } catch (error: any) {
      localStorage.setItem('easy_mcq_latest', JSON.stringify({ ...form, questions, createdAt: new Date().toISOString() }));
      toast('Saved locally', error?.message || 'Server save failed, local copy saved.', 'info');
    } finally {
      setSaving(false);
    }
  };

  const publishSet = async () => {
    if (!setId) return saveSet(true);
    try {
      await apiClient.patch(`/question-bank/sets/${setId}/publish`, { isPublished: true });
      toast('Published', 'MCQ published for practice.', 'success');
    } catch (error: any) {
      toast('Publish failed', error?.message || 'Could not publish MCQ.', 'error');
    }
  };

  const markServer = async () => {
    if (!setId) return setServerResult({ score: localScore, total: questions.length, note: 'Local marking used. Save to server first for server marking.' });
    setMarking(true);
    try {
      const data: any = await apiClient.post(`/question-bank/sets/${setId}/mark`, { rollNumber: roll, answersText: studentAnswers });
      setServerResult(data);
      toast('Marked', `Score ${data.score}/${data.total}`, 'success');
    } catch (error: any) {
      setServerResult({ score: localScore, total: questions.length, note: error?.message || 'Server failed; local score shown.' });
    } finally {
      setMarking(false);
    }
  };

  const handleCameraScan = (code: string) => {
    setStudentAnswers((current) => `${current ? `${current} ` : ''}${code}`.trim());
    toast('Camera scan received', code, 'success');
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="rounded-2xl border bg-gradient-to-r from-emerald-50 via-white to-sky-50 p-5 shadow-sm"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><h1 className="text-3xl font-bold tracking-tight">MCQ Manage</h1><p className="text-sm text-muted-foreground">MCQ তৈরি, A4 print, publish, roll-based camera scan marking—সব এক জায়গায়।</p></div><div className="flex flex-wrap gap-2"><Badge variant="default">Secure</Badge><Badge variant="secondary">Teacher / Head</Badge></div></div></div>

      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <Card><CardHeader><CardTitle>MCQ Setup</CardTitle><CardDescription>Class/subject/syllabus অনুযায়ী MCQ বানান।</CardDescription></CardHeader><CardContent className="space-y-3">
          <Input value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="Test title" />
          <div className="grid gap-3 sm:grid-cols-2"><Input value={form.className} onChange={(e) => update('className', e.target.value)} placeholder="Class" /><Input value={form.subjectName} onChange={(e) => update('subjectName', e.target.value)} placeholder="Subject" /></div>
          <div className="grid gap-3 sm:grid-cols-3"><Input value={form.count} onChange={(e) => update('count', e.target.value)} placeholder="Count" /><Input value={form.totalMarks} onChange={(e) => update('totalMarks', e.target.value)} placeholder="Marks" /><Input value={form.duration} onChange={(e) => update('duration', e.target.value)} placeholder="Duration" /></div>
          <textarea className="min-h-28 w-full rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" value={form.syllabus} onChange={(e) => update('syllabus', e.target.value)} placeholder="Syllabus / chapter / topic" />
          <Input value={roll} onChange={(e) => setRoll(e.target.value)} placeholder="Roll number for print/marking" />
          <div className="grid gap-2 sm:grid-cols-2"><Button onClick={generate} disabled={generating}>{generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}Generate</Button><Button variant="outline" onClick={() => saveSet(false)} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save</Button></div>
          <div className="grid gap-2 sm:grid-cols-2"><Button variant="outline" onClick={publishSet}><Send className="mr-2 h-4 w-4" />Publish</Button><Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />A4 Print</Button></div>
        </CardContent></Card>

        <div className="space-y-4">
          <Card className="print:shadow-none print:border-0"><CardHeader><CardTitle>{form.title}</CardTitle><CardDescription>{form.className} · {form.subjectName} · Duration: {form.duration} · Roll: {roll || '________'}</CardDescription></CardHeader><CardContent><div className="grid gap-3 print:text-black">{questions.map((q, index) => <div key={index} className="break-inside-avoid rounded-md border p-3"><p className="font-medium">{index + 1}. {q.question}</p><div className="mt-2 grid gap-1 text-sm sm:grid-cols-2">{(q.options || []).map((op: string, i: number) => <span key={`${index}-${i}`}>{letters[i]}) {String(op).replace(/^[A-D][).:-]\s*/i, '')}</span>)}</div></div>)}</div><p className="mt-4 text-xs text-muted-foreground print:hidden">Answer key: {answerKey}</p></CardContent></Card>

          <Card className="print:hidden"><CardHeader><CardTitle className="flex items-center gap-2"><Camera className="h-5 w-5" />Camera Scanner & Auto Marking</CardTitle><CardDescription>QR/Barcode scanner দিয়ে answer text scan করুন। Format: 1A 2B 3C অথবা 1.A 2.B</CardDescription></CardHeader><CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setCameraOpen((v) => !v)}><Camera className="mr-2 h-4 w-4" />{cameraOpen ? 'Hide Camera' : 'Open Camera'}</Button><Button onClick={markServer} disabled={marking}>{marking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}Auto Mark</Button></div>
            {cameraOpen && <WebcamScanner enabled onScan={handleCameraScan} />}
            <textarea className="min-h-28 w-full rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" value={studentAnswers} onChange={(e) => setStudentAnswers(e.target.value)} placeholder="Camera/barcode/OCR answer text: 1A 2B 3C 4D ..." />
            <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Local Score</p><b>{localScore}/{questions.length}</b></div><div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Server Score</p><b>{serverResult ? `${serverResult.score}/${serverResult.total}` : '-'}</b></div><div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Roll</p><b>{roll || '-'}</b></div></div>
          </CardContent></Card>
        </div>
      </div>
      <style jsx global>{`@media print{body{background:white}.sidebar,.navbar,button,textarea{display:none!important}@page{size:A4;margin:12mm}}`}</style>
    </div>
  );
}
