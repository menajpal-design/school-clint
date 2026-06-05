import { UserRole, User } from '@/types';
import { getDemoMode } from './demo-store';

export interface MenuItemConfig {
  label: string;
  href: string;
  icon?: string;
  roles: UserRole[];
  children?: MenuItemConfig[];
}

export interface DashboardQuickActionConfig {
  label: string;
  href: string;
  icon: string;
  description: string;
}

export type PermissionAction =
  | 'academic:create'
  | 'academic:edit'
  | 'academic:delete'
  | 'academic:publish'
  | 'academic:approve'
  | 'result:create'
  | 'result:edit'
  | 'result:publish'
  | 'result:approve'
  | 'attendance:mark'
  | 'homework:create'
  | 'homework:edit'
  | 'homework:delete'
  | 'leave:create'
  | 'leave:approve'
  | 'leave:reject'
  | 'library:create'
  | 'library:edit'
  | 'library:delete'
  | 'library:issue'
  | 'library:return'
  | 'sms:view'
  | 'student:manage'
  | 'settings:manage';

type RoutePermission = { path: string; roles: UserRole[]; match?: 'exact' | 'prefix'; readOnlyFor?: UserRole[]; scope?: string };

export const ALL_ROLES: UserRole[] = ['admin', 'super_admin', 'head', 'assistant_head', 'class_teacher', 'subject_teacher', 'teacher', 'finance_officer', 'staff', 'student', 'parent', 'committee_member'];
export const PLATFORM_ADMIN: UserRole[] = ['admin', 'super_admin'];
export const SCHOOL_LEADERS: UserRole[] = ['head', 'assistant_head'];
export const TEACHERS: UserRole[] = ['class_teacher', 'subject_teacher', 'teacher'];
export const EMPLOYEES: UserRole[] = ['head', 'assistant_head', 'class_teacher', 'subject_teacher', 'teacher', 'finance_officer', 'staff'];
export const SCHOOL_USERS: UserRole[] = ['head', 'assistant_head', 'class_teacher', 'subject_teacher', 'teacher', 'finance_officer', 'staff', 'student', 'parent', 'committee_member'];
export const STUDENT_PARENT: UserRole[] = ['student', 'parent'];
export const ACADEMIC_VIEW: UserRole[] = [...SCHOOL_LEADERS, ...TEACHERS, ...STUDENT_PARENT];
export const ACADEMIC_MANAGE: UserRole[] = [...SCHOOL_LEADERS, ...TEACHERS];
export const RESULT_MANAGE: UserRole[] = [...SCHOOL_LEADERS, 'class_teacher', 'subject_teacher', 'teacher'];
export const ATTENDANCE_VIEW: UserRole[] = [...EMPLOYEES, ...STUDENT_PARENT];
export const ATTENDANCE_MANAGE: UserRole[] = EMPLOYEES;
export const SMS_MONITORING: UserRole[] = ['admin', 'super_admin', 'head'];
export const HOLIDAY_VIEW: UserRole[] = ['head', 'assistant_head', 'class_teacher', 'subject_teacher', 'teacher', 'student', 'parent', 'staff', 'finance_officer'];
export const ID_CARD_OWN: UserRole[] = [...EMPLOYEES, 'student'];
export const NOTICE_VIEW: UserRole[] = [...EMPLOYEES, ...STUDENT_PARENT, 'committee_member'];
export const DOCUMENT_VIEW: UserRole[] = ['head', 'assistant_head', 'finance_officer', 'staff', 'student', 'parent'];
export const LIBRARY_VIEW: UserRole[] = [...SCHOOL_LEADERS, ...TEACHERS, 'staff', 'student', 'parent'];
export const LIBRARY_MANAGE: UserRole[] = [...SCHOOL_LEADERS, 'staff', 'admin', 'super_admin'];
export const HOMEWORK_VIEW: UserRole[] = [...SCHOOL_LEADERS, ...TEACHERS, 'student', 'parent'];
export const LEAVE_REVIEW: UserRole[] = ['head', 'assistant_head', 'class_teacher'];
export const LEAVE_APPLY: UserRole[] = ['student', 'parent'];

export function normalizeUserRole(role?: string | null): UserRole | undefined {
  if (!role) return undefined;
  const normalized = String(role).toLowerCase().replace(/[\s-]+/g, '_');
  if (normalized === 'guardian' || normalized === 'parent_guardian') return 'parent';
  if (ALL_ROLES.includes(normalized as UserRole)) return normalized as UserRole;
  return undefined;
}

