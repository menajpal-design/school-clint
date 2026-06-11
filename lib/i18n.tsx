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
  Finance: 'অর্থ ব্যবস্থাপনা',
  Documents: 'নথিপত্র',
  Management: 'ব্যবস্থাপনা',
  Settings: 'সেটিংস',
  Profile: 'প্রোফাইল',
  Holidays: 'ছুটির তালিকা',
  'ID Card': 'আইডি কার্ড',
  'My ID Card': 'আমার আইডি কার্ড',
  'Generate Card': 'কার্ড তৈরি করুন',
  'Admit Card': 'অ্যাডমিট কার্ড (Admit Card)',
  'Bulk Generate': 'বাল্ক জেনারেট',
  Templates: 'টেমপ্লেটসমূহ',
  Reports: 'রিপোর্টসমূহ',
  'Billing & Subscription': 'বিলিং ও সাবস্ক্রিপশন',
  'SMS Balance': 'এসএমএস ব্যালেন্স',
  'Finance Audit': 'আর্থিক অডিট (Finance Audit)',
  'Leave Application': 'ছুটির আবেদন',
  'Apply for Leave': 'আবেদন করুন',
  'Leave List': 'ছুটির তালিকা',
  'School Management': 'স্কুল ব্যবস্থাপনা',
  'SMS Usage': 'এসএমএস ব্যবহার',
  'Select School': 'স্কুল নির্বাচন',
  'User Management': 'ব্যবহারকারী ব্যবস্থাপনা',
  'Backup & Restore': 'ব্যাকআপ ও রিস্টোর',
  Sections: 'সেকশন',
  Syllabus: 'সিলেবাস',
  'Exam Routine': 'পরীক্ষার রুটিন',
  'Final Promotion': 'চূড়ান্ত প্রমোশন',
  'Mark Attendance': 'উপস্থিতি নিন',
  'All Present Scanner': 'অল প্রেজেন্ট স্ক্যানার',
  'My Attendance': 'আমার উপস্থিতি',
  'Users & Roles': 'ব্যবহারকারী ও ভূমিকা',
  'All Users': 'সকল ব্যবহারকারী',
  'Roles & Permissions': 'ভূমিকা ও অনুমতি',
  Committee: 'কমিটি',
  Library: 'লাইব্রেরি',
  Books: 'বই',
  Loans: 'ধার',
  Homework: 'হোমওয়ার্ক',
  'SMS Monitoring': 'SMS মনিটরিং',
  'My Profile': 'আমার প্রোফাইল',
  'Change Password': 'পাসওয়ার্ড পরিবর্তন',
  Expand: 'বড় করুন',
  Collapse: 'ছোট করুন',
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
  'Institution Profile': 'প্রতিষ্ঠান প্রোফাইল',
  'Edit identity, contact details and official assets.': 'পরিচয়, যোগাযোগের বিবরণ এবং অফিশিয়াল অ্যাসেট সম্পাদনা করুন।',
  'Profile Details': 'প্রোফাইলের বিবরণ',
  'These details are used in admissions, reports, cards, and certificates.': 'এই বিবরণগুলো ভর্তি, রিপোর্ট, কার্ড এবং সার্টিফিকেটে ব্যবহৃত হয়।',
  'Phone Number': 'ফোন নম্বর',
  'Official Seal': 'অফিশিয়াল সিল',
  'Head Teacher\'s Signature': 'প্রধান শিক্ষকের স্বাক্ষর',
  'Card Preview': 'কার্ড প্রিভিউ',
  'Preview of how the institution\'s information will appear on official headers and ID cards.': 'অফিশিয়াল হেডার ও আইডি কার্ডে কীভাবে প্রতিষ্ঠানের তথ্য দেখাবে তার প্রিভিউ।',
  'Save Profile': 'প্রোফাইল সংরক্ষণ করুন',
  'Click to upload': 'আপলোড করতে ক্লিক করুন',
  'Uploading...': 'আপলোড হচ্ছে...',
  'Max 5MB · JPG, PNG, WebP': 'সর্বোচ্চ ৫এমবি · JPG, PNG, WebP',
  'School': 'বিদ্যালয়',
  'Madrasah': 'মাদ্রাসা',
  'Type': 'ধরণ',
  'Website': 'ওয়েবসাইট',
  'Domains': 'ডোমেনসমূহ',
  'Provide one domain per line. The public results page will be accessible from these domains.': 'প্রতি লাইনে একটি করে ডোমেন দিন। পাবলিক রেজাল্ট দেখার পেজটি এই ডোমেনগুলো থেকে ডাটা খুঁজে বের করতে পারবে।',
  'Storage': 'স্টোরেজ',
  'Images are stored in MongoDB GridFS. Set a MongoDB URI per school for separate storage.': 'ছবিগুলো মঙ্গোডিবি গ্রিডএফএস (GridFS)-এ সংরক্ষিত হয়। আলাদা স্টোরেজের জন্য স্কুল প্রতি একটি মঙ্গোডিবি ইউআরআই সেট করুন।',
  'MongoDB URI (Optional)': 'MongoDB URI (ঐচ্ছিক)',
  '✅ Images are now on ': '✅ ছবিগুলো এখন ',
  ' - no external API key needed.': ' — কোনো এক্সটার্নাল এপিআই কি প্রয়োজন নেই।',
  'SMS Settings': 'এসএমএস সেটিংস',
  'Configure SMS provider and API keys. Visible only to headmaster.': 'এসএমএস প্রোভাইডার এবং এপিআই কি কনফিগার করুন। শুধুমাত্র প্রধান শিক্ষকের জন্য দৃশ্যমান।',
  'Enable SMS': 'এসএমএস চালু করুন',
  'Enable/disable SMS notifications for this institution.': 'এই প্রতিষ্ঠানের জন্য এসএমএস নোটিফিকেশন চালু/বন্ধ করুন।',
  'Provider': 'প্রোভাইডার',
  'API URL': 'এপিআই ইউআরএল',
  'API Key': 'এপিআই কি',
  'Academic Year Settings': 'শিক্ষাবর্ষের সেটিংস',
  'Use one line per year: Year | MongoDB URI | ImgBB API Key': 'প্রতি বছরের জন্য একটি করে লাইন ব্যবহার করুন: শিক্ষাবর্ষ | মঙ্গোডিবি ইউআরআই | ইমজবিবি এপিআই কি',
  'Active Academic Year': 'সক্রিয় শিক্ষাবর্ষ',
  'Yearly Storage': 'বছর-ভিত্তিক স্টোরেজ',
  'Billing & Activation': 'বিলিং এবং অ্যাক্টিভেশন',
  'Activate school after recording payment received.': 'প্রাপ্ত পেমেন্ট রেকর্ড করার পর স্কুলটি সক্রিয় করুন।',
  'Plan': 'প্ল্যান',
  'Billing Cycle': 'বিলিং চক্র',
  'EASY SCHOOL storage - ৳100/month': 'EASY SCHOOL storage - ৳100/মাস',
  'Own MongoDB URI and ImgBB API - no extra cost': 'নিজস্ব মঙ্গোডিবি ইউআরআই এবং ইমজবিবি এপিআই - কোনো অতিরিক্ত খরচ নেই',
  'School Status': 'স্কুলের অবস্থা',
  'Only platform admin can activate or suspend a school.': 'শুধুমাত্র প্ল্যাটফর্ম এডমিন কোনো স্কুল সক্রিয় বা স্থগিত করতে পারেন।',
  'Payment Received': 'প্রাপ্ত পেমেন্ট',
  'Received': 'প্রাপ্ত হয়েছে',
  'Not Received': 'প্রাপ্ত হয়নি',
  'Received Amount': 'প্রাপ্ত পরিমাণ',
  'Gateway': 'গেটওয়ে',
  'Payment transaction ID': 'পেমেন্ট ট্রানজেকশন আইডি',
  'Plan Due: ': 'প্ল্যান বকেয়া: ',
  ' + Storage ': ' + স্টোরেজ ',
  '. Yearly Discount: ': '. বার্ষিক ছাড়: ',
  'Subscription': 'সাবস্ক্রিপশন',
  'Manage subscription and view active package.': 'সাবস্ক্রিপশন পরিচালনা করুন এবং সক্রিয় প্যাকেজ দেখুন।',
  'Manage Subscription': 'সাবস্ক্রিপশন পরিচালনা করুন',
  'Billing Dashboard': 'বিলিং ড্যাশবোর্ড',
  // Sidebar missing items
  'Subscriptions': 'সাবস্ক্রিপশনসমূহ',
  'Accounting': 'হিসাবরক্ষণ',
  'Admin SMS Monitoring': 'এডমিন এসএমএস মনিটরিং',
  'Charts': 'চার্টসমূহ',
  'Profile Charts': 'প্রোফাইল চার্টসমূহ',
  'Downloads': 'ডাউনলোডসমূহ',
  'Online Classes': 'অনলাইন ক্লাস',
  'Online Routine': 'অনলাইন রুটিন',
  'Recorded Classes': 'রেকর্ডকৃত ক্লাস',
  'Class Schedule': 'ক্লাসের সময়সূচী',
  'PDF Books': 'পিডিএফ বই',
  'Print Card': 'কার্ড প্রিন্ট করুন',
  'Renewal': 'নবায়ন',
  'Pending Admissions': 'অপেক্ষমান ভর্তি',
  'Admission': 'ভর্তি',
  'Subordinates': 'অধীনস্থ',
  'Backup': 'ব্যাকআপ',
  'Class Routine Overview': 'ক্লাস রুটিনের ওভারভিউ',
  'Question Bank': 'প্রশ্ন ব্যাংক',
  'Question Generate': 'প্রশ্ন তৈরি করুন',
  'Question Storage': 'প্রশ্ন সংরক্ষণ',
  'AI Question Manage': 'এআই প্রশ্ন ব্যবস্থাপনা',
  'AI Storage': 'এআই স্টোরেজ',
  'MCQ Manage': 'এমসিকিউ ব্যবস্থাপনা',
  'MCQ Storage': 'এমসিকিউ স্টোরেজ',
  'MCQ Practice': 'এমসিকিউ অনুশীলন',
  'Practice Storage': 'অনুশীলন স্টোরেজ',
  'Add Fingerprint': 'আঙুলের ছাপ যোগ করুন',
  'Attendance SMS': 'উপস্থিতির এসএমএস',
  'Memo': 'মেমো',
  'Admit Cards': 'অ্যাডমিট কার্ডসমূহ',
  'Document SMS': 'নথিপত্রের এসএমএস',

  // Dashboard missing items
  'Quick Actions': 'দ্রুত অ্যাকশন',
  'Actions are filtered by your role and permission.': 'অ্যাকশনসমূহ আপনার রোল এবং পারমিশন অনুযায়ী ফিল্টার করা হয়েছে।',
  'Analytics Overview': 'বিশ্লেষণ ওভারভিউ',
  'Loading analytics dashboard...': 'অ্যানালিটিক্স ড্যাশবোর্ড লোড হচ্ছে...',
  'Total Students': 'মোট শিক্ষার্থী',
  'Total Teachers': 'মোট শিক্ষক',
  'Today Attendance': 'আজকের উপস্থিতি',
  'Active Notices': 'সক্রিয় নোটিশ',
  'Attendance Rate': 'উপস্থিতির হার',
  'Fee Balance Dues': 'বকেয়া ফি',
  'Published Results': 'প্রকাশিত রেজাল্ট',
  'No fee collection data found.': 'কোনো ফি সংগ্রহের ডাটা পাওয়া যায়নি।',
  'No class attendance data found for today. Mark attendance first to see dynamic rates.': 'আজকের কোনো ক্লাসের উপস্থিতির ডাটা পাওয়া যায়নি। ডায়নামিক হার দেখতে প্রথমে উপস্থিতি দিন।',
  'Students distribution will appear after class data is available.': 'ক্লাসের ডাটা পাওয়া যাওয়ার পর শিক্ষার্থীর বণ্টন দেখতে পাবেন।',
  'No weekly attendance data found.': 'কোনো সাপ্তাহিক উপস্থিতির ডাটা পাওয়া যায়নি।',
  'No attendance summary found.': 'কোনো উপস্থিতির সারসংক্ষেপ পাওয়া যায়নি।',
  'No fee payment data found.': 'কোনো পেমেন্টের ডাটা পাওয়া যায়নি।',
  'No published marks found.': 'কোনো প্রকাশিত নম্বরের ডাটা পাওয়া যায়নি।',
  'Monthly Fee Collections (Revenue)': 'মাসিক ফি সংগ্রহ (রাজস্ব)',
  'Class-wise Daily Attendance Rate (%)': 'শ্রেণিভিত্তিক দৈনিক উপস্থিতির হার (%)',
  'Weekly Attendance Rates (%)': 'সাপ্তাহিক উপস্থিতির হার (%)',
  'Attendance Summary': 'উপস্থিতির সারসংক্ষেপ',
  'Fee Payment Summary (৳)': 'ফি পেমেন্টের সারসংক্ষেপ (৳)',
  'Academic Subject-wise Marks (%)': 'একাডেমিক বিষয়ভিত্তিক নম্বর (%)',

  'Role-based dashboard for Head. Only permitted actions are shown here.': 'প্রধান শিক্ষকের জন্য ভূমিকা-ভিত্তিক ড্যাশবোর্ড। শুধুমাত্র অনুমোদিত কাজগুলো এখানে দেখানো হয়েছে।',
  'Role-based dashboard for Assistant Head. Only permitted actions are shown here.': 'সহকারী প্রধান শিক্ষকের জন্য ভূমিকা-ভিত্তিক ড্যাশবোর্ড। শুধুমাত্র অনুমোদিত কাজগুলো এখানে দেখানো হয়েছে।',
  'Role-based dashboard for Class Teacher. Only permitted actions are shown here.': 'শ্রেণি শিক্ষকের জন্য ভূমিকা-ভিত্তিক ড্যাশবোর্ড। শুধুমাত্র অনুমোদিত কাজগুলো এখানে দেখানো হয়েছে।',
  'Role-based dashboard for Student. Only permitted actions are shown here.': 'শিক্ষার্থীর জন্য ভূমিকা-ভিত্তিক ড্যাশবোর্ড। শুধুমাত্র অনুমোদিত কাজগুলো এখানে দেখানো হয়েছে।',
  'Role-based dashboard for Parent. Only permitted actions are shown here.': 'অভিভাবকের জন্য ভূমিকা-ভিত্তিক ড্যাশবোর্ড। শুধুমাত্র অনুমোদিত কাজগুলো এখানে দেখানো হয়েছে।',
  'Role-based dashboard for Teacher. Only permitted actions are shown here.': 'শিক্ষকের জন্য ভূমিকা-ভিত্তিক ড্যাশবোর্ড। শুধুমাত্র অনুমোদিত কাজগুলো এখানে দেখানো হয়েছে।',
  'Role-based dashboard for Finance Officer. Only permitted actions are shown here.': 'অর্থ কর্মকর্তার জন্য ভূমিকা-ভিত্তিক ড্যাশবোর্ড। শুধুমাত্র অনুমোদিত কাজগুলো এখানে দেখানো হয়েছে।',
  'Role-based dashboard for Staff. Only permitted actions are shown here.': 'স্টাফের জন্য ভূমিকা-ভিত্তিক ড্যাশবোর্ড। শুধুমাত্র অনুমোদিত কাজগুলো এখানে দেখানো হয়েছে।',
  'Role-based dashboard for Guest. Only permitted actions are shown here.': 'গেস্টের জন্য ভূমিকা-ভিত্তিক ড্যাশবোর্ড। শুধুমাত্র অনুমোদিত কাজগুলো এখানে দেখানো হয়েছে।',

  'Head': 'প্রধান শিক্ষক',
  'Assistant Head': 'সহকারী প্রধান শিক্ষক',
  'Class Teacher': 'শ্রেণি শিক্ষক',
  'Finance Officer': 'অর্থ কর্মকর্তা',
  'Guest': 'গেস্ট',

  'My Result': 'আমার রেজাল্ট',
  'View and download your own result only.': 'শুধুমাত্র নিজের রেজাল্ট দেখুন এবং ডাউনলোড করুন।',
  'View your own attendance record.': 'নিজের উপস্থিতির রেকর্ড দেখুন।',
  'Preview or download your ID card.': 'আপনার আইডি কার্ডের প্রিভিউ দেখুন বা ডাউনলোড করুন।',
  'View your own fee status.': 'নিজের ফির অবস্থা দেখুন।',
  'View your class syllabus only.': 'শুধুমাত্র আপনার ক্লাসের সিলেবাস দেখুন।',
  'View your class routine only.': 'শুধুমাত্র আপনার ক্লাসের রুটিন দেখুন।',
  'See today\'s and previous homework.': 'আজকের এবং আগের হোমওয়ার্ক দেখুন।',
  'Apply for leave and view your applications.': 'ছুটির আবেদন করুন এবং আপনার আবেদনগুলো দেখুন।',

  'Child Result': 'সন্তানের রেজাল্ট',
  'View and download child result only.': 'শুধুমাত্র সন্তানের রেজাল্ট দেখুন এবং ডাউনলোড করুন।',
  'View child attendance.': 'সন্তানের উপস্থিতি দেখুন।',
  'Child Fees': 'সন্তানের ফি',
  'View child fee status.': 'সন্তানের ফির অবস্থা দেখুন।',
  'Child Routine': 'সন্তানের রুটিন',
  'View child class routine.': 'সন্তানের ক্লাস রুটিন দেখুন।',
  'Child Syllabus': 'সন্তানের সিলেবাস',
  'View child class syllabus.': 'সন্তানের ক্লাস সিলেবাস দেখুন।',
  'View child homework.': 'সন্তানের হোমওয়ার্ক দেখুন।',
  'Apply for child leave.': 'সন্তানের ছুটির আবেদন করুন।',

  'View and update your own profile.': 'আপনার নিজের প্রোফাইল দেখুন এবং আপডেট করুন।',
  'Read published school notices.': 'প্রকাশিত স্কুলের নোটিশগুলো পড়ুন।',

  'Admit a new student.': 'নতুন শিক্ষার্থী ভর্তি করুন।',
  'Review, approve, or publish results.': 'রেজাল্ট পর্যালোচনা, অনুমোদন বা প্রকাশ করুন।',
  'Approve or reject leave applications.': 'ছুটির আবেদনপত্র অনুমোদন বা বাতিল করুন।',
  'Monitor monthly SMS usage.': 'মাসিক এসএমএস ব্যবহার মনিটর করুন।',
  'Mark assigned class attendance.': 'শ্রেণির শিক্ষার্থীদের উপস্থিতি নিন।',
  'Class Results': 'শ্রেণির রেজাল্ট',
  'Review assigned student leave.': 'শিক্ষার্থীদের ছুটির আবেদন পর্যালোচনা করুন।',
  'Create class homework.': 'শ্রেণির হোমওয়ার্ক তৈরি করুন।',
  'Enter results for assigned subjects.': 'নির্ধারিত বিষয়ের রেজাল্ট ইনপুট দিন।',
  'Create homework for students.': 'শিক্ষার্থীদের জন্য হোমওয়ার্ক তৈরি করুন।',
  'View or propose routine items.': 'রুটিন দেখুন বা প্রস্তাব করুন।',
  'Manage fee collection.': 'ফি সংগ্রহ পরিচালনা করুন।',
  'Manage permitted documents.': 'অনুমোদিত ডকুমেন্টস পরিচালনা করুন।',
  'Manage library records if assigned.': 'লাইব্রেরির রেকর্ড পরিচালনা করুন (যদি নির্ধারিত থাকে)।',

  // Billing missing English items
  'Billing & SMS': 'বিলিং ও এসএমএস',
  'Validity': 'কতদিন চলবে',
  'In this payment': 'এই পেমেন্টে',
  'Buy SMS': 'SMS কিনুন',
  'SMS can be recharged with the billing popup system.': 'Billing popup system দিয়ে SMS recharge করা যাবে।',
  'Open SMS Monitoring / Recharge': 'SMS Monitoring / Recharge খুলুন',
  'Expires': 'শেষ হবে',
  'Validity Panel': 'কতদিন চলবে প্যানেল',
};

