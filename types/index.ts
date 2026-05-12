// User and Authentication
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  permissions: string[];
  institutionId: string;
  lastLogin?: Date;
}

export type UserRole = 
  | 'head' 
  | 'assistant_head' 
  | 'class_teacher' 
  | 'subject_teacher' 
  | 'teacher'
  | 'finance_officer' 
  | 'staff' 
  | 'student' 
  | 'parent' 
  | 'committee_member';

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// Student
export interface Student {
  id: string;
  userId: string;
  rollNumber: string;
  classId: string;
  sectionId: string;
  admissionDate: Date;
  dateOfBirth: Date;
  bloodGroup?: string;
  address: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail?: string;
  subjects: string[];
  isActive: boolean;
  idCardNumber?: string;
  idCardExpiry?: Date;
}

// Teacher
export interface Teacher {
  id: string;
  userId: string;
  employeeId: string;
  designation: string;
  department: string;
  subjects: string[];
  assignedClasses: string[];
  joiningDate: Date;
  qualification: string;
  experience: number;
  salary: number;
  isActive: boolean;
}

// Attendance
export interface Attendance {
  id: string;
  studentId: string;
  classId: string;
  sectionId: string;
  date: Date;
  status: 'present' | 'absent' | 'late';
  markedBy: string;
  notes?: string;
}

// Fee
export interface Fee {
  id: string;
  studentId: string;
  amount: number;
  type: 'tuition' | 'exam' | 'transport' | 'other';
  month: string;
  year: number;
  dueDate: Date;
  paidDate?: Date;
  status: 'pending' | 'paid' | 'overdue';
  paymentMethod?: string;
}

// IDCard
export interface IDCard {
  id: string;
  userId: string;
  userType: 'student' | 'teacher' | 'staff';
  cardNumber: string;
  issueDate: Date;
  expiryDate: Date;
  status: 'active' | 'expired' | 'revoked';
  qrCode?: string;
  photoUrl?: string;
}

// Notice
export interface Notice {
  id: string;
  title: string;
  content: string;
  category: 'general' | 'academic' | 'finance' | 'event' | 'urgent';
  priority: 'low' | 'medium' | 'high';
  postedBy: string;
  isPublished: boolean;
  publishedAt?: Date;
  expiryDate?: Date;
}

// Institution
export interface Institution {
  id: string;
  name: string;
  type: 'school' | 'madrasah';
  eiin?: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
  website?: string;
}

// Class
export interface Class {
  id: string;
  name: string;
  grade: string;
  sections: string[];
  subjects: string[];
  academicYear: string;
}

// Section
export interface Section {
  id: string;
  name: string;
  classId: string;
  capacity: number;
  currentStudents: number;
}

// Subject
export interface Subject {
  id: string;
  name: string;
  code: string;
  type: 'core' | 'elective' | 'optional';
  classId: string;
  creditHours: number;
}

// Dashboard
export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalStaff: number;
  todayAttendance: number;
  pendingFees: number;
  activeNotices: number;
}

export interface AttendanceOverview {
  status: string;
  count: number;
}

export interface FeeOverview {
  status: string;
  count: number;
  total: number;
}
