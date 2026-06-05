import { UserRole, User } from '@/types';
import { getDemoMode } from './demo-store';

export interface MenuItemConfig { label: string; href: string; icon?: string; roles: UserRole[]; children?: MenuItemConfig[] }
export interface DashboardQuickActionConfig { label: string; href: string; icon: string; description: string }
export type PermissionAction = 'academic:create' | 'academic:edit' | 'academic:delete' | 'academic:publish' | 'academic:approve' | 'result:create' | 'result:edit' | 'result:publish' | 'result:approve' | 'attendance:mark' | 'homework:create' | 'homework:edit' | 'homework:delete' | 'leave:create' | 'leave:approve' | 'leave:reject' | 'library:create' | 'library:edit' | 'library:delete' | 'library:issue' | 'library:return' | 'sms:view' | 'student:manage' | 'settings:manage';
type RoutePermission = { path: string; roles: UserRole[]; match?: 'exact' | 'prefix'; readOnlyFor?: UserRole[]; scope?: string };

export const ALL_ROLES: UserRole[] = ['admin', 'super_admin', 'head', 'assistant_head', 'class_teacher', 'subject_teacher', 'teacher', 'finance_officer', 'librarian', 'staff', 'student', 'parent', 'committee_member'];
export const PLATFORM_ADMIN: UserRole[] = ['admin', 'super_admin'];
export const SCHOOL_LEADERS: UserRole[] = ['head', 'assistant_head'];
export const TEACHERS: UserRole[] = ['class_teacher', 'subject_teacher', 'teacher'];
export const STAFF_VIEW: UserRole[] = ['staff', 'finance_officer', 'librarian'];
export const EMPLOYEES: UserRole[] = [...SCHOOL_LEADERS, ...TEACHERS, ...STAFF_VIEW];
export const SCHOOL_USERS: UserRole[] = [...EMPLOYEES, 'student', 'parent', 'committee_member'];
export const STUDENT_PARENT: UserRole[] = ['student', 'parent'];
export const ACADEMIC_VIEW: UserRole[] = [...SCHOOL_LEADERS, ...TEACHERS, ...STUDENT_PARENT];
export const ACADEMIC_MANAGE: UserRole[] = SCHOOL_LEADERS;
export const RESULT_ENTRY: UserRole[] = ['head', 'assistant_head', 'class_teacher', 'subject_teacher', 'teacher'];
export const RESULT_PUBLISH: UserRole[] = SCHOOL_LEADERS;
export const ATTENDANCE_VIEW: UserRole[] = [...EMPLOYEES, ...STUDENT_PARENT];
export const ATTENDANCE_MARK: UserRole[] = ['head', 'assistant_head', 'class_teacher'];
export const SMS_MONITORING: UserRole[] = ['admin', 'super_admin', 'head'];
export const HOLIDAY_VIEW: UserRole[] = [...EMPLOYEES, ...STUDENT_PARENT];
export const ID_CARD_OWN: UserRole[] = [...EMPLOYEES, 'student'];
export const ID_CARD_MANAGE: UserRole[] = ['head', 'assistant_head'];
export const NOTICE_VIEW: UserRole[] = [...EMPLOYEES, ...STUDENT_PARENT, 'committee_member'];
export const DOCUMENT_VIEW: UserRole[] = ['head', 'assistant_head', 'finance_officer', 'staff'];
export const LIBRARY_VIEW: UserRole[] = [...SCHOOL_LEADERS, ...TEACHERS, 'finance_officer', 'librarian', 'staff', 'student', 'parent'];
export const LIBRARY_MANAGE: UserRole[] = ['head', 'assistant_head', 'admin', 'super_admin', 'librarian'];
export const HOMEWORK_VIEW: UserRole[] = [...SCHOOL_LEADERS, ...TEACHERS, 'student', 'parent'];
export const HOMEWORK_MANAGE: UserRole[] = [...SCHOOL_LEADERS, ...TEACHERS];
export const LEAVE_REVIEW: UserRole[] = ['head', 'assistant_head', 'class_teacher'];
export const LEAVE_APPLY: UserRole[] = ['student', 'parent'];
export const FINANCE_MANAGE: UserRole[] = ['head', 'assistant_head', 'finance_officer'];