export const dashboardQuickActionMatrix: Record<string, DashboardQuickActionConfig[]> = {
  student: [
    { label: 'My Result', href: '/academic/results', icon: 'GraduationCap', description: 'View and download your own result only.' },
    { label: 'My Attendance', href: '/attendance/my-attendance', icon: 'CalendarCheck', description: 'View your own attendance record.' },
    { label: 'My ID Card', href: '/id-cards/my-card', icon: 'BadgeCheck', description: 'Preview or download your ID card.' },
    { label: 'My Fees', href: '/finance/my-fees', icon: 'CreditCard', description: 'View your own fee status.' },
    { label: 'Syllabus', href: '/academic/syllabus', icon: 'FileText', description: 'View your class syllabus only.' },
    { label: 'Class Routine', href: '/academic/class-routine', icon: 'BookOpen', description: 'View your class routine only.' },
    { label: 'Homework', href: '/homework', icon: 'BookOpen', description: 'See today\'s and previous homework.' },
    { label: 'Leave Application', href: '/leave-application', icon: 'CalendarCheck', description: 'Apply for leave and view your applications.' },
  ],
  parent: [
    { label: 'Child Result', href: '/academic/results', icon: 'GraduationCap', description: 'View and download child result only.' },
    { label: 'Child Attendance', href: '/attendance/my-attendance', icon: 'CalendarCheck', description: 'View child attendance.' },
    { label: 'Child Fees', href: '/finance/my-fees', icon: 'CreditCard', description: 'View child fee status.' },
    { label: 'Child Routine', href: '/academic/class-routine', icon: 'BookOpen', description: 'View child class routine.' },
    { label: 'Child Syllabus', href: '/academic/syllabus', icon: 'FileText', description: 'View child class syllabus.' },
    { label: 'Homework', href: '/homework', icon: 'BookOpen', description: 'View child homework.' },
    { label: 'Leave Application', href: '/leave-application', icon: 'CalendarCheck', description: 'Apply for child leave.' },
  ],
  head: [
    { label: 'Add Student', href: '/institution/admission', icon: 'Plus', description: 'Admit a new student.' },
    { label: 'Students', href: '/institution/students', icon: 'Users', description: 'Manage student records.' },
    { label: 'Results', href: '/academic/results', icon: 'GraduationCap', description: 'Review, approve, or publish results.' },
    { label: 'Leave Review', href: '/leave-application', icon: 'CalendarCheck', description: 'Approve or reject leave applications.' },
    { label: 'Finance Reports', href: '/finance/reports', icon: 'Landmark', description: 'View finance reports.' },
    { label: 'SMS Monitoring', href: '/sms-monitoring', icon: 'Bell', description: 'Monitor monthly SMS usage.' },
  ],
  assistant_head: [
    { label: 'Add Student', href: '/institution/admission', icon: 'Plus', description: 'Admit a new student.' },
    { label: 'Students', href: '/institution/students', icon: 'Users', description: 'Manage student records.' },
    { label: 'Results', href: '/academic/results', icon: 'GraduationCap', description: 'Review, approve, or publish results.' },
    { label: 'Leave Review', href: '/leave-application', icon: 'CalendarCheck', description: 'Approve or reject leave applications.' },
    { label: 'Finance Reports', href: '/finance/reports', icon: 'Landmark', description: 'View finance reports.' },
  ],
  class_teacher: [
    { label: 'Mark Attendance', href: '/attendance/mark', icon: 'CalendarCheck', description: 'Mark assigned class attendance.' },
    { label: 'Class Results', href: '/academic/results', icon: 'GraduationCap', description: 'Enter or manage class results.' },
    { label: 'Leave Review', href: '/leave-application', icon: 'CalendarCheck', description: 'Review assigned student leave.' },
    { label: 'Homework', href: '/homework', icon: 'BookOpen', description: 'Create class homework.' },
    { label: 'My Profile', href: '/profile', icon: 'UserRound', description: 'View and update your own profile.' },
    { label: 'Notice Board', href: '/notices', icon: 'Bell', description: 'Read published school notices.' },
  ],
  teacher: [
    { label: 'Enter Results', href: '/academic/results', icon: 'GraduationCap', description: 'Enter results for assigned subjects.' },
    { label: 'Homework', href: '/homework', icon: 'BookOpen', description: 'Create homework for students.' },
    { label: 'Class Routine', href: '/academic/class-routine', icon: 'CalendarCheck', description: 'View or propose routine items.' },
    { label: 'My Profile', href: '/profile', icon: 'UserRound', description: 'View and update your own profile.' },
    { label: 'Notice Board', href: '/notices', icon: 'Bell', description: 'Read published school notices.' },
  ],
  subject_teacher: [
    { label: 'Enter Results', href: '/academic/results', icon: 'GraduationCap', description: 'Enter results for assigned subjects.' },
    { label: 'Homework', href: '/homework', icon: 'BookOpen', description: 'Create homework for students.' },
    { label: 'Class Routine', href: '/academic/class-routine', icon: 'CalendarCheck', description: 'View or propose routine items.' },
    { label: 'My Profile', href: '/profile', icon: 'UserRound', description: 'View and update your own profile.' },
    { label: 'Notice Board', href: '/notices', icon: 'Bell', description: 'Read published school notices.' },
  ],
  finance_officer: [
    { label: 'Collect Fees', href: '/finance/collections', icon: 'CreditCard', description: 'Manage fee collection.' },
    { label: 'Finance Reports', href: '/finance/reports', icon: 'FileText', description: 'View finance reports.' },
    { label: 'My Profile', href: '/profile', icon: 'UserRound', description: 'View and update your own profile.' },
    { label: 'Notice Board', href: '/notices', icon: 'Bell', description: 'Read published school notices.' },
  ],
  staff: [
    { label: 'Documents', href: '/documents', icon: 'FileText', description: 'Manage permitted documents.' },
    { label: 'Library', href: '/library', icon: 'BookOpen', description: 'Manage library records if assigned.' },
    { label: 'My ID Card', href: '/id-cards/my-card', icon: 'BadgeCheck', description: 'Preview or download your ID card.' },
    { label: 'My Profile', href: '/profile', icon: 'UserRound', description: 'View and update your own profile.' },
    { label: 'Notice Board', href: '/notices', icon: 'Bell', description: 'Read published school notices.' },
  ],
};

