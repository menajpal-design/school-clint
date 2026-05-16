'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type AppLanguage = 'en' | 'bn';

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (text: string) => string;
};

const dictionary: Record<string, string> = {
  'Dashboard': 'ড্যাশবোর্ড',
  'Admin': 'অ্যাডমিন',
  'Overview': 'ওভারভিউ',
  'School Manage': 'স্কুল ম্যানেজ',
  'Subscriptions': 'সাবস্ক্রিপশন',
  'SMS Usage': 'এসএমএস ব্যবহার',
  'Select School': 'স্কুল নির্বাচন',
  'Manage Users': 'ইউজার ম্যানেজ',
  'SMS Monitoring': 'এসএমএস মনিটরিং',
  'ID Card Management': 'আইডি কার্ড ম্যানেজমেন্ট',
  'My Card': 'আমার কার্ড',
  'Generate Card': 'কার্ড তৈরি',
  'Admit Card': 'এডমিট কার্ড',
  'Bulk Generate': 'বাল্ক তৈরি',
  'Templates': 'টেমপ্লেট',
  'Reports': 'রিপোর্ট',
  'Renewal': 'রিনিউয়াল',
  'Institution': 'প্রতিষ্ঠান',
  'Profile': 'প্রোফাইল',
  'Students': 'শিক্ষার্থী',
  'Teachers': 'শিক্ষক',
  'Staff': 'স্টাফ',
  'Student Admission': 'শিক্ষার্থী ভর্তি',
  'Backup': 'ব্যাকআপ',
  'Academic': 'একাডেমিক',
  'Classes': 'ক্লাস',
  'Class Routine': 'ক্লাস রুটিন',
  'Subjects': 'সাবজেক্ট',
  'Exams': 'পরীক্ষা',
  'Results': 'রেজাল্ট',
  'Final Promotion': 'ফাইনাল প্রোমোশন',
  'Report Card': 'রিপোর্ট কার্ড',
  'Attendance': 'উপস্থিতি',
  'Mark Attendance': 'উপস্থিতি দিন',
  'My Attendance': 'আমার উপস্থিতি',
  'Finance': 'ফাইন্যান্স',
  'Fees': 'ফি',
  'Collections': 'কালেকশন',
  'Salary': 'বেতন',
  'My Fees': 'আমার ফি',
  'Documents': 'ডকুমেন্ট',
  'Memo': 'মেমো',
  'Upload': 'আপলোড',
  'Management': 'ম্যানেজমেন্ট',
  'Users & Roles': 'ইউজার ও রোল',
  'All Users': 'সব ইউজার',
  'Roles & Permissions': 'রোল ও পারমিশন',
  'Committee': 'কমিটি',
  'Parent Portal': 'অভিভাবক পোর্টাল',
  'Notice Board': 'নোটিশ বোর্ড',
  'Profile & Auth': 'প্রোফাইল ও অথ',
  'My Profile': 'আমার প্রোফাইল',
  'Change Password': 'পাসওয়ার্ড পরিবর্তন',
  'My ID Card': 'আমার আইডি কার্ড',
  'Settings': 'সেটিংস',
  'Expand': 'বড় করুন',
  'Collapse': 'ছোট করুন',
  'Refresh': 'রিফ্রেশ',
  'Add': 'যোগ করুন',
  'Create': 'তৈরি করুন',
  'Save': 'সেভ',
  'Save Changes': 'পরিবর্তন সেভ',
  'Cancel': 'বাতিল',
  'Delete': 'ডিলিট',
  'Edit': 'এডিট',
  'Search': 'সার্চ',
  'Print': 'প্রিন্ট',
  'Download': 'ডাউনলোড',
  'Submit': 'সাবমিট',
  'Confirm': 'কনফার্ম',
  'Actions': 'অ্যাকশন',
  'Status': 'স্ট্যাটাস',
  'Class': 'ক্লাস',
  'Section': 'শাখা',
  'Subject': 'সাবজেক্ট',
  'Teacher': 'শিক্ষক',
  'Student': 'শিক্ষার্থী',
  'Name': 'নাম',
  'Roll': 'রোল',
  'Phone': 'ফোন',
  'Email': 'ইমেইল',
  'Address': 'ঠিকানা',
  'Date': 'তারিখ',
  'Time': 'সময়',
  'Day': 'দিন',
  'Period': 'পিরিয়ড',
  'Room': 'রুম',
  'Note': 'নোট',
  'Public': 'পাবলিক',
  'Private': 'প্রাইভেট',
  'Active': 'অ্যাকটিভ',
  'Inactive': 'ইনঅ্যাকটিভ',
  'Loading': 'লোড হচ্ছে',
  'No data found': 'কোনো ডাটা পাওয়া যায়নি',
  'Language': 'ভাষা',
  'English': 'ইংরেজি',
  'Bangla': 'বাংলা',
  'বাংলা': 'বাংলা',
  'English / বাংলা': 'English / বাংলা',
  'Create Exam': 'পরীক্ষা তৈরি',
  'Exam Management': 'পরীক্ষা ম্যানেজমেন্ট',
  'Public routine': 'পাবলিক রুটিন',
  'Publish routine': 'রুটিন পাবলিশ',
  'Make private': 'প্রাইভেট করুন',
  'Routine ready': 'রুটিন প্রস্তুত',
  'Routine incomplete': 'রুটিন অসম্পূর্ণ',
  'Add Routine': 'রুটিন যোগ করুন',
  'Edit Class Routine': 'ক্লাস রুটিন এডিট',
  'Add Class Routine': 'ক্লাস রুটিন যোগ',
  'Save Routine': 'রুটিন সেভ',
  'SMS Sent': 'এসএমএস পাঠানো হয়েছে',
  'SMS Not Sent': 'এসএমএস পাঠানো হয়নি',
  'Monthly SMS Limit': 'মাসিক এসএমএস লিমিট',
  'Used This Month': 'এই মাসে ব্যবহার',
  'Remaining': 'বাকি',
  'Not Sent': 'পাঠানো হয়নি',
  'Recent SMS Logs': 'সাম্প্রতিক এসএমএস লগ',
};

