import { UserRole, User } from '@/types';

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
const SCHOOL_LEADER_ADMIN: UserRole[] = [...SCHOOL_LEADERS];
const BILLING_ROLES: UserRole[] = ['admin', 'super_admin', 'head'];
const TEACHERS: UserRole[] = ['class_teacher', 'subject_teacher', 'teacher'];
const EMPLOYEES: UserRole[] = ['head', 'assistant_head', 'class_teacher', 'subject_teacher', 'teacher', 'finance_officer', 'staff'];
const SCHOOL_USERS: UserRole[] = ['head', 'assistant_head', 'class_teacher', 'subject_teacher', 'teacher', 'finance_officer', 'staff', 'student', 'parent', 'committee_member'];
const STUDENT_PARENT: UserRole[] = ['student', 'parent'];
const ACADEMIC_VIEW: UserRole[] = [...SCHOOL_LEADERS, ...TEACHERS, ...STUDENT_PARENT];
const RESULT_ENTRY: UserRole[] = ['head', 'assistant_head', 'class_teacher', 'subject_teacher', 'teacher'];
const QUESTION_MANAGE: UserRole[] = ['head', 'assistant_head', 'class_teacher', 'subject_teacher', 'teacher'];
const MCQ_PRACTICE: UserRole[] = [...QUESTION_MANAGE, 'student', 'parent'];
const QUESTION_BANK_VIEW: UserRole[] = [...QUESTION_MANAGE, 'student', 'parent'];
const ONLINE_CLASS_VIEW: UserRole[] = [...SCHOOL_LEADERS, ...TEACHERS, ...STUDENT_PARENT];
const ATTENDANCE_VIEW: UserRole[] = [...EMPLOYEES, ...STUDENT_PARENT];
const ATTENDANCE_MARK: UserRole[] = ['head', 'assistant_head', 'class_teacher'];
const ATTENDANCE_BIOMETRIC: UserRole[] = ['head', 'assistant_head'];
const SMS_MONITORING: UserRole[] = ['admin', 'super_admin', 'head'];
const SETTINGS: UserRole[] = ['head'];
const HOLIDAY_VIEW: UserRole[] = ['head', 'assistant_head', 'class_teacher', 'subject_teacher', 'teacher', 'student', 'parent', 'staff', 'finance_officer'];
const ID_CARD_OWN: UserRole[] = [...EMPLOYEES, 'student', 'parent'];
const ID_CARD_GENERATE: UserRole[] = SCHOOL_LEADER_ADMIN;
const NOTICE_VIEW: UserRole[] = [...EMPLOYEES, ...STUDENT_PARENT, 'committee_member'];
const DOCUMENT_VIEW: UserRole[] = ['head', 'assistant_head', 'finance_officer', 'staff', 'student', 'parent'];
const DOCUMENT_MANAGE: UserRole[] = ['head', 'assistant_head', 'finance_officer', 'staff'];
const LIBRARY_VIEW: UserRole[] = [...SCHOOL_LEADER_ADMIN, ...TEACHERS, 'staff', 'student', 'parent'];
const LIBRARY_MANAGE: UserRole[] = [...SCHOOL_LEADER_ADMIN, 'staff'];
const HOMEWORK_VIEW: UserRole[] = [...SCHOOL_LEADERS, ...TEACHERS, 'student', 'parent'];
const LEAVE_REVIEW: UserRole[] = ['head', 'assistant_head', 'class_teacher'];
const LEAVE_APPLY: UserRole[] = ['student', 'parent', 'teacher', 'subject_teacher', 'class_teacher', 'staff', 'finance_officer'];
const FEE_COLLECT_ROLES: UserRole[] = ['head', 'assistant_head', 'finance_officer', 'class_teacher'];
const FINANCE_VIEW: UserRole[] = ['head', 'assistant_head', 'finance_officer'];

export function normalizeUserRole(role?: string | null): UserRole | undefined {
  if (!role) return undefined;
  const normalized = String(role).toLowerCase().trim().replace(/[\s-]+/g, '_');
  if (normalized === 'guardian' || normalized === 'parent_guardian' || normalized === 'parent_guardian_role') return 'parent';
  if (normalized === 'headmaster' || normalized === 'principal') return 'head';
  if (normalized === 'assistanthead') return 'assistant_head';
  if (normalized === 'librarian') return 'staff';
  if ((ALL_ROLES as string[]).includes(normalized)) return normalized as UserRole;
  return undefined;
}

