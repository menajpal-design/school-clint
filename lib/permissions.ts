import { UserRole, User } from '@/types';
import { getDemoMode } from './demo-store';

interface MenuItemConfig {
  label: string;
  href: string;
  icon?: string;
  roles: UserRole[];
  children?: MenuItemConfig[];
}

const ALL_ROLES: UserRole[] = ['admin', 'super_admin', 'head', 'assistant_head', 'class_teacher', 'subject_teacher', 'teacher', 'finance_officer', 'staff', 'student', 'parent', 'committee_member'];
const PLATFORM_ADMIN: UserRole[] = ['admin', 'super_admin'];
const SCHOOL_LEADERS: UserRole[] = ['head', 'assistant_head'];
const TEACHERS: UserRole[] = ['class_teacher', 'subject_teacher', 'teacher'];
const EMPLOYEES: UserRole[] = ['head', 'assistant_head', 'class_teacher', 'subject_teacher', 'teacher', 'finance_officer', 'staff'];
const SCHOOL_USERS: UserRole[] = ['head', 'assistant_head', 'class_teacher', 'subject_teacher', 'teacher', 'finance_officer', 'staff', 'student', 'parent', 'committee_member'];
const ACADEMIC_VIEW: UserRole[] = ['head', 'assistant_head', 'class_teacher', 'subject_teacher', 'teacher', 'student', 'parent'];
const ATTENDANCE_VIEW: UserRole[] = ['head', 'assistant_head', 'class_teacher', 'subject_teacher', 'teacher', 'finance_officer', 'staff', 'student', 'parent'];
const ATTENDANCE_MANAGE: UserRole[] = ['head', 'assistant_head', 'class_teacher', 'subject_teacher', 'teacher', 'finance_officer', 'staff'];
const SMS_MONITORING: UserRole[] = ['admin', 'super_admin', 'head', 'assistant_head', 'class_teacher', 'subject_teacher', 'teacher', 'finance_officer', 'staff'];
const HOLIDAY_VIEW: UserRole[] = ['head', 'assistant_head', 'class_teacher', 'subject_teacher', 'teacher', 'student', 'parent', 'staff', 'finance_officer'];
const ID_CARD_OWN: UserRole[] = ['head', 'assistant_head', 'class_teacher', 'subject_teacher', 'teacher', 'finance_officer', 'staff', 'student', 'parent'];
const NOTICE_VIEW: UserRole[] = ['head', 'assistant_head', 'class_teacher', 'subject_teacher', 'teacher', 'finance_officer', 'staff', 'student', 'parent', 'committee_member'];
const DOCUMENT_VIEW: UserRole[] = ['head', 'assistant_head', 'finance_officer', 'staff', 'student', 'parent'];
const LIBRARY_VIEW: UserRole[] = ['head', 'assistant_head', 'class_teacher', 'subject_teacher', 'teacher', 'staff', 'student', 'parent'];