export function normalizeUserRole(role?: string | null): UserRole | undefined {
  if (!role) return undefined;
  const normalized = String(role).toLowerCase().replace(/[\s-]+/g, '_');
  if (normalized === 'guardian' || normalized === 'parent_guardian') return 'parent';
  if (normalized === 'library' || normalized === 'library_admin') return 'librarian';
  return ALL_ROLES.includes(normalized as UserRole) ? normalized as UserRole : undefined;
}

const qa = (label: string, href: string, icon: string, description: string): DashboardQuickActionConfig => ({ label, href, icon, description });
export const dashboardQuickActionMatrix: Record<string, DashboardQuickActionConfig[]> = {
  student: [qa('My Result', '/academic/results', 'GraduationCap', 'View own result only.'), qa('My Attendance', '/attendance/my-attendance', 'CalendarCheck', 'View own attendance.'), qa('My ID Card', '/id-cards/my-card', 'BadgeCheck', 'Preview/download own ID card.'), qa('My Fees', '/finance/my-fees', 'CreditCard', 'View own fees.'), qa('Syllabus', '/academic/syllabus', 'FileText', 'View own class syllabus.'), qa('Class Routine', '/academic/class-routine', 'BookOpen', 'View own class routine.'), qa('Homework', '/homework', 'BookOpen', 'View own class homework.'), qa('Leave Application', '/leave-application', 'CalendarCheck', 'Apply for leave.')],
  parent: [qa('Child Result', '/academic/results', 'GraduationCap', 'View linked child result.'), qa('Child Attendance', '/attendance/my-attendance', 'CalendarCheck', 'View child attendance.'), qa('Child Fees', '/finance/my-fees', 'CreditCard', 'View child fees.'), qa('Child Routine', '/academic/class-routine', 'BookOpen', 'View child routine.'), qa('Child Syllabus', '/academic/syllabus', 'FileText', 'View child syllabus.'), qa('Homework', '/homework', 'BookOpen', 'View child homework.'), qa('Leave Application', '/leave-application', 'CalendarCheck', 'Apply for child leave.')],
  head: [qa('Add Student', '/institution/admission', 'Plus', 'Admit a new student.'), qa('Students', '/institution/students', 'Users', 'Manage student records.'), qa('Results', '/academic/results', 'GraduationCap', 'Review/approve/publish results.'), qa('Leave Review', '/leave-application', 'CalendarCheck', 'Approve/reject leave.'), qa('Finance Reports', '/finance/reports', 'Landmark', 'View finance reports.'), qa('SMS Monitoring', '/sms-monitoring', 'Bell', 'Monitor SMS usage.')],
  assistant_head: [qa('Students', '/institution/students', 'Users', 'Review student records.'), qa('Results', '/academic/results', 'GraduationCap', 'Review academic results.'), qa('Leave Review', '/leave-application', 'CalendarCheck', 'Approve/reject leave.'), qa('Homework', '/homework', 'BookOpen', 'Review homework.'), qa('Notice Board', '/notices', 'Bell', 'Read notices.')],
  class_teacher: [qa('Assigned Class', '/institution/students', 'Users', 'View assigned class students.'), qa('Mark Attendance', '/attendance/mark', 'CalendarCheck', 'Mark assigned class attendance.'), qa('Class Attendance Report', '/attendance/reports', 'FileText', 'View assigned class reports.'), qa('Homework', '/homework', 'BookOpen', 'Add assigned class homework.'), qa('Leave Applications', '/leave-application', 'CalendarCheck', 'Review assigned class leave.'), qa('Class Routine', '/academic/class-routine', 'BookOpen', 'View assigned routine.'), qa('Syllabus', '/academic/syllabus', 'FileText', 'View assigned syllabus.'), qa('Exam Routine', '/academic/exam-routine', 'CalendarCheck', 'View assigned exam routine.'), qa('Result Entry', '/academic/results', 'GraduationCap', 'Enter assigned class/subject results.'), qa('Notice Board', '/notices', 'Bell', 'Read notices.')],
  teacher: [qa('My Profile', '/profile', 'UserRound', 'View own profile.'), qa('My Attendance', '/attendance/my-attendance', 'CalendarCheck', 'View own attendance.'), qa('Homework', '/homework', 'BookOpen', 'Add/view assigned homework.'), qa('Class Routine', '/academic/class-routine', 'BookOpen', 'View assigned routine.'), qa('Syllabus', '/academic/syllabus', 'FileText', 'View assigned syllabus.'), qa('Exam Routine', '/academic/exam-routine', 'CalendarCheck', 'View assigned exam routine.'), qa('Results / Marks Entry', '/academic/results', 'GraduationCap', 'Enter marks only if assigned.'), qa('Notice Board', '/notices', 'Bell', 'Read notices.'), qa('Library', '/library', 'BookOpen', 'View books/own loans.')],
  subject_teacher: [qa('My Profile', '/profile', 'UserRound', 'View own profile.'), qa('My Attendance', '/attendance/my-attendance', 'CalendarCheck', 'View own attendance.'), qa('Homework', '/homework', 'BookOpen', 'Add/view assigned homework.'), qa('Class Routine', '/academic/class-routine', 'BookOpen', 'View assigned routine.'), qa('Syllabus', '/academic/syllabus', 'FileText', 'View assigned syllabus.'), qa('Exam Routine', '/academic/exam-routine', 'CalendarCheck', 'View assigned exam routine.'), qa('Results / Marks Entry', '/academic/results', 'GraduationCap', 'Enter marks only if assigned.'), qa('Notice Board', '/notices', 'Bell', 'Read notices.')],
  staff: [qa('My Profile', '/profile', 'UserRound', 'View own profile.'), qa('My Attendance', '/attendance/my-attendance', 'CalendarCheck', 'View own attendance.'), qa('Notice Board', '/notices', 'Bell', 'Read notices.'), qa('Library', '/library', 'BookOpen', 'View library read-only.')],
  finance_officer: [qa('Collect Fees', '/finance/collections', 'CreditCard', 'Manage fee collection.'), qa('Finance Reports', '/finance/reports', 'FileText', 'View finance reports.'), qa('My Profile', '/profile', 'UserRound', 'View own profile.'), qa('My Attendance', '/attendance/my-attendance', 'CalendarCheck', 'View own attendance.'), qa('Notice Board', '/notices', 'Bell', 'Read notices.')],
  librarian: [qa('Library', '/library', 'BookOpen', 'Manage books and loans.'), qa('Manage Books', '/library/books', 'BookOpen', 'Add/edit/delete books.'), qa('Issue / Return', '/library/loans', 'CalendarCheck', 'Issue and return books.'), qa('My Profile', '/profile', 'UserRound', 'View own profile.'), qa('Notice Board', '/notices', 'Bell', 'Read notices.')],
};