export const menuConfig: MenuItemConfig[] = [
  { label: 'Admin', href: '/admin', roles: PLATFORM_ADMIN, icon: 'ShieldCheck', children: [
    { label: 'Overview', href: '/admin', roles: PLATFORM_ADMIN },
    { label: 'School Management', href: '/admin/schools', roles: PLATFORM_ADMIN },
    { label: 'Subscriptions', href: '/admin/subscriptions', roles: PLATFORM_ADMIN },
    { label: 'Accounting', href: '/admin/accounting', roles: PLATFORM_ADMIN },
    { label: 'SMS Usage', href: '/admin/sms-usage', roles: PLATFORM_ADMIN },
    { label: 'Admin SMS Monitoring', href: '/admin/sms-monitoring', roles: PLATFORM_ADMIN },
    { label: 'Select School', href: '/admin/select-school', roles: PLATFORM_ADMIN },
    { label: 'User Management', href: '/admin/users', roles: PLATFORM_ADMIN },
    { label: 'Backup & Restore', href: '/admin/backup', roles: ['super_admin'] },
  ] },
  { label: 'Dashboard', href: '/dashboard', roles: [...PLATFORM_ADMIN, ...SCHOOL_USERS], icon: 'LayoutGrid', children: [
    { label: 'Dashboard', href: '/dashboard', roles: [...PLATFORM_ADMIN, ...SCHOOL_USERS] },
    { label: 'Charts', href: '/charts', roles: [...PLATFORM_ADMIN, ...SCHOOL_USERS] },
    { label: 'Profile Charts', href: '/charts/profile', roles: [...PLATFORM_ADMIN, ...SCHOOL_USERS] },
    { label: 'Parent Charts', href: '/charts/parent', roles: ['parent'] },
  ] },
  { label: 'App Guide', href: '/app-guide', roles: [...PLATFORM_ADMIN, ...SCHOOL_USERS], icon: 'Route' },
  { label: 'Billing & Subscription', href: '/billing', roles: BILLING_ROLES, icon: 'CreditCard' },
  { label: 'Notice Board', href: '/notices', roles: NOTICE_VIEW, icon: 'Bell' },
  { label: 'Notifications', href: '/notifications', roles: ALL_ROLES, icon: 'Bell' },
  { label: 'Messages', href: '/messages', roles: ALL_ROLES, icon: 'MessageSquare' },
  { label: 'Holidays', href: '/holidays', roles: HOLIDAY_VIEW, icon: 'CalendarDays' },
  { label: 'Downloads', href: '/downloads', roles: [...PLATFORM_ADMIN, ...SCHOOL_USERS], icon: 'FileText' },
  { label: 'Online Classes', href: '/online-classes', roles: ONLINE_CLASS_VIEW, icon: 'BookOpenCheck', children: [
    { label: 'Overview', href: '/online-classes', roles: ONLINE_CLASS_VIEW },
    { label: 'Online Routine', href: '/online-classes/routine', roles: ONLINE_CLASS_VIEW },
    { label: 'Recorded Classes', href: '/online-classes/recorded', roles: ONLINE_CLASS_VIEW },
    { label: 'Class Schedule', href: '/online-classes/schedule', roles: ONLINE_CLASS_VIEW },
    { label: 'PDF Books', href: '/online-classes/books', roles: ONLINE_CLASS_VIEW },
  ] },
  { label: 'ID Card', href: '/id-cards', roles: ID_CARD_OWN, icon: 'CreditCard', children: [
    { label: 'Overview', href: '/id-cards', roles: ID_CARD_OWN },
    { label: 'My ID Card', href: '/id-cards/my-card', roles: ID_CARD_OWN },
    { label: 'Generate Card', href: '/id-cards/generate', roles: ID_CARD_GENERATE },
    { label: 'Admit Card', href: '/id-cards/admit-card', roles: SCHOOL_LEADER_ADMIN },
    { label: 'Bulk Generate', href: '/id-cards/bulk-generate', roles: ID_CARD_GENERATE },
    { label: 'Print Card', href: '/id-cards/print', roles: ID_CARD_GENERATE },
    { label: 'Renewal', href: '/id-cards/renewal', roles: ID_CARD_GENERATE },
    { label: 'Templates', href: '/id-cards/templates', roles: SCHOOL_LEADER_ADMIN },
    { label: 'Reports', href: '/id-cards/reports', roles: SCHOOL_LEADER_ADMIN },
  ] },
  { label: 'Institution', href: '/institution', roles: [...SCHOOL_LEADERS, 'class_teacher'], icon: 'Building2', children: [
    { label: 'Overview', href: '/institution', roles: SCHOOL_LEADERS },
    { label: 'Profile', href: '/institution/profile', roles: SCHOOL_LEADERS },
    { label: 'Billing & Subscription', href: '/billing', roles: ['head'] },
    { label: 'Finance Audit', href: '/institution/finance-audit', roles: SCHOOL_LEADERS },
    { label: 'Students', href: '/institution/students', roles: [...SCHOOL_LEADERS, 'class_teacher'] },
    { label: 'Pending Admissions', href: '/institution/pending-admissions', roles: ['head', 'assistant_head', 'class_teacher', 'subject_teacher', 'teacher'] },
    { label: 'Teachers', href: '/institution/teachers', roles: SCHOOL_LEADERS },
    { label: 'Staff', href: '/institution/staff', roles: SCHOOL_LEADERS },
    { label: 'Admission', href: '/institution/admission', roles: SCHOOL_LEADERS },
    { label: 'Subordinates', href: '/institution/subordinates', roles: ['head'] },
    { label: 'Backup', href: '/institution/backup', roles: ['head'] },
  ] },
  { label: 'Academic', href: '/academic-menu', roles: ACADEMIC_VIEW, icon: 'BookOpen', children: [
    { label: 'Overview', href: '/academic', roles: SCHOOL_LEADER_ADMIN },
    { label: 'Classes', href: '/academic/classes', roles: SCHOOL_LEADER_ADMIN },
    { label: 'Sections', href: '/academic/sections', roles: SCHOOL_LEADER_ADMIN },
    { label: 'Subjects', href: '/academic/subjects', roles: SCHOOL_LEADER_ADMIN },
    { label: 'Syllabus', href: '/academic/syllabus', roles: ACADEMIC_VIEW },
    { label: 'Class Routine', href: '/academic/class-routine', roles: ACADEMIC_VIEW },
    { label: 'Class Routine Overview', href: '/class-routine', roles: ACADEMIC_VIEW },
    { label: 'Exam Routine', href: '/academic/exam-routine', roles: ACADEMIC_VIEW },
    { label: 'Exams', href: '/academic/exams', roles: ACADEMIC_VIEW },
    { label: 'Results', href: '/academic/results', roles: [...RESULT_ENTRY, ...STUDENT_PARENT] },
    { label: 'Final Promotion', href: '/academic/promotions', roles: ['head', 'assistant_head', 'class_teacher'] },
    { label: 'Report Card', href: '/academic/report-card', roles: ['head', 'assistant_head', 'class_teacher', 'student', 'parent'] },
  ] },
  { label: 'Question Bank', href: '/question-bank', roles: QUESTION_BANK_VIEW, icon: 'BookOpenCheck', children: [
    { label: 'Overview', href: '/question-bank', roles: QUESTION_BANK_VIEW },
    { label: 'Question Generate', href: '/question-bank/question-generate', roles: QUESTION_MANAGE },
    { label: 'Question Storage', href: '/question-bank/question-generate/storage', roles: QUESTION_MANAGE },
    { label: 'AI Question Manage', href: '/question-bank/ai-manage', roles: QUESTION_MANAGE },
    { label: 'AI Storage', href: '/question-bank/ai-manage/storage', roles: QUESTION_MANAGE },
    { label: 'MCQ Manage', href: '/question-bank/mcq-manage', roles: QUESTION_MANAGE },
    { label: 'MCQ Storage', href: '/question-bank/mcq-manage/storage', roles: QUESTION_MANAGE },
    { label: 'MCQ Practice', href: '/question-bank/mcq-practice', roles: MCQ_PRACTICE },
    { label: 'Practice Storage', href: '/question-bank/mcq-practice/storage', roles: MCQ_PRACTICE },
  ] },
  { label: 'Attendance', href: '/attendance', roles: ATTENDANCE_VIEW, icon: 'CheckCircle2', children: [
    { label: 'Overview', href: '/attendance', roles: ATTENDANCE_MARK },
    { label: 'Mark Attendance', href: '/attendance/mark', roles: ATTENDANCE_MARK },
    { label: 'All Present Scanner', href: '/attendance/all-present', roles: ATTENDANCE_MARK },
    { label: 'Add Fingerprint', href: '/attendance/add-fingerprint', roles: ATTENDANCE_BIOMETRIC },
    { label: 'Reports', href: '/attendance/reports', roles: ATTENDANCE_MARK },
    { label: 'Present SMS', href: '/attendance/present-sms', roles: ATTENDANCE_MARK },
    { label: 'Attendance SMS', href: '/attendance/sms-monitoring', roles: ['head', 'assistant_head', 'class_teacher'] },
    { label: 'My Attendance', href: '/attendance/my-attendance', roles: ATTENDANCE_VIEW },
  ] },
  { label: 'Leave Application', href: '/leave-application-menu', roles: [...LEAVE_REVIEW, ...LEAVE_APPLY], icon: 'CalendarDays', children: [
    { label: 'Apply for Leave', href: '/leave-application', roles: [...LEAVE_REVIEW, ...LEAVE_APPLY] },
    { label: 'Leave List', href: '/leave-list', roles: LEAVE_REVIEW },
  ] },
  { label: 'Finance', href: '/finance-menu', roles: [...FEE_COLLECT_ROLES, ...STUDENT_PARENT], icon: 'DollarSign', children: [
    { label: 'Overview', href: '/finance', roles: FINANCE_VIEW },
    { label: 'Fees', href: '/finance/fees', roles: FINANCE_VIEW },
    { label: 'Fees Collect', href: '/finance/fee-collect', roles: FEE_COLLECT_ROLES },
    { label: 'Collections', href: '/finance/collections', roles: FEE_COLLECT_ROLES },
    { label: 'Salary', href: '/finance/salary', roles: ['head', 'finance_officer'] },
    { label: 'Reports', href: '/finance/reports', roles: FINANCE_VIEW },
    { label: 'My Fees', href: '/finance/my-fees', roles: STUDENT_PARENT },
  ] },
  { label: 'Documents', href: '/documents', roles: DOCUMENT_VIEW, icon: 'FileText', children: [
    { label: 'Overview', href: '/documents', roles: DOCUMENT_VIEW },
    { label: 'Memo', href: '/documents/memo', roles: DOCUMENT_MANAGE },
    { label: 'Admit Cards', href: '/documents/admit-cards', roles: DOCUMENT_MANAGE },
    { label: 'Upload', href: '/documents/upload', roles: ['head', 'assistant_head', 'staff'] },
    { label: 'Management', href: '/documents/manage', roles: SCHOOL_LEADERS },
    { label: 'Management Alias', href: '/documents/management', roles: SCHOOL_LEADERS },
    { label: 'Document SMS', href: '/documents/sms-monitoring', roles: ['head', 'assistant_head', 'staff'] },
  ] },
  { label: 'Users & Roles', href: '/users-roles', roles: ['admin', 'super_admin', 'head'], icon: 'Users', children: [
    { label: 'Overview', href: '/users-roles', roles: ['admin', 'super_admin', 'head'] },
    { label: 'All Users', href: '/users-roles/all', roles: ['admin', 'super_admin', 'head'] },
    { label: 'Roles & Permissions', href: '/users-roles/permissions', roles: ['admin', 'super_admin', 'head'] },
  ] },
  { label: 'Committee', href: '/committee', roles: ['head', 'assistant_head', 'committee_member'], icon: 'Users2' },
  { label: 'Library', href: '/library', roles: LIBRARY_VIEW, icon: 'BookMarked', children: [
    { label: 'Overview', href: '/library', roles: LIBRARY_VIEW },
    { label: 'Books', href: '/library/books', roles: LIBRARY_MANAGE },
    { label: 'Loans', href: '/library/loans', roles: LIBRARY_MANAGE },
  ] },
  { label: 'Parent Portal', href: '/parent-portal', roles: ['parent'], icon: 'Home' },
  { label: 'Homework', href: '/homework', roles: HOMEWORK_VIEW, icon: 'BookOpen' },
  { label: 'SMS Monitoring', href: '/sms-monitoring', roles: SMS_MONITORING, icon: 'MessageSquare' },
  { label: 'Profile', href: '/profile', roles: ALL_ROLES, icon: 'User', children: [
    { label: 'My Profile', href: '/profile', roles: ALL_ROLES },
    { label: 'Change Password', href: '/profile/change-password', roles: ALL_ROLES },
    { label: 'My ID Card', href: '/id-cards/my-card', roles: ID_CARD_OWN },
  ] },
  { label: 'Settings', href: '/settings', roles: SETTINGS, icon: 'Settings' },
];