export const menuConfig: MenuItemConfig[] = [
  {
    label: 'এডমিন (Admin)', href: '/admin', roles: PLATFORM_ADMIN, icon: 'ShieldCheck',
    children: [
      { label: 'ওভারভিউ', href: '/admin', roles: PLATFORM_ADMIN },
      { label: 'স্কুল ব্যবস্থাপনা', href: '/admin/schools', roles: PLATFORM_ADMIN },
      { label: 'সাবস্ক্রিপশন', href: '/admin/subscriptions', roles: PLATFORM_ADMIN },
      { label: 'হিসাব বিজ্ঞান (Accounting)', href: '/admin/accounting', roles: PLATFORM_ADMIN },
      { label: 'এসএমএস ব্যবহার', href: '/admin/sms-usage', roles: PLATFORM_ADMIN },
      { label: 'স্কুল নির্বাচন', href: '/admin/select-school', roles: PLATFORM_ADMIN },
      { label: 'ব্যবহারকারী ব্যবস্থাপনা', href: '/admin/users', roles: PLATFORM_ADMIN },
      { label: 'ব্যাকআপ ও রিস্টোর', href: '/admin/backup', roles: ['super_admin'] },
    ],
  },
  { label: 'ড্যাশবোর্ড', href: '/dashboard', roles: [...PLATFORM_ADMIN, ...SCHOOL_USERS], icon: 'LayoutGrid' },
  { label: 'নোটিশ বোর্ড', href: '/notices', roles: NOTICE_VIEW, icon: 'Bell' },
  { label: 'ছুটির তালিকা', href: '/holidays', roles: HOLIDAY_VIEW, icon: 'CalendarDays' },
  {
    label: 'আইডি কার্ড', href: '/id-cards', roles: ID_CARD_OWN, icon: 'CreditCard',
    children: [
      { label: 'আমার আইডি কার্ড', href: '/id-cards/my-card', roles: ID_CARD_OWN },
      { label: 'কার্ড তৈরি করুন', href: '/id-cards/generate', roles: ['head', 'assistant_head', 'staff'] },
      { label: 'অ্যাডমিট কার্ড (Admit Card)', href: '/id-cards/admit-card', roles: ['head', 'assistant_head', 'staff'] },
      { label: 'বাল্ক জেনারেট', href: '/id-cards/bulk-generate', roles: SCHOOL_LEADERS },
      { label: 'টেমপ্লেটসমূহ', href: '/id-cards/templates', roles: SCHOOL_LEADERS },
      { label: 'রিপোর্টসমূহ', href: '/id-cards/reports', roles: SCHOOL_LEADERS },
    ],
  },
  {
    label: 'প্রতিষ্ঠান', href: '/institution', roles: [...SCHOOL_LEADERS, ...TEACHERS], icon: 'Building2',
    children: [
      { label: 'প্রোফাইল', href: '/institution/profile', roles: SCHOOL_LEADERS },
      { label: 'বিলিং ও সাবস্ক্রিপশন', href: '/institution/billing', roles: SCHOOL_LEADERS },
      { label: 'এসএমএস ব্যালেন্স', href: '/billing', roles: SCHOOL_LEADERS },
      { label: 'আর্থিক অডিট (Finance Audit)', href: '/institution/finance-audit', roles: SCHOOL_LEADERS },
      { label: 'ছাত্রছাত্রী', href: '/institution/students', roles: [...SCHOOL_LEADERS, ...TEACHERS] },
      { label: 'শিক্ষক', href: '/institution/teachers', roles: SCHOOL_LEADERS },
      { label: 'কর্মচারী', href: '/institution/staff', roles: SCHOOL_LEADERS },
      { label: 'ভর্তি (Admission)', href: '/institution/admission', roles: SCHOOL_LEADERS },
      { label: 'ব্যাকআপ', href: '/institution/backup', roles: ['head'] },
    ],
  },
  {
    label: 'একাডেমিক', href: '/academic', roles: ACADEMIC_VIEW, icon: 'BookOpen',
    children: [
      { label: 'ওভারভিউ', href: '/academic', roles: [...SCHOOL_LEADERS, ...TEACHERS] },
      { label: 'ক্লাস', href: '/academic/classes', roles: SCHOOL_LEADERS },
      { label: 'সেকশন', href: '/academic/sections', roles: SCHOOL_LEADERS },
      { label: 'বিষয়', href: '/academic/subjects', roles: [...SCHOOL_LEADERS, 'subject_teacher', 'teacher', 'class_teacher'] },
      { label: 'সিলেবাস', href: '/academic/syllabus', roles: ACADEMIC_VIEW },
      { label: 'ক্লাস রুটিন', href: '/academic/class-routine', roles: ACADEMIC_VIEW },
      { label: 'পরীক্ষার রুটিন', href: '/academic/exam-routine', roles: ACADEMIC_VIEW },
      { label: 'পরীক্ষা', href: '/academic/exams', roles: [...SCHOOL_LEADERS, 'subject_teacher', 'teacher', 'class_teacher'] },
      { label: 'রেজাল্ট', href: '/academic/results', roles: [...SCHOOL_LEADERS, 'class_teacher', 'subject_teacher', 'teacher', 'student', 'parent'] },
      { label: 'চূড়ান্ত প্রমোশন', href: '/academic/promotions', roles: ['head', 'assistant_head', 'class_teacher'] },
      { label: 'রিপোর্ট কার্ড', href: '/academic/report-card', roles: ['head', 'assistant_head', 'class_teacher', 'student', 'parent'] },
    ],
  },
  {
    label: 'উপস্থিতি', href: '/attendance', roles: ATTENDANCE_VIEW, icon: 'CheckCircle2',
    children: [
      { label: 'ওভারভিউ', href: '/attendance', roles: ATTENDANCE_MANAGE },
      { label: 'উপস্থিতি নিন', href: '/attendance/mark', roles: ['head', 'assistant_head', 'class_teacher', 'subject_teacher', 'teacher'] },
      { label: 'অল প্রেজেন্ট স্ক্যানার', href: '/attendance/all-present', roles: ATTENDANCE_MANAGE },
      { label: 'রিপোর্ট', href: '/attendance/reports', roles: ['head', 'assistant_head', 'class_teacher', 'subject_teacher', 'teacher'] },
      { label: 'আমার উপস্থিতি', href: '/attendance/my-attendance', roles: ATTENDANCE_VIEW },
    ],
  },
  {
    label: 'ছুটির আবেদন', href: '/leave-application', roles: [...EMPLOYEES, 'student', 'parent'], icon: 'CalendarDays',
    children: [
      { label: 'আবেদন করুন', href: '/leave-application', roles: [...EMPLOYEES, 'student'] },
      { label: 'ছুটির তালিকা', href: '/leave-list', roles: SCHOOL_LEADERS },
    ],
  },
  {
    label: 'অর্থ ব্যবস্থাপনা', href: '/finance', roles: ['head', 'assistant_head', 'finance_officer', 'student', 'parent'], icon: 'DollarSign',
    children: [
      { label: 'ওভারভিউ', href: '/finance', roles: ['head', 'assistant_head', 'finance_officer'] },
      { label: 'ফি', href: '/finance/fees', roles: ['head', 'assistant_head', 'finance_officer'] },
      { label: 'কালেকশন (Collection)', href: '/finance/collections', roles: ['head', 'assistant_head', 'finance_officer'] },
      { label: 'বেতন', href: '/finance/salary', roles: ['head'] },
      { label: 'রিপোর্ট', href: '/finance/reports', roles: ['head', 'assistant_head', 'finance_officer'] },
      { label: 'আমার ফি', href: '/finance/my-fees', roles: ['student', 'parent'] },
    ],
  },
  {
    label: 'নথিপত্র', href: '/documents', roles: DOCUMENT_VIEW, icon: 'FileText',
    children: [
      { label: 'ওভারভিউ', href: '/documents', roles: DOCUMENT_VIEW },
      { label: 'মেমো (Memo)', href: '/documents/memo', roles: ['head', 'assistant_head', 'finance_officer', 'staff'] },
      { label: 'আপলোড', href: '/documents/upload', roles: ['head', 'assistant_head', 'staff'] },
      { label: 'ব্যবস্থাপনা', href: '/documents/manage', roles: SCHOOL_LEADERS },
    ],
  },
  {
    label: 'ব্যবহারকারী ও ভূমিকা', href: '/users-roles', roles: ['admin', 'super_admin', 'head'], icon: 'Users',
    children: [
      { label: 'ওভারভিউ', href: '/users-roles', roles: ['admin', 'super_admin', 'head'] },
      { label: 'সকল ব্যবহারকারী', href: '/users-roles/all', roles: ['admin', 'super_admin', 'head'] },
      { label: 'ভূমিকা ও অনুমতি', href: '/users-roles/permissions', roles: ['admin', 'super_admin', 'head'] },
    ],
  },
  { label: 'কমিটি', href: '/committee', roles: ['head', 'assistant_head', 'committee_member'], icon: 'Users2' },
  {
    label: 'লাইব্রেরি', href: '/library', roles: LIBRARY_VIEW, icon: 'BookMarked',
    children: [
      { label: 'বই', href: '/library/books', roles: LIBRARY_VIEW },
      { label: 'ধার', href: '/library/loans', roles: LIBRARY_VIEW },
    ],
  },
  { label: 'অভিভাবক পোর্টাল', href: '/parent-portal', roles: ['parent'], icon: 'Home' },
  { label: 'হোমওয়ার্ক', href: '/homework', roles: ['head', 'assistant_head', 'class_teacher', 'subject_teacher', 'teacher', 'student', 'parent'], icon: 'BookOpen' },
  { label: 'SMS মনিটরিং', href: '/sms-monitoring', roles: SMS_MONITORING, icon: 'MessageSquare' },
  {
    label: 'প্রোফাইল', href: '/profile', roles: ALL_ROLES, icon: 'User',
    children: [
      { label: 'আমার প্রোফাইল', href: '/profile', roles: ALL_ROLES },
      { label: 'পাসওয়ার্ড পরিবর্তন', href: '/profile/change-password', roles: ALL_ROLES },
      { label: 'আমার আইডি কার্ড', href: '/id-cards/my-card', roles: ID_CARD_OWN },
    ],
  },
  { label: 'সেটিংস', href: '/settings', roles: ['admin', 'super_admin', 'head'], icon: 'Settings' },
];

