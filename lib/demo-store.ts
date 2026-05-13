import { User, UserRole } from '@/types';

export const DEMO_MODE_KEY = 'easy-school:mode';
export const DEMO_STATE_KEY = 'easy-school:demo:state';
export const DEMO_SESSION_KEY = 'easy-school:demo:session';

export type DemoCollectionName =
  | 'users'
  | 'students'
  | 'teachers'
  | 'staff'
  | 'notices'
  | 'documents'
  | 'classes'
  | 'subjects'
  | 'exams'
  | 'results'
  | 'attendance'
  | 'fees'
  | 'payments'
  | 'idCards'
  | 'admissions'
  | 'messages'
  | 'committee'
  | 'notifications';

export type DemoState = {
  collections: Record<DemoCollectionName, any[]>;
  counters: Record<string, number>;
};

const collectionNames: DemoCollectionName[] = [
  'users', 'students', 'teachers', 'staff', 'notices', 'documents', 'classes', 'subjects', 'exams', 'results', 'attendance', 'fees', 'payments', 'idCards', 'admissions', 'messages', 'committee', 'notifications',
];

const getStorage = () => {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
};

const now = () => new Date().toISOString();

const uid = (prefix: string, count: number) => `${prefix}-${String(count).padStart(4, '0')}`;

const makeUser = (role: UserRole, name: string, email: string, permissions: string[]): User => ({
  id: `${role}-user`,
  name,
  email,
  role,
  isActive: true,
  permissions,
  institutionId: 'demo-institution',
  phone: '01700000000',
});

const baseUsers: User[] = [
  makeUser('head', 'Demo Head', 'head@demo.local', ['*']),
  makeUser('assistant_head', 'Demo Assistant Head', 'assistant@demo.local', ['manage:assignedArea', 'generate:idcard', 'edit:idcard', 'download:idcard', 'manage:academic', 'post:notice']),
  makeUser('class_teacher', 'Demo Class Teacher', 'teacher1@demo.local', ['manage:attendance', 'manage:class_students']),
  makeUser('subject_teacher', 'Demo Subject Teacher', 'subject@demo.local', ['manage:results']),
  makeUser('finance_officer', 'Demo Finance Officer', 'finance@demo.local', ['manage:finance', 'view:payments']),
  makeUser('staff', 'Demo Staff', 'staff@demo.local', ['manage:idcard', 'download:idcard']),
  makeUser('student', 'Demo Student', 'student@demo.local', ['view:own']),
  makeUser('parent', 'Demo Parent', 'parent@demo.local', ['view:child']),
  makeUser('committee_member', 'Demo Committee Member', 'committee@demo.local', ['post:notice']),
  makeUser('teacher', 'Demo Teacher', 'teacher@demo.local', ['manage:results']),
];

function seedState(): DemoState {
  const classes = [
    { id: 'class-1', _id: 'class-1', name: 'Class 1', grade: '1', sections: [{ id: 'sec-a', _id: 'sec-a', name: 'A', isActive: true }], academicYear: '2025' },
    { id: 'class-2', _id: 'class-2', name: 'Class 2', grade: '2', sections: [{ id: 'sec-b', _id: 'sec-b', name: 'B', isActive: true }], academicYear: '2025' },
  ];

  const students = [
    { id: 'student-1', _id: 'student-1', userId: baseUsers[6], rollNumber: '101', classId: classes[0], sectionId: classes[0].sections[0], admissionDate: now(), isActive: true, guardianName: 'Demo Guardian', guardianPhone: '01800000000' },
    { id: 'student-2', _id: 'student-2', userId: { name: 'Second Student' }, rollNumber: '102', classId: classes[0], sectionId: classes[0].sections[0], admissionDate: now(), isActive: true },
  ];

  const teachers = [
    { id: 'teacher-1', _id: 'teacher-1', userId: baseUsers[2], employeeId: 'T-1001', designation: 'Class Teacher', department: 'Science', joiningDate: now(), qualification: 'MSc', experience: 4, salary: 42000, isActive: true },
  ];

  const staff = [
    { id: 'staff-1', _id: 'staff-1', userId: baseUsers[5], employeeId: 'S-1001', designation: 'Office Assistant', department: 'Admin', joiningDate: now(), qualification: 'BA', experience: 3, salary: 25000, isActive: true },
  ];

  const notices = [
    { id: 'notice-1', _id: 'notice-1', title: 'Welcome to Demo Mode', content: 'All data is stored locally in your browser.', category: 'general', priority: 'high', isPublished: true, createdAt: now(), publishedAt: now() },
  ];

  const documents = [
    { id: 'doc-1', _id: 'doc-1', title: 'Demo Memo', fileName: 'demo-memo.pdf', type: 'memo', ownerName: 'Demo Head', ownerType: 'head', fileSize: 12104, createdAt: now(), fileUrl: '/uploads/demo-memo.pdf' },
  ];

  const committee = [
    { id: 'com-1', _id: 'com-1', name: 'Demo Committee Member', role: 'Chair', isActive: true },
  ];

  const messages = [
    { id: 'msg-1', _id: 'msg-1', title: 'Demo Inbox', body: 'Messages stay local in demo mode.', isRead: false, createdAt: now() },
  ];

  const fees = [
    { id: 'fee-1', _id: 'fee-1', studentId: students[0], amount: 2500, type: 'tuition', month: 'May', year: 2026, dueDate: now(), status: 'pending' },
  ];

  const payments = [
    { id: 'payment-1', _id: 'payment-1', studentId: students[0], amount: 1200, paymentMethod: 'cash', paymentDate: now(), notes: 'Seed payment' },
  ];

  const cards = [
    { id: 'card-1', _id: 'card-1', userId: baseUsers[6], userType: 'student', cardNumber: 'STU-0001', issueDate: now(), expiryDate: now(), status: 'active', photoUrl: '' },
  ];

  const attendance = [
    { id: 'att-1', _id: 'att-1', studentId: students[0], classId: classes[0], sectionId: classes[0].sections[0], date: now(), status: 'present', markedBy: baseUsers[2], notes: 'Seed attendance' },
  ];

  const admissions = [
    { id: 'adm-1', _id: 'adm-1', name: 'Demo Applicant', className: 'Class 1', status: 'pending', createdAt: now() },
  ];

  const results = [
    { id: 'res-1', _id: 'res-1', studentName: 'Demo Student', examName: 'Half Yearly', grade: 'A', gpa: 5, percentage: 92, subjects: [] },
  ];

  const exams = [
    { id: 'exam-1', _id: 'exam-1', name: 'Half Yearly', classId: classes[0], date: now() },
  ];

  const subjects = [
    { id: 'sub-1', _id: 'sub-1', name: 'Mathematics', code: 'MTH', classId: classes[0], type: 'core', creditHours: 4 },
  ];

  const notifications = [
    { id: 'notif-1', _id: 'notif-1', title: 'Demo notification', isRead: false, createdAt: now(), link: '/dashboard' },
  ];

  return {
    collections: {
      users: baseUsers,
      students,
      teachers,
      staff,
      notices,
      documents,
      classes,
      subjects,
      exams,
      results,
      attendance,
      fees,
      payments,
      idCards: cards,
      admissions,
      messages,
      committee,
      notifications,
    },
    counters: {
      users: baseUsers.length,
      students: students.length,
      teachers: teachers.length,
      staff: staff.length,
      notices: notices.length,
      documents: documents.length,
      classes: classes.length,
      subjects: subjects.length,
      exams: exams.length,
      results: results.length,
      attendance: attendance.length,
      fees: fees.length,
      payments: payments.length,
      idCards: cards.length,
      admissions: admissions.length,
      messages: messages.length,
      committee: committee.length,
      notifications: notifications.length,
    },
  };
}