export const actionPermissionMatrix: Record<PermissionAction, UserRole[]> = {
  'academic:create': ACADEMIC_MANAGE, 'academic:edit': ACADEMIC_MANAGE, 'academic:delete': ACADEMIC_MANAGE, 'academic:publish': SCHOOL_LEADERS, 'academic:approve': SCHOOL_LEADERS,
  'result:create': RESULT_MANAGE, 'result:edit': RESULT_MANAGE, 'result:publish': SCHOOL_LEADERS, 'result:approve': SCHOOL_LEADERS,
  'attendance:mark': ['head', 'assistant_head', 'class_teacher', 'subject_teacher', 'teacher'],
  'homework:create': [...SCHOOL_LEADERS, ...TEACHERS, 'admin', 'super_admin'], 'homework:edit': [...SCHOOL_LEADERS, ...TEACHERS, 'admin', 'super_admin'], 'homework:delete': [...SCHOOL_LEADERS, ...TEACHERS, 'admin', 'super_admin'],
  'leave:create': LEAVE_APPLY, 'leave:approve': LEAVE_REVIEW, 'leave:reject': LEAVE_REVIEW,
  'library:create': LIBRARY_MANAGE, 'library:edit': LIBRARY_MANAGE, 'library:delete': LIBRARY_MANAGE, 'library:issue': LIBRARY_MANAGE, 'library:return': LIBRARY_MANAGE,
  'sms:view': SMS_MONITORING, 'student:manage': [...SCHOOL_LEADERS, ...TEACHERS, 'admin', 'super_admin'], 'settings:manage': ['admin', 'super_admin', 'head'],
};

