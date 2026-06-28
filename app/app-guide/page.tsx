"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  BookOpenCheck,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  FileText,
  GraduationCap,
  LifeBuoy,
  ListChecks,
  MessageSquare,
  Route,
  Search,
  Settings2,
  ShieldCheck,
} from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { hasRole, normalizeUserRole } from "@/lib/permissions";
import type { User, UserRole } from "@/types";

type GuideStep = {
  title: string;
  page: string;
  href: string;
  goal: string;
  details: string;
  checklist: string[];
  outcome: string;
  warning?: string;
  roles: UserRole[];
};

type GuideSection = {
  id: string;
  title: string;
  phase: string;
  description: string;
  icon: typeof Route;
  roles: UserRole[];
  steps: GuideStep[];
};

type RolePath = {
  title: string;
  roles: UserRole[];
  description: string;
  items: string[];
};

const allSchool: UserRole[] = [
  "admin",
  "super_admin",
  "head",
  "assistant_head",
  "class_teacher",
  "subject_teacher",
  "teacher",
  "finance_officer",
  "librarian",
  "staff",
  "student",
  "parent",
  "committee_member",
];
const leaders: UserRole[] = ["admin", "super_admin", "head", "assistant_head"];
const academicStaff: UserRole[] = ["head", "assistant_head", "class_teacher", "subject_teacher", "teacher"];
const attendanceStaff: UserRole[] = ["head", "assistant_head", "class_teacher"];
const financeStaff: UserRole[] = ["head", "assistant_head", "finance_officer", "class_teacher"];
const studentParent: UserRole[] = ["student", "parent"];
const masterWorkflow = [
  "প্রতিষ্ঠানের Profile, Logo, Subdomain, Storage, SMS ও Payment setting ঠিক করুন।",
  "Billing active করুন, plan limit ও SMS balance যাচাই করুন।",
  "Academic year, class, section, subject, syllabus, class routine ও exam routine তৈরি করুন।",
  "Teacher, staff, role permission, class teacher assignment ও user access ঠিক করুন।",
  "Student admission করুন, roll/section ঠিক করুন এবং parent login credential পাঠান।",
  "Holiday calendar ঠিক করে প্রতিদিন attendance mark করুন; package অনুযায়ী Present SMS পাঠান।",
  "Exam তৈরি করুন, marks entry করুন, review করে result publish করুন এবং report card print করুন।",
  "Annual result final হলে Final Promotion দিয়ে পরের class/section-এ student উত্তীর্ণ করুন।",
  "Fee structure, collection, receipt, salary ও finance report নিয়মিত maintain করুন।",
  "Notice, message, homework, online class, library, documents, ID card ও downloads ব্যবহার করুন।",
  "Analytics, finance audit, SMS log, attendance report ও backup দিয়ে কাজ যাচাই করুন।",
];

const rolePaths: RolePath[] = [
  {
    title: "Head / Admin Start Path",
    roles: ["head"],
    description: "স্কুল চালু, বিলিং, permission, finance, result publish ও analytics দেখার প্রধান পথ।",
    items: ["Institution Profile", "Billing", "Academic Setup", "Users & Roles", "Admission", "Attendance", "Finance", "Results", "Analytics"],
  },
  {
    title: "Assistant Head Path",
    roles: ["assistant_head"],
    description: "Academic monitoring, attendance, result review, reports ও teacher workflow দেখার পথ।",
    items: ["Academic", "Teachers", "Attendance Reports", "Exam Management", "Finance Reports", "App Guide"],
  },
  {
    title: "Class Teacher Path",
    roles: ["class_teacher"],
    description: "নিজের class-এর student, attendance, homework, leave ও marks entry করার পথ।",
    items: ["Student List", "Mark Attendance", "Present SMS", "Homework", "Result Entry", "Leave Review"],
  },
  {
    title: "Subject Teacher Path",
    roles: ["subject_teacher", "teacher"],
    description: "Subject routine, syllabus, homework, question bank ও marks entry করার পথ।",
    items: ["Class Routine", "Syllabus", "Homework", "Question Bank", "Results", "Profile"],
  },
  {
    title: "Finance Officer Path",
    roles: ["finance_officer"],
    description: "Fee setup, fee collection, salary, receipt, due list ও finance report করার পথ।",
    items: ["Fees", "Fee Collect", "Collections", "Salary", "Reports", "Finance Audit"],
  },
  {
    title: "Student / Parent Path",
    roles: ["student", "parent"],
    description: "নিজের বা সন্তানের attendance, homework, result, fee, notice ও downloads দেখার পথ।",
    items: ["Dashboard", "My Attendance", "Homework", "Results", "My Fees", "Downloads", "Profile"],
  },
];