const reverseDictionary: Record<string, string> = {
  ...Object.fromEntries(Object.entries(dictionary).map(([english, bangla]) => [bangla, english])),
  'বিদ্যালয়': 'School',
  'বিদ্যালয় (School)': 'School',
  'মাদ্রাসা (Madrasah)': 'Madrasah',
  'সাবডোমেন (Subdomain)': 'Subdomain',
  'তৈরি করুন (Generate)': 'Generate',
  'যাচাই করুন (Check)': 'Check',
  'উপলব্ধ (Available)': 'Available',
  'উপলব্ধ নয় (Not available)': 'Not available',
  'লোগো (Logo)': 'Logo',
  'সিল (Seal)': 'Seal',
  'অ্যাডমিট কার্ড (Admit Card)': 'Admit Card',
  'আর্থিক অডিট (Finance Audit)': 'Finance Audit',
  'একটি ছোট ছোট হাতের অক্ষরের নাম দিন (অক্ষর, সংখ্যা, হাইফেন)। এটি subdomain.MAIN_DOMAIN হিসেবে সেট হবে।': 'Enter a subdomain in lowercase (letters, numbers, hyphens). It will be set as subdomain.MAIN_DOMAIN.',

  // Holiday and weekday names mappings
  'শনিবার': 'Saturday',
  'রবিবার': 'Sunday',
  'সোমবার': 'Monday',
  'মঙ্গলবার': 'Tuesday',
  'বুধবার': 'Wednesday',
  'বৃহস্পতিবার': 'Thursday',
  'শুক্রবার': 'Friday',

  // Billing page reverse mappings
  'কতদিন চলবে': 'Validity',
  'শেষ হবে: ': 'Expires: ',
  'এই পেমেন্টে': 'In this payment',
  'SMS কিনুন': 'Buy SMS',
  'Billing popup system দিয়ে SMS recharge করা যাবে।': 'SMS can be recharged with the billing popup system.',
  'SMS Monitoring / Recharge খুলুন': 'Open SMS Monitoring / Recharge',
  ' দিন': ' days',
  ' টি': ' SMS',
  ' জন': ' students',
  'বার্ষিক': 'yearly',
  'মাসিক': 'monthly',
  'প্রায়': 'Approx',
  'প্রতিষ্ঠান প্রধানের সাথে যোগাযোগ করুন।': 'Please contact the head of the institution.',
  'লগআউট': 'Logout',
  'আপনার সাবস্ক্রিপশন এবং এসএমএস ব্যালেন্স এখানে দেখুন ও পরিচালনা করুন।': 'View and manage your subscription and SMS balance here.',
  '✅ सक्रिय প্যাকেজ': '✅ Active Package',
  '🔄 Trial চলছে': '🔄 Trial Active',
  '⚠️ Subscription নেই': '⚠️ No Subscription',
  'প্রতিষ্ঠান': 'Institution',
  'প্যাকেজ': 'Package',
  'বিলিং চক্র': 'Billing Cycle',
  'ছাত্র সীমা': 'Student Limit',
  'মাসিক ফ্রি SMS': 'Monthly Free SMS',
  'মেয়াদ শেষ: ': 'Expires: ',
  '📱 SMS ব্যালেন্স': '📱 SMS Balance',
  'আপনার অবশিষ্ট SMS সংখ্যা': 'Your remaining SMS count',
  '⚠️ SMS ব্যালেন্স কম! নিচে থেকে SMS প্যাকেজ কিনুন।': '⚠️ SMS Balance low! Purchase SMS package below.',
  'কেনা SMS বাকি': 'Purchased SMS remaining',
  'প্ল্যান থেকে ফ্রি': 'Free from plan',
  'এ মাসে পাঠানো': 'Sent this month',
  'মোট ব্যবহারযোগ্য': 'Total usable',
  ' স্কুল বিল পরিশোধ': ' School Bill Payment',
  'নিবন্ধন বিল এবং মাসিক বিল শুধুমাত্র পপআপ পেমেন্ট গেটওয়ে দিয়ে পরিশোধ করতে হবে।': 'Registration and monthly bills must be paid via the popup payment gateway only.',
  'সাবস্ক্রিপশন প্ল্যান': 'Subscription Plan',
  'ইজি স্কুল স্টোরেজ ব্যবহার করুন': 'Use Easy School Storage',
  'বিল পরিশোধ': 'Pay Bill',
  'একটি প্যাকেজ বেছে নিন।': 'Please select a package.',
  'Payment popup লোড হয়নি। একটু পরে চেষ্টা করুন।': 'Payment popup not loaded. Please try again in a moment.',
  'পেমেন্ট সম্পন্ন। SMS প্যাকেজ activate করা হচ্ছে...': 'Payment complete. Activating SMS package...',
  'সফলভাবে কেনা হয়েছে!': 'successfully purchased!',
  'SMS credit যোগ হয়েছে।': 'SMS credit added.',
  'SMS প্যাকেজ activate করতে সমস্যা হয়েছে।': 'Failed to activate SMS package.',
  'বিকাশ পেমেন্ট': 'bKash Payment',
  'স্ট্রাইপ পেমেন্ট': 'Stripe Payment',
  'কার্ড হোল্ডারের নাম': 'Card Holder Name',
  'কার্ড নম্বর': 'Card Number',
  'মেয়াদ (MM/YY)': 'Expiry (MM/YY)',
  'পেমেন্ট সফল হয়েছে।': 'Payment successful.',
  'পেমেন্ট প্রক্রিয়া করতে সমস্যা হয়েছে।': 'Failed to process payment.',
  'পেমেন্ট নিশ্চিত করুন': 'Confirm Payment',
  'পেমেন্ট বাতিল করুন': 'Cancel Payment',
  '৫০ SMS': '50 SMS',
  '১০০ SMS': '100 SMS',
  '২০০ SMS': '200 SMS',
  '৩০০ SMS': '300 SMS',
  '৫০০ SMS': '500 SMS',
  '১০০০ SMS': '1000 SMS',
  '২০০০ SMS': '2000 SMS',
  '৫০০০ SMS': '5000 SMS',

  // Settings page reverse mappings
  'ছুটি ও বন্ধের সেটিংস server/database-এ সংরক্ষণ করা হয়েছে। Attendance calendar refresh করলে ঠিক দেখাবে।': 'Holiday & closure settings have been saved to the server/database. It will display correctly after refreshing the attendance calendar.',
  'UI color এবং school control settings সংরক্ষণ করা হয়েছে।': 'UI color and school control settings have been saved.',
  'এসএমএস সেটিংস সংরক্ষণ করা হয়েছে।': 'SMS settings have been saved.',
  'MongoDB সেটিংস সংরক্ষণ করা হয়েছে।': 'MongoDB settings have been saved.',
  'সংরক্ষণ করা যায়নি।': 'Could not save.',
  'MongoDB URI দিন': 'Please provide MongoDB URI',
  'এসএমএস সফলভাবে পাঠানো হয়েছে': 'SMS sent successfully',
  'এসএমএস পাঠানো যায়নি': 'SMS could not be sent',
  'ছুটি, storage, SMS, UI color, academic year, parent/student portal এবং school control settings এক জায়গায় সুন্দরভাবে manage করুন।': 'Manage holidays, storage, SMS, UI colors, academic year, parent/student portals, and school control settings beautifully in one place.',
  'Personal MongoDB URI save করুন। URI masked থাকবে, শুধু connection/history status দেখা যাবে।': 'Save your personal MongoDB URI. The URI will remain masked, only connection/history status will be shown.',
  'New MongoDB URI paste করুন': 'Paste new MongoDB URI',
  'Academic year, timezone, language এবং portal control settings।': 'Academic year, timezone, language, and portal control settings.',
  'সাপ্তাহিক ছুটি এবং বিশেষ বন্ধের সময়সীমা database/server-এ save হবে।': 'Weekly holidays and special closure limits will be saved in the database/server.',
  'ছুটি/বন্ধের নিয়মাবলী চালু করুন': 'Enable holiday/closure rules',
  'সাপ্তাহিক ছুটির দিনসমূহ': 'Weekly Holidays',
  'বন্ধের শুরুর তারিখ': 'Closure Start Date',
  'বন্ধের শেষের তারিখ': 'Closure End Date',
  'বন্ধের কারণ': 'Closure Reason',
  'মোট বন্ধের মেয়াদ: ': 'Total Closure Duration: ',
  ' দিন। সাপ্তাহিক ছুটি: ': ' days. Weekly Holidays: ',
  'কোনোটিই নয়': 'None',
  'Site color mixer এবং attendance calendar-এর রঙ control করুন।': 'Control site color mixer and attendance calendar colors.',
  'উপস্থিত': 'Present',
  'অনুপস্থিত': 'Absent',
  'ছুটি': 'Leave',
  'সাপ্তাহিক ছুটি': 'Weekly Holiday',
  'বিদ্যালয় বন্ধ': 'School Closed',
  'এসএমএস service চালু/বন্ধ, API URL/key, diagnostic এবং test SMS। Saved URL/key plain text দেখানো হবে না।': 'SMS service enable/disable, API URL/key, diagnostic, and test SMS. Saved URL/key will not be shown in plain text.',
  'নতুন URL দিলে আগের URL replace হবে': 'Providing new URL will replace the previous URL',
  'SMS API URL paste করুন': 'Paste SMS API URL',
  'নতুন key দিলে আগের key replace হবে': 'Providing new key will replace the previous key',
  'SMS API key paste করুন': 'Paste SMS API key',
  'এসএমএস চালু করুন': 'Enable SMS',
  'সমাধান: ': 'Solution: ',
  'প্রতি স্কুল নিজের payment system চালু করবে। Recommended GatewayFlow popup এ customer TrxID দেবে না; sender number + exact amount + SMS receive time match হবে। Official bKash/Nagad/SSLCommerz হলে তাদের merchant credentials লাগবে।': 'Each school will enable its own payment system. Recommended GatewayFlow popup does not require the customer TrxID; sender number + exact amount + SMS receive time will be matched. Official bKash/Nagad/SSLCommerz requires their merchant credentials.',
  'শুধুমাত্র প্রধান শিক্ষকই স্কুলের সেটিংস পরিবর্তন করতে পারবেন।': 'Only the headmaster can modify the school settings.',

  // Notification / Message mappings
  'বার্তা': 'Messages',
  'লোড হচ্ছে...': 'Loading...',
  'কোনো বার্তা নেই': 'No messages',
  'পড়া চিহ্নিত করুন': 'Mark as read',
  'সব বার্তা দেখুন': 'View all messages',
  'থেকে: ': 'From: ',
  'গতকাল': 'Yesterday',
  'অপড়া': 'Unread',
  'মুছুন': 'Delete',
  'একটি বার্তা নির্বাচন করুন': 'Select a message',
  'সব': 'All',
  'কোনো অপড়া বার্তা নেই': 'No unread messages',
  'বিজ্ঞপ্তি কেন্দ্র': 'Notification Center',
  'সকল আপনার বার্তা এবং বিজ্ঞপ্তি একসাথে দেখুন': 'View all your messages and notifications in one place',
  'ইনবক্স': 'Inbox',
  'পাঠানো': 'Sent',
  'কোনো পাঠানো বার্তা নেই': 'No sent messages',
  'প্রাপক: ': 'To: ',
  'অপড়া বার্তা': 'unread messages',
  'হেড': 'Head',
  'টিচার': 'Teacher',
  'প্যারেন্ট': 'Parent',
  'স্টাফ': 'Staff',
};

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
    // Match only whole words or full phrases using custom word boundaries that support Bengali characters as well.
    const boundaryRegex = new RegExp('(?<![\\u0980-\\u09FFa-zA-Z0-9])' + escapeRegExp(source) + '(?![\\u0980-\\u09FFa-zA-Z0-9])', 'g');
    result = result.replace(boundaryRegex, target);
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
    const anyNode = node as any;
    const currentVal = node.nodeValue || '';
    if (anyNode.__translatedValue === currentVal && anyNode.__translatedLang === language) {
      return;
    }
    const translated = translateText(currentVal, language);
    if (currentVal !== translated) {
      anyNode.__translatedValue = translated;
      anyNode.__translatedLang = language;
      node.nodeValue = translated;
    }
  });

  document.querySelectorAll<HTMLElement>('[title], [placeholder], [aria-label]').forEach((element) => {
    if (shouldSkipElement(element)) return;
    const anyElement = element as any;
    if (!anyElement.__translatedAttrs) {
      anyElement.__translatedAttrs = {};
    }
    ['title', 'placeholder', 'aria-label'].forEach((attribute) => {
      const value = element.getAttribute(attribute);
      if (value) {
        if (anyElement.__translatedAttrs[attribute] === value && anyElement.__translatedLang === language) {
          return;
        }
        const translated = translateText(value, language);
        if (value !== translated) {
          anyElement.__translatedAttrs[attribute] = translated;
          anyElement.__translatedLang = language;
          element.setAttribute(attribute, translated);
        }
      }
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
    if (typeof window === 'undefined') return;

    // Run translation initially
    applyDomLanguage(language);

    // Watch for dynamic DOM changes and keep translation active
    const observer = new MutationObserver((mutations) => {
      observer.disconnect();
      applyDomLanguage(language);
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      observer.disconnect();
    };
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