export const routePermissionMatrix: RoutePermission[] = [
  { path: '/dashboard', roles: [...PLATFORM_ADMIN, ...SCHOOL_USERS] },
  { path: '/profile', roles: ALL_ROLES, match: 'prefix' },
  { path: '/notices', roles: NOTICE_VIEW, match: 'prefix', scope: 'public-or-assigned' },
  { path: '/id-cards/my-card', roles: ID_CARD_OWN, scope: 'own-card-only' },
  { path: '/institution/students', roles: [...SCHOOL_LEADERS, ...TEACHERS, 'admin', 'super_admin'] },
  { path: '/institution/admission', roles: [...SCHOOL_LEADERS, 'admin', 'super_admin'] },
  { path: '/institution/teachers', roles: [...SCHOOL_LEADERS, 'admin', 'super_admin'] },
  { path: '/institution/staff', roles: [...SCHOOL_LEADERS, 'admin', 'super_admin'] },
  { path: '/institution', roles: [...SCHOOL_LEADERS, ...TEACHERS, 'admin', 'super_admin'], match: 'prefix' },
  { path: '/academic', roles: ACADEMIC_MANAGE, match: 'exact' },
  { path: '/academic/classes', roles: SCHOOL_LEADERS, match: 'prefix' },
  { path: '/academic/sections', roles: SCHOOL_LEADERS, match: 'prefix' },
  { path: '/academic/subjects', roles: ACADEMIC_MANAGE, match: 'prefix' },
  { path: '/academic/syllabus', roles: ACADEMIC_VIEW, match: 'prefix', readOnlyFor: STUDENT_PARENT, scope: 'own-or-child-class' },
  { path: '/academic/class-routine', roles: ACADEMIC_VIEW, match: 'prefix', readOnlyFor: STUDENT_PARENT, scope: 'own-or-child-class' },
  { path: '/academic/exams', roles: ACADEMIC_VIEW, match: 'prefix', readOnlyFor: STUDENT_PARENT, scope: 'published-own-or-child-class' },
  { path: '/academic/exam-routine', roles: ACADEMIC_VIEW, match: 'prefix', readOnlyFor: STUDENT_PARENT, scope: 'published-own-or-child-class' },
  { path: '/academic/results', roles: [...RESULT_MANAGE, ...STUDENT_PARENT], match: 'prefix', readOnlyFor: STUDENT_PARENT, scope: 'own-or-child-result' },
  { path: '/attendance/mark', roles: ['head', 'assistant_head', 'class_teacher', 'subject_teacher', 'teacher'] },
  { path: '/attendance/my-attendance', roles: ATTENDANCE_VIEW, match: 'prefix', scope: 'own-or-child-attendance' },
  { path: '/attendance', roles: ATTENDANCE_MANAGE, match: 'prefix' },
  { path: '/finance/my-fees', roles: ['student', 'parent'], match: 'prefix', scope: 'own-or-child-fees' },
  { path: '/finance', roles: ['head', 'assistant_head', 'finance_officer'], match: 'prefix' },
  { path: '/leave-application', roles: [...LEAVE_REVIEW, ...LEAVE_APPLY], match: 'prefix', scope: 'own-child-or-review-scope' },
  { path: '/library/books', roles: LIBRARY_MANAGE, match: 'prefix' },
  { path: '/library/loans', roles: LIBRARY_MANAGE, match: 'prefix' },
  { path: '/library', roles: LIBRARY_VIEW, match: 'exact', readOnlyFor: STUDENT_PARENT, scope: 'available-or-own-child-loans' },
  { path: '/homework', roles: HOMEWORK_VIEW, match: 'prefix', readOnlyFor: STUDENT_PARENT, scope: 'own-or-child-class-homework' },
  { path: '/sms-monitoring', roles: SMS_MONITORING, match: 'prefix' },
  { path: '/users', roles: ['admin', 'super_admin', 'head'], match: 'prefix' },
  { path: '/users-roles', roles: ['admin', 'super_admin', 'head'], match: 'prefix' },
  { path: '/settings', roles: ['admin', 'super_admin', 'head'], match: 'prefix' },
  { path: '/documents', roles: DOCUMENT_VIEW, match: 'prefix' },
  { path: '/committee', roles: ['head', 'assistant_head', 'committee_member'], match: 'prefix' },
  { path: '/parent-portal', roles: ['parent'], match: 'prefix' },
  { path: '/admin', roles: PLATFORM_ADMIN, match: 'prefix' },
];