export const actionPermissionMatrix: Record<PermissionAction, UserRole[]> = {
  'academic:create': ACADEMIC_MANAGE, 'academic:edit': ACADEMIC_MANAGE, 'academic:delete': ACADEMIC_MANAGE, 'academic:publish': RESULT_PUBLISH, 'academic:approve': RESULT_PUBLISH,
  'result:create': RESULT_ENTRY, 'result:edit': RESULT_ENTRY, 'result:publish': RESULT_PUBLISH, 'result:approve': RESULT_PUBLISH,
  'attendance:mark': ATTENDANCE_MARK, 'homework:create': HOMEWORK_MANAGE, 'homework:edit': HOMEWORK_MANAGE, 'homework:delete': HOMEWORK_MANAGE,
  'leave:create': LEAVE_APPLY, 'leave:approve': LEAVE_REVIEW, 'leave:reject': LEAVE_REVIEW,
  'library:create': LIBRARY_MANAGE, 'library:edit': LIBRARY_MANAGE, 'library:delete': LIBRARY_MANAGE, 'library:issue': LIBRARY_MANAGE, 'library:return': LIBRARY_MANAGE,
  'sms:view': SMS_MONITORING, 'student:manage': SCHOOL_LEADERS, 'settings:manage': ['admin', 'super_admin', 'head'],
};

