'use client';

import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { Camera, CheckCircle2, FileInput, Loader2, Printer, Save, Send, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api';
import { WebcamScanner } from '@/components/id-cards/WebcamScanner';

const letters = ['A', 'B', 'C', 'D'];
const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

type ExamItem = { _id: string; name?: string; type?: string; classId?: any; subjectId?: any; subjectMarks?: any[]; totalMarks?: number };
type McqItem = { id: number; type: string; question: string; options: string[]; answer: string; marks: number };

const toast = (title: string, message: string, type: 'success' | 'error' | 'info' = 'success') => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('app-toast', { detail: { title, message, type, duration: 4500 } }));
};

const makeQuestions = (count: number, subject: string, syllabus: string): McqItem[] =>
  Array.from({ length: Math.max(1, Math.min(100, count || 30)) }).map((_, index) => ({
    id: index + 1,
    type: 'mcq',
    question: `${subject || 'Subject'} - ${syllabus || 'সিলেবাস'} থেকে প্রশ্ন ${index + 1}?`,
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    answer: letters[index % 4],
    marks: 1,
  }));

function Bubble({ children, small = false }: { children: string; small?: boolean }) {
  return <span className={`${small ? 'h-[13px] w-[13px] text-[9px]' : 'h-[18px] w-[18px] text-[12px]'} inline-flex items-center justify-center rounded-full border border-red-500 text-red-600 font-semibold leading-none`}>{children}</span>;
}

function DigitGrid({ title, cols = 6 }: { title: string; cols?: number }) {
  return <div className="border border-red-500"><div className="border-b border-red-500 py-1 text-center font-bold text-red-600">{title}</div><div className="grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>{Array.from({ length: cols }).map((_, col) => <div key={col} className="border-r border-red-300 last:border-r-0"><div className="h-7 border-b border-red-300" />{digits.map((digit) => <div key={`${col}-${digit}`} className="flex justify-center py-[1px]"><Bubble small>{digit}</Bubble></div>)}</div>)}</div></div>;
}

function OmrAnswerBlock({ start, end }: { start: number; end: number }) {
  return <div className="border-2 border-red-500"><div className="grid grid-cols-[36px_1fr] border-b border-red-500 text-center font-bold text-red-600"><div className="border-r border-red-500 p-1 text-[10px] leading-tight">Ques.<br />Num.</div><div className="p-2 text-xl">Answer</div></div><div className="space-y-[5px] p-2">{Array.from({ length: Math.max(0, end - start + 1) }).map((_, index) => { const number = start + index; return <div key={number} className="grid grid-cols-[34px_1fr] items-center"><span className="text-xl font-semibold text-red-600">{number}.</span><div className="flex justify-between">{letters.map((letter) => <Bubble key={letter}>{letter.toLowerCase()}</Bubble>)}</div></div>; })}</div></div>;
}

