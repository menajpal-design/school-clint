'use client';

import { useEffect, useMemo, useState } from 'react';
import { BookOpenCheck, CheckCircle2, Loader2, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api';

type Question = { id?: number; question: string; options?: string[]; answer?: string; marks?: number };
type PracticeSet = { _id?: string; title: string; className?: string; subjectName?: string; duration?: string; questions: Question[] };

const letters = ['A', 'B', 'C', 'D'];
const sample: PracticeSet = { title: 'Practice MCQ', className: 'Class 10', subjectName: 'Science', duration: '30 minutes', questions: Array.from({ length: 10 }).map((_, i) => ({ question: `Practice question ${i + 1}?`, options: ['Option A', 'Option B', 'Option C', 'Option D'], answer: letters[i % 4], marks: 1 })) };

export default function McqPracticePage() {
  const [sets, setSets] = useState<PracticeSet[]>([]);
  const [active, setActive] = useState<PracticeSet>(sample);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverResult, setServerResult] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data: any = await apiClient.get('/question-bank/practice/me');
        const serverSets = Array.isArray(data?.sets) ? data.sets : [];
        if (serverSets.length) { setSets(serverSets); setActive(serverSets[0]); return; }
      } catch {}
      try {
        const saved = localStorage.getItem('easy_mcq_latest');
        if (saved) setActive(JSON.parse(saved));
      } catch {}
      setLoading(false);
    };
    load().finally(() => setLoading(false));
  }, []);

  const questions = active.questions || [];
  const localScore = useMemo(() => questions.reduce((sum, q, i) => sum + (answers[String(i + 1)] === q.answer ? Number(q.marks || 1) : 0), 0), [answers, questions]);

  const submit = async () => {
    setSubmitted(true);
    if (!active._id) return;
    try {
      const data = await apiClient.post(`/question-bank/sets/${active._id}/mark`, { answers });
      setServerResult(data);
    } catch {}
  };

  const retry = () => { setAnswers({}); setSubmitted(false); setServerResult(null); };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="rounded-2xl border bg-gradient-to-r from-sky-50 via-white to-indigo-50 p-5 shadow-sm"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><h1 className="text-3xl font-bold tracking-tight">MCQ Practice</h1><p className="text-sm text-muted-foreground">Students published class/subject MCQ practice করবে এবং instant score পাবে।</p></div><Badge>{active.className || 'Class'} · {active.subjectName || 'Subject'}</Badge></div></div>
      {sets.length > 1 && <Card><CardHeader><CardTitle>Available Practice Sets</CardTitle><CardDescription>Teacher published MCQ set select করুন।</CardDescription></CardHeader><CardContent><div className="flex flex-wrap gap-2">{sets.map((set) => <Button key={set._id || set.title} variant={(set._id || set.title) === (active._id || active.title) ? 'default' : 'outline'} onClick={() => { setActive(set); retry(); }}>{set.title}</Button>)}</div></CardContent></Card>}
      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><BookOpenCheck className="h-5 w-5" />{active.title}</CardTitle><CardDescription>{active.duration || '30 minutes'} · Select one option for each question.</CardDescription></CardHeader><CardContent className="space-y-4">{loading ? <p className="p-6 text-center text-sm text-muted-foreground"><Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />Loading practice...</p> : questions.map((q, index) => <div key={index} className="rounded-lg border p-4"><p className="font-semibold">{index + 1}. {q.question}</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{(q.options || []).map((op, optionIndex) => { const letter = letters[optionIndex]; const chosen = answers[String(index + 1)] === letter; const correct = submitted && q.answer === letter; const wrong = submitted && chosen && q.answer !== letter; return <button key={`${index}-${letter}`} type="button" disabled={submitted} onClick={() => setAnswers((current) => ({ ...current, [String(index + 1)]: letter }))} className={`rounded-md border p-3 text-left text-sm transition ${correct ? 'border-emerald-500 bg-emerald-50' : wrong ? 'border-rose-500 bg-rose-50' : chosen ? 'border-blue-500 bg-blue-50' : 'hover:bg-muted'}`}>{letter}) {String(op).replace(/^[A-D][).:-]\s*/i, '')}</button>; })}</div>{submitted && <p className="mt-2 text-xs text-muted-foreground">Correct answer: {q.answer || '-'}</p>}</div>)}<div className="flex flex-wrap items-center gap-3"><Button onClick={submit} disabled={submitted || !questions.length}><CheckCircle2 className="mr-2 h-4 w-4" />Submit</Button><Button variant="outline" onClick={retry}><RotateCcw className="mr-2 h-4 w-4" />Retry</Button></div></CardContent></Card>
        <Card><CardHeader><CardTitle>Result Summary</CardTitle><CardDescription>Practice performance</CardDescription></CardHeader><CardContent className="space-y-3"><div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Local Score</p><p className="text-3xl font-bold">{submitted ? localScore : '-'}/{questions.length}</p></div><div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Server Score</p><p className="text-3xl font-bold">{serverResult ? `${serverResult.score}/${serverResult.total}` : '-'}</p></div><div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Answered</p><p className="text-3xl font-bold">{Object.keys(answers).length}/{questions.length}</p></div></CardContent></Card>
      </div>
    </div>
  );
}