export const rolePermissions: Record<string, string[]> = {
  admin: ['admin:view', 'admin:manage', 'admin:billing', 'admin:sms'],
  super_admin: ['*'],
  head: ['*'],
  assistant_head: ['result:create', 'result:update', 'result:approve_assistant', 'result:approve_head', 'result:publish', 'exam:publish', 'idcard:generate', 'idcard:manage', 'attendance:mark', 'leave:approve', 'library:manage', 'fee:collect'],
  class_teacher: ['result:create', 'result:update', 'result:request_publish', 'attendance:mark', 'leave:approve', 'manage:homework', 'fee:collect'],
  subject_teacher: ['result:create', 'result:update', 'manage:homework'],
  teacher: ['result:create', 'result:update', 'manage:homework'],
  finance_officer: ['manage:finance', 'fee:collect', 'view:payments', 'view:own_attendance', 'leave:create'],
  librarian: ['view:documents', 'view:own_attendance', 'leave:create', 'library:manage'],
  staff: ['view:documents', 'view:own_attendance', 'leave:create', 'library:manage'],
  student: ['view:own', 'leave:create', 'view:syllabus', 'view:routine', 'view:homework', 'view:library'],
  parent: ['view:child', 'leave:create', 'view:syllabus', 'view:routine', 'view:homework', 'view:library'],
  committee_member: ['post:notice'],
};

