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
const SCHOOL_LEADER_ADMIN: UserRole[] = [...PLATFORM_ADMIN, ...SCHOOL_LEADERS];
const TEACHERS: UserRole[] = ['class_teacher', 'subject_teacher', 'teacher'];
const EMPLOYEES: UserRole[] = ['head', 'assistant_head', 'class_teacher', 'subject_teacher', 'teacher', 'finance_officer', 'staff'];
const SCHOOL_USERS: UserRole[] = ['head', 'assistant_head', 'class_teacher', 'subject_teacher', 'teacher', 'finance_officer', 'staff', 'student', 'parent', 'committee_member'];
const STUDENT_PARENT: UserRole[] = ['student', 'parent'];
const ACADEMIC_VIEW: UserRole[] = [...SCHOOL_LEADERS, ...TEACHERS, ...STUDENT_PARENT];
const RESULT_ENTRY: UserRole[] = ['head', 'assistant_head', 'class_teacher', 'subject_teacher', 'teacher'];
const RESULT_APPROVE: UserRole[] = ['head', 'assistant_head', 'admin', 'super_admin'];
const RESULT_PUBLISH: UserRole[] = ['head', 'admin', 'super_admin'];
const EXAM_WRITE: UserRole[] = SCHOOL_LEADER_ADMIN;
const SUBJECT_MANAGE: UserRole[] = SCHOOL_LEADER_ADMIN;
const CLASS_MANAGE: UserRole[] = SCHOOL_LEADER_ADMIN;
const ATTENDANCE_VIEW: UserRole[] = [...EMPLOYEES, ...STUDENT_PARENT];
const ATTENDANCE_MARK: UserRole[] = ['head', 'assistant_head', 'class_teacher'];
const SMS_MONITORING: UserRole[] = ['admin', 'super_admin', 'head'];
const SETTINGS: UserRole[] = ['admin', 'super_admin', 'head'];
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

export function normalizeUserRole(role?: string | null): UserRole | undefined {
  if (!role) return undefined;
  const normalized = String(role).toLowerCase().replace(/[\s-]+/g, '_');
  if (normalized === 'guardian' || normalized === 'parent_guardian') return 'parent';
  if ((ALL_ROLES as string[]).includes(normalized)) return normalized as UserRole;
  if (normalized === 'librarian') return 'staff' as UserRole;
  return undefined;
}

