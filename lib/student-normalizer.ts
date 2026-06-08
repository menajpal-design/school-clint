type AnyRecord = Record<string, any>;

const clean = (value: any) => String(value ?? '').trim();
const isObjectIdLike = (value: any) => /^[a-f0-9]{24}$/i.test(clean(value));
const valid = (value: any) => {
  const text = clean(value);
  if (!text) return '';
  const lower = text.toLowerCase();
  if (['-', 'n/a', 'na', 'undefined', 'null', 'student', 'unnamed student', 'unassigned', 'no section'].includes(lower)) return '';
  return text;
};
const id = (value: any) => clean(value?._id || value?.id || value);
const nameOf = (value: any) => valid(typeof value === 'object' ? value?.name || value?.title || value?.label : value);
const first = (...values: any[]) => {
  for (const value of values) {
    const text = valid(typeof value === 'object' ? value?.name || value?.title || value?.label : value);
    if (text && !isObjectIdLike(text)) return text;
  }
  return '';
};
const digits = (value: any) => clean(value).replace(/\D/g, '');
const eq = (a: any, b: any) => clean(a) && clean(b) && clean(a) === clean(b);
const deq = (a: any, b: any) => digits(a) && digits(b) && digits(a) === digits(b);

export type NormalizedStudent = {
  id: string;
  studentId: string;
  name: string;
  roll: string;
  rollNumber: string;
  className: string;
  section: string;
  sectionName: string;
  phone: string;
  guardianPhone: string;
  guardianName: string;
  fatherName: string;
  motherName: string;
  idCardNumber: string;
  admissionNo: string;
  userId: string;
  username: string;
  raw: AnyRecord;
};

export function normalizeStudent(rawStudent: any): NormalizedStudent {
  const raw = (rawStudent || {}) as AnyRecord;
  const user = raw.userId || raw.user || raw.account || {};
  const guardian = raw.guardian || raw.parent || raw.parentId || {};
  const basic = raw.basicInfo || {};
  const academic = raw.academic || {};
  const admission = raw.admission || {};
  const classObj = raw.classId || raw.classInfo || raw.class || academic.classId || academic.classInfo || {};
  const sectionObj = raw.sectionId || raw.sectionInfo || raw.section || academic.sectionId || academic.sectionInfo || {};
  const studentId = id(raw._id || raw.id || raw.studentId || raw.student);
  const normalized: NormalizedStudent = {
    id: studentId,
    studentId,
    name: first(raw.name, raw.fullName, raw.studentName, basic.name, user.name, raw.displayName),
    roll: first(raw.roll, raw.rollNo, raw.rollNumber, academic.roll, academic.rollNo, academic.rollNumber, admission.roll, admission.rollNo, admission.rollNumber),
    rollNumber: '',
    className: first(raw.className, raw.class_name, raw.classTitle, academic.className, academic.class, admission.className, nameOf(classObj), classObj?.className),
    section: first(raw.section, raw.sectionName, raw.section_name, academic.section, academic.sectionName, admission.section, admission.sectionName, nameOf(sectionObj), sectionObj?.sectionName),
    sectionName: '',
    phone: first(raw.phone, basic.phone, user.phone, raw.mobile, raw.contact),
    guardianPhone: first(raw.guardianPhone, raw.parentPhone, raw.guardianMobile, raw.parentMobile, guardian.phone, guardian.mobile, raw.parentId?.phone),
    guardianName: first(raw.guardianName, raw.parentName, guardian.name, raw.parentId?.name),
    fatherName: first(raw.fatherName, raw.father?.name, basic.fatherName, admission.fatherName),
    motherName: first(raw.motherName, raw.mother?.name, basic.motherName, admission.motherName),
    idCardNumber: first(raw.idCardNumber, raw.cardNumber, raw.idCard?.cardNumber, raw.card?.cardNumber),
    admissionNo: first(raw.admissionNo, raw.admissionNumber, raw.registrationNumber, admission.admissionNo, admission.admissionNumber),
    userId: id(raw.userId?._id || raw.userId || raw.accountId || raw.user?._id || raw.user || user._id || user.id),
    username: first(raw.username, user.username, raw.userId?.username, raw.account?.username),
    raw,
  };
  normalized.rollNumber = normalized.roll;
  normalized.sectionName = normalized.section;
  return normalized;
}