export function getVisibleMenuItems(userRole: UserRole): MenuItemConfig[] {
  return filterMenuByRole(userRole);
}

export const rolePermissions: Record<UserRole, string[]> = {
  admin: ['*'], super_admin: ['*'], head: ['*'],
  assistant_head: ['manage:assignedArea', 'generate:idcard', 'edit:idcard', 'download:idcard', 'manage:academic', 'post:notice'],
  class_teacher: ['manage:attendance', 'manage:class_students', 'view:academic'],
  subject_teacher: ['manage:results', 'view:academic'], teacher: ['manage:results', 'view:academic'],
  finance_officer: ['manage:finance', 'view:payments', 'view:attendance'], staff: ['manage:idcard', 'download:idcard', 'view:documents'],
  student: ['view:own'], parent: ['view:child'], committee_member: ['post:notice'],
};

export function hasRole(user?: User | null, roles?: UserRole[] | UserRole) {
  if (!user) return false;
  if (getDemoMode()) return true;
  if (!roles) return true;
  if (['admin', 'super_admin', 'head'].includes(user.role)) return true;
  if (Array.isArray(roles)) return roles.includes(user.role);
  return user.role === roles;
}

export function hasPermission(user?: User | null, permission?: string) {
  if (!user || !permission) return false;
  if (getDemoMode()) return true;
  if (['admin', 'super_admin', 'head'].includes(user.role)) return true;
  const rolePerms = rolePermissions[user.role] || [];
  if (rolePerms.includes('*')) return true;
  if (rolePerms.includes(permission)) return true;
  if (Array.isArray(user.permissions) && user.permissions.includes(permission)) return true;
  return false;
}