export const menuConfig: MenuItemConfig[] = [
  {
    label: 'Admin', href: '/admin', roles: PLATFORM_ADMIN, icon: 'ShieldCheck',
    children: [
      { label: 'Overview', href: '/admin', roles: PLATFORM_ADMIN },
      { label: 'School Management', href: '/admin/schools', roles: PLATFORM_ADMIN },
      { label: 'Subscriptions', href: '/admin/subscriptions', roles: PLATFORM_ADMIN },
      { label: 'Accounting', href: '/admin/accounting', roles: PLATFORM_ADMIN },
      { label: 'SMS Usage', href: '/admin/sms-usage', roles: PLATFORM_ADMIN },
      { label: 'Select School', href: '/admin/select-school', roles: PLATFORM_ADMIN },
      { label: 'User Management', href: '/admin/users', roles: PLATFORM_ADMIN },
      { label: 'Backup & Restore', href: '/admin/backup', roles: ['super_admin'] },
    ],
  },
  { label: 'Dashboard', href: '/dashboard', roles: [...PLATFORM_ADMIN, ...SCHOOL_USERS], icon: 'LayoutGrid' },
  { label: 'Notice Board', href: '/notices', roles: NOTICE_VIEW, icon: 'Bell' },
  { label: 'Holidays', href: '/holidays', roles: HOLIDAY_VIEW, icon: 'CalendarDays' },
  {
    label: 'ID Card', href: '/id-cards', roles: ID_CARD_OWN, icon: 'CreditCard',
    children: [
      { label: 'My ID Card', href: '/id-cards/my-card', roles: ID_CARD_OWN },
      { label: 'Generate Card', href: '/id-cards/generate', roles: ID_CARD_GENERATE },
      { label: 'Admit Card', href: '/id-cards/admit-card', roles: SCHOOL_LEADER_ADMIN },
      { label: 'Bulk Generate', href: '/id-cards/bulk-generate', roles: ID_CARD_GENERATE },
      { label: 'Templates', href: '/id-cards/templates', roles: SCHOOL_LEADER_ADMIN },
      { label: 'Reports', href: '/id-cards/reports', roles: SCHOOL_LEADER_ADMIN },
    ],
  },
  {
    label: 'Institution', href: '/institution', roles: [...SCHOOL_LEADERS, 'class_teacher'], icon: 'Building2',
    children: [
      { label: 'Profile', href: '/institution/profile', roles: SCHOOL_LEADERS },
      { label: 'Billing & Subscription', href: '/institution/billing', roles: SCHOOL_LEADERS },
      { label: 'SMS Balance', href: '/billing', roles: SCHOOL_LEADERS },
      { label: 'Finance Audit', href: '/institution/finance-audit', roles: SCHOOL_LEADERS },
      { label: 'Students', href: '/institution/students', roles: [...SCHOOL_LEADERS, 'class_teacher'] },
      { label: 'Teachers', href: '/institution/teachers', roles: SCHOOL_LEADERS },
      { label: 'Staff', href: '/institution/staff', roles: SCHOOL_LEADERS },
      { label: 'Admission', href: '/institution/admission', roles: SCHOOL_LEADERS },
      { label: 'Backup', href: '/institution/backup', roles: ['head'] },
    ],
  },
  {
    label: 'Academic', href: '/academic-menu', roles: ACADEMIC_VIEW, icon: 'BookOpen',
    children: [
      { label: 'Overview', href: '/academic', roles: [...SCHOOL_LEADERS, ...TEACHERS] },
      { label: 'Classes', href: '/academic/classes', roles: CLASS_MANAGE },
      { label: 'Sections', href: '/academic/sections', roles: CLASS_MANAGE },
      { label: 'Subjects', href: '/academic/subjects', roles: SUBJECT_MANAGE },
      { label: 'Syllabus', href: '/academic/syllabus', roles: ACADEMIC_VIEW },
      { label: 'Class Routine', href: '/academic/class-routine', roles: ACADEMIC_VIEW },
      { label: 'Exam Routine', href: '/academic/exam-routine', roles: ACADEMIC_VIEW },
      { label: 'Exams', href: '/academic/exams', roles: ACADEMIC_VIEW },
      { label: 'Results', href: '/academic/results', roles: [...RESULT_ENTRY, ...STUDENT_PARENT] },
      { label: 'Final Promotion', href: '/academic/promotions', roles: ['head', 'assistant_head', 'class_teacher'] },
      { label: 'Report Card', href: '/academic/report-card', roles: ['head', 'assistant_head', 'class_teacher', 'student', 'parent'] },
    ],
  },
  {
    label: 'Attendance', href: '/attendance', roles: ATTENDANCE_VIEW, icon: 'CheckCircle2',
    children: [
      { label: 'Overview', href: '/attendance', roles: ATTENDANCE_MARK },
      { label: 'Mark Attendance', href: '/attendance/mark', roles: ATTENDANCE_MARK },
      { label: 'All Present Scanner', href: '/attendance/all-present', roles: ATTENDANCE_MARK },
      { label: 'Reports', href: '/attendance/reports', roles: ATTENDANCE_MARK },
      { label: 'My Attendance', href: '/attendance/my-attendance', roles: ATTENDANCE_VIEW },
    ],
  },
  {
    label: 'Leave Application', href: '/leave-application-menu', roles: [...LEAVE_REVIEW, ...LEAVE_APPLY], icon: 'CalendarDays',
    children: [
      { label: 'Apply for Leave', href: '/leave-application', roles: [...LEAVE_REVIEW, ...LEAVE_APPLY] },
      { label: 'Leave List', href: '/leave-list', roles: LEAVE_REVIEW },
    ],
  },
  {
    label: 'Finance', href: '/finance-menu', roles: ['head', 'assistant_head', 'finance_officer', 'student', 'parent'], icon: 'DollarSign',
    children: [
      { label: 'Overview', href: '/finance', roles: ['head', 'assistant_head', 'finance_officer'] },
      { label: 'Fees', href: '/finance/fees', roles: ['head', 'assistant_head', 'finance_officer'] },
      { label: 'Collections', href: '/finance/collections', roles: ['head', 'assistant_head', 'finance_officer'] },
      { label: 'Salary', href: '/finance/salary', roles: ['head'] },
      { label: 'Reports', href: '/finance/reports', roles: ['head', 'assistant_head', 'finance_officer'] },
      { label: 'My Fees', href: '/finance/my-fees', roles: ['student', 'parent'] },
    ],
  },
  {
    label: 'Documents', href: '/documents', roles: DOCUMENT_VIEW, icon: 'FileText',
    children: [
      { label: 'Overview', href: '/documents', roles: DOCUMENT_VIEW },
      { label: 'Memo', href: '/documents/memo', roles: ['head', 'assistant_head', 'finance_officer', 'staff'] },
      { label: 'Upload', href: '/documents/upload', roles: ['head', 'assistant_head', 'staff'] },
      { label: 'Management', href: '/documents/manage', roles: SCHOOL_LEADERS },
    ],
  },
  {
    label: 'Users & Roles', href: '/users-roles', roles: ['admin', 'super_admin', 'head'], icon: 'Users',
    children: [
      { label: 'Overview', href: '/users-roles', roles: ['admin', 'super_admin', 'head'] },
      { label: 'All Users', href: '/users-roles/all', roles: ['admin', 'super_admin', 'head'] },
      { label: 'Roles & Permissions', href: '/users-roles/permissions', roles: ['admin', 'super_admin', 'head'] },
    ],
  },
  { label: 'Committee', href: '/committee', roles: ['head', 'assistant_head', 'committee_member'], icon: 'Users2' },
  {
    label: 'Library', href: '/library', roles: LIBRARY_VIEW, icon: 'BookMarked',
    children: [
      { label: 'Books', href: '/library/books', roles: LIBRARY_VIEW },
      { label: 'Loans', href: '/library/loans', roles: LIBRARY_MANAGE },
    ],
  },
  { label: 'Parent Portal', href: '/parent-portal', roles: ['parent'], icon: 'Home' },
  { label: 'Homework', href: '/homework', roles: HOMEWORK_VIEW, icon: 'BookOpen' },
  { label: 'SMS Monitoring', href: '/sms-monitoring', roles: SMS_MONITORING, icon: 'MessageSquare' },
  {
    label: 'Profile', href: '/profile', roles: ALL_ROLES, icon: 'User',
    children: [
      { label: 'My Profile', href: '/profile', roles: ALL_ROLES },
      { label: 'Change Password', href: '/profile/change-password', roles: ALL_ROLES },
      { label: 'My ID Card', href: '/id-cards/my-card', roles: ID_CARD_OWN },
    ],
  },
  { label: 'Settings', href: '/settings', roles: SETTINGS, icon: 'Settings' },
];