export const menuConfig: MenuItemConfig[] = [
  { label: 'Admin', href: '/admin', roles: PLATFORM_ADMIN, icon: 'ShieldCheck', children: [
    { label: 'Overview', href: '/admin', roles: PLATFORM_ADMIN }, { label: 'School Management', href: '/admin/schools', roles: PLATFORM_ADMIN }, { label: 'Subscriptions', href: '/admin/subscriptions', roles: PLATFORM_ADMIN }, { label: 'Accounting', href: '/admin/accounting', roles: PLATFORM_ADMIN }, { label: 'SMS Usage', href: '/admin/sms-usage', roles: PLATFORM_ADMIN }, { label: 'Select School', href: '/admin/select-school', roles: PLATFORM_ADMIN }, { label: 'User Management', href: '/admin/users', roles: PLATFORM_ADMIN }, { label: 'Backup & Restore', href: '/admin/backup', roles: ['super_admin'] },
  ] },
  { label: 'Dashboard', href: '/dashboard', roles: [...PLATFORM_ADMIN, ...SCHOOL_USERS], icon: 'LayoutGrid' },
  { label: 'Notice Board', href: '/notices', roles: NOTICE_VIEW, icon: 'Bell' },
  { label: 'Holidays', href: '/holidays', roles: HOLIDAY_VIEW, icon: 'CalendarDays' },
  { label: 'ID Card', href: '/id-cards', roles: ID_CARD_OWN, icon: 'CreditCard', children: [
    { label: 'My ID Card', href: '/id-cards/my-card', roles: ID_CARD_OWN }, { label: 'Generate Card', href: '/id-cards/generate', roles: ['head', 'assistant_head', 'staff'] }, { label: 'Admit Card', href: '/id-cards/admit-card', roles: ['head', 'assistant_head', 'staff'] }, { label: 'Bulk Generate', href: '/id-cards/bulk-generate', roles: SCHOOL_LEADERS }, { label: 'Templates', href: '/id-cards/templates', roles: SCHOOL_LEADERS }, { label: 'Reports', href: '/id-cards/reports', roles: SCHOOL_LEADERS },
  ] },
  { label: 'Institution', href: '/institution', roles: [...SCHOOL_LEADERS, ...TEACHERS], icon: 'Building2', children: [
    { label: 'Profile', href: '/institution/profile', roles: SCHOOL_LEADERS }, { label: 'Billing & Subscription', href: '/institution/billing', roles: SCHOOL_LEADERS }, { label: 'SMS Balance', href: '/billing', roles: SCHOOL_LEADERS }, { label: 'Finance Audit', href: '/institution/finance-audit', roles: SCHOOL_LEADERS }, { label: 'Students', href: '/institution/students', roles: [...SCHOOL_LEADERS, ...TEACHERS] }, { label: 'Teachers', href: '/institution/teachers', roles: SCHOOL_LEADERS }, { label: 'Staff', href: '/institution/staff', roles: SCHOOL_LEADERS }, { label: 'Admission', href: '/institution/admission', roles: SCHOOL_LEADERS }, { label: 'Backup', href: '/institution/backup', roles: ['head'] },
  ] },
  { label: 'Academic', href: '/academic-menu', roles: ACADEMIC_VIEW, icon: 'BookOpen', children: [
    { label: 'Overview', href: '/academic', roles: ACADEMIC_MANAGE }, { label: 'Classes', href: '/academic/classes', roles: SCHOOL_LEADERS }, { label: 'Sections', href: '/academic/sections', roles: SCHOOL_LEADERS }, { label: 'Subjects', href: '/academic/subjects', roles: ACADEMIC_MANAGE }, { label: 'Syllabus', href: '/academic/syllabus', roles: ACADEMIC_VIEW }, { label: 'Class Routine', href: '/academic/class-routine', roles: ACADEMIC_VIEW }, { label: 'Exam Routine', href: '/academic/exam-routine', roles: ACADEMIC_VIEW }, { label: 'Exams', href: '/academic/exams', roles: ACADEMIC_VIEW }, { label: 'Results', href: '/academic/results', roles: [...RESULT_MANAGE, ...STUDENT_PARENT] }, { label: 'Final Promotion', href: '/academic/promotions', roles: ['head', 'assistant_head', 'class_teacher'] }, { label: 'Report Card', href: '/academic/report-card', roles: ['head', 'assistant_head', 'class_teacher', 'student', 'parent'] },
  ] },
  { label: 'Attendance', href: '/attendance', roles: ATTENDANCE_VIEW, icon: 'CheckCircle2', children: [
    { label: 'Overview', href: '/attendance', roles: ATTENDANCE_MANAGE }, { label: 'Mark Attendance', href: '/attendance/mark', roles: ['head', 'assistant_head', 'class_teacher', 'subject_teacher', 'teacher'] }, { label: 'All Present Scanner', href: '/attendance/all-present', roles: ATTENDANCE_MANAGE }, { label: 'Reports', href: '/attendance/reports', roles: ['head', 'assistant_head', 'class_teacher', 'subject_teacher', 'teacher'] }, { label: 'My Attendance', href: '/attendance/my-attendance', roles: ATTENDANCE_VIEW },
  ] },
  { label: 'Leave Application', href: '/leave-application-menu', roles: [...LEAVE_REVIEW, ...LEAVE_APPLY], icon: 'CalendarDays', children: [
    { label: 'Apply for Leave', href: '/leave-application', roles: [...LEAVE_REVIEW, ...LEAVE_APPLY] }, { label: 'Leave List', href: '/leave-list', roles: LEAVE_REVIEW },
  ] },
  { label: 'Finance', href: '/finance-menu', roles: ['head', 'assistant_head', 'finance_officer', 'student', 'parent'], icon: 'DollarSign', children: [
    { label: 'Overview', href: '/finance', roles: ['head', 'assistant_head', 'finance_officer'] }, { label: 'Fees', href: '/finance/fees', roles: ['head', 'assistant_head', 'finance_officer'] }, { label: 'Collections', href: '/finance/collections', roles: ['head', 'assistant_head', 'finance_officer'] }, { label: 'Salary', href: '/finance/salary', roles: ['head'] }, { label: 'Reports', href: '/finance/reports', roles: ['head', 'assistant_head', 'finance_officer'] }, { label: 'My Fees', href: '/finance/my-fees', roles: ['student', 'parent'] },
  ] },
  { label: 'Documents', href: '/documents', roles: DOCUMENT_VIEW, icon: 'FileText', children: [
    { label: 'Overview', href: '/documents', roles: DOCUMENT_VIEW }, { label: 'Memo', href: '/documents/memo', roles: ['head', 'assistant_head', 'finance_officer', 'staff'] }, { label: 'Upload', href: '/documents/upload', roles: ['head', 'assistant_head', 'staff'] }, { label: 'Management', href: '/documents/manage', roles: SCHOOL_LEADERS },
  ] },
  { label: 'Users & Roles', href: '/users-roles', roles: ['admin', 'super_admin', 'head'], icon: 'Users', children: [
    { label: 'Overview', href: '/users-roles', roles: ['admin', 'super_admin', 'head'] }, { label: 'All Users', href: '/users-roles/all', roles: ['admin', 'super_admin', 'head'] }, { label: 'Roles & Permissions', href: '/users-roles/permissions', roles: ['admin', 'super_admin', 'head'] },
  ] },
  { label: 'Committee', href: '/committee', roles: ['head', 'assistant_head', 'committee_member'], icon: 'Users2' },
  { label: 'Library', href: '/library', roles: LIBRARY_VIEW, icon: 'BookMarked', children: [
    { label: 'Books', href: '/library/books', roles: LIBRARY_MANAGE }, { label: 'Loans', href: '/library/loans', roles: LIBRARY_MANAGE },
  ] },
  { label: 'Parent Portal', href: '/parent-portal', roles: ['parent'], icon: 'Home' },
  { label: 'Homework', href: '/homework', roles: HOMEWORK_VIEW, icon: 'BookOpen' },
  { label: 'SMS Monitoring', href: '/sms-monitoring', roles: SMS_MONITORING, icon: 'MessageSquare' },
  { label: 'Profile', href: '/profile', roles: ALL_ROLES, icon: 'User', children: [
    { label: 'My Profile', href: '/profile', roles: ALL_ROLES }, { label: 'Change Password', href: '/profile/change-password', roles: ALL_ROLES }, { label: 'My ID Card', href: '/id-cards/my-card', roles: ID_CARD_OWN },
  ] },
  { label: 'Settings', href: '/settings', roles: ['admin', 'super_admin', 'head'], icon: 'Settings' },
];