export const getDemoMode = (): boolean => {
  const storage = getStorage();
  return storage?.getItem(DEMO_MODE_KEY) === 'demo';
};

export const setDemoMode = (enabled: boolean): void => {
  const storage = getStorage();
  if (!storage) return;
  if (enabled) storage.setItem(DEMO_MODE_KEY, 'demo');
  else storage.removeItem(DEMO_MODE_KEY);
};

export const getDemoState = (): DemoState => {
  const storage = getStorage();
  if (!storage) return seedState();
  const stored = storage.getItem(DEMO_STATE_KEY);
  if (!stored) {
    const seeded = seedState();
    storage.setItem(DEMO_STATE_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    return JSON.parse(stored) as DemoState;
  } catch {
    const seeded = seedState();
    storage.setItem(DEMO_STATE_KEY, JSON.stringify(seeded));
    return seeded;
  }
};

export const saveDemoState = (state: DemoState): void => {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(DEMO_STATE_KEY, JSON.stringify(state));
};

export const getDemoUser = (): User | null => {
  const storage = getStorage();
  if (!storage) return null;
  const value = storage.getItem(DEMO_SESSION_KEY);
  if (!value) return null;
  try {
    return JSON.parse(value) as User;
  } catch {
    return null;
  }
};

export const setDemoUser = (user: User): void => {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(DEMO_SESSION_KEY, JSON.stringify(user));
  setDemoMode(true);
};

export const clearDemoSession = (): void => {
  const storage = getStorage();
  if (!storage) return;
  const keysToRemove = [DEMO_SESSION_KEY, DEMO_STATE_KEY, DEMO_MODE_KEY, 'token', 'user', 'selectedInstitutionId', 'selectedInstitutionName'];
  keysToRemove.forEach((key) => storage.removeItem(key));
  for (const key of collectionNames.map((name) => `easy-school:demo:${name}`)) {
    storage.removeItem(key);
  }
};

export const getCollection = (name: DemoCollectionName): any[] => {
  const state = getDemoState();
  return Array.isArray(state.collections[name]) ? state.collections[name] : [];
};

export const setCollection = (name: DemoCollectionName, items: any[]): void => {
  const state = getDemoState();
  state.collections[name] = items;
  saveDemoState(state);
};

export const nextCollectionId = (name: DemoCollectionName, prefix: string): string => {
  const state = getDemoState();
  state.counters[name] = (state.counters[name] || 0) + 1;
  saveDemoState(state);
  return uid(prefix, state.counters[name]);
};

export const appendCollectionItem = (name: DemoCollectionName, prefix: string, item: any): any => {
  const items = getCollection(name);
  const generatedId = item._id || item.id || nextCollectionId(name, prefix);
  const record = {
    ...item,
    _id: generatedId,
    id: generatedId,
    createdAt: item.createdAt || now(),
    updatedAt: now(),
  };
  items.push(record);
  setCollection(name, items);
  return record;
};

export const updateCollectionItem = (name: DemoCollectionName, id: string, patch: any): any | null => {
  const items = getCollection(name);
  const index = items.findIndex((item) => String(item._id || item.id) === String(id));
  if (index === -1) return null;
  items[index] = { ...items[index], ...patch, updatedAt: now() };
  setCollection(name, items);
  return items[index];
};

export const deleteCollectionItem = (name: DemoCollectionName, id: string): boolean => {
  const items = getCollection(name);
  const next = items.filter((item) => String(item._id || item.id) !== String(id));
  if (next.length === items.length) return false;
  setCollection(name, next);
  return true;
};