export function getVisibleMenuItems(userRole: UserRole): MenuItemConfig[] {
  const role = normalizeUserRole(userRole) || userRole;
  return filterMenuByRole(role);
}

export const rolePermissions: Record<UserRole, string[]> = {
  admin: ['*'],
  super_admin: ['*'],
  head: ['*'],
  assistant_head: ['result:approve_assistant', 'exam:publish', 'idcard:generate', 'idcard:manage', 'attendance:mark', 'leave:approve', 'library:manage'],
  class_teacher: ['result:create', 'result:update', 'attendance:mark', 'leave:approve', 'manage:homework'],
  subject_teacher: ['result:create', 'result:update', 'manage:homework'],
  teacher: ['result:create', 'result:update', 'manage:homework'],
  finance_officer: ['manage:finance', 'view:payments', 'view:own_attendance', 'leave:create'],
  librarian: ['view:documents', 'view:own_attendance', 'leave:create', 'library:manage'],
  staff: ['view:documents', 'view:own_attendance', 'leave:create'],
  student: ['view:own', 'leave:create', 'view:syllabus', 'view:routine', 'view:homework', 'view:library'],
  parent: ['view:child', 'leave:create', 'view:syllabus', 'view:routine', 'view:homework', 'view:library'],
  committee_member: ['post:notice'],
};