const sections: GuideSection[] = [
  {
    id: "setup",
    title: "প্রথম সেটআপ ও Activation",
    phase: "Foundation",
    description: "নতুন স্কুল চালুর আগে identity, billing, storage, SMS, payment ও access ঠিক করার ধাপ।",
    icon: ShieldCheck,
    roles: leaders,
    steps: [
      {
        title: "প্রতিষ্ঠানের তথ্য সম্পূর্ণ করুন",
        page: "Institution > Profile",
        href: "/institution/profile",
        goal: "সব official document, ID card, receipt ও report card-এ সঠিক school identity দেখানো।",
        details: "স্কুলের নাম, EIIN, address, phone, email, website, subdomain, logo, seal এবং head teacher signature আপলোড করুন। Subdomain ঠিক থাকলে school link হবে https://subdomain.easyschool.live।",
        checklist: ["School name ও EIIN যাচাই", "Logo/seal/signature ৫০KB-৫০০KB এর মধ্যে upload", "Subdomain check করে save", "SMS ও storage setting যাচাই"],
        outcome: "স্কুলের branding সব report, card, receipt ও public link-এ ব্যবহার হবে।",
        roles: leaders,
      },
      {
        title: "Subscription, student limit ও storage active করুন",
        page: "Billing & Subscription",
        href: "/billing",
        goal: "স্কুল কোন plan ব্যবহার করছে এবং কোন feature চালু থাকবে তা নিশ্চিত করা।",
        details: "Plan, billing cycle, student limit, expiry, storage package, payment status ও renewal এখানে দেখুন। Payment confirm না হলে subscription active হবে না।",
        checklist: ["Plan due amount মিলিয়ে দেখা", "Payment received status verify", "Student limit দেখা", "Paid feature lock আছে কিনা দেখা"],
        outcome: "সঠিক plan অনুযায়ী attendance SMS, ID card, admit card, AI question ও analytics চালু থাকবে।",
        warning: "Payment gateway popup খুললেই payment confirm হবে না; gateway থেকে success response/transaction verify হতে হবে।",
        roles: ["head"],
      },
      {
        title: "SMS provider ও gateway setting দিন",
        page: "Settings",
        href: "/settings",
        goal: "Attendance, admission, teacher credential, result ও monthly SMS ঠিকভাবে পাঠানো।",
        details: "Provider, API URL, API key এবং sender configuration দিন। SMS enabled off থাকলে balance থাকলেও SMS যাবে না।",
        checklist: ["Provider select", "API key save", "Test SMS send", "SMS Monitoring log check"],
        outcome: "Guardian ও staff notification নির্ভরযোগ্যভাবে যাবে।",
        roles: leaders,
      },
      {
        title: "Holiday calendar ঠিক করুন",
        page: "Holidays",
        href: "/holidays",
        goal: "বন্ধের দিনে attendance ভুল করে mark হওয়া বন্ধ করা।",
        details: "Default weekly holiday সাধারণত Friday এবং Saturday থাকে। চাইলে প্রতিষ্ঠান নিজের calendar অনুযায়ী holiday select করবে। Exam, Eid, Puja, national holiday আলাদা করে যোগ করুন।",
        checklist: ["Weekly holiday confirm", "Special holiday add", "Attendance calendar preview দেখা", "ভুল holiday থাকলে remove"],
        outcome: "Attendance working day, closed day ও report total সঠিক থাকবে।",
        roles: leaders,
      },
      {
        title: "Role ও Permission configure করুন",
        page: "Users & Roles",
        href: "/users-roles",
        goal: "যার যতটুকু access দরকার শুধু ততটুকু menu ও action দেখানো।",
        details: "Head, assistant head, class teacher, subject teacher, finance officer, staff, student, parent ও committee member role অনুযায়ী permission দিন।",
        checklist: ["Role list দেখা", "Permission toggle verify", "Restricted page sidebar থেকে hide/disable", "Test user দিয়ে login check"],
        outcome: "Security ঠিক থাকবে এবং user নিজের কাজের menu-ই দেখবে।",
        roles: ["head"],
      },
    ],
  },
  {
    id: "academic",
    title: "Academic Setup: Class থেকে Routine",
    phase: "Academic Base",
    description: "Class, section, subject, syllabus, class routine, exam routine ও exam setup তৈরির সঠিক ক্রম।",
    icon: BookOpenCheck,
    roles: academicStaff.concat(studentParent),
    steps: [
      {
        title: "Academic year ও class তৈরি করুন",
        page: "Academic > Classes",
        href: "/academic/classes",
        goal: "Student admission, attendance, fee ও result-এর মূল কাঠামো তৈরি করা।",
        details: "প্রথমে active academic year ঠিক করুন, তারপর Nursery/KG/Class 1 থেকে Class 10 পর্যন্ত প্রয়োজনীয় class তৈরি করুন।",
        checklist: ["Active year confirm", "Class name unique রাখা", "Class order ঠিক করা", "Unused class delete না করে inactive করার কথা ভাবা"],
        outcome: "পরের সব module class অনুযায়ী কাজ করবে।",
        roles: leaders,
      },
      {
        title: "Section ও subject assign করুন",
        page: "Academic > Sections / Subjects",
        href: "/academic/subjects",
        goal: "প্রতিটি class-এর section ও পড়ানো subject নির্দিষ্ট করা।",
        details: "A/B/Morning/Day section তৈরি করুন। এরপর Bangla, English, Math, Science ইত্যাদি subject class-wise assign করুন।",
        checklist: ["প্রতিটি class-এ section আছে", "Subject code/mark setup আছে", "Subject teacher assignment আছে", "Result entry subject list মিলছে"],
        outcome: "Routine, homework, question bank ও result entry ঠিক subject ধরে চলবে।",
        roles: academicStaff,
      },
      {
        title: "Syllabus ও lesson plan প্রকাশ করুন",
        page: "Academic > Syllabus",
        href: "/academic/syllabus",
        goal: "Teacher, student ও parent যেন exam preparation বুঝতে পারে।",
        details: "Class, section, subject, term/month অনুযায়ী syllabus বা PDF upload করুন। Update করলে student/parent নতুন syllabus দেখতে পাবে।",
        checklist: ["Term select", "Subject select", "Attachment readable কিনা দেখা", "Publish status check"],
        outcome: "Homework, question ও exam routine syllabus-এর সাথে aligned থাকবে।",
        roles: academicStaff.concat(studentParent),
      },
      {
        title: "Class routine তৈরি করুন",
        page: "Academic > Class Routine",
        href: "/academic/class-routine",
        goal: "প্রতিদিন কোন period-এ কোন teacher কোন subject নিবে তা নির্ধারণ।",
        details: "Day, period, class, section, subject, teacher ও room select করুন। Teacher clash থাকলে routine save করার আগে ঠিক করুন।",
        checklist: ["Teacher double-booking নেই", "Friday/Saturday routine নেই যদি holiday হয়", "Student view থেকে preview", "Print/PDF check"],
        outcome: "Teacher ও student dashboard-এ সঠিক routine দেখা যাবে।",
        roles: academicStaff.concat(studentParent),
      },
      {
        title: "Exam routine publish করুন",
        page: "Academic > Exam Routine",
        href: "/academic/exam-routine",
        goal: "পরীক্ষার date, time, subject ও room সবাইকে জানানো।",
        details: "Exam select করে class/section-wise subject date, start time, end time ও instructions দিন। Publish করলে student/parent দেখতে পাবে।",
        checklist: ["Exam select", "Subject date clash নেই", "Room/instruction দেওয়া", "Publish status on"],
        outcome: "Admit card ও student preparation-এর জন্য routine ready থাকবে।",
        roles: academicStaff.concat(studentParent),
      },
    ],
  },
  {
    id: "people",
    title: "Admission, Teacher, Staff ও User Access",
    phase: "People",
    description: "Student ভর্তি, pending admission approve, teacher/staff account ও login credential flow।",
    icon: GraduationCap,
    roles: leaders.concat(["class_teacher", "subject_teacher", "teacher"]),
    steps: [
      {
        title: "Student admission করুন",
        page: "Institution > Admission",
        href: "/institution/admission",
        goal: "Student profile, class, section, roll ও guardian account তৈরি করা।",
        details: "নাম, জন্মতারিখ, photo, class, section, roll, guardian name, guardian mobile ও address দিন। Admission save হলে parent login তৈরি করা যায়।",
        checklist: ["Class/section আগে তৈরি", "Roll duplicate নয়", "Guardian mobile valid", "Credential SMS log check"],
        outcome: "Student attendance, fee, result ও parent portal-এ যুক্ত হবে।",
        roles: leaders,
      },
      {
        title: "Pending admission approve করুন",
        page: "Institution > Pending Admissions",
        href: "/institution/pending-admissions",
        goal: "Online admission application যাচাই করে final student list-এ নেওয়া।",
        details: "Application details, documents, selected class ও guardian information দেখে approve/reject করুন।",
        checklist: ["Document review", "Class seat availability", "Roll assign", "Approve করলে credential পাঠানো"],
        outcome: "Accepted application student list-এ যুক্ত হবে।",
        roles: leaders.concat(["class_teacher", "subject_teacher", "teacher"]),
      },
      {
        title: "Student list clean করুন",
        page: "Institution > Students",
        href: "/institution/students",
        goal: "ভুল class, section, roll, guardian number বা inactive student ঠিক করা।",
        details: "Search/filter দিয়ে student খুঁজে edit, deactivate, promote বা guardian info update করুন।",
        checklist: ["Class-wise total মিলানো", "Section blank আছে কিনা দেখা", "Guardian phone correction", "Photo missing check"],
        outcome: "Attendance, SMS, fee ও result ভুল student-এ যাবে না।",
        roles: ["head", "assistant_head", "class_teacher"],
      },
      {
        title: "Teacher ও staff যুক্ত করুন",
        page: "Institution > Teachers / Staff",
        href: "/institution/teachers",
        goal: "School employee account, role ও দায়িত্ব নির্ধারণ।",
        details: "Teacher profile, subject, class teacher duty, staff designation ও login credential তৈরি করুন। Finance officer হলে finance role দিন।",
        checklist: ["Role ঠিক", "Subject assignment", "Class teacher section assignment", "Credential SMS sent"],
        outcome: "Teacher/staff নিজের dashboard ও permitted pages ব্যবহার করতে পারবে।",
        roles: leaders,
      },
    ],
  },
  {
    id: "attendance",
    title: "Attendance, Holiday ও Present SMS",
    phase: "Daily Operation",
    description: "প্রতিদিন attendance নেওয়া, auto save, guardian SMS, reports ও biometric/scanner flow।",
    icon: CheckCircle2,
    roles: attendanceStaff.concat(studentParent),
    steps: [
      {
        title: "Daily attendance mark করুন",
        page: "Attendance > Mark Attendance",
        href: "/attendance/mark",
        goal: "Class teacher যেন এক click-এ present/absent/late/leave auto-save করতে পারে।",
        details: "Date, class, section select করে status button চাপুন। Save button দরকার নেই; click করলেই save হবে এবং total update হবে।",
        checklist: ["Holiday কিনা দেখা", "Correct date select", "Class/section select", "Marked rows count দেখা", "Monthly total verify"],
        outcome: "Student attendance calendar, report ও monthly total update হবে।",
        roles: attendanceStaff,
      },
      {
        title: "All Present Scanner / Fingerprint ব্যবহার করুন",
        page: "Attendance > All Present Scanner",
        href: "/attendance/all-present",
        goal: "QR/barcode বা biometric দিয়ে দ্রুত attendance নেওয়া।",
        details: "ID card scanner দিয়ে student scan করলে present হবে। Fingerprint আগে register করা থাকলে biometric attendance নেওয়া যাবে।",
        checklist: ["Student ID card generated", "Scanner permission check", "Fingerprint register", "Duplicate scan log দেখা"],
        outcome: "Large class attendance দ্রুত complete হবে।",
        roles: attendanceStaff,
      },
      {
        title: "Present SMS পাঠান",
        page: "Attendance > Present SMS",
        href: "/attendance/present-sms",
        goal: "Guardian-কে present status SMS পাঠানো।",
        details: "Daily package হলে present হওয়ার সাথে সাথে SMS যাবে। Weekly package হলে weekly summary হিসেবে SMS যাবে। SMS balance থাকলে manual present SMS-ও পাঠানো যাবে।",
        checklist: ["Guardian number আছে", "SMS enabled", "Balance/package check", "Failed log review"],
        outcome: "Guardian attendance update পাবে এবং SMS Monitoring-এ log থাকবে।",
        warning: "Login link সবসময় https://subdomain.easyschool.live/login ফরম্যাটে যাবে; duplicate subdomain হলে institution profile ঠিক করুন।",
        roles: attendanceStaff,
      },
      {
        title: "Attendance reports দেখুন",
        page: "Attendance > Reports",
        href: "/attendance/reports",
        goal: "Class, student, month ও year অনুযায়ী attendance performance দেখা।",
        details: "Report page থেকে present/absent/late/leave summary, calendar, monthly/yearly total ও printable report দেখুন।",
        checklist: ["Date range select", "Class/section filter", "Student search", "Print/PDF preview"],
        outcome: "Head/teacher দ্রুত attendance issue ধরতে পারবে।",
        roles: attendanceStaff,
      },
      {
        title: "নিজের attendance দেখুন",
        page: "Attendance > My Attendance",
        href: "/attendance/my-attendance",
        goal: "Student/parent নিজের বা সন্তানের attendance calendar দেখা।",
        details: "Monthly view-তে working day, closed day, present, absent, late ও leave count দেখা যাবে।",
        checklist: ["Correct month", "Holiday label দেখা", "Present total মিলানো", "Report download"],
        outcome: "Parent real-time attendance transparency পাবে।",
        roles: attendanceStaff.concat(studentParent),
      },
    ],
  },
  {
    id: "exam-result",
    title: "Exam Management, Result ও Promotion",
    phase: "Assessment",
    description: "Exam তৈরি, participant class/section নির্ধারণ, marks entry, publish, report card ও promotion।",
    icon: ListChecks,
    roles: academicStaff.concat(studentParent),
    steps: [
      {
        title: "Exam তৈরি ও class/section assign করুন",
        page: "Academic > Exams",
        href: "/academic/exams",
        goal: "কোন exam কোন class/section দেবে এবং mark structure কী হবে তা নির্ধারণ।",
        details: "Exam name, term, class, section, subject, total mark, pass mark, grading ও publish status set করুন।",
        checklist: ["Exam name unique", "Class/section selected", "Subject mark setup", "Pass mark/grading verify"],
        outcome: "Result entry ও exam management একই exam ধরে কাজ করবে।",
        roles: academicStaff,
      },
      {
        title: "Exam Management দিয়ে progress দেখুন",
        page: "Academic > Exam Management",
        href: "/academic/exam-management",
        goal: "কে exam দিয়েছে, কোন class-এর result বাকি, কোন subject incomplete তা দেখা।",
        details: "Class-wise progress, subject-wise mark entry status, draft/review/published status এবং result shortcut এখান থেকে দেখুন।",
        checklist: ["Exam filter", "Class progress", "Missing subject", "Publish readiness"],
        outcome: "Result publish করার আগে সব gap ধরা যাবে।",
        roles: leaders,
      },
      {
        title: "Marks entry করুন",
        page: "Academic > Results",
        href: "/academic/results",
        goal: "Subject-wise marks save করে final result তৈরি করা।",
        details: "Exam, class, section ও subject select করে marks দিন। Subject teacher নিজের subject-এর marks দিতে পারবে; head/class teacher review করবে।",
        checklist: ["Correct exam", "Absent student mark policy", "Autosave/status check", "Total/GPA preview"],
        outcome: "Draft result ready হবে।",
        roles: academicStaff,
      },
      {
        title: "Result review ও publish করুন",
        page: "Academic > Results",
        href: "/academic/results",
        goal: "Final result student/parent-এর জন্য প্রকাশ করা।",
        details: "Marks verify করে review complete করুন। Publish করলে student ও parent result দেখতে পারবে এবং notification/SMS পাঠানো যাবে।",
        checklist: ["All subjects complete", "Merit/GPA check", "Failed/pass status check", "Publish confirm"],
        outcome: "Report card ও parent portal result visible হবে।",
        roles: leaders,
      },
      {
        title: "Report card print/download করুন",
        page: "Academic > Report Card",
        href: "/academic/report-card",
        goal: "প্রিন্ট ও PDF-এ পূর্ণ report card দেওয়া।",
        details: "Student/class select করে report card preview দেখুন। Logo, signature, grade, subject marks ও attendance summary থাকবে।",
        checklist: ["Institution logo আছে", "Marks complete", "Print preview full page", "PDF not cut"],
        outcome: "সব device-এ consistent printable report card পাওয়া যাবে।",
        roles: ["head", "assistant_head", "class_teacher", "student", "parent"],
      },
      {
        title: "Final Promotion দিন",
        page: "Academic > Final Promotion",
        href: "/academic/promotions",
        goal: "Passed student-কে পরের class-এ নেওয়া এবং failed student ধরে রাখা।",
        details: "Annual/final result select করে target class ও section দিন। Promote করার আগে backup/report export করে নিন।",
        checklist: ["Final result published", "Target class exists", "Section selected", "Promotion preview check"],
        outcome: "নতুন academic year/class structure-এ student ready হবে।",
        roles: ["head", "assistant_head", "class_teacher"],
      },
    ],
  },
  {
    id: "finance",
    title: "Finance, Fee, Receipt ও Salary",
    phase: "Accounts",
    description: "Fee setup, collection, online/cash payment, salary, due list, audit ও finance report।",
    icon: CreditCard,
    roles: financeStaff.concat(studentParent),
    steps: [
      {
        title: "Fee structure তৈরি করুন",
        page: "Finance > Fees",
        href: "/finance/fees",
        goal: "Class-wise admission, tuition, exam, transport বা custom fee তৈরি।",
        details: "Fee head, amount, class, month/term, due date এবং fine policy set করুন।",
        checklist: ["Class selected", "Fee type clear", "Due date set", "Duplicate fee নেই"],
        outcome: "Student due list generate হবে।",
        roles: ["head", "assistant_head", "finance_officer"],
      },
      {
        title: "Fee collect ও receipt print করুন",
        page: "Finance > Fee Collect",
        href: "/finance/fee-collect",
        goal: "Student payment receive করে receipt দেওয়া।",
        details: "Student search করে due select করুন, cash/online method দিন, amount receive করুন এবং receipt print/download করুন।",
        checklist: ["Student verify", "Due item select", "Payment method", "Receipt preview"],
        outcome: "Collection history ও finance report update হবে।",
        roles: financeStaff,
      },
      {
        title: "Collection, due ও finance reports দেখুন",
        page: "Finance > Reports",
        href: "/finance/reports",
        goal: "প্রতিদিন/মাসে কত টাকা উঠেছে, কত due আছে ও expense কত তা দেখা।",
        details: "Date range, class, fee type ও collector filter করে report দেখুন। Head finance audit দিয়ে পরিবর্তনের log দেখতে পারবে।",
        checklist: ["Date range", "Cash/online split", "Due report", "Audit log"],
        outcome: "Accounts transparent থাকবে।",
        roles: ["head", "assistant_head", "finance_officer"],
      },
      {
        title: "Salary manage করুন",
        page: "Finance > Salary",
        href: "/finance/salary",
        goal: "Teacher/staff salary entry, payment ও outstanding track করা।",
        details: "Employee select করে salary amount, month, deduction/bonus ও payment status দিন।",
        checklist: ["Employee role", "Month selected", "Paid/unpaid status", "Salary report"],
        outcome: "Monthly expense report accurate হবে।",
        roles: ["head", "finance_officer"],
      },
      {
        title: "Student/Parent নিজের fee দেখবে",
        page: "Finance > My Fees",
        href: "/finance/my-fees",
        goal: "Due, paid amount ও receipt parent/student নিজে দেখা।",
        details: "Parent portal থেকে due fee, paid history, receipt ও payment instruction দেখা যাবে।",
        checklist: ["Student linked", "Due list visible", "Receipt download", "Payment status"],
        outcome: "Fee communication কম ঝামেলায় হবে।",
        roles: studentParent,
      },
    ],
  },
  {
    id: "communication",
    title: "Notice, Message, Notification ও SMS Monitoring",
    phase: "Communication",
    description: "School notice, direct message, guardian SMS, monthly SMS, failed log ও recharge workflow।",
    icon: MessageSquare,
    roles: allSchool,
    steps: [
      {
        title: "Notice publish করুন",
        page: "Notice Board",
        href: "/notices",
        goal: "School announcement role/class অনুযায়ী পৌঁছে দেওয়া।",
        details: "Title, message, target audience, attachment ও publish date দিয়ে notice তৈরি করুন।",
        checklist: ["Target audience", "Attachment check", "Publish status", "Notification visible"],
        outcome: "User dashboard ও notice page-এ announcement দেখা যাবে।",
        roles: allSchool,
      },
      {
        title: "Direct message বা custom SMS পাঠান",
        page: "Messages",
        href: "/messages",
        goal: "নির্দিষ্ট user বা mobile number-এ বার্তা পাঠানো।",
        details: "Internal message app notification হিসেবে যাবে। SMS হলে balance ও provider active থাকতে হবে।",
        checklist: ["Recipient", "Message length", "SMS balance", "Delivery log"],
        outcome: "Communication record থাকবে।",
        roles: leaders,
      },
      {
        title: "SMS Monitoring দেখুন",
        page: "SMS Monitoring",
        href: "/sms-monitoring",
        goal: "কোন SMS sent/failed হয়েছে এবং balance কত আছে তা দেখা।",
        details: "Admission credential, teacher credential, attendance, result, monthly guardian SMS সব log এখানে দেখা যায়।",
        checklist: ["Status filter", "Failed reason", "Balance", "Recharge history"],
        outcome: "SMS problem দ্রুত ধরা যাবে।",
        roles: leaders.concat(["class_teacher"]),
      },
      {
        title: "Notifications follow করুন",
        page: "Notifications",
        href: "/notifications",
        goal: "System alert, result publish, fee due, leave update ও notice alert দেখা।",
        details: "Unread count দেখে notification open করুন। Important alert পড়া শেষে mark as read করুন।",
        checklist: ["Unread count", "Filter", "Action link", "Mark as read"],
        outcome: "Daily task miss হবে না।",
        roles: allSchool,
      },
    ],
  },
  {
    id: "documents",
    title: "Documents, ID Card, Admit Card ও Downloads",
    phase: "Documents",
    description: "Official document, ID card, admit card, memo, upload, print/PDF এবং download center।",
    icon: FileText,
    roles: leaders.concat(["student", "parent", "staff", "finance_officer"]),
    steps: [
      {
        title: "ID card template ও generate করুন",
        page: "ID Card",
        href: "/id-cards",
        goal: "Student/teacher/staff ID card design, generate ও print করা।",
        details: "Template design করুন, class/section select করে generate করুন, তারপর print/download করুন। QR/barcode attendance scanner-এর জন্য দরকার।",
        checklist: ["Logo/photo আছে", "Template selected", "QR visible", "Print preview full"],
        outcome: "ID card attendance ও identity workflow-ready হবে।",
        roles: allSchool,
      },
      {
        title: "Admit card তৈরি করুন",
        page: "Documents > Admit Cards",
        href: "/documents/admit-cards",
        goal: "Exam routine অনুযায়ী student admit card দেওয়া।",
        details: "Exam, class, section select করে admit card generate করুন। Institution logo, exam date, student details ও instructions থাকবে।",
        checklist: ["Exam routine published", "Student list correct", "Signature/logo", "PDF full page"],
        outcome: "Exam hall entry document ready হবে।",
        roles: leaders,
      },
      {
        title: "Documents upload ও share করুন",
        page: "Documents > Manage",
        href: "/documents/manage",
        goal: "PDF/image/office document user বা class অনুযায়ী share করা।",
        details: "Document title, category, target class/role ও file upload করুন। Large image হলে আগে compress হবে।",
        checklist: ["File size valid", "Target audience", "Download permission", "Preview"],
        outcome: "Downloads page থেকে authorized user file পাবে।",
        roles: leaders.concat(["finance_officer", "staff"]),
      },
      {
        title: "Downloads ব্যবহার করুন",
        page: "Downloads",
        href: "/downloads",
        goal: "Report, receipt, card, routine ও shared file এক জায়গায় পাওয়া।",
        details: "User role অনুযায়ী downloadable document list দেখা যাবে।",
        checklist: ["Correct category", "Download works", "Print/PDF full", "Access role"],
        outcome: "প্রয়োজনীয় file দ্রুত পাওয়া যাবে।",
        roles: allSchool,
      },
    ],
  },
  {
    id: "learning",
    title: "Question Bank, Online Class, Homework ও Library",
    phase: "Learning",
    description: "Digital learning content, AI/MCQ question, homework, online class, books ও library loan।",
    icon: BookOpen,
    roles: academicStaff.concat(studentParent).concat(["staff"]),
    steps: [
      {
        title: "Question Bank তৈরি করুন",
        page: "Question Bank",
        href: "/question-bank",
        goal: "Subject/chapter অনুযায়ী MCQ, written question ও practice তৈরি।",
        details: "AI Manage দিয়ে question generate, MCQ Manage দিয়ে edit, Practice দিয়ে student test করতে পারবে।",
        checklist: ["Class/subject selected", "Question reviewed", "Correct answer set", "Practice enabled"],
        outcome: "Exam preparation ও class test সহজ হবে।",
        roles: academicStaff.concat(studentParent),
      },
      {
        title: "Homework দিন ও follow করুন",
        page: "Homework",
        href: "/homework",
        goal: "Class/subject homework deadline সহ publish করা।",
        details: "Teacher homework title, description, attachment, due date ও target class/section দিন। Student/parent same page থেকে দেখবে।",
        checklist: ["Target class", "Due date", "Attachment", "Student view"],
        outcome: "Daily academic task visible থাকবে।",
        roles: academicStaff.concat(studentParent),
      },
      {
        title: "Online classes manage করুন",
        page: "Online Classes",
        href: "/online-classes",
        goal: "Live/recorded class, routine ও digital books publish করা।",
        details: "Schedule, routine, recorded video link এবং digital books class-wise add করুন।",
        checklist: ["Class/section", "Meeting/video link", "Routine", "Book file"],
        outcome: "Student online learning content পাবে।",
        roles: academicStaff.concat(studentParent),
      },
      {
        title: "Library books ও loans track করুন",
        page: "Library",
        href: "/library",
        goal: "Book stock, issue, return ও overdue record রাখা।",
        details: "Book add করে student/staff loan দিন, return date track করুন এবং overdue list দেখুন।",
        checklist: ["Book stock", "Borrower", "Issue date", "Return date"],
        outcome: "Library inventory ঠিক থাকবে।",
        roles: leaders.concat(["staff", "student", "parent", "class_teacher", "teacher"]),
      },
    ],
  },
  {
    id: "analytics",
    title: "Analytics, Reports, Audit ও Backup",
    phase: "Monitoring",
    description: "School performance, visit analytics, finance audit, reports, backup ও system health।",
    icon: BarChart3,
    roles: leaders.concat(["student", "parent"]),
    steps: [
      {
        title: "Visit analytics দেখুন",
        page: "Analytics",
        href: "/analytics",
        goal: "Google Analytics-এর মতো page view, visitor, device ও top page দেখা।",
        details: "Platform admin সব school list ও total দেখবে। School head নিজের school-এর visits, pages, device এবং daily trend দেখবে।",
        checklist: ["Date range", "Top pages", "Device split", "School filter"],
        outcome: "কোন page বেশি ব্যবহার হচ্ছে তা বোঝা যাবে।",
        roles: leaders,
      },
      {
        title: "Charts ও profile analytics দেখুন",
        page: "Charts",
        href: "/charts",
        goal: "Attendance, finance, result ও profile progress chart আকারে দেখা।",
        details: "Paid plan-এ school analytics এবং student/parent profile chart দেখা যাবে। Free plan-এ restricted feature hide থাকবে।",
        checklist: ["Plan active", "Filter", "Chart load", "Export/print"],
        outcome: "Decision নেওয়ার data ready থাকবে।",
        roles: leaders.concat(["student", "parent"]),
      },
      {
        title: "Finance audit ও activity review করুন",
        page: "Institution > Finance Audit",
        href: "/institution/finance-audit",
        goal: "কে কখন payment/collection/edit করেছে তা দেখা।",
        details: "Sensitive finance operation-এর log দেখে irregularity track করুন।",
        checklist: ["Date filter", "User filter", "Action type", "Export"],
        outcome: "Financial accountability থাকবে।",
        roles: leaders,
      },
      {
        title: "Backup নিন",
        page: "Institution > Backup",
        href: "/institution/backup",
        goal: "School data নিরাপদ রাখা।",
        details: "Regular interval-এ backup download করুন। Major promotion/result publish/payment migration-এর আগে backup নেওয়া ভালো।",
        checklist: ["Latest backup", "Download complete", "Secure storage", "Restore note"],
        outcome: "Data loss risk কমবে।",
        roles: ["head"],
      },
    ],
  },
  {
    id: "profile-support",
    title: "Profile, Settings ও Problem Solving",
    phase: "Support",
    description: "Profile update, password, access problem, upload problem, print/PDF ও common troubleshooting।",
    icon: Settings2,
    roles: allSchool,
    steps: [
      {
        title: "নিজের profile update করুন",
        page: "Profile",
        href: "/profile",
        goal: "নিজের নাম, ছবি, phone, email ও password ঠিক রাখা।",
        details: "Profile picture upload করলে সব জায়গায় auto update হবে। Image বেশি বড় হলে ৫০KB-৫০০KB এর মধ্যে compress করে upload করুন।",
        checklist: ["Photo clear", "Phone/email correct", "Password strong", "Save success"],
        outcome: "Account identity ঠিক থাকবে।",
        roles: allSchool,
      },
      {
        title: "Access না থাকলে কী করবেন",
        page: "Users & Roles",
        href: "/users-roles",
        goal: "Menu দেখা যাচ্ছে না বা API permission error হলে role/permission ঠিক করা।",
        details: "Head role permission check করবে। Plan restricted feature হলে billing page-এ plan upgrade/activate করতে হবে।",
        checklist: ["User role", "Permission toggle", "Plan feature", "Logout/login"],
        outcome: "User সঠিক page access পাবে।",
        roles: leaders,
      },
      {
        title: "Print/PDF কেটে গেলে কী দেখবেন",
        page: "Downloads",
        href: "/downloads",
        goal: "সব device-এ full page print/PDF পাওয়া।",
        details: "Browser print preview-তে paper size A4, scale 100%, margins default/minimum এবং background graphics on রাখুন। App-এর print pages responsive print style ব্যবহার করবে।",
        checklist: ["A4 paper", "Scale 100%", "Background graphics", "Preview full"],
        outcome: "Report, ID card, admit card ও receipt কাটা ছাড়াই print হবে।",
        roles: allSchool,
      },
      {
        title: "Help ও issue reporting",
        page: "Dashboard",
        href: "/dashboard",
        goal: "কোন error হলে page, user, date, screenshot ও exact message সহ report করা।",
        details: "API Error, upload error, SMS failed, payment pending বা attendance total mismatch হলে exact page URL ও error message লিখে admin/support-কে দিন।",
        checklist: ["Page URL", "Error message", "User role", "Screenshot/time"],
        outcome: "Problem দ্রুত reproduce ও fix করা যাবে।",
        roles: allSchool,
      },
    ],
  },
];

