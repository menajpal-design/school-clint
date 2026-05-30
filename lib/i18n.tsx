'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type AppLanguage = 'en' | 'bn';

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (text: string) => string;
};

const dictionary: Record<string, string> = {
  Dashboard: 'ড্যাশবোর্ড',
  Admin: 'অ্যাডমিন',
  Overview: 'ওভারভিউ',
  Institution: 'প্রতিষ্ঠান',
  Academic: 'একাডেমিক',
  Attendance: 'উপস্থিতি',
  Finance: 'ফাইন্যান্স',
  Documents: 'ডকুমেন্ট',
  Management: 'ম্যানেজমেন্ট',
  Settings: 'সেটিংস',
  Profile: 'প্রোফাইল',
  Students: 'শিক্ষার্থী',
  Teachers: 'শিক্ষক',
  Staff: 'স্টাফ',
  Classes: 'ক্লাস',
  Class: 'ক্লাস',
  'Class Routine': 'ক্লাস রুটিন',
  Subjects: 'বিষয়',
  Exams: 'পরীক্ষা',
  Results: 'রেজাল্ট',
  'Report Card': 'রিপোর্ট কার্ড',
  Fees: 'ফি',
  Collections: 'কালেকশন',
  Salary: 'বেতন',
  'Parent Portal': 'অভিভাবক পোর্টাল',
  'Notice Board': 'নোটিশ বোর্ড',
  Notifications: 'নোটিফিকেশন',
  Messages: 'মেসেজ',
  Logout: 'লগআউট',
  Login: 'লগইন',
  Register: 'রেজিস্টার',
  Search: 'সার্চ',
  'Search...': 'সার্চ...',
  Save: 'সেভ',
  'Save Changes': 'পরিবর্তন সেভ',
  Create: 'তৈরি করুন',
  Add: 'যোগ করুন',
  Edit: 'এডিট',
  Delete: 'ডিলিট',
  Refresh: 'রিফ্রেশ',
  Download: 'ডাউনলোড',
  Upload: 'আপলোড',
  Print: 'প্রিন্ট',
  Submit: 'সাবমিট',
  Cancel: 'বাতিল',
  Confirm: 'কনফার্ম',
  Active: 'অ্যাকটিভ',
  Inactive: 'ইনঅ্যাকটিভ',
  Public: 'পাবলিক',
  Private: 'প্রাইভেট',
  English: 'ইংরেজি',
  Bangla: 'বাংলা',
  Language: 'ভাষা',
  Loading: 'লোড হচ্ছে',
  Summary: 'সারসংক্ষেপ',
  Composition: 'গঠন',
  Status: 'স্ট্যাটাস',
  Name: 'নাম',
  Phone: 'ফোন',
  Email: 'ইমেইল',
  Address: 'ঠিকানা',
  Date: 'তারিখ',
  Time: 'সময়',
  Day: 'দিন',
  Note: 'নোট',
  'No data found': 'কোনো ডাটা পাওয়া যায়নি',
  'No notifications': 'কোনো নোটিফিকেশন নেই',
  'Mark all': 'সব চিহ্নিত করুন',
  'Recent Notices': 'সাম্প্রতিক নোটিশ',
  'Monthly SMS Limit': 'মাসিক এসএমএস লিমিট',
  'Used This Month': 'এই মাসে ব্যবহার',
  Remaining: 'বাকি',
  'Not Sent': 'পাঠানো হয়নি',
  'SMS Sent': 'এসএমএস পাঠানো হয়েছে',
  'SMS Not Sent': 'এসএমএস পাঠানো হয়নি',
  'Welcome back': 'আবার স্বাগতম',
  Welcome: 'স্বাগতম',
  'Welcome,': 'স্বাগতম,',
  'Top Due Schools': 'সর্বাধিক বকেয়া স্কুল',
  'Live dashboard': 'লাইভ ড্যাশবোর্ড',
  'Loading live data': 'লাইভ ডাটা লোড হচ্ছে',
  'No live data yet': 'এখনও কোনো লাইভ ডাটা নেই',
  'Subscription and Payment': 'সাবস্ক্রিপশন ও পেমেন্ট',
  'Paid and active': 'পরিশোধিত ও সক্রিয়',
  'Due and inactive': 'বকেয়া ও নিষ্ক্রিয়',
  'Overdue but active': 'বকেয়া কিন্তু সক্রিয়',
  Cancelled: 'বাতিল',
  'See plans': 'প্ল্যান দেখুন',
  'Apply for admission': 'ভর্তির জন্য আবেদন করুন',
  'Check result': 'রেজাল্ট দেখুন',
  'Download App': 'অ্যাপ ডাউনলোড',
  'Download Android app': 'অ্যান্ড্রয়েড অ্যাপ ডাউনলোড করুন',
  'School management and billing': 'স্কুল ম্যানেজমেন্ট ও বিলিং',
  'Latest announcements from the institution': 'প্রতিষ্ঠানের সর্বশেষ ঘোষণা',
  'Institution Composition': 'প্রতিষ্ঠানের গঠন',
  'Distribution of students, teachers, and staff': 'শিক্ষার্থী, শিক্ষক ও স্টাফের বণ্টন',
  'Attendance Overview': 'উপস্থিতি সারসংক্ষেপ',
  "Today's attendance statistics": 'আজকের উপস্থিতির পরিসংখ্যান',
  'Monthly Fee Collection Trend': 'মাসিক ফি সংগ্রহের প্রবণতা',
  'Fee collection over the past months': 'গত কয়েক মাসের ফি সংগ্রহ',
  'Institution Profile Charts': 'প্রতিষ্ঠান প্রোফাইল চার্ট',
  'Parent Charts': 'অভিভাবক চার্ট',
  'Child Attendance': 'সন্তানের উপস্থিতি',
  'Fee Trend (Institution)': 'ফি ট্রেন্ড (প্রতিষ্ঠান)',
  'Child attendance and fee overview': 'সন্তানের উপস্থিতি ও ফি সারসংক্ষেপ',
  'Institution details, billing, and storage status.': 'প্রতিষ্ঠানের বিবরণ, বিলিং ও স্টোরেজ অবস্থা।',
  'Role-based overview for': 'রোলভিত্তিক সারসংক্ষেপ',
  operations: 'পরিচালনার জন্য',
  Pricing: 'প্রাইসিং',
  'School/Madrasah Management': 'স্কুল/মাদ্রাসা ম্যানেজমেন্ট',
  'Role-based school operations': 'রোলভিত্তিক স্কুল পরিচালনা',
  'EASY SCHOOL - School/Madrasah Management System': 'ইজি স্কুল - স্কুল/মাদ্রাসা ম্যানেজমেন্ট সিস্টেম',
  'A professional dashboard for academics, attendance, finance, ID cards, documents, notices, parents and staff operations.': 'শিক্ষা, উপস্থিতি, ফাইন্যান্স, আইডি কার্ড, ডকুমেন্ট, নোটিশ, অভিভাবক ও স্টাফ পরিচালনার জন্য একটি পেশাদার ড্যাশবোর্ড।',
  'Login to dashboard': 'ড্যাশবোর্ডে লগইন করুন',
  'Generate ID': 'আইডি তৈরি করুন',
  'Scan & Mark': 'স্ক্যান ও চিহ্নিত করুন',
  'Upload Doc': 'ডকুমেন্ট আপলোড করুন',
  'Collect Fees': 'ফি সংগ্রহ করুন',
  'Live Module Preview': 'লাইভ মডিউল প্রিভিউ',
  'Academic Control': 'একাডেমিক নিয়ন্ত্রণ',
  'Classes, subjects, exams, results and report cards in one clean workflow.': 'ক্লাস, বিষয়, পরীক্ষা, রেজাল্ট এবং রিপোর্ট কার্ড এক পরিষ্কার ওয়ার্কফ্লোতে।',
  'Attendance & ID Cards': 'উপস্থিতি ও আইডি কার্ড',
  'Track daily attendance and connect every student, teacher and staff member with secure ID cards.': 'দৈনিক উপস্থিতি ট্র্যাক করুন এবং প্রতিটি শিক্ষার্থী, শিক্ষক ও স্টাফকে নিরাপদ আইডি কার্ডের সাথে যুক্ত করুন।',
  'Finance & Reports': 'ফাইন্যান্স ও রিপোর্ট',
  'Manage fees, salary, collections, due reports and receipts with role-aware access.': 'রোলভিত্তিক অ্যাক্সেসসহ ফি, বেতন, কালেকশন, বকেয়া রিপোর্ট এবং রসিদ পরিচালনা করুন।',
  'Secure role-based access': 'নিরাপদ রোলভিত্তিক অ্যাক্সেস',
  'Run every school operation from one professional dashboard.': 'একটি পেশাদার ড্যাশবোর্ড থেকেই সব স্কুল পরিচালনা করুন।',
  'Manage academics, attendance, finance, ID cards, notices, documents and parent communication with clean permissions for every role.': 'শিক্ষা, উপস্থিতি, ফাইন্যান্স, আইডি কার্ড, নোটিশ, ডকুমেন্ট এবং অভিভাবক যোগাযোগ—সব রোলের জন্য পরিষ্কার পারমিশনসহ পরিচালনা করুন।',
  'Login to EASY SCHOOL': 'ইজি স্কুলে লগইন করুন',
  'Use your username, email or mobile number and password to continue.': 'চালিয়ে যেতে ইউজারনেম, ইমেইল বা মোবাইল নম্বর এবং পাসওয়ার্ড ব্যবহার করুন।',
  'Username, email or mobile': 'ইউজারনেম, ইমেইল বা মোবাইল',
  'username, you@example.com or 01XXXXXXXXX': 'ইউজারনেম, you@example.com বা 01XXXXXXXXX',
  'Enter your password': 'আপনার পাসওয়ার্ড লিখুন',
  'Hide password': 'পাসওয়ার্ড লুকান',
  'Show password': 'পাসওয়ার্ড দেখান',
  'Remember me': 'আমাকে মনে রাখুন',
  'Forgot password?': 'পাসওয়ার্ড ভুলে গেছেন?',
  'Logging in': 'লগইন হচ্ছে',
  'New institution or account?': 'নতুন প্রতিষ্ঠান বা অ্যাকাউন্ট?',
  'Register here': 'এখানে রেজিস্টার করুন',
  'Login successful': 'লগইন সফল',
  'Redirecting to your workspace.': 'আপনার ওয়ার্কস্পেসে নেওয়া হচ্ছে।',
  'Demo role not available': 'ডেমো রোল পাওয়া যাচ্ছে না',
  'Admin and Super Admin are not available in demo mode.': 'ডেমো মোডে অ্যাডমিন এবং সুপার অ্যাডমিন পাওয়া যাবে না।',
  'Demo mode enabled': 'ডেমো মোড চালু হয়েছে',
  'All data will stay in your browser only.': 'সব ডাটা শুধু আপনার ব্রাউজারে থাকবে।',
  'Tip:': 'টিপস:',
  'Login failed? Try the demo mode below to explore the system as a student or teacher, or contact your administrator.': 'লগইন ব্যর্থ? নিচের ডেমো মোডে ছাত্র বা শিক্ষক হিসেবে সিস্টেমটি দেখুন, অথবা অ্যাডমিনের সাথে যোগাযোগ করুন।',
  'Students and teachers can use the demo mode below to explore the system without credentials.': 'শিক্ষার্থী ও শিক্ষকরা ক্রেডেনশিয়াল ছাড়াই সিস্টেম দেখতে নিচের ডেমো মোড ব্যবহার করতে পারেন।',
  'Test Credentials (Development)': 'টেস্ট ক্রেডেনশিয়াল (ডেভেলপমেন্ট)',
  'Student:': 'শিক্ষার্থী:',
  'Teacher:': 'শিক্ষক:',
  'Admin:': 'অ্যাডমিন:',
  'All credentials use password:': 'সব ক্রেডেনশিয়ালে পাসওয়ার্ড:',
  'Demo login': 'ডেমো লগইন',
  'No server, no SMS, no mail, all data stays local.': 'কোনো সার্ভার, এসএমএস বা মেইল নেই—সব ডাটা লোকালেই থাকে।',
  'Demo role': 'ডেমো রোল',
  'Enter demo mode': 'ডেমো মোডে প্রবেশ করুন',
  'Reset request sent': 'রিসেট অনুরোধ পাঠানো হয়েছে',
  'Password reset instructions have been sent to your email address.': 'পাসওয়ার্ড রিসেটের নির্দেশনা আপনার ইমেইলে পাঠানো হয়েছে।',
  'Unable to process password reset request.': 'পাসওয়ার্ড রিসেট অনুরোধ প্রক্রিয়া করা যাচ্ছে না।',
  'Reset request failed': 'রিসেট অনুরোধ ব্যর্থ',
  'Public password recovery': 'পাবলিক পাসওয়ার্ড পুনরুদ্ধার',
  'Reset access without waiting for admin support.': 'অ্যাডমিনের সহায়তার অপেক্ষা না করেই অ্যাক্সেস রিসেট করুন।',
  'Enter your email, username, or phone number. We\'ll generate a temporary password and send it to the email on file.': 'আপনার ইমেইল, ইউজারনেম বা ফোন নম্বর দিন। আমরা একটি সাময়িক পাসওয়ার্ড তৈরি করে রেকর্ডকৃত ইমেইলে পাঠাব।',
  'After logging in, change the temporary password immediately from your profile.': 'লগইন করার পর প্রোফাইল থেকে সঙ্গে সঙ্গে সাময়িক পাসওয়ার্ড পরিবর্তন করুন।',
  'We\'ll send a temporary password to the email linked to your account.': 'আপনার অ্যাকাউন্টের সঙ্গে যুক্ত ইমেইলে একটি সাময়িক পাসওয়ার্ড পাঠানো হবে।',
  'Request sent': 'অনুরোধ পাঠানো হয়েছে',
  'Check your email for the temporary password, then sign in and change it right away.': 'সাময়িক পাসওয়ার্ডের জন্য ইমেইল দেখুন, তারপর সাইন ইন করে সঙ্গে সঙ্গে পরিবর্তন করুন।',
  'Email, username, or phone': 'ইমেইল, ইউজারনেম বা ফোন',
  'Sending reset email': 'রিসেট ইমেইল পাঠানো হচ্ছে',
  'Send reset email': 'রিসেট ইমেইল পাঠান',
  'Remembered your password?': 'পাসওয়ার্ড মনে পড়েছে?',
  'Back to login': 'লগইনে ফিরে যান',
  'Name must be at least 2 characters': 'নাম কমপক্ষে ২ অক্ষরের হতে হবে',
  'Institution name is required': 'প্রতিষ্ঠানের নাম আবশ্যক',
  'Invalid email address': 'ইমেইল ঠিকানা সঠিক নয়',
  'Password must be at least 6 characters': 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে',
  "Passwords don't match": 'পাসওয়ার্ড মিলছে না',
  'School Management System': 'স্কুল ম্যানেজমেন্ট সিস্টেম',
  'Selected plan': 'নির্বাচিত প্ল্যান',
  'Payable by popup after registration: ': 'রেজিস্ট্রেশনের পরে পপআপের মাধ্যমে পরিশোধযোগ্য: ',
  'Popup payment only': 'শুধু পপআপ পেমেন্ট',
  'Registration করার পরে Billing page থেকে শুধু popup payment হবে। Billing number, Transaction ID, Sender number বা Paid amount manually দিতে হবে না।': 'রেজিস্ট্রেশনের পরে বিলিং পেজ থেকে শুধু পপআপ পেমেন্ট হবে। বিলিং নম্বর, ট্রানজ্যাকশন আইডি, সেন্ডার নম্বর বা পেইড অ্যামাউন্ট হাতে দিতে হবে না।',
  'Full Name': 'পূর্ণ নাম',
  'Institution Name': 'প্রতিষ্ঠানের নাম',
  'Your school or madrasah': 'আপনার স্কুল বা মাদ্রাসা',
  'Email Address': 'ইমেইল ঠিকানা',
  'Phone Number (Optional)': 'ফোন নম্বর (ঐচ্ছিক)',
  'User Role': 'ইউজার রোল',
  'Institution Head': 'প্রতিষ্ঠান প্রধান',
  'Confirm Password': 'পাসওয়ার্ড নিশ্চিত করুন',
  'Creating Account...': 'অ্যাকাউন্ট তৈরি হচ্ছে...',
  'Already have an account?': 'আগেই অ্যাকাউন্ট আছে?',
  'Login here': 'এখানে লগইন করুন',
  Success: 'সফল',
  'Account created successfully. Please complete billing by popup payment.': 'অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে। অনুগ্রহ করে পপআপ পেমেন্টের মাধ্যমে বিলিং সম্পন্ন করুন।',
  Error: 'ত্রুটি',
  'Registration failed': 'রেজিস্ট্রেশন ব্যর্থ',
  'Select a school first.': 'প্রথমে একটি স্কুল নির্বাচন করুন।',
  'Submitting application...': 'আবেদন পাঠানো হচ্ছে...',
  'Application submitted. You will receive SMS after approval.': 'আবেদন জমা হয়েছে। অনুমোদনের পর আপনি এসএমএস পাবেন।',
  'Submission failed.': 'জমা দিতে ব্যর্থ হয়েছে।',
  'Admission Application': 'ভর্তি আবেদন',
  'Search a registered school and apply for admission.': 'রেজিস্টার করা স্কুল খুঁজে ভর্তি আবেদন করুন।',
  'Apply to': 'ভর্তির জন্য আবেদন করুন',
  'Registered Schools': 'রেজিস্টার্ড স্কুলসমূহ',
  'Select the school where you want to apply.': 'যে স্কুলে আবেদন করতে চান সেটি নির্বাচন করুন।',
  'Search school, address or EIIN': 'স্কুল, ঠিকানা বা EIIN খুঁজুন',
  'Application Details': 'আবেদনের বিবরণ',
  'Provide student, guardian, previous school and result information.': 'শিক্ষার্থী, অভিভাবক, পূর্বের স্কুল এবং ফলাফলের তথ্য দিন।',
  'Student Name': 'শিক্ষার্থীর নাম',
  'Class for Admission': 'ভর্তির শ্রেণি',
  'Date of Birth': 'জন্মতারিখ',
  'Guardian Name': 'অভিভাবকের নাম',
  'Guardian Phone': 'অভিভাবকের ফোন',
  'Guardian Email': 'অভিভাবকের ইমেইল',
  'Previous School': 'পূর্বের স্কুল',
  'Previous Result': 'পূর্বের ফলাফল',
  'Full address': 'পূর্ণ ঠিকানা',
  'Select school and enter roll number.': 'স্কুল নির্বাচন করে রোল নম্বর দিন।',
  Searching: 'খোঁজা হচ্ছে',
  'Result not found.': 'রেজাল্ট পাওয়া যায়নি।',
  'Public Result': 'পাবলিক রেজাল্ট',
  'Search school, select class and exam, then enter roll number.': 'স্কুল খুঁজুন, শ্রেণি ও পরীক্ষা নির্বাচন করুন, তারপর রোল নম্বর দিন।',
  Home: 'হোম',
  School: 'স্কুল',
  'Registered schools are shown here.': 'রেজিস্টার্ড স্কুলগুলো এখানে দেখানো হয়েছে।',
  'School name or EIIN': 'স্কুলের নাম বা EIIN',
  'Result Lookup': 'রেজাল্ট অনুসন্ধান',
  'All classes': 'সব ক্লাস',
  'All published exams': 'সব প্রকাশিত পরীক্ষা',
  'Roll number': 'রোল নম্বর',
  'View Result': 'রেজাল্ট দেখুন',
  Total: 'মোট',
  Percentage: 'শতকরা',
  Passed: 'পাস',
  Failed: 'ফেল',
  'Subject-wise marks': 'বিষয়ভিত্তিক নম্বর',
  Exam: 'পরীক্ষা',
  Subject: 'বিষয়',
  Marks: 'নম্বর',
  Grade: 'গ্রেড',
};