export const routePermissionMatrix: RoutePermission[] = [
  { path: '/dashboard', roles: [...PLATFORM_ADMIN, ...SCHOOL_USERS] },
  { path: '/profile', roles: ALL_ROLES, match: 'prefix' },
  { path: '/notices', roles: NOTICE_VIEW, match: 'prefix', scope: 'public-or-assigned' },
  { path: '/id-cards/my-card', roles: ID_CARD_OWN, scope: 'own-card-only' },
  { path: '/id-cards/generate', roles: ID_CARD_MANAGE, match: 'prefix' },
  { path: '/id-cards/admit-card', roles: ID_CARD_MANAGE, match: 'prefix' },
  { path: '/id-cards/bulk-generate', roles: ['head'], match: 'prefix' },
  { path: '/id-cards/templates', roles: SCHOOL_LEADERS, match: 'prefix' },
  { path: '/id-cards/reports', roles: SCHOOL_LEADERS, match: 'prefix' },
  { path: '/institution/students', roles: ['head', 'assistant_head', 'class_teacher'], scope: 'assigned-class-for-class-teacher' },
  { path: '/institution/admission', roles: SCHOOL_LEADERS },
  { path: '/institution/teachers', roles: SCHOOL_LEADERS },
  { path: '/institution/staff', roles: SCHOOL_LEADERS },
  { path: '/institution', roles: SCHOOL_LEADERS, match: 'prefix' },
  { path: '/academic', roles: ACADEMIC_MANAGE, match: 'exact' },
  { path: '/academic/classes', roles: SCHOOL_LEADERS, match: 'prefix' },
  { path: '/academic/sections', roles: SCHOOL_LEADERS, match: 'prefix' },
  { path: '/academic/subjects', roles: SCHOOL_LEADERS, match: 'prefix' },
  { path: '/academic/syllabus', roles: ACADEMIC_VIEW, match: 'prefix', readOnlyFor: ['student', 'parent', 'teacher', 'subject_teacher', 'class_teacher'], scope: 'own-child-or-assigned-class' },
  { path: '/academic/class-routine', roles: ACADEMIC_VIEW, match: 'prefix', readOnlyFor: ['student', 'parent', 'teacher', 'subject_teacher', 'class_teacher'], scope: 'own-child-or-assigned-class' },
  { path: '/academic/exams', roles: ACADEMIC_VIEW, match: 'prefix', readOnlyFor: ['student', 'parent', 'teacher', 'subject_teacher', 'class_teacher'], scope: 'published-or-assigned-class' },
  { path: '/academic/exam-routine', roles: ACADEMIC_VIEW, match: 'prefix', readOnlyFor: ['student', 'parent', 'teacher', 'subject_teacher', 'class_teacher'], scope: 'published-or-assigned-class' },
  { path: '/academic/results', roles: [...RESULT_ENTRY, ...STUDENT_PARENT], match: 'prefix', readOnlyFor: STUDENT_PARENT, scope: 'own-child-or-assigned-result' },
  { path: '/attendance/mark', roles: ATTENDANCE_MARK, scope: 'assigned-class-only' },
  { path: '/attendance/reports', roles: ['head', 'assistant_head', 'class_teacher'], match: 'prefix', scope: 'assigned-class-for-class-teacher' },
  { path: '/attendance/all-present', roles: ATTENDANCE_MARK, match: 'prefix', scope: 'assigned-class-only' },
  { path: '/attendance/my-attendance', roles: ATTENDANCE_VIEW, match: 'prefix', scope: 'own-or-child-attendance' },
  { path: '/attendance', roles: ['head', 'assistant_head', 'class_teacher'], match: 'exact' },
  { path: '/finance/my-fees', roles: ['student', 'parent'], match: 'prefix', scope: 'own-or-child-fees' },
  { path: '/finance', roles: FINANCE_MANAGE, match: 'prefix' },
  { path: '/leave-application', roles: [...LEAVE_REVIEW, ...LEAVE_APPLY], match: 'prefix', scope: 'own-child-or-review-scope' },
  { path: '/library/books', roles: LIBRARY_MANAGE, match: 'prefix' },
  { path: '/library/loans', roles: LIBRARY_MANAGE, match: 'prefix' },
  { path: '/library', roles: LIBRARY_VIEW, match: 'exact', readOnlyFor: ['student', 'parent', 'teacher', 'subject_teacher', 'class_teacher', 'staff', 'finance_officer'], scope: 'available-or-own-loans' },
  { path: '/homework', roles: HOMEWORK_VIEW, match: 'prefix', readOnlyFor: STUDENT_PARENT, scope: 'assigned-or-own-child-class-homework' },
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
    { label: 'My ID Card', href: '/id-cards/my-card', roles: ID_CARD_OWN }, { label: 'Generate Card', href: '/id-cards/generate', roles: ID_CARD_MANAGE }, { label: 'Admit Card', href: '/id-cards/admit-card', roles: ID_CARD_MANAGE }, { label: 'Bulk Generate', href: '/id-cards/bulk-generate', roles: ['head'] }, { label: 'Templates', href: '/id-cards/templates', roles: SCHOOL_LEADERS }, { label: 'Reports', href: '/id-cards/reports', roles: SCHOOL_LEADERS },
  ] },
  { label: 'Institution', href: '/institution', roles: ['head', 'assistant_head', 'class_teacher'], icon: 'Building2', children: [
    { label: 'Profile', href: '/institution/profile', roles: SCHOOL_LEADERS }, { label: 'Billing & Subscription', href: '/institution/billing', roles: SCHOOL_LEADERS }, { label: 'Finance Audit', href: '/institution/finance-audit', roles: SCHOOL_LEADERS }, { label: 'Students', href: '/institution/students', roles: ['head', 'assistant_head', 'class_teacher'] }, { label: 'Teachers', href: '/institution/teachers', roles: SCHOOL_LEADERS }, { label: 'Staff', href: '/institution/staff', roles: SCHOOL_LEADERS }, { label: 'Admission', href: '/institution/admission', roles: SCHOOL_LEADERS }, { label: 'Backup', href: '/institution/backup', roles: ['head'] },
  ] },
  { label: 'Academic', href: '/academic-menu', roles: ACADEMIC_VIEW, icon: 'BookOpen', children: [
    { label: 'Overview', href: '/academic', roles: ACADEMIC_MANAGE }, { label: 'Classes', href: '/academic/classes', roles: SCHOOL_LEADERS }, { label: 'Sections', href: '/academic/sections', roles: SCHOOL_LEADERS }, { label: 'Subjects', href: '/academic/subjects', roles: SCHOOL_LEADERS }, { label: 'Syllabus', href: '/academic/syllabus', roles: ACADEMIC_VIEW }, { label: 'Class Routine', href: '/academic/class-routine', roles: ACADEMIC_VIEW }, { label: 'Exam Routine', href: '/academic/exam-routine', roles: ACADEMIC_VIEW }, { label: 'Exams', href: '/academic/exams', roles: ACADEMIC_VIEW }, { label: 'Results', href: '/academic/results', roles: [...RESULT_ENTRY, ...STUDENT_PARENT] }, { label: 'Final Promotion', href: '/academic/promotions', roles: ['head', 'assistant_head', 'class_teacher'] }, { label: 'Report Card', href: '/academic/report-card', roles: ['head', 'assistant_head', 'class_teacher', 'student', 'parent'] },
  ] },
  { label: 'Attendance', href: '/attendance', roles: ATTENDANCE_VIEW, icon: 'CheckCircle2', children: [
    { label: 'Overview', href: '/attendance', roles: ['head', 'assistant_head', 'class_teacher'] }, { label: 'Mark Attendance', href: '/attendance/mark', roles: ATTENDANCE_MARK }, { label: 'All Present Scanner', href: '/attendance/all-present', roles: ATTENDANCE_MARK }, { label: 'Reports', href: '/attendance/reports', roles: ['head', 'assistant_head', 'class_teacher'] }, { label: 'My Attendance', href: '/attendance/my-attendance', roles: ATTENDANCE_VIEW },
  ] },
  { label: 'Leave Application', href: '/leave-application-menu', roles: [...LEAVE_REVIEW, ...LEAVE_APPLY], icon: 'CalendarDays', children: [
    { label: 'Apply / Review Leave', href: '/leave-application', roles: [...LEAVE_REVIEW, ...LEAVE_APPLY] },
  ] },
  { label: 'Finance', href: '/finance-menu', roles: [...FINANCE_MANAGE, 'student', 'parent'], icon: 'DollarSign', children: [
    { label: 'Overview', href: '/finance', roles: FINANCE_MANAGE }, { label: 'Fees', href: '/finance/fees', roles: FINANCE_MANAGE }, { label: 'Collections', href: '/finance/collections', roles: FINANCE_MANAGE }, { label: 'Salary', href: '/finance/salary', roles: ['head', 'finance_officer'] }, { label: 'Reports', href: '/finance/reports', roles: FINANCE_MANAGE }, { label: 'My Fees', href: '/finance/my-fees', roles: ['student', 'parent'] },
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
  admin: ['*'], super_admin: ['*'], head: ['*'], assistant_head: ['manage:assignedArea', 'download:idcard', 'manage:academic', 'post:notice', 'review:leave'], class_teacher: ['manage:attendance', 'view:assigned_class_students', 'view:academic', 'review:leave', 'manage:homework'], subject_teacher: ['manage:results', 'view:academic', 'manage:homework'], teacher: ['manage:results', 'view:academic', 'manage:homework'], finance_officer: ['manage:finance', 'view:payments', 'view:attendance'], librarian: ['manage:library'], staff: ['download:idcard', 'view:documents', 'view:library'], student: ['view:own', 'apply:leave', 'view:syllabus', 'view:routine', 'view:homework', 'view:library'], parent: ['view:child', 'apply:leave', 'view:syllabus', 'view:routine', 'view:homework', 'view:library'], committee_member: ['post:notice'],
};

export function getDashboardQuickActions(role?: UserRole | string): DashboardQuickActionConfig[] { const normalizedRole = normalizeUserRole(role); if (!normalizedRole) return []; return dashboardQuickActionMatrix[normalizedRole] || [qa('My Profile', '/profile', 'UserRound', 'View own profile.'), qa('Notice Board', '/notices', 'Bell', 'Read notices.')]; }
export function canPerformAction(roleOrUser: UserRole | string | User | null | undefined, action: PermissionAction): boolean { if (getDemoMode()) return true; const role = typeof roleOrUser === 'string' ? normalizeUserRole(roleOrUser) : normalizeUserRole(roleOrUser?.role); if (!role) return false; if (['admin', 'super_admin', 'head'].includes(role)) return true; return (actionPermissionMatrix[action] || []).includes(role); }
export function isRoleReadOnlyForRoute(roleOrUser: UserRole | string | User | null | undefined, pathname: string): boolean { const role = typeof roleOrUser === 'string' ? normalizeUserRole(roleOrUser) : normalizeUserRole(roleOrUser?.role); if (!role) return false; const route = findRoutePermission(pathname); return Boolean(route?.readOnlyFor?.includes(role)); }
export function hasRole(user?: User | null, roles?: UserRole[] | UserRole) { if (!user) return false; if (getDemoMode()) return true; if (!roles) return true; const role = normalizeUserRole(user.role) || user.role; if (['admin', 'super_admin', 'head'].includes(role)) return true; if (Array.isArray(roles)) return roles.includes(role); return role === roles; }
export function hasPermission(user?: User | null, permission?: string) { if (!user || !permission) return false; if (getDemoMode()) return true; const role = normalizeUserRole(user.role) || user.role; if (['admin', 'super_admin', 'head'].includes(role)) return true; const rolePerms = rolePermissions[role] || []; if (rolePerms.includes('*')) return true; if (rolePerms.includes(permission)) return true; if (Array.isArray(user.permissions) && user.permissions.includes(permission)) return true; return false; }
function filterMenuByRole(userRole: UserRole) { return menuConfig.map((item) => { const children = item.children?.filter((child) => child.roles.includes(userRole)); return { ...item, children }; }).filter((item) => item.roles.includes(userRole) && (!item.children || item.children.length > 0)); }
export function getVisibleMenuItems(userRole: UserRole | string): MenuItemConfig[] { const role = normalizeUserRole(userRole); return role ? filterMenuByRole(role) : []; }
export function getMenuForUser(user?: User | null) { if (!user) return []; if (getDemoMode()) return menuConfig; const role = normalizeUserRole(user.role); return role ? filterMenuByRole(role) : []; }
const normalizePath = (pathname: string) => pathname.split('?')[0].replace(/\/$/, '') || '/';
const routeAliases: Record<string, string> = { '/documents/admit-cards': '/id-cards/admit-card', '/academic/holiday-list': '/holidays', '/billing': '/finance', '/institution/billing': '/institution/billing', '/leave-list': '/leave-application', '/class-routine': '/academic/class-routine', '/my-result': '/academic/results', '/academic/my-results': '/academic/results' };
function findRoutePermission(pathname: string): RoutePermission | undefined { const path = routeAliases[normalizePath(pathname)] || normalizePath(pathname); return routePermissionMatrix.slice().sort((a, b) => normalizePath(b.path).length - normalizePath(a.path).length).find((route) => { const routePath = normalizePath(route.path); if ((route.match || 'exact') === 'prefix') return path === routePath || path.startsWith(`${routePath}/`); return path === routePath; }); }
export function isRouteAllowed(pathname: string, userRole: UserRole | string): boolean { if (getDemoMode()) return true; const role = normalizeUserRole(userRole); if (!role) return false; if (['admin', 'super_admin', 'head'].includes(role)) return true; const route = findRoutePermission(pathname); return Boolean(route?.roles.includes(role)); }
