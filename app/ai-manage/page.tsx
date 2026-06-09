'use client';

import { useMemo, useState } from 'react';
import { BookOpenCheck, Copy, Download, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const makeMcqs = (count: number, subject: string, syllabus: string) => Array.from({ length: count }).map((_, i) => ({
  q: `${i + 1}. ${subject || 'Subject'} - ${syllabus || 'সিলেবাস'} থেকে MCQ প্রশ্ন?`,
  a: 'A) সঠিক উত্তর', b: 'B) অপশন ২', c: 'C) অপশন ৩', d: 'D) অপশন ৪', ans: 'A'
}));

export default function AiManagePage() {
  const [form, setForm] = useState({ className: 'Class 10', subject: 'Science', syllabus: '', type: 'Mixed', count: '20', totalMarks: '50', duration: '1 hour' });
  const [generated, setGenerated] = useState<any | null>(null);
  const mcqs = useMemo(() => makeMcqs(Number(form.count) || 20, form.subject, form.syllabus), [form]);
  const update = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const generate = () => setGenerated({ ...form, mcqs, creative: [`১. ${form.subject} এর ${form.syllabus || 'প্রদত্ত অধ্যায়'} ব্যাখ্যা কর।`, `২. উদাহরণসহ ${form.subject} এর গুরুত্বপূর্ণ ধারণা লিখ।`] });
  const text = generated ? `${generated.className} - ${generated.subject}\nSyllabus: ${generated.syllabus}\nMarks: ${generated.totalMarks}\nDuration: ${generated.duration}\n\nCreative Questions:\n${generated.creative.join('\n')}\n\nMCQ:\n${generated.mcqs.map((m: any) => `${m.q}\n${m.a}\n${m.b}\n${m.c}\n${m.d}\nAnswer: ${m.ans}`).join('\n\n')}` : '';
  return <div className="space-y-6 p-4 md:p-6">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><h1 className="text-3xl font-bold tracking-tight">AI Manage - Question Generator</h1><p className="text-sm text-muted-foreground">Gemini 2.5 Flash style prompt দিয়ে class/subject/syllabus অনুযায়ী প্রশ্ন তৈরি করার পেজ।</p></div><Badge>Teacher / Head / Assistant only</Badge></div>
    <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" />Generate Setup</CardTitle><CardDescription>Class-wise syllabus অনুযায়ী question set বানান।</CardDescription></CardHeader><CardContent className="space-y-3">
        <Input value={form.className} onChange={(e) => update('className', e.target.value)} placeholder="Class name" />
        <Input value={form.subject} onChange={(e) => update('subject', e.target.value)} placeholder="Subject" />
        <Input value={form.type} onChange={(e) => update('type', e.target.value)} placeholder="Question type: MCQ/Creative/Mixed" />
        <Input value={form.count} onChange={(e) => update('count', e.target.value)} placeholder="MCQ count" />
        <Input value={form.totalMarks} onChange={(e) => update('totalMarks', e.target.value)} placeholder="Total marks" />
        <Input value={form.duration} onChange={(e) => update('duration', e.target.value)} placeholder="Duration" />
        <textarea className="min-h-32 w-full rounded-md border p-3 text-sm" value={form.syllabus} onChange={(e) => update('syllabus', e.target.value)} placeholder="Paste syllabus/chapter/topic here" />
        <Button className="w-full" onClick={generate}><BookOpenCheck className="mr-2 h-4 w-4" />Generate Questions</Button>
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Generated Question</CardTitle><CardDescription>Gemini API connect করলে এখানেই AI output দেখাবে। এখন safe fallback generator দেওয়া হয়েছে।</CardDescription></CardHeader><CardContent className="space-y-3">
        {!generated ? <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">Generate চাপুন।</p> : <pre className="max-h-[620px] overflow-auto rounded-lg bg-muted p-4 text-sm whitespace-pre-wrap">{text}</pre>}
        {generated && <div className="flex gap-2"><Button variant="outline" onClick={() => navigator.clipboard.writeText(text)}><Copy className="mr-2 h-4 w-4" />Copy</Button><Button variant="outline" onClick={() => { const blob = new Blob([text], { type: 'text/plain' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'ai-question.txt'; a.click(); }}><Download className="mr-2 h-4 w-4" />Download</Button></div>}
      </CardContent></Card>
    </div>
  </div>;
}
