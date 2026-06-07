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
const TEACHERS: UserRole[] = ['class_teacher', 'subject_teacher', 'teacher'];
const EMPLOYEES: UserRole[] = ['head', 'assistant_head', 'class_teacher', 'subject_teacher', 'teacher', 'finance_officer', 'staff'];
const SCHOOL_USERS: UserRole[] = ['head', 'assistant_head', 'class_teacher', 'subject_teacher', 'teacher', 'finance_officer', 'staff', 'student', 'parent', 'committee_member'];
const STUDENT_PARENT: UserRole[] = ['student', 'parent'];
const ACADEMIC_VIEW: UserRole[] = [...SCHOOL_LEADERS, ...TEACHERS, ...STUDENT_PARENT];
const RESULT_ENTRY: UserRole[] = ['head', 'assistant_head', 'class_teacher', 'subject_teacher', 'teacher'];
const ATTENDANCE_VIEW: UserRole[] = [...EMPLOYEES, ...STUDENT_PARENT];
const ATTENDANCE_MARK: UserRole[] = ['head', 'assistant_head', 'class_teacher'];
const SMS_MONITORING: UserRole[] = ['admin', 'super_admin', 'head'];
const SETTINGS: UserRole[] = ['head'];
const HOLIDAY_VIEW: UserRole[] = ['head', 'assistant_head', 'class_teacher', 'subject_teacher', 'teacher', 'student', 'parent', 'staff', 'finance_officer'];
const ID_CARD_OWN: UserRole[] = [...EMPLOYEES, 'student', 'parent'];
const ID_CARD_GENERATE: UserRole[] = SCHOOL_LEADER_ADMIN;
const NOTICE_VIEW: UserRole[] = [...EMPLOYEES, ...STUDENT_PARENT, 'committee_member'];
const DOCUMENT_VIEW: UserRole[] = ['head', 'assistant_head', 'finance_officer', 'staff', 'student', 'parent'];
const LIBRARY_VIEW: UserRole[] = [...SCHOOL_LEADER_ADMIN, ...TEACHERS, 'staff', 'student', 'parent'];
const LIBRARY_MANAGE: UserRole[] = [...SCHOOL_LEADER_ADMIN, 'staff'];
const HOMEWORK_VIEW: UserRole[] = [...SCHOOL_LEADERS, ...TEACHERS, 'student', 'parent'];
const LEAVE_REVIEW: UserRole[] = ['head', 'assistant_head', 'class_teacher'];
const LEAVE_APPLY: UserRole[] = ['student', 'parent', 'teacher', 'subject_teacher', 'class_teacher', 'staff', 'finance_officer'];
const FEE_COLLECT_ROLES: UserRole[] = ['head', 'assistant_head', 'finance_officer', 'class_teacher'];

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
    { label: 'Select School', href: '/admin/select-school', roles: PLATFORM_ADMIN },
    { label: 'User Management', href: '/admin/users', roles: PLATFORM_ADMIN },
    { label: 'Backup & Restore', href: '/admin/backup', roles: ['super_admin'] },
  ] },
  { label: 'Dashboard', href: '/dashboard', roles: [...PLATFORM_ADMIN, ...SCHOOL_USERS], icon: 'LayoutGrid' },
  { label: 'Notice Board', href: '/notices', roles: NOTICE_VIEW, icon: 'Bell' },
  { label: 'Holidays', href: '/holidays', roles: HOLIDAY_VIEW, icon: 'CalendarDays' },
  { label: 'ID Card', href: '/id-cards', roles: ID_CARD_OWN, icon: 'CreditCard', children: [
    { label: 'My ID Card', href: '/id-cards/my-card', roles: ID_CARD_OWN },
    { label: 'Generate Card', href: '/id-cards/generate', roles: ID_CARD_GENERATE },
    { label: 'Admit Card', href: '/id-cards/admit-card', roles: SCHOOL_LEADER_ADMIN },
    { label: 'Bulk Generate', href: '/id-cards/bulk-generate', roles: ID_CARD_GENERATE },
    { label: 'Templates', href: '/id-cards/templates', roles: SCHOOL_LEADER_ADMIN },
    { label: 'Reports', href: '/id-cards/reports', roles: SCHOOL_LEADER_ADMIN },
  ] },
  { label: 'Institution', href: '/institution', roles: [...SCHOOL_LEADERS, 'class_teacher'], icon: 'Building2', children: [
    { label: 'Profile', href: '/institution/profile', roles: SCHOOL_LEADERS },
    { label: 'Billing & Subscription', href: '/institution/billing', roles: SCHOOL_LEADERS },
    { label: 'SMS Balance', href: '/billing', roles: SCHOOL_LEADERS },
    { label: 'Finance Audit', href: '/institution/finance-audit', roles: SCHOOL_LEADERS },
    { label: 'Students', href: '/institution/students', roles: [...SCHOOL_LEADERS, 'class_teacher'] },
    { label: 'Pending Admissions', href: '/institution/pending-admissions', roles: ['head', 'assistant_head', 'class_teacher', 'subject_teacher', 'teacher'] },
    { label: 'Teachers', href: '/institution/teachers', roles: SCHOOL_LEADERS },
    { label: 'Staff', href: '/institution/staff', roles: SCHOOL_LEADERS },
    { label: 'Admission', href: '/institution/admission', roles: SCHOOL_LEADERS },
    { label: 'Backup', href: '/institution/backup', roles: ['head'] },
  ] },
  { label: 'Academic', href: '/academic-menu', roles: ACADEMIC_VIEW, icon: 'BookOpen', children: [
    { label: 'Overview', href: '/academic', roles: SCHOOL_LEADER_ADMIN },
    { label: 'Classes', href: '/academic/classes', roles: SCHOOL_LEADER_ADMIN },
    { label: 'Sections', href: '/academic/sections', roles: SCHOOL_LEADER_ADMIN },
    { label: 'Subjects', href: '/academic/subjects', roles: SCHOOL_LEADER_ADMIN },
    { label: 'Syllabus', href: '/academic/syllabus', roles: ACADEMIC_VIEW },
    { label: 'Class Routine', href: '/academic/class-routine', roles: ACADEMIC_VIEW },
    { label: 'Exam Routine', href: '/academic/exam-routine', roles: ACADEMIC_VIEW },
    { label: 'Exams', href: '/academic/exams', roles: ACADEMIC_VIEW },
    { label: 'Results', href: '/academic/results', roles: [...RESULT_ENTRY, ...STUDENT_PARENT] },
    { label: 'Final Promotion', href: '/academic/promotions', roles: ['head', 'assistant_head', 'class_teacher'] },
    { label: 'Report Card', href: '/academic/report-card', roles: ['head', 'assistant_head', 'class_teacher', 'student', 'parent'] },
  ] },
  { label: 'Attendance', href: '/attendance', roles: ATTENDANCE_VIEW, icon: 'CheckCircle2', children: [
    { label: 'Overview', href: '/attendance', roles: ATTENDANCE_MARK },
    { label: 'Mark Attendance', href: '/attendance/mark', roles: ATTENDANCE_MARK },
    { label: 'All Present Scanner', href: '/attendance/all-present', roles: ATTENDANCE_MARK },
    { label: 'Reports', href: '/attendance/reports', roles: ATTENDANCE_MARK },
    { label: 'My Attendance', href: '/attendance/my-attendance', roles: ATTENDANCE_VIEW },
  ] },
  { label: 'Leave Application', href: '/leave-application-menu', roles: [...LEAVE_REVIEW, ...LEAVE_APPLY], icon: 'CalendarDays', children: [
    { label: 'Apply for Leave', href: '/leave-application', roles: [...LEAVE_REVIEW, ...LEAVE_APPLY] },
    { label: 'Leave List', href: '/leave-list', roles: LEAVE_REVIEW },
  ] },
  { label: 'Finance', href: '/finance-menu', roles: [...FEE_COLLECT_ROLES, 'student', 'parent'], icon: 'DollarSign', children: [
    { label: 'Overview', href: '/finance', roles: ['head', 'assistant_head', 'finance_officer'] },
    { label: 'Fees', href: '/finance/fees', roles: ['head', 'assistant_head', 'finance_officer'] },
    { label: 'Fees Collect', href: '/finance/fee-collect', roles: FEE_COLLECT_ROLES },
    { label: 'Collections', href: '/finance/collections', roles: FEE_COLLECT_ROLES },
    { label: 'Salary', href: '/finance/salary', roles: ['head'] },
    { label: 'Reports', href: '/finance/reports', roles: ['head', 'assistant_head', 'finance_officer'] },
    { label: 'My Fees', href: '/finance/my-fees', roles: ['student', 'parent'] },
  ] },
  { label: 'Documents', href: '/documents', roles: DOCUMENT_VIEW, icon: 'FileText', children: [
    { label: 'Overview', href: '/documents', roles: DOCUMENT_VIEW },
    { label: 'Memo', href: '/documents/memo', roles: ['head', 'assistant_head', 'finance_officer', 'staff'] },
    { label: 'Upload', href: '/documents/upload', roles: ['head', 'assistant_head', 'staff'] },
    { label: 'Management', href: '/documents/manage', roles: SCHOOL_LEADERS },
  ] },
  { label: 'Users & Roles', href: '/users-roles', roles: ['admin', 'super_admin', 'head'], icon: 'Users', children: [
    { label: 'Overview', href: '/users-roles', roles: ['admin', 'super_admin', 'head'] },
    { label: 'All Users', href: '/users-roles/all', roles: ['admin', 'super_admin', 'head'] },
    { label: 'Roles & Permissions', href: '/users-roles/permissions', roles: ['admin', 'super_admin', 'head'] },
  ] },
  { label: 'Committee', href: '/committee', roles: ['head', 'assistant_head', 'committee_member'], icon: 'Users2' },
  { label: 'Library', href: '/library', roles: LIBRARY_VIEW, icon: 'BookMarked', children: [
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
  canResultDelete: (user?: User | null | any) => hasPermission(user, 'result:delete'),
  canExamPublish: (user?: User | null | any) => hasPermission(user, 'exam:publish'),
  canMarkAttendance: (user?: User | null | any) => hasPermission(user, 'attendance:mark'),
  canApproveLeave: (user?: User | null | any) => hasPermission(user, 'leave:approve'),
};

export function getVisibleMenuItems(userRole: UserRole): MenuItemConfig[] {
  const role = normalizeUserRole(userRole) || userRole;
  return filterMenuByRole(role);
}

export function getMenuForUser(userOrRole?: User | UserRole | string | null): MenuItemConfig[] {
  const role = typeof userOrRole === 'string' ? userOrRole : userOrRole?.role;
  const normalized = normalizeUserRole(role || '') || (role as UserRole);
  return normalized ? filterMenuByRole(normalized) : [];
}

export function filterMenuByRole(role: UserRole) {
  const normalizedRole = normalizeUserRole(role) || role;
  if (!normalizedRole) return [];
  return menuConfig
    .filter((item) => hasRole({ role: normalizedRole } as User, item.roles))
    .map((item) => ({ ...item, children: item.children?.filter((child) => hasRole({ role: normalizedRole } as User, child.roles)) }))
    .filter((item) => !item.children || item.children.length > 0);
}

export function canAccessRoute(user: User | null | undefined, path: string) {
  if (!user) return false;
  const role = normalizeUserRole(user.role) || user.role;
  if (role === 'super_admin') return true;
  const items = flattenMenu(menuConfig);
  const matches = items
    .filter((item) => path === item.href || path.startsWith(item.href + '/'))
    .sort((a, b) => b.href.length - a.href.length);
  const match = matches[0];
  if (!match) return true;
  return hasRole({ role } as User, match.roles);
}

export function isRouteAllowed(user: User | null | undefined, path: string) {
  return canAccessRoute(user, path);
}

function flattenMenu(items: MenuItemConfig[]): MenuItemConfig[] {
  return items.flatMap((item) => [item, ...(item.children ? flattenMenu(item.children) : [])]);
}