const reverseDictionary = Object.fromEntries(Object.entries(dictionary).map(([en, bn]) => [bn, en]));

const LanguageContext = createContext<LanguageContextValue | null>(null);

function translateText(text: string, language: AppLanguage) {
  const trimmed = text.trim();
  if (!trimmed) return text;
  const translated = language === 'bn' ? dictionary[trimmed] : reverseDictionary[trimmed];
  if (!translated) return text;
  return text.replace(trimmed, translated);
}

function shouldSkipElement(element: Element | null) {
  if (!element) return true;
  const tag = element.tagName?.toLowerCase();
  return ['script', 'style', 'textarea', 'input', 'select', 'option', 'svg', 'path'].includes(tag);
}

function applyDomLanguage(language: AppLanguage) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = language === 'bn' ? 'bn' : 'en';
  document.documentElement.dir = 'ltr';

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (shouldSkipElement(node.parentElement)) return NodeFilter.FILTER_REJECT;
      const value = node.nodeValue || '';
      if (!value.trim()) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  nodes.forEach((node) => {
    node.nodeValue = translateText(node.nodeValue || '', language);
  });

  const attrNames = ['title', 'placeholder', 'aria-label'];
  document.querySelectorAll<HTMLElement>('[title], [placeholder], [aria-label]').forEach((element) => {
    if (shouldSkipElement(element)) return;
    attrNames.forEach((attr) => {
      const value = element.getAttribute(attr);
      if (value) element.setAttribute(attr, translateText(value, language));
    });
  });
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>('en');

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('appLanguage') : null;
    if (saved === 'bn' || saved === 'en') setLanguageState(saved);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('appLanguage', language);
    const run = () => applyDomLanguage(language);
    run();
    const observer = new MutationObserver(() => window.requestAnimationFrame(run));
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [language]);

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage: setLanguageState,
    t: (text: string) => (language === 'bn' ? dictionary[text] || text : reverseDictionary[text] || text),
  }), [language]);

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
