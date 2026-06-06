import { api, apiClient } from './api';

const serialRoll = (index: number) => String(index + 1).padStart(2, '0');
const peopleCache = new Map<string, { at: number; data: any }>();
const peopleInflight = new Map<string, Promise<any>>();
const peopleCacheMs = 10000;
const keyOf = (params?: any) => JSON.stringify({ personType: params?.personType || 'student', classId: params?.classId || '', sectionId: params?.sectionId || '' });

const getUsers = async () => {
  const data: any = await apiClient.get('/users');
  return Array.isArray(data?.users) ? data.users : [];
};
const studentRowsFromUsers = (users: any[]) => users.filter((user: any) => user?.role === 'student').map((user: any, index: number) => ({ _id: `user-${user._id}`, rollNumber: user.rollNumber || serialRoll(index), userId: { _id: user._id, name: user.name, username: user.username, phone: user.phone, avatar: user.avatar }, classId: user.classId || undefined, sectionId: user.sectionId || undefined, isActive: user.isActive !== false }));
const teacherRowsFromUsers = (users: any[]) => users.filter((user: any) => ['teacher', 'subject_teacher', 'class_teacher'].includes(user?.role)).map((user: any, index: number) => ({ _id: user._id, profileId: `user-${user._id}`, personType: 'teacher', employeeId: user.employeeId || `T-${String(index + 1).padStart(3, '0')}`, designation: user.role === 'class_teacher' ? 'Class Teacher' : user.role === 'subject_teacher' ? 'Subject Teacher' : 'Teacher', department: user.department || '', userId: { _id: user._id, name: user.name, username: user.username, email: user.email, phone: user.phone, avatar: user.avatar, role: user.role } }));
const staffRowsFromUsers = (users: any[]) => users.filter((user: any) => ['staff', 'finance_officer', 'librarian', 'accountant'].includes(user?.role)).map((user: any, index: number) => ({ _id: user._id, profileId: `user-${user._id}`, personType: 'staff', employeeId: user.employeeId || `S-${String(index + 1).padStart(3, '0')}`, designation: user.designation || (user.role === 'finance_officer' ? 'Finance Officer' : user.role === 'librarian' ? 'Librarian' : 'Staff'), department: user.department || '', userId: { _id: user._id, name: user.name, username: user.username, email: user.email, phone: user.phone, avatar: user.avatar, role: user.role } }));

const fallbackPeople = async (personType: string, params?: any) => {
  const users = await getUsers();
  if (personType === 'teacher') return { people: teacherRowsFromUsers(users) };
  if (personType === 'staff') return { people: staffRowsFromUsers(users) };
  let people = studentRowsFromUsers(users);
  const studentsHaveClass = people.some((student: any) => student.classId);
  if (params?.classId && studentsHaveClass) people = people.filter((student: any) => String(student.classId?._id || student.classId || '') === String(params.classId));
  if (params?.sectionId) people = people.filter((student: any) => String(student.sectionId?._id || student.sectionId || '') === String(params.sectionId));
  return { people };
};

export function installAttendanceApiCompat() {
  api.attendance = api.attendance || {};
  if (!api.dashboard?.attendanceOverview) {
    api.dashboard = api.dashboard || {};
    api.dashboard.attendanceOverview = async () => {
      const data: any = await apiClient.get('/attendance/overview');
      return data?.overview || data || {};
    };
  }
  api.attendance.getPeople = async (params?: any) => {
    const personType = params?.personType || 'student';
    const key = keyOf(params);
    const cached = peopleCache.get(key);
    if (cached && Date.now() - cached.at < peopleCacheMs) return cached.data;
    if (peopleInflight.has(key)) return peopleInflight.get(key);
    const promise = (async () => {
      try {
        const data: any = await apiClient.get('/attendance/people', { params });
        const people = Array.isArray(data?.people) ? data.people : [];
        const result = people.length ? { people, lockedClassId: data.lockedClassId, lockedClassIds: data.lockedClassIds } : { ...(await fallbackPeople(personType, params)), lockedClassId: data?.lockedClassId, lockedClassIds: data?.lockedClassIds };
        peopleCache.set(key, { at: Date.now(), data: result });
        return result;
      } catch {
        const result = await fallbackPeople(personType, params);
        peopleCache.set(key, { at: Date.now(), data: result });
        return result;
      } finally { peopleInflight.delete(key); }
    })();
    peopleInflight.set(key, promise);
    return promise;
  };
  if (!api.attendance.getStudentAttendance) api.attendance.getStudentAttendance = (studentId: string) => apiClient.get(`/attendance/student/${String(studentId).replace(/^user-/, '')}`);
  if (!api.attendance.getPersonAttendance) api.attendance.getPersonAttendance = (type: 'teacher' | 'staff', id: string) => apiClient.get(`/attendance/person/${type}/${String(id).replace(/^user-/, '')}`);
  if (!api.attendance.scanIdCard) api.attendance.scanIdCard = (data: any) => apiClient.post('/attendance/scan-id-card', data);
  if (!api.attendance.scanPresent) api.attendance.scanPresent = (data: any) => apiClient.post('/attendance/scan-present', data);
}
installAttendanceApiCompat();