export function hasRole(user?: User | null, roles?: UserRole[] | UserRole) {
  if (!user) return false;
  if (!roles) return true;
  const role = normalizeUserRole(user.role) || user.role;
  const normalizedRoles = (Array.isArray(roles) ? roles : [roles]).map((candidate) => normalizeUserRole(candidate) || candidate);
  if (role === 'super_admin') return true;
  return normalizedRoles.includes(role as UserRole);
}

export function hasPermission(user?: User | null | any, permission?: string) {
  if (!user || !permission) return false;
  const role = normalizeUserRole(user.role) || user.role;
  if (['super_admin', 'head'].includes(role)) return true;
  const permissions = rolePermissions[String(role)] || [];
  return permissions.includes('*') || permissions.includes(permission);
}

export const permissionActions = {
  canResultEntry: (user?: User | null | any) => hasPermission(user, 'result:create') || hasPermission(user, 'result:update'),
  canResultApproveAssistant: (user?: User | null | any) => hasPermission(user, 'result:approve_assistant'),
  canResultApproveHead: (user?: User | null | any) => hasPermission(user, 'result:approve_head'),
  canResultPublish: (user?: User | null | any) => hasPermission(user, 'result:publish'),
  canExamPublish: (user?: User | null | any) => hasPermission(user, 'exam:publish'),
  canAttendanceMark: (user?: User | null | any) => hasPermission(user, 'attendance:mark'),
  canFeeCollect: (user?: User | null | any) => hasPermission(user, 'fee:collect'),
};