function filterMenuByRole(userRole: UserRole) {
  return menuConfig
    .map((item) => {
      const children = item.children?.filter((child) => child.roles.includes(userRole));
      return { ...item, children };
    })
    .filter((item) => item.roles.includes(userRole) && (!item.children || item.children.length > 0));
}

export function getMenuForUser(user?: User | null) {
  if (!user) return [];
  if (getDemoMode()) return menuConfig;
  return filterMenuByRole(user.role);
}

const normalizePath = (pathname: string) => pathname.split('?')[0].replace(/\/$/, '') || '/';

function flattenMenu(items: MenuItemConfig[]): MenuItemConfig[] {
  return items.flatMap((item) => [item, ...(item.children ? flattenMenu(item.children) : [])]);
}

const routeAliases: Record<string, string> = {
  '/documents/admit-cards': '/id-cards/admit-card',
  '/academic/holiday-list': '/holidays',
  '/billing': '/billing',
  '/institution/billing': '/institution/billing',
  '/leave-application': '/leave-application',
  '/leave-list': '/leave-list',
  '/sms-monitoring': '/sms-monitoring',
  '/class-routine': '/academic/class-routine',
};


export function isRouteAllowed(pathname: string, userRole: UserRole): boolean {
  if (getDemoMode()) return true;
  if (['admin', 'super_admin', 'head'].includes(userRole)) return true;

  const path = routeAliases[normalizePath(pathname)] || normalizePath(pathname);
  const allRoutes = flattenMenu(menuConfig).sort((a, b) => normalizePath(b.href).length - normalizePath(a.href).length);

  const exactMatch = allRoutes.find((route) => normalizePath(route.href) === path);
  if (exactMatch) return exactMatch.roles.includes(userRole);

  const parentMatch = allRoutes.find((route) => {
    const routePath = normalizePath(route.href);
    return routePath !== '/' && path.startsWith(`${routePath}/`);
  });

  if (parentMatch) return parentMatch.roles.includes(userRole);

  // Unknown authenticated pages should not become public by mistake.
  return false;
}
