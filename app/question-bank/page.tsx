"use client";

import Link from 'next/link';
import { BookOpenCheck, BrainCircuit, ClipboardList, Database, PenLine, Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { isFreeLifetimePlan } from '@/lib/permissions';
import { cn } from '@/lib/utils';

const items = [
  { title: 'Question Generate', href: '/question-bank/question-generate', storage: '/question-bank/question-generate/storage', icon: PenLine, desc: 'Syllabus অনুযায়ী general/creative question generate করুন।' },
  { title: 'AI Question Manage', href: '/question-bank/ai-manage', storage: '/question-bank/ai-manage/storage', icon: BrainCircuit, desc: 'Gemini based question generate, review এবং save করুন।' },
  { title: 'MCQ Manage', href: '/question-bank/mcq-manage', storage: '/question-bank/mcq-manage/storage', icon: ClipboardList, desc: 'MCQ create, OMR sheet print, camera/OMR marking করুন।' },
  { title: 'MCQ Practice', href: '/question-bank/mcq-practice', storage: '/question-bank/mcq-practice/storage', icon: BookOpenCheck, desc: 'Published MCQ student practice route।' },
];

export default function QuestionBankPage() {
  const { user } = useAuth();
  const isFree = isFreeLifetimePlan(user);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="rounded-2xl border bg-gradient-to-r from-indigo-50 via-white to-emerald-50 p-6 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Question Bank</h1>
            <p className="text-sm text-muted-foreground">
              Question Generate, AI Manage, MCQ Manage এবং MCQ Practice সব route এক parent menu-এর নিচে।
            </p>
          </div>
          <Badge>Secure Academic Module</Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          const isLocked = isFree && (item.href.includes('question-generate') || item.href.includes('ai-manage'));

          return (
            <Card 
              key={item.href} 
              className={cn(
                "transition shadow-sm relative overflow-hidden", 
                isLocked ? "border-amber-200 bg-amber-50/10" : "hover:shadow-md"
              )}
            >
              {isLocked && (
                <div className="absolute top-2 right-2 rounded-full bg-amber-100 p-1 text-amber-700">
                  <Lock className="h-3.5 w-3.5" />
                </div>
              )}
              <CardHeader className={cn(isLocked && "blur-[0.8px] opacity-60")}>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  {item.title}
                </CardTitle>
                <CardDescription>{item.desc}</CardDescription>
              </CardHeader>
              <CardContent className={cn("space-y-2", isLocked && "blur-[0.8px] opacity-60")}>
                {isLocked ? (
                  <>
                    <Link 
                      href="/billing" 
                      className="block rounded-md bg-amber-600 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-amber-750 transition-colors"
                    >
                      Upgrade Plan
                    </Link>
                    <div className="text-[11px] text-center font-medium text-amber-700">
                      Free Lifetime প্ল্যানে এই ফিচারটি লকড
                    </div>
                  </>
                ) : (
                  <>
                    <Link 
                      href={item.href} 
                      className="block rounded-md bg-primary px-3 py-2 text-center text-sm font-semibold text-primary-foreground"
                    >
                      Open
                    </Link>
                    <Link 
                      href={item.storage} 
                      className="flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold"
                    >
                      <Database className="h-4 w-4" />
                      Storage / Verify
                    </Link>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
