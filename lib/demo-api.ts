import { User, UserRole } from '@/types';
import {
  appendCollectionItem,
  deleteCollectionItem,
  getCollection,
  getDemoUser,
  nextCollectionId,
  setCollection,
  updateCollectionItem,
} from './demo-store';

const now = () => new Date().toISOString();

const stripQuery = (url: string) => url.split('?')[0].replace(/^\/api/, '');

const response = (data: any) => Promise.resolve(data);

const notFound = () => response({});

const userFromRole = (role: UserRole): User => ({
  id: `${role}-demo-${Date.now()}`,
  name: `${role.replace(/_/g, ' ')} Demo`,
  email: `${role}@demo.local`,
  role,
  isActive: true,
  permissions: ['*'],
  institutionId: 'demo-institution',
});

const toList = (name: string, key: string) => ({ [key]: getCollection(name as any) });

const matchId = (items: any[], id: string) => items.find((item) => String(item._id || item.id) === String(id));

const demoDashboard = () => {
  const students = getCollection('students');
  const teachers = getCollection('teachers');
  const staff = getCollection('staff');
  const notices = getCollection('notices');
  const attendance = getCollection('attendance');
  const fees = getCollection('fees');
  const payments = getCollection('payments');

  return {
    summary: {
      totalStudents: students.length,
      totalTeachers: teachers.length,
      totalStaff: staff.length,
      todayAttendanceCount: attendance.filter((item) => item.status === 'present').length,
      monthlyFeeCollection: payments.reduce((sum, item) => sum + Number(item.amount || 0), 0),
      activeNotices: notices.filter((item) => item.isPublished !== false).length,
      idCardsIssued: getCollection('idCards').length,
    },
    charts: {
      attendance: [
        { name: 'Present', value: attendance.filter((item) => item.status === 'present').length },
        { name: 'Absent', value: attendance.filter((item) => item.status === 'absent').length },
        { name: 'Late', value: attendance.filter((item) => item.status === 'late').length },
        { name: 'Leave', value: attendance.filter((item) => item.status === 'leave').length },
      ],
      feeTrend: [{ name: 'This month', value: payments.reduce((sum, item) => sum + Number(item.amount || 0), 0) }],
    },
    composition: [
      { name: 'Students', value: students.length },
      { name: 'Teachers', value: teachers.length },
      { name: 'Staff', value: staff.length },
    ],
    notices: notices.slice(-5),
  };
};

const createReceiptNumber = () => `RCPT-${Date.now()}`;

const handleCrud = (collection: string, method: string, path: string, data: any, listKey: string) => {
  const items = getCollection(collection as any);
  const id = path.split('/').filter(Boolean)[1];
  const singularKey = collection.endsWith('s') ? collection.slice(0, -1) : collection;

  if (method === 'GET' && (!id || path.endsWith('/manage'))) return response({ [listKey]: items });
  if (method === 'GET' && id) return response(matchId(items, id) || null);
  if (method === 'POST') return response({ [singularKey]: appendCollectionItem(collection as any, collection.slice(0, 3), data) });
  if (method === 'PUT' || method === 'PATCH') return response({ [singularKey]: updateCollectionItem(collection as any, id, data) });
  if (method === 'DELETE') return response({ success: deleteCollectionItem(collection as any, id) });
  return notFound();
};

