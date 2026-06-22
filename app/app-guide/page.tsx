"use client";

import Link from "next/link";
import { BookOpenCheck, CheckCircle2, CreditCard, GraduationCap, ListChecks, Route, ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { hasRole, normalizeUserRole } from "@/lib/permissions";
import type { UserRole } from "@/types";

type GuideStep = {
  title: string;
  page: string;
  href: string;
  details: string;
  roles: UserRole[];
};

type GuideSection = {
  title: string;
  description: string;
  icon: typeof Route;
  roles: UserRole[];
  steps: GuideStep[];
};

const allSchool: UserRole[] = ["head", "assistant_head", "class_teacher", "subject_teacher", "teacher", "finance_officer", "staff", "student", "parent", "committee_member"];
const leaders: UserRole[] = ["head", "assistant_head"];
const academicStaff: UserRole[] = ["head", "assistant_head", "class_teacher", "subject_teacher", "teacher"];
const attendanceStaff: UserRole[] = ["head", "assistant_head", "class_teacher"];
const financeStaff: UserRole[] = ["head", "assistant_head", "finance_officer", "class_teacher"];
const studentParent: UserRole[] = ["student", "parent"];

const sections: GuideSection[] = [
  {
    title: "প্রথম সেটআপ: স্কুল চালুর ভিত্তি",
    description: "নতুন প্রতিষ্ঠান চালু করার পর আগে যেগুলো তৈরি করতে হয়।",
    icon: ShieldCheck,
    roles: leaders,
    steps: [
      { title: "প্রতিষ্ঠানের তথ্য ঠিক করুন", page: "Institution > Profile", href: "/institution/profile", details: "স্কুলের নাম, ঠিকানা, লোগো, ফোন, ইমেইল ও ওয়েবসাইট সেট করুন। এগুলো ID card, receipt, report card-এ ব্যবহার হয়।", roles: leaders },
      { title: "সাবস্ক্রিপশন ও প্যাকেজ চালু রাখুন", page: "Billing & Subscription", href: "/billing", details: "Student limit, management package, regular SMS package এবং attendance SMS package এখান থেকে দেখা/পরিবর্তন করা হয়।", roles: ["head"] },
      { title: "সাপ্তাহিক ছুটি ও বিশেষ বন্ধ দিন ঠিক করুন", page: "Holidays", href: "/holidays", details: "Default Friday + Saturday থাকবে। প্রয়োজন হলে প্রতিষ্ঠানের জন্য নিজস্ব weekly off এবং বিশেষ holiday সেট করুন।", roles: leaders },
      { title: "Role permission যাচাই করুন", page: "Users & Roles > Roles & Permissions", href: "/users-roles/permissions", details: "কে কোন menu/page দেখতে পারবে সেটা role অনুযায়ী এখানে নিয়ন্ত্রণ করা যায়।", roles: ["head"] },
    ],
  },
  {
    title: "Academic সেটআপ: ক্লাস থেকে রুটিন",
    description: "ক্লাস, সেকশন, সাবজেক্ট তৈরি করে পড়াশোনার কাঠামো বানানোর flow।",
    icon: BookOpenCheck,
    roles: academicStaff,
    steps: [
      { title: "প্রথমে ক্লাস তৈরি করুন", page: "Academic > Classes", href: "/academic/classes", details: "Class 1, Class 2, Class 5 ইত্যাদি এখানে তৈরি হবে। ক্লাস না থাকলে ভর্তি, attendance, result ঠিকভাবে চলবে না।", roles: leaders },
      { title: "তারপর সেকশন তৈরি করুন", page: "Academic > Sections", href: "/academic/sections", details: "প্রতিটি ক্লাসে A/B বা Morning/Day সেকশন থাকলে এখানে তৈরি করুন। সেকশন না থাকলে All Sections দিয়েও কাজ করা যাবে।", roles: leaders },
      { title: "সাবজেক্ট তৈরি ও ক্লাসে যুক্ত করুন", page: "Academic > Subjects", href: "/academic/subjects", details: "প্রতিটি ক্লাসের বাংলা, ইংরেজি, গণিত ইত্যাদি subject তৈরি করুন। Result ও question bank এই subject ব্যবহার করে।", roles: leaders },
      { title: "Syllabus দিন", page: "Academic > Syllabus", href: "/academic/syllabus", details: "শিক্ষক, ছাত্র ও অভিভাবক সিলেবাস দেখতে পারবে।", roles: academicStaff.concat(studentParent) },
      { title: "Class routine তৈরি করুন", page: "Academic > Class Routine", href: "/academic/class-routine", details: "কোন ক্লাসে কোন সময়ে কোন subject হবে সেটা সেট করুন।", roles: academicStaff.concat(studentParent) },
      { title: "Exam routine ও exam তৈরি করুন", page: "Academic > Exam Routine / Exams", href: "/academic/exams", details: "পরীক্ষার নাম, সময়সূচি, subject-wise setup এখান থেকে হবে।", roles: academicStaff.concat(studentParent) },
    ],
  },
  {
    title: "ভর্তি ও মানুষ যুক্ত করা",
    description: "Student, teacher, staff এবং account তৈরি করার ধারাবাহিকতা।",
    icon: GraduationCap,
    roles: leaders.concat(["class_teacher", "subject_teacher", "teacher"]),
    steps: [
      { title: "Student admission করুন", page: "Institution > Admission", href: "/institution/admission", details: "ক্লাস/সেকশন আগে তৈরি থাকলে ভর্তি করার সময় student কে সঠিক জায়গায় বসানো যাবে। Auto parent account ও ID card চাইলে এখানেই তৈরি হবে।", roles: leaders },
      { title: "Pending admission approve/reject করুন", page: "Institution > Pending Admissions", href: "/institution/pending-admissions", details: "Public admission আবেদন এলে teacher/head review করে accept বা reject করতে পারবে।", roles: ["head", "assistant_head", "class_teacher", "subject_teacher", "teacher"] },
      { title: "Student list যাচাই করুন", page: "Institution > Students", href: "/institution/students", details: "Student তথ্য, roll, class, section ঠিক আছে কিনা দেখে নিন।", roles: ["head", "assistant_head", "class_teacher"] },
      { title: "Teacher যুক্ত করুন", page: "Institution > Teachers", href: "/institution/teachers", details: "Teacher profile, subject/class assignment এবং class teacher setup করুন।", roles: leaders },
      { title: "Staff যুক্ত করুন", page: "Institution > Staff", href: "/institution/staff", details: "Office staff, librarian, finance officer ইত্যাদি যুক্ত করুন।", roles: leaders },
      { title: "User role ঠিক করুন", page: "Users & Roles > All Users", href: "/users-roles/all", details: "ভুল role হলে menu access ভুল হবে, তাই account তৈরি হলে role যাচাই করুন।", roles: ["head"] },
    ],
  },
  {
    title: "Daily attendance flow",
    description: "প্রতিদিন present/absent mark, SMS এবং report দেখার কাজ।",
    icon: CheckCircle2,
    roles: attendanceStaff.concat(studentParent),
    steps: [
      { title: "Holiday check করুন", page: "Holidays", href: "/holidays", details: "যদি দিনটি বন্ধ থাকে attendance mark disabled থাকবে।", roles: attendanceStaff },
      { title: "Class attendance দিন", page: "Attendance > Mark Attendance", href: "/attendance/mark", details: "প্রেজেন্ট/এবসেন্ট বাটনে চাপ দিলেই auto save হবে। Save button আলাদা দরকার নেই।", roles: attendanceStaff },
      { title: "Scanner দিয়ে all present করুন", page: "Attendance > All Present Scanner", href: "/attendance/all-present", details: "ID card/QR/barcode scan করলে student present হবে।", roles: attendanceStaff },
      { title: "প্রয়োজনে Present SMS পাঠান", page: "Attendance > Present SMS", href: "/attendance/present-sms", details: "Daily/weekly attendance SMS package অনুযায়ী guardian number-এ SMS যাবে।", roles: attendanceStaff },
      { title: "Attendance report দেখুন", page: "Attendance > Reports", href: "/attendance/reports", details: "Class/date/student filter করে attendance summary দেখুন।", roles: attendanceStaff },
      { title: "নিজের attendance দেখুন", page: "Attendance > My Attendance", href: "/attendance/my-attendance", details: "Student, parent, teacher, staff নিজের বা সন্তানের attendance দেখতে পারবে।", roles: attendanceStaff.concat(studentParent) },
    ],
  },
  {
    title: "Result ও promotion flow",
    description: "Exam শেষে result entry, report card এবং next class promotion।",
    icon: ListChecks,
    roles: academicStaff.concat(studentParent),
    steps: [
      { title: "Exam setup complete করুন", page: "Academic > Exams", href: "/academic/exams", details: "Exam এবং subject setup না থাকলে result entry ঠিকভাবে হবে না।", roles: academicStaff },
      { title: "Result entry/update করুন", page: "Academic > Results", href: "/academic/results", details: "Teacher বা class teacher subject/class অনুযায়ী marks input করবে।", roles: academicStaff },
      { title: "Report card দেখুন/প্রিন্ট করুন", page: "Academic > Report Card", href: "/academic/report-card", details: "Result final হলে student/parent report card দেখতে পারবে।", roles: ["head", "assistant_head", "class_teacher", "student", "parent"] },
      { title: "Final promotion দিন", page: "Academic > Final Promotion", href: "/academic/promotions", details: "Final result দেখে student কে পরের class-এ উত্তীর্ণ করুন। Promotion দেওয়ার আগে class/section target ঠিক আছে কিনা দেখুন।", roles: ["head", "assistant_head", "class_teacher"] },
    ],
  },
  {
    title: "Finance ও টাকা-পয়সার কাজ",
    description: "Fee setup, collection, salary, reports এবং student/parent fee view।",
    icon: CreditCard,
    roles: financeStaff.concat(studentParent),
    steps: [
      { title: "Fee list/setup দেখুন", page: "Finance > Fees", href: "/finance/fees", details: "কোন fee কোন student/class-এর জন্য due আছে সেটা দেখুন।", roles: ["head", "assistant_head", "finance_officer"] },
      { title: "Fee collect করুন", page: "Finance > Fees Collect", href: "/finance/fee-collect", details: "Student select করে টাকা গ্রহণ করুন। Receipt/collection history finance report-এ যাবে।", roles: financeStaff },
      { title: "Collection history দেখুন", page: "Finance > Collections", href: "/finance/collections", details: "কোন দিনে কত টাকা collect হয়েছে সেটা দেখা যায়।", roles: financeStaff },
      { title: "Salary manage করুন", page: "Finance > Salary", href: "/finance/salary", details: "Teacher/staff salary entry ও payment tracking করুন।", roles: ["head", "finance_officer"] },
      { title: "Finance reports দেখুন", page: "Finance > Reports", href: "/finance/reports", details: "Fee, salary, due, collection summary এক জায়গায় দেখুন।", roles: ["head", "assistant_head", "finance_officer"] },
      { title: "নিজের fee দেখুন", page: "Finance > My Fees", href: "/finance/my-fees", details: "Student/parent নিজের বা সন্তানের fee status দেখতে পারবে।", roles: studentParent },
    ],
  },
  {
    title: "Communication, documents ও daily school work",
    description: "Notice, homework, documents, leave, ID card, library workflow।",
    icon: Route,
    roles: allSchool,
    steps: [
      { title: "Notice publish/view করুন", page: "Notice Board", href: "/notices", details: "School notice সবাই role অনুযায়ী দেখতে পারবে।", roles: allSchool },
      { title: "Homework দিন/দেখুন", page: "Homework", href: "/homework", details: "Teacher homework দিলে student/parent দেখতে পারবে।", roles: ["head", "assistant_head", "class_teacher", "subject_teacher", "teacher", "student", "parent"] },
      { title: "Leave apply/review করুন", page: "Leave Application", href: "/leave-application", details: "Student/employee leave apply করবে, head/assistant/class teacher review করবে।", roles: ["head", "assistant_head", "class_teacher", "subject_teacher", "teacher", "staff", "finance_officer", "student", "parent"] },
      { title: "ID card generate বা নিজের card দেখুন", page: "ID Card", href: "/id-cards", details: "Head/assistant card generate করবে; user নিজের card My ID Card থেকে দেখবে।", roles: allSchool },
      { title: "Documents upload/manage/view", page: "Documents", href: "/documents", details: "Memo, admit card, uploaded document role অনুযায়ী দেখা বা manage করা যায়।", roles: ["head", "assistant_head", "finance_officer", "staff", "student", "parent"] },
      { title: "Library manage/view", page: "Library", href: "/library", details: "Book list, loans এবং library usage role অনুযায়ী manage বা view করা যায়।", roles: ["head", "assistant_head", "class_teacher", "subject_teacher", "teacher", "staff", "student", "parent"] },
    ],
  },
];

const visibleSteps = (user: any, steps: GuideStep[]) => steps.filter((step) => hasRole(user, step.roles));

export default function AppGuidePage() {
  const { user, isLoading } = useAuth();
  const role = normalizeUserRole(user?.role) || user?.role || "guest";
  const visibleSections = sections
    .map((section) => ({ ...section, steps: visibleSteps(user, section.steps) }))
    .filter((section) => section.steps.length > 0 && hasRole(user, section.roles));

  return (
    <div className="space-y-5 p-4 md:p-6">
      <PageHeader
        title="App Guide"
        description="কোন পেজে আগে কী করতে হবে, তারপর কী করতে হবে, এবং role অনুযায়ী কে কোন workflow দেখতে পারবে।"
        icon={Route}
        status={<Badge variant="outline" className="capitalize">{String(role).replace(/_/g, " ")}</Badge>}
      />

      {isLoading ? (
        <Card><CardContent className="p-8 text-sm text-muted-foreground">Guide loading...</CardContent></Card>
      ) : visibleSections.length === 0 ? (
        <Card><CardContent className="p-8 text-sm text-muted-foreground">এই role-এর জন্য কোনো guide পাওয়া যায়নি।</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {visibleSections.map((section) => {
            const Icon = section.icon;
            return (
              <Card key={section.title} className="overflow-hidden">
                <CardHeader className="border-b bg-muted/30">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{section.title}</CardTitle>
                      <CardDescription className="mt-1">{section.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {section.steps.map((step, index) => (
                      <div key={`${section.title}-${step.href}-${index}`} className="grid gap-3 p-4 md:grid-cols-[48px_1fr_auto] md:items-start">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full border bg-background text-sm font-bold">{index + 1}</div>
                        <div className="space-y-1">
                          <div className="font-semibold">{step.title}</div>
                          <div className="text-sm text-muted-foreground">{step.details}</div>
                          <div className="text-xs font-medium text-primary">{step.page}</div>
                        </div>
                        <Button asChild variant="outline" size="sm">
                          <Link href={step.href}>Open</Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
