import { UserRole, User } from '@/types';
import { getDemoMode } from './demo-store';

interface MenuItemConfig {
  label: string;
  href: string;
  icon?: string;
  roles: UserRole[];
  children?: MenuItemConfig[];
}

export const menuConfig: MenuItemConfig[] = [
  {
    label: 'Admin',
    href: '/admin',
    roles: ['admin', 'super_admin'],
    icon: 'ShieldCheck',
    children: [
      { label: 'Overview', href: '/admin', roles: ['admin', 'super_admin'] },
      { label: 'School Manage', href: '/admin/schools', roles: ['admin', 'super_admin'] },
      { label: 'Subscriptions', href: '/admin/subscriptions', roles: ['admin', 'super_admin'] },
      { label: 'SMS Usage', href: '/admin/sms-usage', roles: ['admin', 'super_admin'] },
      { label: 'Select School', href: '/admin/select-school', roles: ['admin', 'super_admin'] },
      { label: 'Manage Users', href: '/admin/users', roles: ['admin', 'super_admin'] },
    ],
  },
  {
    label: 'Dashboard',
    href: '/dashboard',
    roles: ['admin', 'super_admin', 'head', 'assistant_head', 'class_teacher', 'subject_teacher', 'finance_officer', 'staff', 'student', 'parent'],
    icon: 'LayoutGrid',
  },
  {
    label: 'SMS Monitoring',
    href: '/sms-monitoring',
    roles: ['head', 'assistant_head'],
    icon: 'Bell',
  },
  {
    label: 'ID Card Management',
    href: '/id-cards',
    roles: ['head', 'assistant_head', 'staff', 'student', 'teacher'],
    icon: 'CreditCard',
    children: [
      { label: 'My Card', href: '/id-cards/my-card', roles: ['student', 'teacher', 'staff'] },
      { label: 'Generate Card', href: '/id-cards/generate', roles: ['head', 'assistant_head', 'staff'] },
      { label: 'Admit Card', href: '/id-cards/admit-card', roles: ['head', 'assistant_head', 'staff'] },
      { label: 'Bulk Generate', href: '/id-cards/bulk-generate', roles: ['head', 'assistant_head'] },
      { label: 'Templates', href: '/id-cards/templates', roles: ['head', 'assistant_head'] },
      { label: 'Reports', href: '/id-cards/reports', roles: ['head', 'assistant_head'] },
      { label: 'Renewal', href: '/id-cards/renewal', roles: ['head', 'assistant_head'] },
    ],
  },
  {
    label: 'Institution',
    href: '/institution',
    roles: ['head', 'assistant_head', 'class_teacher', 'subject_teacher', 'teacher'],
    icon: 'Building2',
    children: [
      { label: 'Profile', href: '/institution/profile', roles: ['head', 'assistant_head'] },
      { label: 'Students', href: '/institution/students', roles: ['head', 'assistant_head', 'class_teacher', 'subject_teacher', 'teacher'] },
      { label: 'Teachers', href: '/institution/teachers', roles: ['head', 'assistant_head'] },
      { label: 'Staff', href: '/institution/staff', roles: ['head', 'assistant_head'] },
      { label: 'Student Admission', href: '/institution/admission', roles: ['head', 'assistant_head'] },
      { label: 'Backup', href: '/institution/backup', roles: ['head'] },
    ],
  },
  {
    label: 'Academic',
    href: '/academic',
    roles: ['head', 'assistant_head', 'class_teacher', 'subject_teacher'],
    icon: 'BookOpen',
    children: [
      { label: 'Overview', href: '/academic', roles: ['head', 'assistant_head', 'class_teacher', 'subject_teacher'] },
      { label: 'Classes', href: '/academic/classes', roles: ['head', 'assistant_head'] },
      { label: 'Subjects', href: '/academic/subjects', roles: ['head', 'assistant_head', 'subject_teacher'] },
      { label: 'Exams', href: '/academic/exams', roles: ['head', 'assistant_head', 'subject_teacher'] },
      { label: 'Results', href: '/academic/results', roles: ['head', 'assistant_head', 'subject_teacher'] },
      { label: 'Final Promotion', href: '/academic/promotions', roles: ['head', 'assistant_head', 'class_teacher'] },
      { label: 'Report Card', href: '/academic/report-card', roles: ['student', 'parent'] },
    ],
  },
  {
    label: 'Attendance',
    href: '/attendance',
    roles: ['head', 'assistant_head', 'class_teacher', 'subject_teacher'],
    icon: 'CheckCircle2',
    children: [
      { label: 'Overview', href: '/attendance', roles: ['head', 'assistant_head', 'class_teacher', 'subject_teacher'] },
      { label: 'Mark Attendance', href: '/attendance/mark', roles: ['head', 'assistant_head', 'class_teacher', 'subject_teacher'] },
      { label: 'Reports', href: '/attendance/reports', roles: ['head', 'assistant_head', 'class_teacher'] },
      { label: 'My Attendance', href: '/attendance/my-attendance', roles: ['head', 'student', 'parent'] },
    ],
  },
  {
    label: 'Finance',
    href: '/finance',
    roles: ['head', 'assistant_head', 'finance_officer'],
    icon: 'DollarSign',
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
    label: 'Documents',
    href: '/documents',
    roles: ['head', 'assistant_head', 'staff'],
    icon: 'FileText',
    children: [
      { label: 'Overview', href: '/documents', roles: ['head', 'assistant_head', 'staff'] },
      { label: 'Memo', href: '/documents/memo', roles: ['head', 'assistant_head', 'staff'] },
      { label: 'Upload', href: '/documents/upload', roles: ['head', 'assistant_head', 'staff'] },
      { label: 'Management', href: '/documents/manage', roles: ['head', 'assistant_head'] },
    ],
  },
  {
    label: 'Users & Roles',
    href: '/users-roles',
    roles: ['admin', 'super_admin', 'head'],
    icon: 'Users',
    children: [
      { label: 'Overview', href: '/users-roles', roles: ['admin', 'super_admin', 'head'] },
      { label: 'All Users', href: '/users-roles/all', roles: ['admin', 'super_admin', 'head'] },
      { label: 'Roles & Permissions', href: '/users-roles/permissions', roles: ['admin', 'super_admin', 'head'] },
    ],
  },
  {
    label: 'Committee',
    href: '/committee',
    roles: ['head', 'assistant_head', 'committee_member'],
    icon: 'Users2',
  },
  {
    label: 'Parent Portal',
    href: '/parent-portal',
    roles: ['parent'],
    icon: 'Home',
  },
  {
    label: 'Notice Board',
    href: '/notices',
    roles: ['head', 'assistant_head', 'class_teacher', 'subject_teacher', 'student', 'parent', 'staff'],
    icon: 'Bell',
  },
  {
    label: 'Profile & Auth',
    href: '/profile',
    roles: ['admin', 'super_admin', 'head', 'assistant_head', 'class_teacher', 'subject_teacher', 'finance_officer', 'staff', 'student', 'parent', 'committee_member'],
    icon: 'User',
    children: [
      { label: 'My Profile', href: '/profile', roles: ['admin', 'super_admin', 'head', 'assistant_head', 'class_teacher', 'subject_teacher', 'finance_officer', 'staff', 'student', 'parent', 'committee_member'] },
      { label: 'Change Password', href: '/profile/change-password', roles: ['admin', 'super_admin', 'head', 'assistant_head', 'class_teacher', 'subject_teacher', 'finance_officer', 'staff', 'student', 'parent', 'committee_member'] },
    ],
  },
  {
    label: 'Settings',
    href: '/settings',
    roles: ['admin', 'super_admin', 'head', 'assistant_head'],
    icon: 'Settings',
  },
];

export function getVisibleMenuItems(userRole: UserRole): MenuItemConfig[] {
  return menuConfig.filter((item) => item.roles.includes(userRole));
}

// Role -> permissions mapping
export const rolePermissions: Record<UserRole, string[]> = {
  admin: ['*'],
  super_admin: ['*'],
  head: ['*'],
  assistant_head: [
    'manage:assignedArea',
    'generate:idcard',
    'edit:idcard',
    'download:idcard',
    'manage:academic',
    'post:notice',
  ],
  class_teacher: ['manage:attendance', 'manage:class_students'],
  subject_teacher: ['manage:results'],
  teacher: ['manage:results'],
  finance_officer: ['manage:finance', 'view:payments'],
  staff: ['manage:idcard', 'download:idcard'],
  student: ['view:own'],
  parent: ['view:child'],
  committee_member: ['post:notice'],
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

export function getMenuForUser(user?: User | null) {
  if (!user) return [];
  return menuConfig
    .filter((item) => item.roles.includes(user.role))
    .map((item) => ({
      ...item,
      children: item.children?.filter((child) => child.roles.includes(user.role))
    }));
}