export const rolePermissions: Record<UserRole, string[]> = {
  admin: ['*'], super_admin: ['*'], head: ['*'], assistant_head: ['manage:assignedArea', 'generate:idcard', 'edit:idcard', 'download:idcard', 'manage:academic', 'post:notice', 'review:leave'], class_teacher: ['manage:attendance', 'manage:class_students', 'view:academic', 'review:leave', 'manage:homework'], subject_teacher: ['manage:results', 'view:academic', 'manage:homework'], teacher: ['manage:results', 'view:academic', 'manage:homework'], finance_officer: ['manage:finance', 'view:payments', 'view:attendance'], staff: ['manage:idcard', 'download:idcard', 'view:documents', 'manage:library'], student: ['view:own', 'apply:leave', 'view:syllabus', 'view:routine', 'view:homework', 'view:library'], parent: ['view:child', 'apply:leave', 'view:syllabus', 'view:routine', 'view:homework', 'view:library'], committee_member: ['post:notice'],
};

export function getDashboardQuickActions(role?: UserRole | string): DashboardQuickActionConfig[] { const normalizedRole = normalizeUserRole(role); if (!normalizedRole) return []; return dashboardQuickActionMatrix[normalizedRole] || [{ label: 'My Profile', href: '/profile', icon: 'UserRound', description: 'View and update your own profile.' }, { label: 'Notice Board', href: '/notices', icon: 'Bell', description: 'Read published school notices.' }]; }
export function canPerformAction(roleOrUser: UserRole | string | User | null | undefined, action: PermissionAction): boolean { if (getDemoMode()) return true; const role = typeof roleOrUser === 'string' ? normalizeUserRole(roleOrUser) : normalizeUserRole(roleOrUser?.role); if (!role) return false; if (['admin', 'super_admin', 'head'].includes(role)) return true; return (actionPermissionMatrix[action] || []).includes(role); }
export function isRoleReadOnlyForRoute(roleOrUser: UserRole | string | User | null | undefined, pathname: string): boolean { const role = typeof roleOrUser === 'string' ? normalizeUserRole(roleOrUser) : normalizeUserRole(roleOrUser?.role); if (!role) return false; const route = findRoutePermission(pathname); return Boolean(route?.readOnlyFor?.includes(role)); }
export function hasRole(user?: User | null, roles?: UserRole[] | UserRole) { if (!user) return false; if (getDemoMode()) return true; if (!roles) return true; const role = normalizeUserRole(user.role) || user.role; if (['admin', 'super_admin', 'head'].includes(role)) return true; if (Array.isArray(roles)) return roles.includes(role); return role === roles; }
export function hasPermission(user?: User | null, permission?: string) { if (!user || !permission) return false; if (getDemoMode()) return true; const role = normalizeUserRole(user.role) || user.role; if (['admin', 'super_admin', 'head'].includes(role)) return true; const rolePerms = rolePermissions[role] || []; if (rolePerms.includes('*')) return true; if (rolePerms.includes(permission)) return true; if (Array.isArray(user.permissions) && user.permissions.includes(permission)) return true; return false; }
function filterMenuByRole(userRole: UserRole) { return menuConfig.map((item) => { const children = item.children?.filter((child) => child.roles.includes(userRole)); return { ...item, children }; }).filter((item) => item.roles.includes(userRole) && (!item.children || item.children.length > 0)); }
export function getVisibleMenuItems(userRole: UserRole | string): MenuItemConfig[] { const role = normalizeUserRole(userRole); return role ? filterMenuByRole(role) : []; }
export function getMenuForUser(user?: User | null) { if (!user) return []; if (getDemoMode()) return menuConfig; const role = normalizeUserRole(user.role); return role ? filterMenuByRole(role) : []; }
const normalizePath = (pathname: string) => pathname.split('?')[0].replace(/\/$/, '') || '/';
const routeAliases: Record<string, string> = { '/documents/admit-cards': '/id-cards/admit-card', '/academic/holiday-list': '/holidays', '/billing': '/billing', '/institution/billing': '/institution/billing', '/leave-list': '/leave-application', '/class-routine': '/academic/class-routine', '/my-result': '/academic/results', '/academic/my-results': '/academic/results' };
function findRoutePermission(pathname: string): RoutePermission | undefined { const path = routeAliases[normalizePath(pathname)] || normalizePath(pathname); return routePermissionMatrix.slice().sort((a, b) => normalizePath(b.path).length - normalizePath(a.path).length).find((route) => { const routePath = normalizePath(route.path); if ((route.match || 'exact') === 'prefix') return path === routePath || path.startsWith(`${routePath}/`); return path === routePath; }); }
export function isRouteAllowed(pathname: string, userRole: UserRole | string): boolean { if (getDemoMode()) return true; const role = normalizeUserRole(userRole); if (!role) return false; if (['admin', 'super_admin', 'head'].includes(role)) return true; const route = findRoutePermission(pathname); return Boolean(route?.roles.includes(role)); }