const reverseDictionary = Object.fromEntries(Object.entries(dictionary).map(([english, bangla]) => [bangla, english]));
const englishEntries = Object.entries(dictionary).sort((left, right) => right[0].length - left[0].length);
const banglaEntries = Object.entries(reverseDictionary).sort((left, right) => right[0].length - left[0].length);

const LanguageContext = createContext<LanguageContextValue | null>(null);

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function translateText(text: string, language: AppLanguage) {
  if (!text) return text;

  const trimmed = text.trim();
  if (!trimmed) return text;

  const exact = language === 'bn' ? dictionary[trimmed] : reverseDictionary[trimmed];
  if (exact) return text.replace(trimmed, exact);

  const entries = language === 'bn' ? englishEntries : banglaEntries;
  let result = text;

  entries.forEach(([source, target]) => {
    if (!source || !target) return;
    result = result.replace(new RegExp(escapeRegExp(source), 'g'), target);
  });

  return result;
}

function shouldSkipElement(element: Element | null) {
  if (!element) return true;
  return ['script', 'style', 'textarea', 'input', 'select', 'option', 'svg', 'path'].includes(element.tagName.toLowerCase());
}

function applyDomLanguage(language: AppLanguage) {
  if (typeof document === 'undefined') return;

  document.documentElement.lang = language;
  document.documentElement.dir = 'ltr';
  document.body?.setAttribute('data-language', language);

  if (document.title) document.title = translateText(document.title, language);

  document.querySelectorAll('meta[name="description"], meta[property="og:title"], meta[property="og:description"], meta[name="twitter:title"], meta[name="twitter:description"]').forEach((element) => {
    const content = element.getAttribute('content');
    if (content) element.setAttribute('content', translateText(content, language));
  });

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (shouldSkipElement(node.parentElement)) return NodeFilter.FILTER_REJECT;
      const value = node.nodeValue || '';
      return value.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });

  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  nodes.forEach((node) => {
    node.nodeValue = translateText(node.nodeValue || '', language);
  });

  document.querySelectorAll<HTMLElement>('[title], [placeholder], [aria-label]').forEach((element) => {
    if (shouldSkipElement(element)) return;
    ['title', 'placeholder', 'aria-label'].forEach((attribute) => {
      const value = element.getAttribute(attribute);
      if (value) element.setAttribute(attribute, translateText(value, language));
    });
  });
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>('en');

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('appLanguage') : null;
    if (saved === 'bn' || saved === 'en') setLanguageState(saved);
  }, []);

  const setLanguage = (nextLanguage: AppLanguage) => {
    setLanguageState(nextLanguage);
    if (typeof window !== 'undefined') {
      localStorage.setItem('appLanguage', nextLanguage);
      window.location.reload();
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('appLanguage', language);
    }

    const run = () => applyDomLanguage(language);
    const frameId = window.requestAnimationFrame(run);
    return () => window.cancelAnimationFrame(frameId);
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t: (text: string) => translateText(text, language),
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: 'en' as AppLanguage,
      setLanguage: () => undefined,
      t: (text: string) => text,
    };
  }
  return context;
}