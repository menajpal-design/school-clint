'use client';

import { useMemo, useState } from 'react';
import { BookOpenCheck, Copy, Database, Download, Loader2, Save, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api';

type QuestionItem = { type?: string; question: string; options?: string[]; answer?: string; marks?: number };

const toast = (title: string, message: string, type: 'success' | 'error' | 'info' = 'success') => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('app-toast', { detail: { title, message, type, duration: 4500 } }));
};

const localQuestions = (count: number, subject: string, syllabus: string): QuestionItem[] => Array.from({ length: Math.max(1, Math.min(100, count || 20)) }).map((_, index) => ({
  type: index % 5 === 0 ? 'short' : 'mcq',
  question: `${index + 1}. ${subject || 'Subject'} - ${syllabus || 'সিলেবাস'} থেকে প্রশ্ন তৈরি করুন।`,
  options: index % 5 === 0 ? [] : ['A) Option 1', 'B) Option 2', 'C) Option 3', 'D) Option 4'],
  answer: index % 5 === 0 ? '' : 'A',
  marks: index % 5 === 0 ? 5 : 1,
}));

export default function AiManagePage() {
  const [form, setForm] = useState({ title: 'AI Generated Question Set', className: 'Class 10', subjectName: 'Science', syllabus: '', mode: 'question', count: '20', totalMarks: '50', duration: '1 hour', language: 'Bangla' });
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const update = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const totalMarks = useMemo(() => questions.reduce((sum, item) => sum + Number(item.marks || 0), 0), [questions]);
  const mcqCount = useMemo(() => questions.filter((item) => item.type === 'mcq' || item.options?.length).length, [questions]);
  const text = useMemo(() => questions.map((item, index) => `${index + 1}. ${item.question}\n${(item.options || []).join('\n')}\n${item.answer ? `Answer: ${item.answer}` : ''}\nMarks: ${item.marks || 1}`).join('\n\n'), [questions]);

  const generate = async () => {
    setLoading(true);
    try {
      const data: any = await apiClient.post('/question-bank/generate', { ...form, subject: form.subjectName, count: Number(form.count), mode: form.mode });
      const next = Array.isArray(data?.questions) && data.questions.length ? data.questions : localQuestions(Number(form.count), form.subjectName, form.syllabus);
      setQuestions(next);
      toast('Questions generated', `${next.length} questions ready.`, 'success');
    } catch (error: any) {
      const next = localQuestions(Number(form.count), form.subjectName, form.syllabus);
      setQuestions(next);
      toast('Server fallback used', error?.message || 'Generated locally because server failed.', 'info');
    } finally {
      setLoading(false);
    }
  };

  const saveSet = async () => {
    if (!questions.length) return;
    setSaving(true);
    try {
      await apiClient.post('/question-bank/sets', { ...form, subject: form.subjectName, mode: 'question', totalMarks: Number(form.totalMarks || totalMarks), questions });
      toast('Saved', 'Question set saved to server.', 'success');
    } catch (error: any) {
      toast('Save failed', error?.message || 'Could not save question set.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="rounded-2xl border bg-gradient-to-r from-indigo-50 via-white to-emerald-50 p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div><h1 className="text-3xl font-bold tracking-tight">AI Manage</h1><p className="text-sm text-muted-foreground">Gemini 2.5 Flash/server generator দিয়ে class-wise syllabus অনুযায়ী professional question set তৈরি করুন।</p></div>
          <div className="flex flex-wrap gap-2"><Badge>Teacher</Badge><Badge>Head</Badge><Badge>Assistant Head</Badge></div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" />Question Setup</CardTitle><CardDescription>Class, subject, syllabus ও question format দিন।</CardDescription></CardHeader><CardContent className="space-y-3">
          <Input value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="Question set title" />
          <div className="grid gap-3 sm:grid-cols-2"><Input value={form.className} onChange={(e) => update('className', e.target.value)} placeholder="Class" /><Input value={form.subjectName} onChange={(e) => update('subjectName', e.target.value)} placeholder="Subject" /></div>
          <div className="grid gap-3 sm:grid-cols-3"><Input value={form.count} onChange={(e) => update('count', e.target.value)} placeholder="Count" /><Input value={form.totalMarks} onChange={(e) => update('totalMarks', e.target.value)} placeholder="Total marks" /><Input value={form.duration} onChange={(e) => update('duration', e.target.value)} placeholder="Duration" /></div>
          <Input value={form.language} onChange={(e) => update('language', e.target.value)} placeholder="Language" />
          <textarea className="min-h-36 w-full rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" value={form.syllabus} onChange={(e) => update('syllabus', e.target.value)} placeholder="Paste syllabus, chapter, learning outcome or topic here" />
          <div className="grid gap-2 sm:grid-cols-2"><Button onClick={generate} disabled={loading}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BookOpenCheck className="mr-2 h-4 w-4" />}Generate</Button><Button variant="outline" onClick={saveSet} disabled={saving || !questions.length}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save to Server</Button></div>
        </CardContent></Card>

        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3"><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Questions</p><p className="text-2xl font-bold">{questions.length}</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">MCQ</p><p className="text-2xl font-bold">{mcqCount}</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Marks</p><p className="text-2xl font-bold">{totalMarks || form.totalMarks}</p></CardContent></Card></div>
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" />Generated Output</CardTitle><CardDescription>Review, copy, download, then save to server.</CardDescription></CardHeader><CardContent className="space-y-3">
            {!questions.length ? <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">Generate চাপলে question preview এখানে দেখাবে।</p> : <div className="max-h-[620px] space-y-3 overflow-auto rounded-lg border bg-muted/30 p-3">{questions.map((item, index) => <div key={index} className="rounded-lg bg-background p-3 shadow-sm"><p className="font-medium">{index + 1}. {item.question}</p>{Boolean(item.options?.length) && <div className="mt-2 grid gap-1 text-sm sm:grid-cols-2">{item.options?.map((option) => <span key={option}>{option}</span>)}</div>}<div className="mt-2 flex gap-2 text-xs"><Badge variant="secondary">{item.type || 'mcq'}</Badge><Badge variant="outline">Marks {item.marks || 1}</Badge>{item.answer && <Badge>Ans {item.answer}</Badge>}</div></div>)}</div>}
            {questions.length > 0 && <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => navigator.clipboard.writeText(text)}><Copy className="mr-2 h-4 w-4" />Copy</Button><Button variant="outline" onClick={() => { const blob = new Blob([text], { type: 'text/plain' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'ai-question-set.txt'; a.click(); }}><Download className="mr-2 h-4 w-4" />Download</Button></div>}
          </CardContent></Card>
        </div>
      </div>
    </div>
  );
}