export function getAllowedMenu(user?: User | null) {
  return menuConfig
    .filter((item) => hasRole(user, item.roles))
    .map((item) => ({
      ...item,
      children: item.children?.filter((child) => hasRole(user, child.roles)),
    }));
}

export const getMenuForUser = getAllowedMenu;

const isPathInList = (path: string, list: string[]) => list.some((target) => path === target || path.startsWith(`${target}/`));

export function canAccessPath(user: User | null | undefined, path: string): boolean {
  if (!user) return false;
  const normalized = normalizeUserRole(user.role) || user.role;
  if (normalized === 'super_admin') return true;
  const cleanPath = path.split('?')[0].replace(/\/$/, '') || '/';
  if (hasRole(user, QUESTION_MANAGE) && isPathInList(cleanPath, ['/question-generate', '/ai-manage', '/mcq-manage'])) return true;
  if (hasRole(user, MCQ_PRACTICE) && isPathInList(cleanPath, ['/mcq-practice'])) return true;
  const allowed = getAllowedMenu(user);
  const paths = new Set<string>();
  allowed.forEach((item) => {
    paths.add(item.href);
    item.children?.forEach((child) => paths.add(child.href));
  });
  if (paths.has(cleanPath)) return true;
  return [...paths].some((allowedPath) => allowedPath !== '/' && cleanPath.startsWith(`${allowedPath}/`));
}

export const isRouteAllowed = canAccessPath;