function OmrSheet({ form, roll, registration, examTitle, questions }: { form: any; roll: string; registration: string; examTitle: string; questions: McqItem[] }) {
  const count = Math.max(30, Math.min(30, questions.length || 30));
  return <section className="omr-sheet mx-auto bg-white p-4 text-black shadow print:shadow-none"><div className="text-center"><div className="text-xl font-bold">{examTitle || 'এসএসসি/এইচএসসি পরীক্ষা ২০____'}</div><div className="text-lg">নৈর্ব্যক্তিক অভীক্ষার উত্তরপত্র</div><div className="mx-auto mt-1 inline-block bg-black px-2 py-1 text-sm font-bold text-white">উত্তরপত্রে নির্ধারিত স্থান ব্যতীত কোন অবাঞ্ছিত দাগ দেওয়া বা কোন কিছু লেখা যাবে না</div><p className="text-sm font-semibold">অবশ্যই কালো বল-পয়েন্ট কলম দিয়ে বৃত্ত ভরাট করতে হবে</p></div><div className="mt-5 grid grid-cols-[1fr_1fr_1fr_310px] gap-6"><OmrAnswerBlock start={1} end={10} /><OmrAnswerBlock start={11} end={20} /><OmrAnswerBlock start={21} end={count} /><div className="space-y-4"><div className="grid grid-cols-2 gap-3"><div className="h-[58px] border-2 border-black p-2 text-sm font-bold text-red-600">Marks:<br /><span className="text-black">{form.totalMarks}</span></div><div className="grid grid-cols-2 border-2 border-black text-center text-xs font-bold text-red-600"><div className="border-r border-black p-1">Subject<br /><span className="text-black">{form.subjectName}</span></div><div className="p-1">Test No<br /><span className="text-black">{form.title}</span></div></div></div><DigitGrid title={`Roll Number ${roll ? `(${roll})` : ''}`} cols={6} /><DigitGrid title={`Registration number ${registration ? `(${registration})` : ''}`} cols={6} /><div className="text-xs leading-6"><p className="font-semibold">বৃত্তগুলো যথাযথভাবে ভরাট করতে হবে যাতে মেশিন/স্ক্যানার পড়তে পারে।</p><div className="flex items-center gap-4"><span>সঠিক পদ্ধতি</span><span className="inline-block h-4 w-8 rounded-full bg-black" /></div><div className="flex items-center gap-3"><span>ভুল পদ্ধতি</span><span>◐</span><span>⊘</span><span>✓</span><span>×</span></div></div></div></div></section>;
}

function QuestionPaper({ form, examTitle, questions }: { form: any; examTitle: string; questions: McqItem[] }) {
  return <section className="question-paper mx-auto bg-white p-6 text-black shadow print:shadow-none"><div className="mb-4 text-center"><h2 className="text-xl font-bold">{examTitle || form.title}</h2><p>{form.className} · {form.subjectName} · Time: {form.duration} · Marks: {form.totalMarks}</p><p className="font-semibold">MCQ Question Paper</p></div><div className="grid gap-3">{questions.map((q, index) => <div key={q.id || index} className="break-inside-avoid rounded border p-3"><p className="font-semibold">{index + 1}. {q.question}</p><div className="mt-2 grid grid-cols-2 gap-1 text-sm">{(q.options || []).slice(0, 4).map((option, optionIndex) => <span key={`${index}-${optionIndex}`}>{letters[optionIndex]}) {String(option).replace(/^[A-D][).:-]\s*/i, '')}</span>)}</div></div>)}</div><div className="mt-5 rounded border p-3 text-sm"><b>Answer Key:</b> {questions.map((q, index) => `${index + 1}${q.answer || 'A'}`).join(' ')}</div></section>;
}

