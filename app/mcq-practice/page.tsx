'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const questions = [
  { id: 1, q: 'Question 1?', options: ['A', 'B', 'C', 'D'], correct: 'A' },
  { id: 2, q: 'Question 2?', options: ['A', 'B', 'C', 'D'], correct: 'B' },
  { id: 3, q: 'Question 3?', options: ['A', 'B', 'C', 'D'], correct: 'C' },
];

export default function McqPracticePage() {
  const [selected, setSelected] = useState<Record<number, string>>({});
  const [done, setDone] = useState(false);
  const score = questions.filter((q) => selected[q.id] === q.correct).length;
  return <div className="space-y-6 p-4 md:p-6"><div><h1 className="text-3xl font-bold tracking-tight">MCQ Practice</h1><p className="text-sm text-muted-foreground">Students can practice MCQ here.</p></div><Card><CardHeader><CardTitle>Practice Test</CardTitle><CardDescription>Choose one option and submit.</CardDescription></CardHeader><CardContent className="space-y-4">{questions.map((q) => <div key={q.id} className="rounded-lg border p-4"><p className="font-semibold">{q.id}. {q.q}</p><div className="mt-2 flex flex-wrap gap-2">{q.options.map((op) => <button key={op} type="button" onClick={() => !done && setSelected((cur) => ({ ...cur, [q.id]: op }))} className={`rounded border px-3 py-2 ${selected[q.id] === op ? 'bg-blue-50 border-blue-500' : ''}`}>{op}</button>)}</div>{done && <p className="mt-2 text-sm">Correct: {q.correct}</p>}</div>)}<div className="flex items-center gap-3"><Button onClick={() => setDone(true)}>Submit</Button><Button variant="outline" onClick={() => { setSelected({}); setDone(false); }}>Retry</Button>{done && <b>Score: {score}/{questions.length}</b>}</div></CardContent></Card></div>;
}
