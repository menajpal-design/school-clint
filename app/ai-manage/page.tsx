'use client';

import { useMemo, useState } from 'react';
import { BookOpenCheck, Copy, Database, Download, FileJson, Loader2, Printer, Save, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api';
import { downloadHtmlAsPdf } from '@/lib/export-utils';

type QuestionItem = { type?: string; question: string; options?: string[]; answer?: string; marks?: number };
const toast = (title: string, message: string, type: 'success' | 'error' | 'info' = 'success') => { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('app-toast', { detail: { title, message, type, duration: 4500 } })); };
const cqQuestions = (count: number, subject: string, syllabus: string): QuestionItem[] => Array.from({ length: Math.max(1, Math.min(60, count || 8)) }).map((_, index) => ({ type: 'cq', question: `${index + 1}. ${subject || 'Subject'} - ${syllabus || 'à¦¸à¦¿à¦²à§‡à¦¬à¦¾à¦¸'} à¦¥à§‡à¦•à§‡ à¦à¦•à¦Ÿà¦¿ à¦¸à§ƒà¦œà¦¨à¦¶à§€à¦²/CQ à¦ªà§à¦°à¦¶à§à¦¨ à¦¤à§ˆà¦°à¦¿ à¦•à¦°à§à¦¨à¥¤\nà¦•) à¦œà§à¦žà¦¾à¦¨à¦®à§‚à¦²à¦• à¦ªà§à¦°à¦¶à§à¦¨\nà¦–) à¦…à¦¨à§à¦§à¦¾à¦¬à¦¨à¦®à§‚à¦²à¦• à¦ªà§à¦°à¦¶à§à¦¨\nà¦—) à¦ªà§à¦°à§Ÿà§‹à¦—à¦®à§‚à¦²à¦• à¦ªà§à¦°à¦¶à§à¦¨\nà¦˜) à¦‰à¦šà§à¦šà¦¤à¦° à¦¦à¦•à§à¦·à¦¤à¦¾à¦®à§‚à¦²à¦• à¦ªà§à¦°à¦¶à§à¦¨`, options: [], answer: 'Teacher verification required', marks: 10 }));
const formatQuestionText = (form: any, questions: QuestionItem[]) => [`${form.title}`, `Class: ${form.className}`, `Subject: ${form.subjectName}`, `Time: ${form.duration}`, `Total Marks: ${form.totalMarks}`, `Type: CQ / Creative Question`, '', ...questions.map((item, index) => `${index + 1}. ${String(item.question || '').replace(/^\d+\.\s*/, '')}\nMarks: ${item.marks || 10}\nAnswer/Note: ${item.answer || 'Teacher verification required'}`)].join('\n\n');
const downloadFile = (name: string, content: string, type = 'text/plain') => { const blob = new Blob([content], { type }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url); };

