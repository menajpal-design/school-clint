import Link from 'next/link';
import { BookOpenCheck, BrainCircuit, ClipboardList, Database, PenLine } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const items = [
  { title: 'Question Generate', href: '/question-bank/question-generate', storage: '/question-bank/question-generate/storage', icon: PenLine, desc: 'Syllabus অনুযায়ী general/creative question generate করুন।' },
  { title: 'AI Question Manage', href: '/question-bank/ai-manage', storage: '/question-bank/ai-manage/storage', icon: BrainCircuit, desc: 'Gemini based question generate, review এবং save করুন।' },
  { title: 'MCQ Manage', href: '/question-bank/mcq-manage', storage: '/question-bank/mcq-manage/storage', icon: ClipboardList, desc: 'MCQ create, OMR sheet print, camera/OMR marking করুন।' },
  { title: 'MCQ Practice', href: '/question-bank/mcq-practice', storage: '/question-bank/mcq-practice/storage', icon: BookOpenCheck, desc: 'Published MCQ student practice route।' },
];

export default function QuestionBankPage() {
  return <div className="space-y-6 p-4 md:p-6"><div className="rounded-2xl border bg-gradient-to-r from-indigo-50 via-white to-emerald-50 p-6 shadow-sm"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><h1 className="text-3xl font-bold tracking-tight">Question Bank</h1><p className="text-sm text-muted-foreground">Question Generate, AI Manage, MCQ Manage এবং MCQ Practice সব route এক parent menu-এর নিচে।</p></div><Badge>Secure Academic Module</Badge></div></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{items.map((item) => { const Icon = item.icon; return <Card key={item.href} className="transition hover:shadow-md"><CardHeader><CardTitle className="flex items-center gap-2"><Icon className="h-5 w-5" />{item.title}</CardTitle><CardDescription>{item.desc}</CardDescription></CardHeader><CardContent className="space-y-2"><Link href={item.href} className="block rounded-md bg-primary px-3 py-2 text-center text-sm font-semibold text-primary-foreground">Open</Link><Link href={item.storage} className="flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold"><Database className="h-4 w-4" />Storage / Verify</Link></CardContent></Card>; })}</div></div>;
}