export function normalizeStudents(students: any[] = []) {
  return students.map(normalizeStudent);
}

export function findStudentForUser(students: any[] = [], user: any = {}) {
  const list = normalizeStudents(students);
  const userId = id(user?._id || user?.id || user?.userId || user?.accountId);
  const username = clean(user?.username);
  const studentId = id(user?.studentId?._id || user?.studentId || user?.student?._id || user?.student);
  const roleDetailsId = id(user?.roleDetails?._id || user?.roleDetails?.studentId);
  const cardNo = clean(user?.idCardNumber || user?.cardNumber);
  const phone = user?.phone;

  return list.find((s) => studentId && [s.id, s.studentId].includes(studentId))
    || list.find((s) => roleDetailsId && [s.id, s.studentId].includes(roleDetailsId))
    || list.find((s) => userId && s.userId === userId)
    || list.find((s) => username && s.username === username)
    || list.find((s) => cardNo && s.idCardNumber === cardNo)
    || list.find((s) => deq(s.phone, phone) || deq(s.guardianPhone, phone))
    || null;
}

export function findStudentForPayment(students: any[] = [], paymentOrReceipt: any = {}) {
  const list = normalizeStudents(students);
  const source = paymentOrReceipt || {};
  const nested = typeof source.studentId === 'object' ? source.studentId : {};
  const studentId = id(source.studentId?._id || source.studentId || source.student?._id || source.student || source.studentRef || source.student_id);
  const userId = id(source.userId || source.accountId || nested.userId?._id || nested.userId || nested.user?._id || nested.user);
  const username = clean(source.username || nested.userId?.username || nested.username);
  const cardNo = clean(source.idCardNumber || source.cardNumber || nested.idCardNumber || nested.cardNumber);
  const roll = first(source.roll, source.rollNo, source.rollNumber, nested.roll, nested.rollNo, nested.rollNumber);
  const className = first(source.className, source.class, nested.className, nested.classId?.name, source.classId?.name);
  const section = first(source.section, source.sectionName, nested.section, nested.sectionName, nested.sectionId?.name, source.sectionId?.name);
  const phone = source.guardianPhone || source.parentPhone || source.phone || nested.guardianPhone || nested.parentPhone || nested.userId?.phone;

  return list.find((s) => studentId && [s.id, s.studentId].includes(studentId))
    || list.find((s) => userId && s.userId === userId)
    || list.find((s) => username && s.username === username)
    || list.find((s) => cardNo && s.idCardNumber === cardNo)
    || list.find((s) => roll && className && section && clean(s.roll) === clean(roll) && clean(s.className) === clean(className) && clean(s.section) === clean(section))
    || list.find((s) => deq(s.guardianPhone, phone) || deq(s.phone, phone))
    || null;
}

export function mergeStudentIntoRow(row: any, students: any[] = []) {
  const found = findStudentForPayment(students, row) || (typeof row?.studentId === 'object' ? normalizeStudent(row.studentId) : null);
  if (!found) return row;
  return {
    ...row,
    student: found,
    studentName: found.name || row?.studentName,
    rollNumber: found.roll || row?.rollNumber,
    roll: found.roll || row?.roll,
    className: found.className || row?.className,
    sectionName: found.section || row?.sectionName,
    section: found.section || row?.section,
    guardianPhone: found.guardianPhone || row?.guardianPhone,
    studentId: typeof row?.studentId === 'object' ? { ...row.studentId, ...found.raw, name: found.name, rollNumber: found.roll, className: found.className, sectionName: found.section, guardianPhone: found.guardianPhone } : row?.studentId,
  };
}