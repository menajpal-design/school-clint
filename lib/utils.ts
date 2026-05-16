import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCurrency(value: number): string {
  try {
    const preferred = (typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem('easy_school_currency')) || 'BDT';
    const amount = Number(value || 0);
    const formatted = new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
    if (String(preferred).toUpperCase() === 'USD') return `$ ${formatted}`;
    return `৳ ${formatted}`;
  } catch (e) {
    return `৳ ${Number(value || 0).toLocaleString()}`;
  }
}

export function getPreferredCurrency(): 'BDT' | 'USD' {
  if (typeof window === 'undefined') return 'BDT';
  try {
    const val = window.localStorage.getItem('easy_school_currency');
    return val === 'USD' ? 'USD' : 'BDT';
  } catch (e) {
    return 'BDT';
  }
}

export function setPreferredCurrency(code: 'BDT' | 'USD') {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem('easy_school_currency', code);
  } catch (e) {}
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function truncateText(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

export function generateFileContent(data: any[], format: 'csv' | 'json' = 'csv'): string {
  if (format === 'json') return JSON.stringify(data, null, 2);
  if (!data || data.length === 0) return '';
  const headers = Object.keys(data[0]);
  return [headers.join(','), ...data.map((row) => headers.map((header) => {
    const value = row[header];
    if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
    return value;
  }).join(','))].join('\n');
}

export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  downloadBlob(blob, filename);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export type AttendanceSettings = {
  defaultType: 'all' | 'student' | 'teacher' | 'staff';
  includeHeadAsTeacher: boolean;
  defaultDateRange: 'month' | '7days' | 'custom';
  printColumns: string[];
  exportCsv: boolean;
  exportPdf: boolean;
};

const DEFAULT_ATTENDANCE_SETTINGS: AttendanceSettings = {
  defaultType: 'student',
  includeHeadAsTeacher: true,
  defaultDateRange: 'month',
  printColumns: ['Name', 'Roll', 'Class', 'Section', 'Total', 'Present', 'Absent', 'Late', 'Leave'],
  exportCsv: true,
  exportPdf: true,
};

export function getAttendanceSettings(): AttendanceSettings {
  if (typeof window === 'undefined') return DEFAULT_ATTENDANCE_SETTINGS;
  try {
    const raw = window.localStorage.getItem('easy_school_attendance_settings');
    if (!raw) return DEFAULT_ATTENDANCE_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_ATTENDANCE_SETTINGS, ...(parsed || {}) } as AttendanceSettings;
  } catch (e) {
    return DEFAULT_ATTENDANCE_SETTINGS;
  }
}

export function setAttendanceSettings(s: AttendanceSettings) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem('easy_school_attendance_settings', JSON.stringify(s));
  } catch (e) {}
}

export type HolidaySettings = {
  weeklyClosedDays: string[];
  closureStartDate: string;
  closureEndDate: string;
  closureReason: string;
  enabled: boolean;
};

const DEFAULT_HOLIDAY_SETTINGS: HolidaySettings = {
  weeklyClosedDays: ['Friday'],
  closureStartDate: '',
  closureEndDate: '',
  closureReason: '',
  enabled: true,
};

export function getHolidaySettings(): HolidaySettings {
  if (typeof window === 'undefined') return DEFAULT_HOLIDAY_SETTINGS;
  try {
    const raw = window.localStorage.getItem('easy_school_holiday_settings');
    if (!raw) return DEFAULT_HOLIDAY_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_HOLIDAY_SETTINGS, ...(parsed || {}) } as HolidaySettings;
  } catch (e) {
    return DEFAULT_HOLIDAY_SETTINGS;
  }
}

export function setHolidaySettings(settings: HolidaySettings) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem('easy_school_holiday_settings', JSON.stringify(settings));
  } catch (e) {}
}

export function getClosureDaysCount(startDate?: string, endDate?: string) {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;
  const diff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return diff + 1;
}