export default function AiManagePage() {
  const [form, setForm] = useState({ title: 'CQ Question Set', className: 'Class 10', subjectName: 'Science', syllabus: '', mode: 'question', count: '8', totalMarks: '80', duration: '2 hours', language: 'Bangla' });
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const update = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const totalMarks = useMemo(() => questions.reduce((sum, item) => sum + Number(item.marks || 0), 0), [questions]);
  const text = useMemo(() => formatQuestionText(form, questions), [form, questions]);

  const generate = async () => {
    setLoading(true);
    try {
      const data: any = await apiClient.post('/question-bank/generate', { ...form, questionType: 'cq', subject: form.subjectName, count: Number(form.count), mode: 'question' });
      const next = Array.isArray(data?.questions) && data.questions.length ? data.questions.map((q: any, index: number) => ({ type: 'cq', question: q.question || q.stem || `${index + 1}. CQ question`, options: [], answer: q.answer || 'Teacher verification required', marks: Number(q.marks || 10) })) : cqQuestions(Number(form.count), form.subjectName, form.syllabus);
      setQuestions(next);
      toast('CQ generated', `${next.length} CQ questions ready.`, 'success');
    } catch (error: any) {
      const next = cqQuestions(Number(form.count), form.subjectName, form.syllabus);
      setQuestions(next);
      toast('Server fallback used', error?.message || 'Generated locally because server failed.', 'info');
    } finally {
      setLoading(false);
    }
  };

  const saveSet = async () => {
    if (!questions.length) return toast('No questions', 'Generate CQ first.', 'info');
    setSaving(true);
    try {
      await apiClient.post('/question-bank/sets', { ...form, questionType: 'cq', subject: form.subjectName, mode: 'question', totalMarks: Number(form.totalMarks || totalMarks), questions });
      toast('Saved', 'CQ question set saved to server storage.', 'success');
    } catch (error: any) {
      toast('Save failed', error?.message || 'Could not save question set.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const printCopy = async () => {
    const body = `<div class="head"><h2>${form.title}</h2><p class="meta">${form.className} · ${form.subjectName} · ${form.duration} · Marks: ${form.totalMarks}</p><b>CQ / Creative Question Paper</b></div>${questions.map((q, i) => `<div class="q"><b>${i + 1}. ${String(q.question || '').replace(/^\d+\.\s*/, '')}</b><br/><br/>Marks: ${q.marks || 10}<br/>Note: ${q.answer || 'Teacher verification required'}</div>`).join('')}`;
    await downloadHtmlAsPdf(form.title || 'CQ Question Paper', body, `.head{text-align:center;margin-bottom:18px}.q{border:1px solid #ddd;padding:10px;margin:10px 0;break-inside:avoid;white-space:pre-wrap}.meta{font-size:13px}`);
  };

  return <div className="space-y-6 p-4 md:p-6"><div className="rounded-2xl border bg-gradient-to-r from-indigo-50 via-white to-emerald-50 p-5 shadow-sm"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><h1 className="text-3xl font-bold tracking-tight">CQ Question Manage</h1><p className="text-sm text-muted-foreground">Gemini/server generator à¦¦à¦¿à§Ÿà§‡ class-wise syllabus à¦…à¦¨à§à¦¯à¦¾à§Ÿà§€ CQ/Creative question set à¦¤à§ˆà¦°à¦¿, save, print à¦“ download à¦•à¦°à§à¦¨à¥¤</p></div><div className="flex flex-wrap gap-2"><Badge>Teacher</Badge><Badge>Head</Badge><Badge>CQ</Badge></div></div></div><div className="grid gap-4 xl:grid-cols-[420px_1fr]"><Card><CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" />CQ Setup</CardTitle><CardDescription>Class, subject, syllabus à¦“ CQ count à¦¦à¦¿à¦¨à¥¤</CardDescription></CardHeader><CardContent className="space-y-3"><Input value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="Question set title" /><div className="grid gap-3 sm:grid-cols-2"><Input value={form.className} onChange={(e) => update('className', e.target.value)} placeholder="Class" /><Input value={form.subjectName} onChange={(e) => update('subjectName', e.target.value)} placeholder="Subject" /></div><div className="grid gap-3 sm:grid-cols-3"><Input value={form.count} onChange={(e) => update('count', e.target.value)} placeholder="CQ Count" /><Input value={form.totalMarks} onChange={(e) => update('totalMarks', e.target.value)} placeholder="Total marks" /><Input value={form.duration} onChange={(e) => update('duration', e.target.value)} placeholder="Duration" /></div><Input value={form.language} onChange={(e) => update('language', e.target.value)} placeholder="Language" /><textarea className="min-h-36 w-full rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" value={form.syllabus} onChange={(e) => update('syllabus', e.target.value)} placeholder="Syllabus / chapter / learning outcome / topic" /><div className="grid gap-2 sm:grid-cols-2"><Button onClick={generate} disabled={loading}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BookOpenCheck className="mr-2 h-4 w-4" />}Generate CQ</Button><Button variant="outline" onClick={saveSet} disabled={saving || !questions.length}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save to Server</Button></div></CardContent></Card><div className="space-y-4"><div className="grid gap-3 md:grid-cols-3"><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">CQ Questions</p><p className="text-2xl font-bold">{questions.length}</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Type</p><p className="text-2xl font-bold">CQ</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Marks</p><p className="text-2xl font-bold">{totalMarks || form.totalMarks}</p></CardContent></Card></div><Card><CardHeader><CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" />Generated CQ Output</CardTitle><CardDescription>Review, copy, download, print, à¦¤à¦¾à¦°à¦ªà¦° server storage-à¦ save à¦•à¦°à§à¦¨à¥¤</CardDescription></CardHeader><CardContent className="space-y-3">{!questions.length ? <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">Generate CQ à¦šà¦¾à¦ªà¦²à§‡ preview à¦à¦–à¦¾à¦¨à§‡ à¦¦à§‡à¦–à¦¾à¦¬à§‡à¥¤</p> : <div className="max-h-[620px] space-y-3 overflow-auto rounded-lg border bg-muted/30 p-3">{questions.map((item, index) => <div key={index} className="rounded-lg bg-background p-3 shadow-sm"><p className="whitespace-pre-wrap font-medium">{index + 1}. {String(item.question || '').replace(/^\d+\.\s*/, '')}</p><div className="mt-2 flex gap-2 text-xs"><Badge variant="secondary">CQ</Badge><Badge variant="outline">Marks {item.marks || 10}</Badge>{item.answer && <Badge>{item.answer}</Badge>}</div></div>)}</div>}{questions.length > 0 && <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => navigator.clipboard.writeText(text)}><Copy className="mr-2 h-4 w-4" />Copy</Button><Button variant="outline" onClick={() => downloadFile('cq-question-set.txt', text)}><Download className="mr-2 h-4 w-4" />Download TXT</Button><Button variant="outline" onClick={() => downloadFile('cq-question-set.json', JSON.stringify({ ...form, questions }, null, 2), 'application/json')}><FileJson className="mr-2 h-4 w-4" />Download JSON</Button><Button variant="outline" onClick={printCopy}><Printer className="mr-2 h-4 w-4" />Print</Button></div>}</CardContent></Card></div></div></div>;
}