const visibleSteps = (user: User | null | undefined, steps: GuideStep[]) => steps.filter((step) => hasRole(user, step.roles));

const matchesQuery = (section: GuideSection, query: string) => {
  if (!query.trim()) return true;
  const needle = query.toLowerCase();
  const haystack = [
    section.title,
    section.phase,
    section.description,
    ...section.steps.flatMap((step) => [
      step.title,
      step.page,
      step.goal,
      step.details,
      step.outcome,
      step.warning || "",
      ...step.checklist,
    ]),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(needle);
};

export default function AppGuidePage() {
  const { user, isLoading } = useAuth();
  const [query, setQuery] = useState("");
  const role = normalizeUserRole(user?.role) || user?.role || "guest";

  const visibleSections = useMemo(
    () =>
      sections
        .map((section) => ({ ...section, steps: visibleSteps(user, section.steps) }))
        .filter((section) => section.steps.length > 0 && hasRole(user, section.roles))
        .filter((section) => matchesQuery(section, query)),
    [query, user],
  );

  const visibleRolePaths = rolePaths.filter((path) => hasRole(user, path.roles));
  const totalSteps = visibleSections.reduce((sum, section) => sum + section.steps.length, 0);

  return (
    <div className="space-y-5 p-4 md:p-6">
      <PageHeader
        title="App Guide"
        description="Easy School কীভাবে চালাতে হবে, কোন পেজের পরে কোন কাজ করতে হবে এবং role অনুযায়ী কে কী দেখবে - সব এক জায়গায়।"
        icon={Route}
        status={
          <Badge variant="outline" className="capitalize">
            {String(role).replace(/_/g, " ")}
          </Badge>
        }
      />

      {isLoading ? (
        <Card>
          <CardContent className="p-8 text-sm text-muted-foreground">Guide loading...</CardContent>
        </Card>
      ) : visibleSections.length === 0 && !query ? (
        <Card>
          <CardContent className="p-8 text-sm text-muted-foreground">এই role-এর জন্য কোনো guide পাওয়া যায়নি।</CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          <section className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
            <Card className="overflow-hidden">
              <CardHeader className="border-b bg-muted/30">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>Complete School Workflow</CardTitle>
                    <CardDescription>
                      নতুন স্কুল চালু থেকে result publish ও promotion পর্যন্ত recommended কাজের ক্রম।
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid gap-3 md:grid-cols-2">
                  {masterWorkflow.map((item, index) => (
                    <div key={item} className="flex gap-3 rounded-md border bg-background p-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                        {index + 1}
                      </div>
                      <p className="text-sm leading-6">{item}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Your Guide Summary</CardTitle>
                  <CardDescription>বর্তমান login role অনুযায়ী guide filter করা হয়েছে।</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-3">
                  <div className="rounded-md border p-3">
                    <div className="text-2xl font-semibold">{visibleSections.length}</div>
                    <div className="text-xs text-muted-foreground">Sections</div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-2xl font-semibold">{totalSteps}</div>
                    <div className="text-xs text-muted-foreground">Steps</div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-2xl font-semibold">{visibleRolePaths.length || 1}</div>
                    <div className="text-xs text-muted-foreground">Role Path</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quick Search</CardTitle>
                  <CardDescription>যে কাজ খুঁজছেন সেটার নাম লিখুন।</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      className="pl-9"
                      placeholder="attendance, result, fee, SMS, profile..."
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {visibleRolePaths.length > 0 && (
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleRolePaths.map((path) => (
                <Card key={path.title}>
                  <CardHeader>
                    <CardTitle className="text-base">{path.title}</CardTitle>
                    <CardDescription>{path.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {path.items.map((item, index) => (
                        <Badge key={`${path.title}-${item}`} variant={index === 0 ? "default" : "secondary"}>
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </section>
          )}

          <section className="grid gap-4 lg:grid-cols-[260px_1fr]">
            <Card className="h-fit lg:sticky lg:top-4">
              <CardHeader>
                <CardTitle className="text-base">Guide Map</CardTitle>
                <CardDescription>দ্রুত নির্দিষ্ট module-এ যান।</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {visibleSections.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Search অনুযায়ী কিছু পাওয়া যায়নি।</div>
                ) : (
                  visibleSections.map((section) => {
                    const Icon = section.icon;
                    return (
                      <a
                        key={section.id}
                        href={`#${section.id}`}
                        className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted"
                      >
                        <Icon className="h-4 w-4 text-primary" />
                        <span className="min-w-0 flex-1 truncate">{section.title}</span>
                        <Badge variant="outline">{section.steps.length}</Badge>
                      </a>
                    );
                  })
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              {visibleSections.map((section) => {
                const Icon = section.icon;
                return (
                  <Card key={section.id} id={section.id} className="scroll-mt-5 overflow-hidden">
                    <CardHeader className="border-b bg-muted/30">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                              <Badge variant="secondary">{section.phase}</Badge>
                              <Badge variant="outline">{section.steps.length} steps</Badge>
                            </div>
                            <CardTitle className="text-xl">{section.title}</CardTitle>
                            <CardDescription className="mt-1">{section.description}</CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y">
                        {section.steps.map((step, index) => (
                          <div
                            key={`${section.id}-${step.href}-${index}`}
                            className="grid gap-4 p-4 md:grid-cols-[48px_1fr_auto] md:items-start"
                          >
                            <div className="flex h-9 w-9 items-center justify-center rounded-full border bg-background text-sm font-bold">
                              {index + 1}
                            </div>
                            <div className="space-y-3">
                              <div>
                                <div className="font-semibold">{step.title}</div>
                                <div className="mt-1 text-xs font-medium text-primary">{step.page}</div>
                              </div>
                              <p className="text-sm leading-6 text-muted-foreground">{step.details}</p>
                              <div className="grid gap-3 md:grid-cols-2">
                                <div className="rounded-md border bg-background p-3">
                                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                                    <Building2 className="h-4 w-4 text-primary" />
                                    Goal
                                  </div>
                                  <p className="text-sm text-muted-foreground">{step.goal}</p>
                                </div>
                                <div className="rounded-md border bg-background p-3">
                                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                    Output
                                  </div>
                                  <p className="text-sm text-muted-foreground">{step.outcome}</p>
                                </div>
                              </div>
                              <div className="rounded-md border bg-muted/30 p-3">
                                <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                                  <ListChecks className="h-4 w-4 text-primary" />
                                  Checklist
                                </div>
                                <div className="grid gap-2 md:grid-cols-2">
                                  {step.checklist.map((item) => (
                                    <div key={item} className="flex gap-2 text-sm text-muted-foreground">
                                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                      <span>{item}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              {step.warning && (
                                <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                  <span>{step.warning}</span>
                                </div>
                              )}
                            </div>
                            <Button asChild variant="outline" size="sm">
                              <Link href={step.href} className="gap-2">
                                Open
                                <ArrowRight className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bell className="h-4 w-4 text-primary" />
                  Daily Check
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Attendance complete, SMS failed log, fee collection, notice এবং homework প্রতিদিন check করুন।</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  Monthly Check
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Monthly attendance, guardian SMS, salary, fee due, finance report এবং backup month-end এ verify করুন।</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <LifeBuoy className="h-4 w-4 text-primary" />
                  Support Rule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>কোন problem হলে page URL, user role, exact error, date/time ও screenshot একসাথে রাখলে fix দ্রুত হয়।</p>
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </div>
  );
}
