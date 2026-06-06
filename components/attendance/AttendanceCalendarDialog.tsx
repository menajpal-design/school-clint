"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { normalizeUserRole } from "@/lib/permissions";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface AttendanceCalendarDialogProps {
  isOpen: boolean;
  onClose: () => void;
  person: {
    id: string;
    name: string;
    roll?: string;
    className?: string;
    section?: string;
    userType: 'student' | 'teacher' | 'staff';
    dbStudentId?: string;
    dbUserId?: string;
    dbClassId?: string;
    dbSectionId?: string;
  } | null;
  onAttendanceUpdated?: () => void;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const cleanId = (id: string) => String(id || '').replace(/^(student:|user:|teacher:|staff:|user-|student-)/g, '');

export function AttendanceCalendarDialog({ isOpen, onClose, person, onAttendanceUpdated }: AttendanceCalendarDialogProps) {
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingDate, setUpdatingDate] = useState<string | null>(null);

  const role = normalizeUserRole(user?.role);
  const canMark = role && ['admin', 'super_admin', 'head', 'assistant_head', 'class_teacher'].includes(role);

  const years = useMemo(() => {
    const start = new Date().getFullYear() - 3;
    const end = new Date().getFullYear() + 1;
    const list = [];
    for (let y = start; y <= end; y++) {
      list.push(y);
    }
    return list;
  }, []);

  const fetchAttendance = useCallback(async () => {
    if (!person) return;
    setLoading(true);
    try {
      let data: any;
      if (person.userType === 'student') {
        const studentId = cleanId(person.dbStudentId || person.id);
        data = await api.attendance.getStudentAttendance(studentId);
      } else {
        const userId = cleanId(person.dbUserId || person.id);
        data = await api.attendance.getPersonAttendance(person.userType, userId);
      }
      setRecords(data?.attendance || []);
    } catch (error: any) {
      addToast({
        title: "Error",
        message: error?.message || "Failed to load attendance history",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  }, [person, addToast]);

  useEffect(() => {
    if (isOpen && person) {
      fetchAttendance();
    }
  }, [isOpen, person, fetchAttendance]);

  const recordsMap = useMemo(() => {
    const map = new Map<string, string>();
    records.forEach((rec: any) => {
      if (!rec.date) return;
      // Extract YYYY-MM-DD
      const dateStr = new Date(rec.date).toISOString().slice(0, 10);
      map.set(dateStr, rec.status);
    });
    return map;
  }, [records]);

  const calendarCells = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun, 6 = Sat
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const cells: { date: string | null; dayNumber: number | null; status: string | null }[] = [];
    
    // Previous month padding
    for (let i = 0; i < firstDay; i++) {
      cells.push({ date: null, dayNumber: null, status: null });
    }
    
    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const monthStr = String(currentMonth + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const dateStr = `${currentYear}-${monthStr}-${dayStr}`;
      cells.push({
        date: dateStr,
        dayNumber: day,
        status: recordsMap.get(dateStr) || null
      });
    }
    
    return cells;
  }, [currentMonth, currentYear, recordsMap]);

  const handleStatusChange = async (dateStr: string, status: string) => {
    if (!person) return;
    if (!status) return; // Do nothing if blank selected
    setUpdatingDate(dateStr);
    try {
      const payload: any = {
        date: dateStr,
        records: [
          person.userType === 'student'
            ? {
                studentId: cleanId(person.dbStudentId || person.id),
                userType: 'student',
                classId: person.dbClassId,
                sectionId: person.dbSectionId,
                date: dateStr,
                status
              }
            : {
                userId: cleanId(person.dbUserId || person.id),
                userType: person.userType,
                date: dateStr,
                status
              }
        ]
      };
      await api.attendance.mark(payload);
      addToast({
        title: "Success",
        message: `Attendance updated for ${dateStr}`,
        type: "success"
      });
      // Refresh current attendance history
      await fetchAttendance();
      // Notify parent to refresh list/charts
      onAttendanceUpdated?.();
    } catch (error: any) {
      addToast({
        title: "Error",
        message: error?.message || "Failed to update attendance",
        type: "error"
      });
    } finally {
      setUpdatingDate(null);
    }
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'present': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'absent': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'late': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'leave': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-slate-50 text-slate-400 border-slate-200';
    }
  };

  if (!person) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[95vh] overflow-y-auto p-6 rounded-xl border border-slate-100 shadow-2xl bg-white text-slate-900">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-indigo-600" />
            Attendance History & Mark Calendar
          </DialogTitle>
          <DialogDescription className="text-slate-500 font-medium">
            View or mark monthly attendance for: <span className="text-indigo-600 font-semibold">{person.name}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Profile Details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg text-sm border border-slate-100 mt-4">
          <div>
            <span className="text-slate-400 block text-xs uppercase font-semibold">User Type</span>
            <span className="font-semibold text-slate-700 capitalize">{person.userType}</span>
          </div>
          {person.userType === 'student' ? (
            <>
              <div>
                <span className="text-slate-400 block text-xs uppercase font-semibold">Roll Number</span>
                <span className="font-semibold text-slate-700">{person.roll || "-"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-xs uppercase font-semibold">Class</span>
                <span className="font-semibold text-slate-700">{person.className || "-"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-xs uppercase font-semibold">Section</span>
                <span className="font-semibold text-slate-700">{person.section || "-"}</span>
              </div>
            </>
          ) : (
            <>
              <div>
                <span className="text-slate-400 block text-xs uppercase font-semibold">Designation</span>
                <span className="font-semibold text-slate-700">{person.roll || "-"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-xs uppercase font-semibold">Department</span>
                <span className="font-semibold text-slate-700">{person.className || "-"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-xs uppercase font-semibold">Role</span>
                <span className="font-semibold text-slate-700 capitalize">{person.section || "-"}</span>
              </div>
            </>
          )}
        </div>

        {/* Calendar Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevMonth} className="h-9 w-9 rounded-md border-slate-200 hover:bg-slate-50">
              <ChevronLeft className="h-5 w-5 text-slate-600" />
            </Button>
            <span className="text-base font-bold text-slate-800 min-w-[140px] text-center">
              {MONTHS[currentMonth]} {currentYear}
            </span>
            <Button variant="outline" size="icon" onClick={handleNextMonth} className="h-9 w-9 rounded-md border-slate-200 hover:bg-slate-50">
              <ChevronRight className="h-5 w-5 text-slate-600" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={currentMonth}
              onChange={(e) => setCurrentMonth(Number(e.target.value))}
              className="h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none"
            >
              {MONTHS.map((m, idx) => (
                <option key={m} value={idx}>{m}</option>
              ))}
            </select>
            <select
              value={currentYear}
              onChange={(e) => setCurrentYear(Number(e.target.value))}
              className="h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-500 justify-start sm:justify-end mt-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Present
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Absent
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Late
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Leave
          </div>
        </div>

        {/* Calendar Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
            <span className="text-sm font-medium text-slate-500">Loading attendance data...</span>
          </div>
        ) : (
          <div className="mt-4 border border-slate-100 rounded-lg overflow-hidden shadow-sm">
            {/* Weekdays */}
            <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-100 text-center font-bold text-xs text-slate-500 uppercase tracking-wider py-3">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 bg-white divide-x divide-y divide-slate-100 border-l border-t border-slate-100">
              {calendarCells.map((cell, idx) => {
                const isToday = cell.date === new Date().toISOString().slice(0, 10);
                const isFuture = cell.date ? new Date(cell.date) > new Date() : false;
                
                return (
                  <div
                    key={idx}
                    className={cn(
                      "min-h-[90px] p-2 flex flex-col justify-between group transition-all duration-200",
                      cell.date ? "bg-white hover:bg-slate-50/50" : "bg-slate-50/20",
                      isToday && "ring-2 ring-indigo-500/20 bg-indigo-50/10"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "text-sm font-bold",
                        cell.date ? "text-slate-700" : "text-slate-300",
                        isToday && "text-indigo-600 font-extrabold bg-indigo-100/50 px-1.5 py-0.5 rounded-full"
                      )}>
                        {cell.dayNumber}
                      </span>
                      
                      {cell.status && !canMark && (
                        <span className={cn(
                          "text-[10px] font-bold px-1.5 py-0.5 rounded uppercase border",
                          getStatusColor(cell.status)
                        )}>
                          {cell.status}
                        </span>
                      )}
                    </div>

                    <div className="mt-2">
                      {cell.date ? (
                        updatingDate === cell.date ? (
                          <div className="flex justify-center items-center py-1">
                            <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                          </div>
                        ) : canMark && !isFuture ? (
                          <select
                            value={cell.status || ""}
                            onChange={(e) => handleStatusChange(cell.date!, e.target.value)}
                            className={cn(
                              "w-full text-xs font-semibold rounded border px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors bg-white text-slate-800",
                              getStatusColor(cell.status)
                            )}
                          >
                            <option value="" className="bg-white text-slate-700">- Select -</option>
                            <option value="present" className="bg-white text-emerald-700">Present</option>
                            <option value="absent" className="bg-white text-rose-700">Absent</option>
                            <option value="late" className="bg-white text-amber-700">Late</option>
                            <option value="leave" className="bg-white text-blue-700">Leave</option>
                          </select>
                        ) : cell.status ? (
                          <span className={cn(
                            "block text-center text-[10px] font-bold px-1.5 py-1 rounded uppercase border",
                            getStatusColor(cell.status)
                          )}>
                            {cell.status}
                          </span>
                        ) : isFuture ? (
                          <span className="block text-center text-[10px] text-slate-300 italic">Future</span>
                        ) : (
                          <span className="block text-center text-[10px] text-slate-400">-</span>
                        )
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 border-t pt-4 mt-6">
          <Button variant="outline" onClick={onClose} className="rounded-md border-slate-200">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