export async function demoRequest(method: string, url: string, data?: any): Promise<any> {
  const path = stripQuery(url);
  const parts = path.split('/').filter(Boolean);
  const [root, first, second] = parts;

  if (root === 'auth' && method === 'POST' && first === 'login') {
    const role = (data?.role || 'head') as UserRole;
    const user = userFromRole(role);
    return response({ token: `demo-${role}-${Date.now()}`, user });
  }

  if (root === 'auth' && method === 'POST' && first === 'register') {
    const role = 'head' as UserRole;
    const user = userFromRole(role);
    return response({ token: `demo-${Date.now()}`, user });
  }

  if (root === 'auth' && method === 'GET' && first === 'profile') {
    return response({ user: getDemoUser() || userFromRole('head') });
  }

  if (root === 'auth' && method === 'PUT' && first === 'profile') return response({ user: getDemoUser() });
  if (root === 'auth' && method === 'POST' && first === 'change-password') return response({ success: true });

  if (root === 'dashboard') {
    const state = demoDashboard();
    if (first === 'summary') return response(state.summary);
    if (first === 'charts') return response(state.charts);
    if (first === 'composition') return response(state.composition);
    if (first === 'recent-notices') return response(state.notices);
    if (first === 'stats' || first === 'attendance-overview' || first === 'fee-overview') return response(state.summary);
  }

  if (root === 'users') {
    if (method === 'GET' && (first === 'all' || first === '')) return response({ users: getCollection('users') });
    if (method === 'GET' && first === 'permissions') return response({ permissions: ['*'] });
    if (method === 'PATCH' && second === 'status') return response({ user: updateCollectionItem('users', first, { isActive: data?.isActive }) });
    if (method === 'PATCH' && second === 'role') return response({ user: updateCollectionItem('users', first, { role: data?.role }) });
    if (method === 'POST' && second === 'reset-password') return response({ success: true });
    if (method === 'PUT' && first === 'permissions') return response({ success: true, matrix: data?.matrix || {} });
    if (method === 'GET' && first) return response(matchId(getCollection('users'), first) || null);
    if (method === 'POST') return response({ user: appendCollectionItem('users', 'usr', data) });
    if (method === 'PUT' && first) return response({ user: updateCollectionItem('users', first, data) });
    if (method === 'DELETE' && first) return response({ success: deleteCollectionItem('users', first) });
  }

  if (root === 'students') return handleCrud('students', method, path, data, 'students');
  if (root === 'teachers') return handleCrud('teachers', method, path, data, 'teachers');
  if (root === 'staff') return handleCrud('staff', method, path, data, 'staff');
  if (root === 'documents') return handleCrud('documents', method, path, data, 'documents');
  if (root === 'notices') return handleCrud('notices', method, path, data, 'notices');
  if (root === 'committee') return handleCrud('committee', method, path, data, 'committee');
  if (root === 'messages') return handleCrud('messages', method, path, data, 'messages');
  if (root === 'notifications') return handleCrud('notifications', method, path, data, 'notifications');

  if (root === 'admissions') {
    if (method === 'GET' && first === 'public' && second === 'schools') return response({ schools: [{ _id: 'demo-school', name: 'Demo School', isActive: true }] });
    if (method === 'GET') return response({ admissions: getCollection('admissions') });
    if (method === 'POST' && first === 'public' && second === 'apply') return response({ admission: appendCollectionItem('admissions', 'adm', data) });
    if (method === 'POST' && second === 'accept') return response({ admission: updateCollectionItem('admissions', first, { status: 'accepted' }) });
    if (method === 'POST' && second === 'reject') return response({ admission: updateCollectionItem('admissions', first, { status: 'rejected' }) });
  }

  if (root === 'academic') {
    if (first === 'classes') return response({ classes: getCollection('classes') });
    if (first === 'subjects') return response({ subjects: getCollection('subjects') });
    if (first === 'exams') return response({ exams: getCollection('exams') });
    if (first === 'results') {
      if (second === 'students') return response({ students: getCollection('students') });
      if (second?.startsWith('student')) return response({ results: getCollection('results') });
      return response({ results: getCollection('results') });
    }
    if (first === 'report-card') {
      if (second === 'students') return response({ students: getCollection('students') });
      return response({ reportCard: getCollection('results')[0] || null });
    }
  }

  if (root === 'attendance') {
    if (first === 'students') return response({ students: getCollection('students') });
    if (first === 'reports') return response({ attendance: getCollection('attendance') });
    if (first === 'me') return response({ attendance: getCollection('attendance') });
    if (first === 'student' && second) return response({ attendance: getCollection('attendance').filter((item) => String(item.studentId?._id || item.studentId) === String(second)) });
    if (first === 'mark' && method === 'POST') {
      const records = Array.isArray(data?.records) ? data.records : [];
      records.forEach((record: any) => appendCollectionItem('attendance', 'att', record));
      return response({ success: true, attendance: getCollection('attendance') });
    }
    if (first === 'scan-id-card') {
      const student = getCollection('students').find((item) => String(item._id) === String(data?.code) || String(item.rollNumber) === String(data?.code));
      return response({ student: student || null });
    }
    return response({ attendance: getCollection('attendance') });
  }

  if (root === 'finance') {
    if (first === '') return response({ summary: demoDashboard().summary });
    if (first === 'fees') {
      if (second === 'student' && parts[3]) return response({ fees: getCollection('fees').filter((item) => String(item.studentId?._id || item.studentId) === String(parts[3])) });
      return response({ fees: getCollection('fees') });
    }
    if (first === 'payments') {
      if (method === 'GET') return response({ payments: getCollection('payments') });
      if (method === 'POST') {
        const payment = appendCollectionItem('payments', 'pay', { ...data, receiptNumber: createReceiptNumber(), paymentDate: now() });
        return response({ payment });
      }
    }
    if (first === 'collections') {
      return response({ students: getCollection('students').map((student) => ({ ...student, dueAmount: 2500 })) });
    }
    if (first === 'salary') return response({ salary: [] });
    if (first === 'process' || second === 'process') return response({ success: true });
    if (first === 'reports') return response({ reports: { collections: getCollection('payments'), dues: getCollection('fees'), salaries: [] } });
    if (first === 'my-fees') return response({ fees: getCollection('fees'), payments: getCollection('payments') });
  }

  if (root === 'id-cards') {
    if (first === 'owners' && second === 'search') return response({ people: [...getCollection('students'), ...getCollection('teachers'), ...getCollection('staff')] });
    if (first === 'me' && second === 'card') return response({ card: getCollection('idCards')[0] || null });
    if (first === 'reports' && second === 'stats') return response({ totalIssued: getCollection('idCards').length, downloads: 0, expiredCards: 0, pendingRenewals: 0, monthlyDownloads: [] });
    if (first === 'verify') return response({ valid: true });
    if (first === 'bulk') return response({ success: true, message: `Generated ${Array.isArray(data?.ids) ? data.ids.length : 0} cards` });
    if (first === 'generate' && method === 'POST') {
      const card = appendCollectionItem('idCards', 'card', { ...data, userType: data?.ownerType || 'student', cardNumber: nextCollectionId('idCards', 'CARD') });
      return response({ card });
    }
    if (first === 'download') return response(new Blob([JSON.stringify({ id: parts[1], format: new URLSearchParams(url.split('?')[1] || '').get('format') || 'pdf' })], { type: 'application/pdf' }));
    if (first === 'email') return response({ success: true, message: 'Email disabled in demo mode' });
    if (first === 'renew') return response({ card: updateCollectionItem('idCards', parts[1], { status: 'active' }) });
    if (method === 'GET' && (!first || first === '')) return response(getCollection('idCards'));
    if (method === 'GET' && first) return response(matchId(getCollection('idCards'), first) || null);
    if (method === 'POST' && first === 'student' && second) return response({ card: appendCollectionItem('idCards', 'card', { userId: second, userType: 'student' }) });
    if (method === 'POST' && first === 'teacher' && second) return response({ card: appendCollectionItem('idCards', 'card', { userId: second, userType: 'teacher' }) });
    if (method === 'POST' && first === 'staff' && second) return response({ card: appendCollectionItem('idCards', 'card', { userId: second, userType: 'staff' }) });
  }

  if (root === 'institution') {
    if (first === 'plans') return response({ plans: [] });
    if (first === 'profile') return response({ institution: { _id: 'demo-institution', name: 'Demo Institution', isActive: true, billing: { billingStatus: 'demo' } } });
    if (first === 'billing' && second === 'payment') return response({ institution: { _id: 'demo-institution', isActive: true, billing: { billingStatus: 'paid' } } });
  }

  if (root === 'parent' && first === 'portal') return response({ children: getCollection('students') });
  if (root === 'backup') return response({ backups: [] });

  return notFound();
}