export function hasRole(user?: User | null, roles?: UserRole[] | UserRole) {
  if (!user) return false;
  if (getDemoMode()) return true;
  if (!roles) return true;
  const role = normalizeUserRole(user.role) || user.role;
  if (['admin', 'super_admin', 'head'].includes(role)) return true;
  if (Array.isArray(roles)) return roles.includes(role);
  return role === roles;
}

export function hasPermission(user?: User | null, permission?: string) {
  if (!user || !permission) return false;
  if (getDemoMode()) return true;
  const role = normalizeUserRole(user.role) || user.role;
  if (['admin', 'super_admin', 'head'].includes(role)) return true;
  const rolePerms = rolePermissions[role] || [];
  if (rolePerms.includes('*')) return true;
  if (rolePerms.includes(permission)) return true;
  if (Array.isArray(user.permissions) && (user.permissions.includes(permission) || user.permissions.includes(permission.replace(':', '.')))) return true;
  return false;
}

export const permissionActions = {
  canResultEntry: (user?: User | null) => hasPermission(user, 'result:create') || hasPermission(user, 'result:update'),
  canResultApproveAssistant: (user?: User | null) => hasPermission(user, 'result:approve_assistant'),
  canResultApproveHead: (user?: User | null) => hasPermission(user, 'result:approve_head'),
  canResultPublish: (user?: User | null) => hasPermission(user, 'result:publish'),
  canExamWrite: (user?: User | null) => hasRole(user, EXAM_WRITE),
  canExamPublish: (user?: User | null) => hasRole(user, ['head', 'assistant_head', 'admin', 'super_admin']),
  canSubjectManage: (user?: User | null) => hasRole(user, SUBJECT_MANAGE),
  canClassManage: (user?: User | null) => hasRole(user, CLASS_MANAGE),
  canIdCardGenerate: (user?: User | null) => hasRole(user, ID_CARD_GENERATE),
  canLibraryManage: (user?: User | null) => hasRole(user, LIBRARY_MANAGE),
  canSettings: (user?: User | null) => hasRole(user, SETTINGS),
  canSmsMonitoring: (user?: User | null) => hasRole(user, SMS_MONITORING),
};

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
  const role = normalizeUserRole(user.role);
  return role ? filterMenuByRole(role) : [];
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
  '/my-result': '/academic/results',
  '/academic/my-results': '/academic/results',
};

export function isRouteAllowed(pathname: string, userRole: UserRole | string): boolean {
  if (getDemoMode()) return true;
  const role = normalizeUserRole(userRole);
  if (!role) return false;
  if (['admin', 'super_admin', 'head'].includes(role)) return true;

  const path = routeAliases[normalizePath(pathname)] || normalizePath(pathname);
  const allRoutes = flattenMenu(menuConfig).sort((a, b) => normalizePath(b.href).length - normalizePath(a.href).length);

  const exactMatch = allRoutes.find((route) => normalizePath(route.href) === path);
  if (exactMatch) return exactMatch.roles.includes(role);

  const parentMatch = allRoutes.find((route) => {
    const routePath = normalizePath(route.href);
    return routePath !== '/' && path.startsWith(`${routePath}/`);
  });

  if (parentMatch) return parentMatch.roles.includes(role);

  return false;
}