export default function McqManagePage() {
  const [form, setForm] = useState({ title: 'MCQ Test 1', className: 'Class 10', subjectName: 'Science', syllabus: '', count: '30', duration: '30 minutes', totalMarks: '30' });
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [roll, setRoll] = useState('');
  const [registration, setRegistration] = useState('');
  const [studentAnswers, setStudentAnswers] = useState('');
  const [questions, setQuestions] = useState<McqItem[]>(() => makeQuestions(30, 'Science', ''));
  const [setId, setSetId] = useState('');
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [marking, setMarking] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [serverResult, setServerResult] = useState<any>(null);

  useEffect(() => {
    apiClient.get('/academic/exams').then((data: any) => setExams(Array.isArray(data?.exams) ? data.exams : [])).catch(() => setExams([]));
  }, []);

  const update = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const selectedExam = exams.find((exam) => String(exam._id) === selectedExamId);
  const examTitle = selectedExam?.name || form.title;
  const parsed = studentAnswers.toUpperCase().split(/[\s,;]+/).filter(Boolean);
  const localScore = questions.reduce((sum, q, index) => sum + (parsed.includes(`${index + 1}${q.answer}`) || parsed.includes(`${index + 1}.${q.answer}`) ? Number(q.marks || 1) : 0), 0);

  const selectExam = (examId: string) => {
    setSelectedExamId(examId);
    const exam = exams.find((item) => String(item._id) === examId);
    if (!exam) return;
    const subjectName = exam.subjectId?.name || exam.subjectMarks?.[0]?.subjectId?.name || form.subjectName;
    setForm((current) => ({ ...current, title: exam.name || current.title, className: exam.classId?.name || current.className, subjectName, totalMarks: String(exam.totalMarks || current.totalMarks) }));
  };

  const generate = async () => {
    setGenerating(true);
    try {
      const data: any = await apiClient.post('/question-bank/generate', { ...form, examId: selectedExamId || undefined, subject: form.subjectName, mode: 'mcq', count: Number(form.count) });
      const next = Array.isArray(data?.questions) && data.questions.length ? data.questions.map((q: any, index: number) => ({ id: index + 1, type: 'mcq', question: q.question, options: q.options?.length ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'], answer: q.answer || 'A', marks: Number(q.marks || 1) })) : makeQuestions(Number(form.count), form.subjectName, form.syllabus);
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
      const data: any = await apiClient.post('/question-bank/sets', { ...form, examId: selectedExamId || undefined, title: examTitle, mode: 'mcq', subject: form.subjectName, isPublished: publish, totalMarks: Number(form.totalMarks || questions.length), rollRequired: true, questions });
      setSetId(data?.set?._id || data?.set?.id || '');
      localStorage.setItem('easy_mcq_latest', JSON.stringify({ ...form, title: examTitle, questions, createdAt: new Date().toISOString() }));
      toast('MCQ saved', publish ? 'MCQ saved and published for students.' : 'MCQ saved to server.', 'success');
    } catch (error: any) {
      localStorage.setItem('easy_mcq_latest', JSON.stringify({ ...form, title: examTitle, questions, createdAt: new Date().toISOString() }));
      toast('Saved locally', error?.message || 'Server save failed, local copy saved.', 'info');
    } finally {
      setSaving(false);
    }
  };

  const publishSet = async () => {
    if (!setId) return saveSet(true);
    try { await apiClient.patch(`/question-bank/sets/${setId}/publish`, { isPublished: true }); toast('Published', 'MCQ published for practice.', 'success'); }
    catch (error: any) { toast('Publish failed', error?.message || 'Could not publish MCQ.', 'error'); }
  };

  const markServer = async () => {
    if (!setId) return setServerResult({ score: localScore, total: questions.length, note: 'Local marking used. Save to server first for server marking.' });
    setMarking(true);
    try { const data: any = await apiClient.post(`/question-bank/sets/${setId}/mark`, { rollNumber: roll, registrationNumber: registration, answersText: studentAnswers }); setServerResult(data); toast('Marked', `Score ${data.score}/${data.total}`, 'success'); }
    catch (error: any) { setServerResult({ score: localScore, total: questions.length, note: error?.message || 'Server failed; local score shown.' }); }
    finally { setMarking(false); }
  };

  const handleCameraScan = (code: string) => { setStudentAnswers((current) => `${current ? `${current} ` : ''}${code}`.trim()); toast('Camera scan received', code, 'success'); };
  const importOmrFile = async (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; const text = await file.text(); setStudentAnswers((current) => `${current ? `${current}\n` : ''}${text}`.trim()); const rollMatch = text.match(/roll\s*[:,-]?\s*(\d+)/i); const regMatch = text.match(/reg(?:istration)?\s*[:,-]?\s*(\d+)/i); if (rollMatch) setRoll(rollMatch[1]); if (regMatch) setRegistration(regMatch[1]); toast('OMR file imported', 'Machine CSV/TXT output added for marking.', 'success'); };

  return <div className="space-y-6 p-4 md:p-6"><div className="no-print rounded-2xl border bg-gradient-to-r from-emerald-50 via-white to-sky-50 p-5 shadow-sm"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><h1 className="text-3xl font-bold tracking-tight">MCQ Manage</h1><p className="text-sm text-muted-foreground">Exam select, MCQ তৈরি, A4 OMR sheet, question paper, camera scan এবং machine import।</p></div><div className="flex flex-wrap gap-2"><Badge variant="default">Secure</Badge><Badge variant="secondary">Teacher / Head</Badge></div></div></div><div className="grid gap-4 xl:grid-cols-[420px_1fr] print:block"><Card className="no-print"><CardHeader><CardTitle>MCQ Setup</CardTitle><CardDescription>প্রতিষ্ঠানের exam select করুন অথবা manual title দিন।</CardDescription></CardHeader><CardContent className="space-y-3"><select className="w-full rounded-md border bg-background p-2 text-sm" value={selectedExamId} onChange={(event) => selectExam(event.target.value)}><option value="">Select institution exam</option>{exams.map((exam) => <option key={exam._id} value={exam._id}>{exam.name || 'Exam'} {exam.classId?.name ? `- ${exam.classId.name}` : ''}</option>)}</select><Input value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="Test title" /><div className="grid gap-3 sm:grid-cols-2"><Input value={form.className} onChange={(event) => update('className', event.target.value)} placeholder="Class" /><Input value={form.subjectName} onChange={(event) => update('subjectName', event.target.value)} placeholder="Subject" /></div><div className="grid gap-3 sm:grid-cols-3"><Input value={form.count} onChange={(event) => update('count', event.target.value)} placeholder="Count" /><Input value={form.totalMarks} onChange={(event) => update('totalMarks', event.target.value)} placeholder="Marks" /><Input value={form.duration} onChange={(event) => update('duration', event.target.value)} placeholder="Duration" /></div><textarea className="min-h-28 w-full rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" value={form.syllabus} onChange={(event) => update('syllabus', event.target.value)} placeholder="Syllabus / chapter / topic" /><div className="grid gap-3 sm:grid-cols-2"><Input value={roll} onChange={(event) => setRoll(event.target.value)} placeholder="Roll number" /><Input value={registration} onChange={(event) => setRegistration(event.target.value)} placeholder="Registration number" /></div><div className="grid gap-2 sm:grid-cols-2"><Button onClick={generate} disabled={generating}>{generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}Generate</Button><Button variant="outline" onClick={() => saveSet(false)} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save</Button></div><div className="grid gap-2 sm:grid-cols-2"><Button variant="outline" onClick={publishSet}><Send className="mr-2 h-4 w-4" />Publish</Button><Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print A4</Button></div></CardContent></Card><div className="print-area space-y-4"><OmrSheet form={form} roll={roll} registration={registration} examTitle={examTitle} questions={questions} /><QuestionPaper form={form} examTitle={examTitle} questions={questions} /><Card className="no-print"><CardHeader><CardTitle className="flex items-center gap-2"><Camera className="h-5 w-5" />Camera / OMR Machine Marking</CardTitle><CardDescription>Camera QR/Barcode scan করবে। OMR machine output CSV/TXT import করলে auto marking হবে।</CardDescription></CardHeader><CardContent className="space-y-4"><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setCameraOpen((value) => !value)}><Camera className="mr-2 h-4 w-4" />{cameraOpen ? 'Hide Camera' : 'Open Camera'}</Button><label className="inline-flex cursor-pointer items-center rounded-md border px-3 py-2 text-sm font-medium"><FileInput className="mr-2 h-4 w-4" />Import OMR CSV/TXT<input type="file" accept=".csv,.txt" className="hidden" onChange={importOmrFile} /></label><Button onClick={markServer} disabled={marking}>{marking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}Auto Mark</Button></div>{cameraOpen && <WebcamScanner enabled onScan={handleCameraScan} />}<textarea className="min-h-28 w-full rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" value={studentAnswers} onChange={(event) => setStudentAnswers(event.target.value)} placeholder="1A 2B 3C 4D ... অথবা OMR machine CSV/TXT output paste/import করুন" /><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Local Score</p><b>{localScore}/{questions.length}</b></div><div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Server Score</p><b>{serverResult ? `${serverResult.score}/${serverResult.total}` : '-'}</b></div><div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Roll</p><b>{roll || '-'}</b></div></div></CardContent></Card></div></div><style jsx global>{`@media print{body{background:white!important}.no-print{display:none!important}.print-area{display:block!important}.omr-sheet,.question-paper{width:297mm;min-height:210mm;box-shadow:none!important;margin:0 auto!important;padding:8mm!important;page-break-after:always}.question-paper{page-break-after:auto}@page{size:A4 landscape;margin:0}}`}</style></div>;
}
