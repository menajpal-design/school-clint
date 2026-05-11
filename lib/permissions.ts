import { UserRole, User } from '@/types';

interface MenuItemConfig {
  label: string;
  href: string;
  icon?: string;
  roles: UserRole[];
  children?: MenuItemConfig[];
}

export const menuConfig: MenuItemConfig[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    roles: ['head', 'assistant_head', 'class_teacher', 'subject_teacher', 'finance_officer', 'staff', 'student', 'parent'],
    icon: 'LayoutGrid',
  },
  {
    label: 'ID Card Management',
    href: '/id-cards',
    roles: ['head', 'assistant_head', 'staff', 'student', 'teacher'],
    icon: 'CreditCard',
    children: [
      { label: 'My Card', href: '/id-cards/my-card', roles: ['student', 'teacher', 'staff'] },
      { label: 'Generate Card', href: '/id-cards/generate', roles: ['head', 'assistant_head', 'staff'] },
      { label: 'Bulk Generate', href: '/id-cards/bulk-generate', roles: ['head', 'assistant_head'] },
      { label: 'Templates', href: '/id-cards/templates', roles: ['head', 'assistant_head'] },
      { label: 'Reports', href: '/id-cards/reports', roles: ['head', 'assistant_head'] },
      { label: 'Renewal', href: '/id-cards/renewal', roles: ['head', 'assistant_head'] },
    ],
  },
  {
    label: 'Institution',
    href: '/institution',
    roles: ['head', 'assistant_head'],
    icon: 'Building2',
    children: [
      { label: 'Profile', href: '/institution/profile', roles: ['head', 'assistant_head'] },
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
      { label: 'Mark Attendance', href: '/attendance/mark', roles: ['class_teacher', 'subject_teacher'] },
      { label: 'Reports', href: '/attendance/reports', roles: ['head', 'assistant_head', 'class_teacher'] },
      { label: 'My Attendance', href: '/attendance/my-attendance', roles: ['student', 'parent'] },
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
      { label: 'Salary', href: '/finance/salary', roles: ['head', 'assistant_head', 'finance_officer'] },
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
      { label: 'Upload', href: '/documents/upload', roles: ['head', 'assistant_head', 'staff'] },
      { label: 'Management', href: '/documents/manage', roles: ['head', 'assistant_head'] },
    ],
  },
  {
    label: 'Users & Roles',
    href: '/users-roles',
    roles: ['head', 'assistant_head'],
    icon: 'Users',
    children: [
      { label: 'Overview', href: '/users-roles', roles: ['head', 'assistant_head'] },
      { label: 'All Users', href: '/users-roles/all', roles: ['head', 'assistant_head'] },
      { label: 'Roles & Permissions', href: '/users-roles/permissions', roles: ['head'] },
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
    roles: ['head', 'assistant_head', 'class_teacher', 'subject_teacher', 'finance_officer', 'staff', 'student', 'parent', 'committee_member'],
    icon: 'User',
    children: [
      { label: 'My Profile', href: '/profile', roles: ['head', 'assistant_head', 'class_teacher', 'subject_teacher', 'finance_officer', 'staff', 'student', 'parent', 'committee_member'] },
      { label: 'Change Password', href: '/profile/change-password', roles: ['head', 'assistant_head', 'class_teacher', 'subject_teacher', 'finance_officer', 'staff', 'student', 'parent', 'committee_member'] },
    ],
  },
  {
    label: 'Settings',
    href: '/settings',
    roles: ['head', 'assistant_head'],
    icon: 'Settings',
  },
];

export function getVisibleMenuItems(userRole: UserRole): MenuItemConfig[] {
  return menuConfig.filter((item) => item.roles.includes(userRole));
}

// Role -> permissions mapping
export const rolePermissions: Record<UserRole, string[]> = {
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
  if (!roles) return true;
  if (user.role === 'head') return true;
  if (Array.isArray(roles)) return roles.includes(user.role);
  return user.role === roles;
}

export function hasPermission(user?: User | null, permission?: string) {
  if (!user || !permission) return false;
  if (user.role === 'head') return true;
  const rolePerms = rolePermissions[user.role] || [];
  if (rolePerms.includes('*')) return true;
  if (rolePerms.includes(permission)) return true;
  if (Array.isArray(user.permissions) && user.permissions.includes(permission)) return true;
  return false;
}

export function getMenuForUser(user?: User | null) {
  if (!user) return [];
  // Head gets all
  if (user.role === 'head') return menuConfig;
  return menuConfig
    .filter((item) => item.roles.includes(user.role))
    .map((item) => ({
      ...item,
      children: item.children?.filter((child) => child.roles.includes(user.role))
    }));
}