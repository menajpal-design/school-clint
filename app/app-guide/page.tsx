"use client";

import Link from "next/link";
import {
  BookOpenCheck,
  CheckCircle2,
  CreditCard,
  GraduationCap,
  ListChecks,
  Route,
  ShieldCheck,
  MessageSquare,
  FileText,
  Bell,
  Users,
  BookOpen,
  Monitor,
  Award,
  Fingerprint,
  BarChart3,
  Settings2,
  Download,
} from "lucide-react";

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
const staffAll: UserRole[] = ["head", "assistant_head", "class_teacher", "subject_teacher", "teacher", "finance_officer", "staff"];

const sections: GuideSection[] = [
  // ─── 1. FIRST SETUP ───────────────────────────────────────────────────────
  {
    title: "প্রথম সেটআপ: স্কুল চালুর ভিত্তি",
    description: "নতুন প্রতিষ্ঠান চালু করার পর সবার আগে যেগুলো সম্পন্ন করতে হবে।",
    icon: ShieldCheck,
    roles: leaders,
    steps: [
      {
        title: "প্রতিষ্ঠানের তথ্য সম্পূর্ণ করুন",
        page: "Institution › Profile",
        href: "/institution/profile",
        details:
          "স্কুলের নাম, EIIN, ঠিকানা, ফোন, ইমেইল, ওয়েবসাইট এবং লোগো সেট করুন। এই তথ্যগুলো ID card, receipt, report card ও admit card-এ স্বয়ংক্রিয়ভাবে ব্যবহার হয়। Timezone ও ভাষাও এখান থেকে সেট করুন।",
        roles: leaders,
      },
      {
        title: "সাবস্ক্রিপশন ও বিলিং দেখুন",
        page: "Billing & Subscription",
        href: "/billing",
        details:
          "বর্তমান প্ল্যান, মেয়াদ, student limit এবং SMS balance এখানে দেখতে পারবেন। Free Lifetime প্ল্যানে SMS, AI question, ID card ও Admit card সীমিত। Paid প্ল্যানে সব সুবিধা পাওয়া যায়।",
        roles: ["head"],
      },
      {
        title: "SMS সেটিংস চালু করুন",
        page: "Settings",
        href: "/settings",
        details:
          "SMS provider (SMSLayer/Anoncify) API key ও SMS gateway URL এখানে দিন। SMS enabled না থাকলে attendance, result ও monthly guardian SMS কাজ করবে না।",
        roles: leaders,
      },
      {
        title: "Payment gateway সেটআপ করুন",
        page: "Settings › Finance Methods",
        href: "/settings/finance-methods",
        details:
          "বিকাশ, নগদ বা কার্ড payment চালু করতে এখানে gateway API key দিন। SMS recharge ও subscription renewal-এ এই gateway ব্যবহার হবে।",
        roles: ["head"],
      },
      {
        title: "সাপ্তাহিক ছুটি ও বিশেষ বন্ধের দিন ঠিক করুন",
        page: "Holidays",
        href: "/holidays",
        details:
          "Default Friday ও Saturday বন্ধ থাকে। বার্ষিক পরীক্ষা, ঈদ, পূজা, জাতীয় দিবস ইত্যাদি holiday যোগ করুন। Holiday দিনে attendance mark disabled থাকবে।",
        roles: leaders,
      },
      {
        title: "Role ও Permission ঠিক করুন",
        page: "Users & Roles › Roles & Permissions",
        href: "/users-roles/permissions",
        details:
          "কোন role কোন menu ও page দেখতে বা পরিচালনা করতে পারবে তা এখানে নিয়ন্ত্রণ করুন। Permission ভুল হলে menu access সমস্যা হয়।",
        roles: ["head"],
      },
    ],
  },

  // ─── 2. ACADEMIC SETUP ────────────────────────────────────────────────────
  {
    title: "Academic সেটআপ: ক্লাস থেকে রুটিন",
    description: "ক্লাস, সেকশন, সাবজেক্ট, সিলেবাস, রুটিন ও পরীক্ষার কাঠামো তৈরির ধাপ।",
    icon: BookOpenCheck,
    roles: academicStaff,
    steps: [
      {
        title: "ক্লাস তৈরি করুন",
        page: "Academic › Classes",
        href: "/academic/classes",
        details:
          "Class 1 থেকে Class 10 পর্যন্ত বা KG, Nursery ইত্যাদি তৈরি করুন। ক্লাস ছাড়া ভর্তি, attendance, result বা fee setup করা যাবে না।",
        roles: leaders,
      },
      {
        title: "সেকশন তৈরি করুন",
        page: "Academic › Sections",
        href: "/academic/sections",
        details:
          "প্রতিটি ক্লাসে A, B, Morning, Day ইত্যাদি সেকশন তৈরি করুন। সেকশন না থাকলে সব student এক জায়গায় থাকে।",
        roles: leaders,
      },
      {
        title: "বিষয় তৈরি ও ক্লাসে যুক্ত করুন",
        page: "Academic › Subjects",
        href: "/academic/subjects",
        details:
          "বাংলা, ইংরেজি, গণিত, বিজ্ঞান ইত্যাদি subject তৈরি করুন এবং কোন ক্লাসে কোন subject পড়ানো হবে সেটা assign করুন। Result entry ও question bank এই subject ব্যবহার করে।",
        roles: leaders,
      },
      {
        title: "সিলেবাস দিন",
        page: "Academic › Syllabus",
        href: "/academic/syllabus",
        details:
          "প্রতিটি class/section/subject-এ মাসওয়ারি বা term অনুযায়ী syllabus আপলোড করুন। Teacher, student ও parent সিলেবাস দেখতে পারবে।",
        roles: academicStaff.concat(studentParent),
      },
      {
        title: "Class Routine তৈরি করুন",
        page: "Academic › Class Routine",
        href: "/academic/class-routine",
        details:
          "কোন দিন কোন period-এ কোন subject ক্লাস হবে তা সেট করুন। Teacher ও student উভয়ই routine দেখতে পারবে।",
        roles: academicStaff.concat(studentParent),
      },
      {
        title: "Exam Routine তৈরি করুন",
        page: "Academic › Exam Routine",
        href: "/academic/exam-routine",
        details:
          "পরীক্ষার সময়সূচি প্রকাশ করুন। Class/section অনুযায়ী exam date ও time দিন। Student ও parent দেখতে পারবে।",
        roles: academicStaff.concat(studentParent),
      },
      {
        title: "Exam তৈরি ও setup করুন",
        page: "Academic › Exams",
        href: "/academic/exams",
        details:
          "পরীক্ষার নাম (যেমন: ১ম সাময়িক, বার্ষিক), মোট নম্বর, পাশ নম্বর ও subject-wise mark breakdown এখানে সেট করুন। Exam setup না থাকলে result entry করা যাবে না।",
        roles: leaders,
      },
      {
        title: "Exam Management দেখুন",
        page: "Academic › Exam Management",
        href: "/academic/exam-management",
        details:
          "সব exam-এর status, result entry progress ও class-wise completion এক জায়গায় দেখুন। কোন class/section-এর result বাকি তা এখান থেকে track করা যায়।",
        roles: leaders,
      },
    ],
  },

  // ─── 3. ADMISSION & PEOPLE ────────────────────────────────────────────────
  {
    title: "ভর্তি ও মানুষ যুক্ত করা",
    description: "Student, teacher, staff ও user account তৈরির সম্পূর্ণ ধারাবাহিকতা।",
    icon: GraduationCap,
    roles: leaders.concat(["class_teacher", "subject_teacher", "teacher"]),
    steps: [
      {
        title: "Student admission করুন",
        page: "Institution › Admission",
        href: "/institution/admission",
        details:
          "নাম, class, section, roll, অভিভাবকের নাম ও ফোন নম্বর দিয়ে student ভর্তি করুন। ভর্তির সময় auto parent account ও (paid plan-এ) ID card তৈরির option থাকে। Login credential SMS-এ পাঠানো যায়।",
        roles: leaders,
      },
      {
        title: "Pending admission approve করুন",
        page: "Institution › Pending Admissions",
        href: "/institution/pending-admissions",
        details:
          "Public admission form বা website থেকে আবেদন করলে এখানে আসবে। Head বা authorized teacher আবেদন review করে accept বা reject করবে।",
        roles: ["head", "assistant_head", "class_teacher", "subject_teacher", "teacher"],
      },
      {
        title: "Student list যাচাই করুন",
        page: "Institution › Students",
        href: "/institution/students",
        details:
          "সব student-এর তথ্য, roll, class, section ঠিক আছে কিনা দেখুন। এখান থেকে student তথ্য edit, promote বা deactivate করা যায়।",
        roles: ["head", "assistant_head", "class_teacher"],
      },
      {
        title: "Teacher যুক্ত করুন",
        page: "Institution › Teachers",
        href: "/institution/teachers",
        details:
          "Teacher profile, বিষয়, class assignment ও class teacher designation সেট করুন। Teacher account-এ login credential পাঠানো যায়।",
        roles: leaders,
      },
      {
        title: "Staff যুক্ত করুন",
        page: "Institution › Staff",
        href: "/institution/staff",
        details:
          "Office staff, librarian, finance officer, peon ইত্যাদি যুক্ত করুন। Role অনুযায়ী তাদের menu access নিয়ন্ত্রিত হবে।",
        roles: leaders,
      },
      {
        title: "Subordinate institution manage করুন",
        page: "Institution › Subordinates",
        href: "/institution/subordinates",
        details:
          "যদি একটি মূল প্রতিষ্ঠানের অধীনে একাধিক branch বা campus থাকে, তাহলে এখানে manage করুন।",
        roles: ["head"],
      },
      {
        title: "Finance Audit দেখুন",
        page: "Institution › Finance Audit",
        href: "/institution/finance-audit",
        details:
          "কে কখন কোন financial transaction করেছে তার log এখানে দেখুন। Audit trail দিয়ে যেকোনো financial irregularity track করা যায়।",
        roles: ["head", "assistant_head"],
      },
      {
        title: "User role যাচাই ও পরিবর্তন করুন",
        page: "Users & Roles › All Users",
        href: "/users-roles/all",
        details:
          "সব user-এর account ও assigned role এখানে দেখুন। Role ভুল হলে user ভুল menu দেখবে বা সঠিক menu দেখতে পাবে না।",
        roles: ["head"],
      },
    ],
  },

  // ─── 4. ATTENDANCE ────────────────────────────────────────────────────────
  {
    title: "Daily Attendance Flow",
    description: "প্রতিদিন attendance mark করা, SMS পাঠানো এবং report দেখার সম্পূর্ণ workflow।",
    icon: CheckCircle2,
    roles: attendanceStaff.concat(studentParent),
    steps: [
      {
        title: "Holiday check করুন",
        page: "Holidays",
        href: "/holidays",
        details:
          "সেদিন কোনো holiday থাকলে attendance mark disabled থাকবে। Holiday আগে থেকে যোগ করা না থাকলে ভুলবশত attendance নেওয়া হতে পারে।",
        roles: attendanceStaff,
      },
      {
        title: "Class attendance mark করুন",
        page: "Attendance › Mark Attendance",
        href: "/attendance/mark",
        details:
          "Class ও section select করুন, তারপর প্রতিটি student-এর Present/Absent/Late বাটনে চাপ দিন। Auto save হয়, আলাদা Save button নেই।",
        roles: attendanceStaff,
      },
      {
        title: "QR/Barcode দিয়ে All Present করুন",
        page: "Attendance › All Present Scanner",
        href: "/attendance/all-present",
        details:
          "ID card-এর QR বা barcode scanner দিয়ে student scan করলে তাৎক্ষণিক present হয়ে যাবে। Bulk/fast attendance-এর জন্য আদর্শ।",
        roles: attendanceStaff,
      },
      {
        title: "Fingerprint যুক্ত করুন",
        page: "Attendance › Add Fingerprint",
        href: "/attendance/add-fingerprint",
        details:
          "Biometric device থাকলে student বা staff-এর fingerprint register করুন। এরপর fingerprint দিয়ে attendance mark করা যাবে।",
        roles: attendanceStaff,
      },
      {
        title: "Present SMS পাঠান",
        page: "Attendance › Present SMS",
        href: "/attendance/present-sms",
        details:
          "Attendance mark করার পর guardian-কে SMS পাঠান। Daily বা Weekly SMS package অনুযায়ী কাজ করে। Free plan-এ SMS সুবিধা নেই।",
        roles: attendanceStaff,
      },
      {
        title: "Attendance SMS Monitoring",
        page: "Attendance › SMS Monitoring",
        href: "/attendance/sms-monitoring",
        details:
          "কোন guardian SMS পেয়েছে, কে পায়নি এবং SMS log এখানে দেখুন। Failed SMS-এর কারণও এখানে দেখা যায়।",
        roles: attendanceStaff,
      },
      {
        title: "Attendance Report দেখুন",
        page: "Attendance › Reports",
        href: "/attendance/reports",
        details:
          "Date range, class ও student filter করে attendance summary দেখুন। কোন student কতদিন present/absent সেটা chart ও table আকারে পাওয়া যায়।",
        roles: attendanceStaff,
      },
      {
        title: "নিজের attendance দেখুন",
        page: "Attendance › My Attendance",
        href: "/attendance/my-attendance",
        details:
          "Teacher, staff, student ও parent নিজের বা সন্তানের attendance calendar দেখতে পারবে। Daily attendance ও মাসিক summary দেখা যায়।",
        roles: attendanceStaff.concat(studentParent),
      },
    ],
  },

  // ─── 5. RESULT & PROMOTION ───────────────────────────────────────────────
  {
    title: "Result Entry ও Promotion Flow",
    description: "পরীক্ষার পর marks entry, result publish, report card এবং class promotion-এর পূর্ণ প্রক্রিয়া।",
    icon: ListChecks,
    roles: academicStaff.concat(studentParent),
    steps: [
      {
        title: "Exam setup নিশ্চিত করুন",
        page: "Academic › Exams",
        href: "/academic/exams",
        details:
          "Result entry শুরুর আগে exam-এর নাম, মোট নম্বর ও subject setup সম্পন্ন থাকতে হবে।",
        roles: academicStaff,
      },
      {
        title: "Result entry করুন",
        page: "Academic › Results",
        href: "/academic/results",
        details:
          "Class, section, exam ও subject বেছে প্রতিটি student-এর marks input করুন। Subject teacher নিজের বিষয়ের marks দিতে পারবে। Result auto save হয়।",
        roles: academicStaff,
      },
      {
        title: "Result workflow manage করুন",
        page: "Academic › Exam Management",
        href: "/academic/exam-management",
        details:
          "Result Draft → Review → Published workflow follow করুন। Published হলে student ও parent দেখতে পারবে। Unpublish করলে আবার edit করা যাবে।",
        roles: leaders,
      },
      {
        title: "Result SMS পাঠান",
        page: "SMS Monitoring",
        href: "/sms-monitoring",
        details:
          "Published result-এর পর guardian-কে SMS notification পাঠান। এতে student-এর exam-এ প্রাপ্ত নম্বর ও grade SMS-এ জানানো হবে। (Paid plan প্রয়োজন)",
        roles: leaders,
      },
      {
        title: "Report card দেখুন ও print করুন",
        page: "Academic › Report Card",
        href: "/academic/report-card",
        details:
          "Result final হলে student ও parent তাদের report card দেখতে ও print করতে পারবে। Head/teacher report card manage ও customize করতে পারবে।",
        roles: ["head", "assistant_head", "class_teacher", "student", "parent"],
      },
      {
        title: "Final Promotion দিন",
        page: "Academic › Final Promotion",
        href: "/academic/promotions",
        details:
          "বার্ষিক পরীক্ষার পর passed student-কে পরের class-এ promote করুন। Failed student-কে আগের class-এ রাখুন। Promote করার আগে target class ও section select করুন।",
        roles: ["head", "assistant_head", "class_teacher"],
      },
    ],
  },

  // ─── 6. FINANCE ──────────────────────────────────────────────────────────
  {
    title: "Finance ও টাকা-পয়সার সব কাজ",
    description: "Fee setup, collection, salary management, reports ও student fee view-এর সম্পূর্ণ workflow।",
    icon: CreditCard,
    roles: financeStaff.concat(studentParent),
    steps: [
      {
        title: "Fee structure তৈরি করুন",
        page: "Finance › Fees",
        href: "/finance/fees",
        details:
          "Admission fee, monthly tuition, exam fee ইত্যাদি class অনুযায়ী fee তৈরি করুন। Fee না থাকলে collection করা যাবে না।",
        roles: ["head", "assistant_head", "finance_officer"],
      },
      {
        title: "Fee collect করুন",
        page: "Finance › Fee Collect",
        href: "/finance/fee-collect",
        details:
          "Student search করুন, due fee দেখুন এবং payment নিন। Receipt auto generate হবে। Online বা cash উভয় পদ্ধতিতে collection করা যায়।",
        roles: financeStaff,
      },
      {
        title: "Monthly Fee Collect করুন",
        page: "Finance › Monthly Collect",
        href: "/finance/collections",
        details:
          "মাসিক invoice তৈরি ও bulk collection এখানে করুন। Class-wise batch collection-এর জন্য সুবিধাজনক।",
        roles: financeStaff,
      },
      {
        title: "Collection history দেখুন",
        page: "Finance › Collections",
        href: "/finance/collections",
        details:
          "কোন দিন কত টাকা কোন student থেকে collect হয়েছে সেটা দেখুন। Date ও class filter করে নির্দিষ্ট সময়ের collection দেখা যায়।",
        roles: financeStaff,
      },
      {
        title: "Salary manage করুন",
        page: "Finance › Salary",
        href: "/finance/salary",
        details:
          "Teacher ও staff-এর মাসিক salary entry করুন, payment mark করুন। Salary history ও outstanding দেখুন।",
        roles: ["head", "finance_officer"],
      },
      {
        title: "Finance Reports দেখুন",
        page: "Finance › Reports",
        href: "/finance/reports",
        details:
          "Total collection, total due, salary expense ও net income এক জায়গায় দেখুন। Date range ও class filter করে detailed financial report পাওয়া যায়।",
        roles: ["head", "assistant_head", "finance_officer"],
      },
      {
        title: "নিজের fee ও payment history দেখুন",
        page: "Finance › My Fees",
        href: "/finance/my-fees",
        details:
          "Student ও parent নিজের বা সন্তানের due fee, paid fee ও payment receipt দেখতে পারবে।",
        roles: studentParent,
      },
    ],
  },

  // ─── 7. COMMUNICATION & NOTICES ──────────────────────────────────────────
  {
    title: "যোগাযোগ: Notice, Messages ও SMS",
    description: "School notice publish, direct messages, custom SMS ও monthly guardian SMS-এর workflow।",
    icon: MessageSquare,
    roles: allSchool,
    steps: [
      {
        title: "Notice publish করুন",
        page: "Notice Board",
        href: "/notices",
        details:
          "School notice, circular বা announcement publish করুন। Role অনুযায়ী সবাই নিজ নিজ notice দেখতে পারবে। Head/teacher notice তৈরি করতে পারবে।",
        roles: allSchool,
      },
      {
        title: "Custom SMS পাঠান",
        page: "Messages",
        href: "/messages",
        details:
          "যেকোনো নম্বরে custom SMS পাঠান। একাধিক নম্বরে একসাথে পাঠানো যায়। SMS balance থাকলেই কাজ করবে। (Paid plan প্রয়োজন)",
        roles: leaders,
      },
      {
        title: "Monthly Guardian SMS পাঠান",
        page: "SMS Monitoring",
        href: "/sms-monitoring",
        details:
          "প্রতি মাসে সব guardian-কে সন্তানের attendance summary ও fee status SMS করুন। 'All Guardian-কে Monthly SMS পাঠান' বাটনে ক্লিক করলে auto send হবে।",
        roles: leaders,
      },
      {
        title: "SMS Recharge করুন",
        page: "SMS Monitoring",
        href: "/sms-monitoring",
        details:
          "SMS balance শেষ হলে এখান থেকে SMS package কিনুন। ১০০, ৫০০, ১০০০ বা custom package বেছে বিকাশ/নগদ দিয়ে payment করুন।",
        roles: leaders,
      },
      {
        title: "Notifications দেখুন",
        page: "Notifications",
        href: "/notifications",
        details:
          "System notification, fee due reminder, result publish alert ইত্যাদি এখানে আসে। Bell icon-এ unread count দেখায়।",
        roles: allSchool,
      },
    ],
  },

  // ─── 8. DOCUMENTS & ID CARDS ─────────────────────────────────────────────
  {
    title: "Documents ও ID Card Management",
    description: "ID card generate, admit card, documents upload, memo ও backup-এর সম্পূর্ণ flow।",
    icon: FileText,
    roles: leaders.concat(["student", "parent", "staff", "finance_officer"]),
    steps: [
      {
        title: "ID Card template তৈরি করুন",
        page: "ID Card › Templates",
        href: "/id-cards/templates",
        details:
          "ID card-এর design, color, layout ও প্রতিষ্ঠানের logo সেট করুন। Template একবার তৈরি হলে সব card-এ apply হবে। (Paid plan প্রয়োজন)",
        roles: leaders,
      },
      {
        title: "ID Card generate করুন",
        page: "ID Card › Generate",
        href: "/id-cards/generate",
        details:
          "Class ও section select করে একসাথে সব student-এর ID card generate করুন। Card-এ নাম, roll, class, section, photo ও QR code থাকে।",
        roles: leaders,
      },
      {
        title: "Bulk ID Card generate করুন",
        page: "ID Card › Bulk Generate",
        href: "/id-cards/bulk-generate",
        details:
          "একসাথে সব class-এর সব student-এর ID card একসাথে তৈরি করুন। Large batch print-এর জন্য ব্যবহার করুন।",
        roles: leaders,
      },
      {
        title: "ID Card print করুন",
        page: "ID Card › Print",
        href: "/id-cards/print",
        details:
          "Generated card-গুলো print-ready view-এ দেখুন এবং printer-এ পাঠান।",
        roles: leaders,
      },
      {
        title: "নিজের ID Card দেখুন",
        page: "ID Card › My Card",
        href: "/id-cards/my-card",
        details:
          "Student, teacher ও staff নিজের ID card দেখত বা download করতে পারবে।",
        roles: allSchool,
      },
      {
        title: "ID Card Renewal করুন",
        page: "ID Card › Renewal",
        href: "/id-cards/renewal",
        details:
          "মেয়াদোত্তীর্ণ বা হারানো card-এর জন্য renewal apply করুন।",
        roles: allSchool,
      },
      {
        title: "Admit Card তৈরি করুন",
        page: "Documents › Admit Cards",
        href: "/documents/admit-cards",
        details:
          "পরীক্ষার আগে class/section অনুযায়ী admit card generate ও print করুন। (Paid plan প্রয়োজন)",
        roles: leaders,
      },
      {
        title: "Memo তৈরি ও print করুন",
        page: "Documents › Memo",
        href: "/documents/memo",
        details:
          "Official memo বা circular তৈরি করুন এবং print করুন।",
        roles: leaders,
      },
      {
        title: "Documents upload ও manage করুন",
        page: "Documents › Manage",
        href: "/documents/manage",
        details:
          "PDF, image বা Word file upload করুন। Student বা staff-এর সাথে share করুন। Download link দিয়ে access দেওয়া যায়।",
        roles: leaders.concat(["finance_officer", "staff"]),
      },
      {
        title: "Database Backup নিন",
        page: "Institution › Backup",
        href: "/institution/backup",
        details:
          "সমগ্র school data-র backup নিন। নিয়মিত backup নেওয়া নিরাপদ। Download করে local storage-এও রাখতে পারেন।",
        roles: ["head"],
      },
    ],
  },

  // ─── 9. QUESTION BANK & AI ────────────────────────────────────────────────
  {
    title: "Question Bank ও AI Tools",
    description: "MCQ, AI-generated question, practice ও question management-এর সম্পূর্ণ workflow।",
    icon: Award,
    roles: academicStaff.concat(studentParent),
    steps: [
      {
        title: "AI দিয়ে Question তৈরি করুন",
        page: "Question Bank › AI Manage",
        href: "/question-bank/ai-manage",
        details:
          "Subject ও topic দিলে AI স্বয়ংক্রিয়ভাবে MCQ ও written question তৈরি করবে। Generated question review করে question bank-এ save করুন। (Paid plan প্রয়োজন)",
        roles: academicStaff,
      },
      {
        title: "MCQ Question তৈরি ও manage করুন",
        page: "Question Bank › MCQ Manage",
        href: "/question-bank/mcq-manage",
        details:
          "নিজে MCQ question তৈরি করুন, edit করুন ও organize করুন। Class, subject ও chapter অনুযায়ী question সাজান।",
        roles: academicStaff,
      },
      {
        title: "Question Generate করুন",
        page: "Question Generate",
        href: "/question-generate",
        details:
          "Specific topic বা syllabus থেকে exam-ready question set তৈরি করুন। AI tool দিয়ে question variety বাড়ান।",
        roles: academicStaff,
      },
      {
        title: "MCQ Practice করুন",
        page: "Question Bank › MCQ Practice",
        href: "/question-bank/mcq-practice",
        details:
          "Student subject অনুযায়ী MCQ practice করতে পারবে। Answer submit করলে সাথে সাথে result ও correct answer দেখাবে।",
        roles: academicStaff.concat(studentParent),
      },
    ],
  },

  // ─── 10. ONLINE CLASSES ───────────────────────────────────────────────────
  {
    title: "Online Classes ও Digital Learning",
    description: "Online class schedule, live class, recorded class ও digital book-এর management।",
    icon: Monitor,
    roles: academicStaff.concat(studentParent),
    steps: [
      {
        title: "Online Class Schedule তৈরি করুন",
        page: "Online Classes › Schedule",
        href: "/online-classes/schedule",
        details:
          "কোন দিন কোন class-এর online class হবে তার schedule তৈরি করুন। Student ও parent দেখতে পারবে।",
        roles: academicStaff,
      },
      {
        title: "Online Class Routine দেখুন",
        page: "Online Classes › Routine",
        href: "/online-classes/routine",
        details:
          "Online class-এর সাপ্তাহিক routine এখানে দেখুন।",
        roles: academicStaff.concat(studentParent),
      },
      {
        title: "Recorded Class দেখুন/আপলোড করুন",
        page: "Online Classes › Recorded",
        href: "/online-classes/recorded",
        details:
          "Teacher recorded video class আপলোড করুন। Student পরে দেখতে পারবে।",
        roles: academicStaff.concat(studentParent),
      },
      {
        title: "Digital Books manage করুন",
        page: "Online Classes › Books",
        href: "/online-classes/books",
        details:
          "Digital textbook বা PDF ebook আপলোড করুন। Student নির্ধারিত book দেখতে ও download করতে পারবে।",
        roles: academicStaff.concat(studentParent),
      },
    ],
  },

  // ─── 11. LEAVE & HOMEWORK ─────────────────────────────────────────────────
  {
    title: "Leave Application ও Homework",
    description: "Student ও staff leave apply, review ও homework management।",
    icon: BookOpen,
    roles: allSchool,
    steps: [
      {
        title: "Leave Apply করুন",
        page: "Leave Application",
        href: "/leave-application",
        details:
          "Student, teacher বা staff নিজের leave apply করবে। Reason ও duration দিয়ে submit করুন।",
        roles: allSchool,
      },
      {
        title: "Leave Review করুন",
        page: "Leave List",
        href: "/leave-list",
        details:
          "Head বা class teacher pending leave application দেখবে এবং approve বা reject করবে।",
        roles: leaders.concat(["class_teacher"]),
      },
      {
        title: "Homework দিন",
        page: "Homework",
        href: "/homework",
        details:
          "Teacher class/subject অনুযায়ী homework দিন। Deadline, description ও attachment যুক্ত করা যায়।",
        roles: academicStaff,
      },
      {
        title: "Homework দেখুন",
        page: "Homework",
        href: "/homework",
        details:
          "Student ও parent দেওয়া homework এবং deadline দেখতে পারবে।",
        roles: studentParent,
      },
    ],
  },

  // ─── 12. LIBRARY & COMMITTEE ─────────────────────────────────────────────
  {
    title: "Library ও Committee Management",
    description: "Library book management, loan tracking ও school committee পরিচালনা।",
    icon: Users,
    roles: leaders.concat(["staff", "student", "parent", "class_teacher", "teacher", "committee_member"]),
    steps: [
      {
        title: "Library Books manage করুন",
        page: "Library › Books",
        href: "/library/books",
        details:
          "নতুন book যোগ করুন, stock update করুন। ISBN, author ও category দিয়ে organize করুন।",
        roles: leaders.concat(["staff"]),
      },
      {
        title: "Book Loan track করুন",
        page: "Library › Loans",
        href: "/library/loans",
        details:
          "কোন student কোন book নিয়েছে, কবে ফেরত দেবে তা track করুন। Overdue book-এর reminder দেখুন।",
        roles: leaders.concat(["staff"]),
      },
      {
        title: "Committee Members manage করুন",
        page: "Committee",
        href: "/committee",
        details:
          "School Managing Committee বা SMC-এর সদস্যদের তথ্য যুক্ত করুন ও পরিচালনা করুন।",
        roles: leaders,
      },
    ],
  },

  // ─── 13. PARENT PORTAL ───────────────────────────────────────────────────
  {
    title: "Parent Portal",
    description: "অভিভাবকের জন্য সন্তানের সব তথ্য এক জায়গায়।",
    icon: GraduationCap,
    roles: ["parent"],
    steps: [
      {
        title: "Parent Portal ব্যবহার করুন",
        page: "Parent Portal",
        href: "/parent-portal",
        details:
          "সন্তানের attendance, result, fee status, homework ও notice এক জায়গায় দেখুন। একাধিক সন্তান থাকলে switch করে দেখা যায়।",
        roles: ["parent"],
      },
    ],
  },

  // ─── 14. CHARTS & REPORTS ────────────────────────────────────────────────
  {
    title: "Charts ও Analytics",
    description: "School performance, attendance, finance ও student data-র visual analytics।",
    icon: BarChart3,
    roles: leaders.concat(["student", "parent"]),
    steps: [
      {
        title: "School Analytics দেখুন",
        page: "Charts",
        href: "/charts",
        details:
          "Attendance rate, fee collection, result performance ও student growth chart আকারে দেখুন।",
        roles: leaders,
      },
      {
        title: "Profile Chart দেখুন",
        page: "Charts › Profile",
        href: "/charts/profile",
        details:
          "নিজের performance, attendance ও academic progress graphically দেখুন।",
        roles: leaders.concat(["student", "parent"]),
      },
      {
        title: "Downloads দেখুন",
        page: "Downloads",
        href: "/downloads",
        details:
          "Report card, fee receipt, attendance report ও অন্যান্য document download করুন।",
        roles: allSchool,
      },
    ],
  },

  // ─── 15. SETTINGS & PROFILE ──────────────────────────────────────────────
  {
    title: "Profile ও Settings",
    description: "নিজের profile update, password change ও system settings।",
    icon: Settings2,
    roles: allSchool,
    steps: [
      {
        title: "নিজের Profile update করুন",
        page: "Profile",
        href: "/profile",
        details:
          "নাম, ছবি, ফোন, ইমেইল ও ব্যক্তিগত তথ্য update করুন। Profile picture change করলে সব জায়গায় auto update হবে।",
        roles: allSchool,
      },
      {
        title: "Password পরিবর্তন করুন",
        page: "Profile › Change Password",
        href: "/profile/change-password",
        details:
          "আগের password দিয়ে verify করে নতুন password set করুন। Strong password ব্যবহার করুন।",
        roles: allSchool,
      },
      {
        title: "System Settings পরিবর্তন করুন",
        page: "Settings",
        href: "/settings",
        details:
          "SMS gateway, payment method, school branding ও notification settings এখানে manage করুন।",
        roles: leaders,
      },
    ],
  },
];

const visibleSteps = (user: any, steps: GuideStep[]) =>
  steps.filter((step) => hasRole(user, step.roles));

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
        description="কোন পেজে আগে কী করতে হবে, তারপর কী করতে হবে এবং role অনুযায়ী কে কোন workflow দেখতে পারবে — সব এক জায়গায়।"
        icon={Route}
        status={<Badge variant="outline" className="capitalize">{String(role).replace(/_/g, " ")}</Badge>}
      />

      {isLoading ? (
        <Card><CardContent className="p-8 text-sm text-muted-foreground">Guide loading...</CardContent></Card>
      ) : visibleSections.length === 0 ? (
        <Card><CardContent className="p-8 text-sm text-muted-foreground">এই role-এর জন্য কোনো guide পাওয়া যায়নি।</CardContent></Card>
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
                      <div
                        key={`${section.title}-${step.href}-${index}`}
                        className="grid gap-3 p-4 md:grid-cols-[48px_1fr_auto] md:items-start"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-full border bg-background text-sm font-bold">
                          {index + 1}
                        </div>
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
