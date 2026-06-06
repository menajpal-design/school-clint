"use client";

import { useEffect, useMemo, useState } from 'react';
import { Download, Eye, FileDown, Plus, Search, UserPlus, Pencil } from 'lucide-react';

import { PageHeader } from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { downloadFile } from '@/lib/utils';
import { normalizeUserRole } from '@/lib/permissions';

type Option = { _id: string; name: string; sections?: Array<{ _id: string; name: string }> };
type StudentRecord = { _id?: string; userId?: any; parentId?: any; rollNumber?: string; classId?: any; sectionId?: any; admissionDate?: string; dateOfBirth?: string; bloodGroup?: string; address?: string; fatherName?: string; motherName?: string; guardianName?: string; guardianPhone?: string; guardianEmail?: string; isActive?: boolean };
type StudentForm = { name: string; email: string; phone: string; photo: string; gender: string; rollNumber: string; className: string; sectionName: string; admissionDate: string; dateOfBirth: string; bloodGroup: string; address: string; fatherName: string; motherName: string; guardianName: string; guardianPhone: string; guardianEmail: string; feeAmount: string; feeType: string; feeMonth: string; feeYear: String; feeWaiverType: string; feeWaiverAmount: string; feeWaiverReason: string; autoParentAccount: boolean; autoIdCard: boolean };

const today = new Date().toISOString().slice(0, 10);
const emptyForm: StudentForm = { name: '', email: '', phone: '', photo: '', gender: '', rollNumber: '', className: '', sectionName: 'A', admissionDate: today, dateOfBirth: '', bloodGroup: '', address: '', fatherName: '', motherName: '', guardianName: '', guardianPhone: '', guardianEmail: '', feeAmount: '', feeType: 'monthly', feeMonth: new Date().toLocaleString('en-US', { month: 'long' }), feeYear: String(new Date().getFullYear()), feeWaiverType: 'none', feeWaiverAmount: '', feeWaiverReason: '', autoParentAccount: true, autoIdCard: true };
const teacherRoles = ['head', 'assistant_head', 'class_teacher', 'subject_teacher', 'teacher', 'admin', 'super_admin'];
const managerRoles = ['head', 'assistant_head', 'class_teacher', 'subject_teacher', 'teacher', 'admin', 'super_admin'];
const studentCardRoles = ['head', 'assistant_head', 'class_teacher', 'subject_teacher', 'teacher', 'admin', 'super_admin'];
const idOf = (value: any) => String(value?._id || value || '');
const nameOf = (value: any) => typeof value === 'object' && value?.name ? value.name : '';

export default function StudentsPage() {
  const { user, isLoading } = useAuth();
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [classes, setClasses] = useState<Option[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<StudentForm>(emptyForm);
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  
  const normalizedRole = normalizeUserRole(user?.role) || '';
  const canView = !user || teacherRoles.includes(normalizedRole);
  const canManage = !!user && managerRoles.includes(normalizedRole);
  const canGenerateStudentCards = !!user && studentCardRoles.includes(normalizedRole);
  const loadStudents = () => { setLoading(true); api.students.getAll().then((data: any) => setStudents(data.students || [])).catch((error: any) => { setStatus(error?.message || 'Student list load failed.'); setStudents([]); }).finally(() => setLoading(false)); };
  const loadClasses = () => { api.academic.classes.getAll().then((data: any) => setClasses(data.classes || [])).catch(() => setClasses([])); };
  useEffect(() => { loadStudents(); loadClasses(); }, []);
  const update = (key: keyof StudentForm, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));
  const selectedClassByForm = useMemo(() => classes.find((item) => item.name === form.className || item._id === form.className), [classes, form.className]);
  const selectedSections = useMemo(() => selectedClassByForm?.sections || [], [selectedClassByForm]);
  const selectedSectionByForm = useMemo(() => selectedSections.find((section) => section.name === form.sectionName || section._id === form.sectionName), [selectedSections, form.sectionName]);
  const studentClassOptions = useMemo(() => { const map = new Map<string, Option>(); students.forEach((student) => { const classId = idOf(student.classId); if (classId && !map.has(classId)) map.set(classId, { _id: classId, name: nameOf(student.classId) || classId, sections: [] }); const sectionId = idOf(student.sectionId); if (classId && sectionId) { const classItem = map.get(classId); if (classItem && !classItem.sections?.some((section) => section._id === sectionId)) classItem.sections = [...(classItem.sections || []), { _id: sectionId, name: nameOf(student.sectionId) || sectionId }]; } }); return Array.from(map.values()); }, [students]);
  const filterClasses = classes.length ? classes : studentClassOptions;
  const sectionsForFilter = useMemo(() => filterClasses.find((item) => item._id === classFilter)?.sections || [], [classFilter, filterClasses]);
  const filteredStudents = useMemo(() => { const term = search.trim().toLowerCase(); return students.filter((student) => { const classId = idOf(student.classId); const sectionId = idOf(student.sectionId); const classMatch = !classFilter || classId === classFilter; const sectionMatch = !sectionFilter || sectionId === sectionFilter; const haystack = [student.userId?.name, student.userId?.email, student.userId?.phone, student.rollNumber, nameOf(student.classId), nameOf(student.sectionId), student.fatherName, student.motherName, student.guardianName, student.guardianPhone].join(' ').toLowerCase(); return classMatch && sectionMatch && (!term || haystack.includes(term)); }); }, [classFilter, search, sectionFilter, students]);
  const stats = useMemo(() => { const active = filteredStudents.filter((student) => student.isActive !== false).length; const guardians = new Set(filteredStudents.map((student) => student.guardianPhone).filter(Boolean)); return { active, guardians: guardians.size, inactive: filteredStudents.length - active }; }, [filteredStudents]);
  const resetForm = () => { setEditingId(null); setForm({ ...emptyForm, className: classes[0]?.name || '', sectionName: classes[0]?.sections?.[0]?.name || 'A' }); setStatus(''); };
  const openView = (student: StudentRecord) => { setSelectedStudent(student); setViewOpen(true); };
  const exportCsv = async () => { const csvEscape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`; const rows = [['#', 'Student Name', 'Student Phone', 'Roll', 'Class', 'Section', 'Father', 'Mother', 'Guardian Name', 'Guardian Phone', 'Status'], ...filteredStudents.map((student, index) => [index + 1, student.userId?.name || 'Student', student.userId?.phone || '', student.rollNumber || '', nameOf(student.classId) || '', nameOf(student.sectionId) || '', student.fatherName || '', student.motherName || '', student.guardianName || student.parentId?.name || '', student.guardianPhone || student.parentId?.phone || '', student.isActive === false ? 'Inactive' : 'Active'])]; downloadFile(rows.map((row) => row.map(csvEscape).join(',')).join('\n'), `students-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8'); };
  const exportPdf = async () => {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 28;
    const columnWidths = [28, 122, 88, 88, 72, 72, 102, 102, 112, 102, 60];
    const headers = ['#', 'Student Name', 'Phone', 'Roll', 'Class', 'Section', 'Father', 'Mother', 'Guardian', 'Guardian Phone', 'Status'];
    const rows = filteredStudents.map((student, index) => ([
      String(index + 1),
      student.userId?.name || 'Student',
      student.userId?.phone || '-',
      student.rollNumber || '-',
      nameOf(student.classId) || '-',
      nameOf(student.sectionId) || '-',
      student.fatherName || '-',
      student.motherName || '-',
      student.guardianName || student.parentId?.name || '-',
      student.guardianPhone || student.parentId?.phone || '-',
      student.isActive === false ? 'Inactive' : 'Active',
    ]));

    let y = 26;
    const drawHeader = () => {
      doc.setFillColor(15, 23, 42);
      doc.rect(margin, y, pageWidth - margin * 2, 42, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('Students List', margin + 14, y + 20);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated ${new Date().toLocaleDateString()}`, pageWidth - margin - 92, y + 20);
      y += 58;

      let x = margin;
      doc.setFillColor(226, 232, 240);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      headers.forEach((header, index) => {
        doc.rect(x, y, columnWidths[index], 20, 'F');
        doc.text(header, x + 4, y + 13);
        x += columnWidths[index];
      });
      y += 20;
    };

    const drawRow = (cells: string[], rowIndex: number) => {
      const rowHeight = 18;
      if (y + rowHeight > pageHeight - 24) {
        doc.addPage();
        y = 26;
        drawHeader();
      }
      let x = margin;
      doc.setFillColor(rowIndex % 2 === 0 ? 255 : 248, rowIndex % 2 === 0 ? 255 : 250, rowIndex % 2 === 0 ? 255 : 252);
      cells.forEach((cell, index) => {
        doc.rect(x, y, columnWidths[index], rowHeight, 'S');
        doc.setFont('helvetica', index === 1 ? 'bold' : 'normal');
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        const lines = doc.splitTextToSize(cell, columnWidths[index] - 6);
        doc.text(lines[0] || '', x + 3, y + 12);
        x += columnWidths[index];
      });
      y += rowHeight;
    };

    drawHeader();
    rows.forEach((row, index) => drawRow(row, index));
    doc.save(`students-${new Date().toISOString().slice(0, 10)}.pdf`);
  };
  const exportStudentPdf = async (student: StudentRecord) => { const { default: jsPDF } = await import('jspdf'); const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' }); const pageWidth = doc.internal.pageSize.getWidth(); doc.setFillColor(15, 23, 42); doc.rect(24, 24, pageWidth - 48, 52, 'F'); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.text('Student Profile', 40, 54); doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.text(`Generated ${new Date().toLocaleDateString()}`, pageWidth - 150, 54); let y = 100; const lines = [ ['Name', student.userId?.name || 'N/A'], ['Phone', student.userId?.phone || 'N/A'], ['Roll', student.rollNumber || 'N/A'], ['Class / Section', `${nameOf(student.classId) || 'Unassigned'} / ${nameOf(student.sectionId) || 'No section'}`], ['Date of Birth', student.dateOfBirth ? student.dateOfBirth.slice(0, 10) : 'N/A'], ['Father', student.fatherName || 'N/A'], ['Mother', student.motherName || 'N/A'], ['Guardian', `${student.guardianName || student.parentId?.name || 'N/A'} (${student.guardianPhone || student.parentId?.phone || 'N/A'})`], ['Status', student.isActive === false ? 'Inactive' : 'Active'], ]; lines.forEach(([label, value], index) => { const boxHeight = 28; doc.setFillColor(index % 2 === 0 ? 248 : 255, index % 2 === 0 ? 250 : 255, index % 2 === 0 ? 252 : 255); doc.rect(24, y, pageWidth - 48, boxHeight, 'F'); doc.setDrawColor(203, 213, 225); doc.rect(24, y, pageWidth - 48, boxHeight, 'S'); doc.setTextColor(15, 23, 42); doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.text(`${label}:`, 40, y + 18); doc.setFont('helvetica', 'normal'); doc.text(String(value), 150, y + 18); y += boxHeight + 8; }); doc.save(`student-${student.rollNumber || student._id || 'profile'}.pdf`); };
  const openEdit = (student: StudentRecord) => { setEditingId(student._id || null); setForm({ ...emptyForm, name: student.userId?.name || '', phone: student.userId?.phone || '', photo: student.userId?.avatar || '', gender: student.userId?.gender || '', rollNumber: student.rollNumber || '', className: nameOf(student.classId), sectionName: nameOf(student.sectionId) || 'A', admissionDate: student.admissionDate ? student.admissionDate.slice(0, 10) : today, dateOfBirth: student.dateOfBirth ? student.dateOfBirth.slice(0, 10) : '', bloodGroup: student.bloodGroup || '', address: student.address || '', fatherName: student.fatherName || '', motherName: student.motherName || '', guardianName: student.guardianName || student.parentId?.name || '', guardianPhone: student.guardianPhone || student.parentId?.phone || '', guardianEmail: student.guardianEmail || student.parentId?.email || '', autoIdCard: false, autoParentAccount: false }); setOpen(true); };
  const submit = async () => { if (!form.name.trim() || !form.className.trim() || !form.sectionName.trim() || !form.guardianPhone.trim()) { setStatus('Name, class, section, and guardian phone are required. Roll can be auto-generated.'); return; } setStatus(editingId ? 'Saving student...' : 'Admitting student...'); try { const payload = { ...form, classId: selectedClassByForm?._id, sectionId: selectedSectionByForm?._id, className: selectedClassByForm?.name || form.className, sectionName: selectedSectionByForm?.name || form.sectionName, feeAmount: form.feeAmount ? Number(form.feeAmount) : undefined, feeYear: form.feeYear ? Number(form.feeYear) : undefined, feeWaiverAmount: form.feeWaiverAmount ? Number(form.feeWaiverAmount) : undefined }; if (editingId) await api.students.update(editingId, payload); else await api.students.create(payload); setStatus(editingId ? 'Student updated.' : 'Student admitted.'); setOpen(false); resetForm(); loadStudents(); loadClasses(); } catch (error: any) { setStatus(error?.message || 'Student API failed.'); } };
  if (!isLoading && !canView) return <div className="p-6"><Card><CardHeader><CardTitle>Students</CardTitle><CardDescription>You do not have access to student records.</CardDescription></CardHeader></Card></div>;
  return <div className="space-y-5"><PageHeader title="Student Management" description="Student list, class/section filter, admission details, parent information, guardian account, fee setup, and ID card shortcuts." icon={UserPlus} status={<Badge variant="outline">{filteredStudents.length} of {students.length} student records from /api/students.</Badge>} actions={[<Button key="csv" variant="outline" size="sm" onClick={exportCsv}><Download className="mr-2 h-4 w-4" />Download CSV</Button>, <Button key="pdf" variant="outline" size="sm" onClick={exportPdf}><FileDown className="mr-2 h-4 w-4" />Download PDF</Button>, canManage && <Button key="add" size="sm" onClick={() => { resetForm(); setOpen(true); }}><Plus className="mr-2 h-4 w-4" />Add Student</Button>].filter(Boolean) as any} />{status && <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700 whitespace-pre-wrap">{status}</div>}<div className="grid gap-4 md:grid-cols-4"><Card><CardHeader><CardDescription>Visible Students</CardDescription><CardTitle>{filteredStudents.length}</CardTitle></CardHeader></Card><Card><CardHeader><CardDescription>Active Students</CardDescription><CardTitle>{stats.active}</CardTitle></CardHeader></Card><Card><CardHeader><CardDescription>Guardians</CardDescription><CardTitle>{stats.guardians}</CardTitle></CardHeader></Card><Card><CardHeader><CardDescription>Students</CardDescription><CardTitle>{filteredStudents.length}</CardTitle></CardHeader></Card></div><Card><CardContent className="space-y-4 p-4"><div className="grid gap-3 md:grid-cols-[220px_220px_1fr]"><Select value={classFilter || 'all'} onValueChange={(value) => { setClassFilter(value === 'all' ? '' : value); setSectionFilter(''); }}><SelectTrigger><SelectValue placeholder="All classes" /></SelectTrigger><SelectContent><SelectItem value="all">All classes</SelectItem>{filterClasses.map((item) => <SelectItem key={item._id} value={item._id}>{item.name}</SelectItem>)}</SelectContent></Select><Select value={sectionFilter || 'all'} onValueChange={(value) => setSectionFilter(value === 'all' ? '' : value)}><SelectTrigger><SelectValue placeholder="All sections" /></SelectTrigger><SelectContent><SelectItem value="all">All sections</SelectItem>{sectionsForFilter.map((section) => <SelectItem key={section._id} value={section._id}>{section.name}</SelectItem>)}</SelectContent></Select><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, roll, father, mother, guardian" /></div></div><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Roll</TableHead><TableHead>Class / Section</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader><TableBody>{loading ? <TableRow><TableCell colSpan={5} className="h-24 text-center">Loading students...</TableCell></TableRow> : filteredStudents.length === 0 ? <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No students match this class, section, or search.</TableCell></TableRow> : filteredStudents.map((student) => <TableRow key={student._id || student.userId?._id}><TableCell><div className="font-medium">{student.userId?.name || 'Student'}</div><div className="text-xs text-muted-foreground">{student.userId?.phone || student.guardianPhone || ''}</div></TableCell><TableCell>{student.rollNumber || '-'}</TableCell><TableCell>{nameOf(student.classId) || 'Unassigned'} / {nameOf(student.sectionId) || 'No section'}</TableCell><TableCell><Badge variant="outline">{student.isActive === false ? 'Inactive' : 'Active'}</Badge></TableCell><TableCell><div className="flex justify-end gap-2"><Button size="icon" variant="outline" onClick={() => openView(student)}><Eye className="h-4 w-4" /></Button>{canManage && <Button size="icon" variant="outline" onClick={() => openEdit(student)}><Pencil className="h-4 w-4" /></Button>}{canGenerateStudentCards && <Button size="icon" variant="outline" onClick={() => exportStudentPdf(student)}><FileDown className="h-4 w-4" /></Button>}</div></TableCell></TableRow>)}</TableBody></Table></CardContent></Card><Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle>{editingId ? 'Edit Student' : 'Add Student'}</DialogTitle><DialogDescription>Student basic information, parent names, class assignment and guardian contact.</DialogDescription></DialogHeader><div className="grid gap-4 md:grid-cols-2"><Field label="Name"><Input value={form.name} onChange={(e) => update('name', e.target.value)} /></Field><Field label="Gender"><Select value={form.gender || ''} onValueChange={(value) => update('gender', value)}><SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger><SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></Field><Field label="Roll Number"><Input value={form.rollNumber} onChange={(e) => update('rollNumber', e.target.value)} placeholder="Auto if blank" /></Field><Field label="Student Phone"><Input value={form.phone} onChange={(e) => update('phone', e.target.value)} /></Field><Field label="Class"><Select value={selectedClassByForm?._id || ''} onValueChange={(value) => { const cls = classes.find((item) => item._id === value); setForm((current) => ({ ...current, className: cls?.name || '', sectionName: cls?.sections?.[0]?.name || 'A' })); }}><SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger><SelectContent>{classes.map((item) => <SelectItem key={item._id} value={item._id}>{item.name}</SelectItem>)}</SelectContent></Select></Field><Field label="Section"><Select value={selectedSectionByForm?._id || ''} onValueChange={(value) => { const sec = selectedSections.find((item) => item._id === value); update('sectionName', sec?.name || 'A'); }}><SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger><SelectContent>{selectedSections.map((section) => <SelectItem key={section._id} value={section._id}>{section.name}</SelectItem>)}</SelectContent></Select></Field><Field label="Admission Date"><Input type="date" value={form.admissionDate} onChange={(e) => update('admissionDate', e.target.value)} /></Field><Field label="Date of Birth"><Input type="date" value={form.dateOfBirth} onChange={(e) => update('dateOfBirth', e.target.value)} /></Field><Field label="Blood Group"><Input value={form.bloodGroup} onChange={(e) => update('bloodGroup', e.target.value)} /></Field><Field label="Father Name"><Input value={form.fatherName} onChange={(e) => update('fatherName', e.target.value)} /></Field><Field label="Mother Name"><Input value={form.motherName} onChange={(e) => update('motherName', e.target.value)} /></Field><Field label="Guardian Name"><Input value={form.guardianName} onChange={(e) => update('guardianName', e.target.value)} /></Field><Field label="Guardian Phone"><Input value={form.guardianPhone} onChange={(e) => update('guardianPhone', e.target.value)} /></Field><Field label="Guardian Email"><Input value={form.guardianEmail} onChange={(e) => update('guardianEmail', e.target.value)} /></Field><Field label="Fee Amount"><Input value={form.feeAmount} onChange={(e) => update('feeAmount', e.target.value)} /></Field><Field label="Address"><Textarea value={form.address} onChange={(e) => update('address', e.target.value)} /></Field><div className="flex items-center justify-between rounded-lg border p-3"><Label>Create parent account and send credentials</Label><Switch checked={form.autoParentAccount} onCheckedChange={(checked) => update('autoParentAccount', checked)} /></div><div className="flex items-center justify-between rounded-lg border p-3"><Label>Auto generate account and ID card</Label><Switch checked={form.autoIdCard} onCheckedChange={(checked) => update('autoIdCard', checked)} /></div></div><DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Close</Button><Button onClick={submit}>{editingId ? 'Save Changes' : 'Admit Student'}</Button></DialogFooter></DialogContent></Dialog><Dialog open={viewOpen} onOpenChange={setViewOpen}><DialogContent><DialogHeader><DialogTitle>Student Details</DialogTitle><DialogDescription>Student and parent information for the selected record.</DialogDescription></DialogHeader>{selectedStudent && <div className="space-y-3 text-sm"><div><b>Name:</b> {selectedStudent.userId?.name || 'N/A'}</div><div><b>Phone:</b> {selectedStudent.userId?.phone || 'N/A'}</div><div><b>Roll:</b> {selectedStudent.rollNumber || 'N/A'}</div><div><b>Class / Section:</b> {nameOf(selectedStudent.classId) || 'Unassigned'} / {nameOf(selectedStudent.sectionId) || 'No section'}</div><div><b>Date of Birth:</b> {selectedStudent.dateOfBirth ? selectedStudent.dateOfBirth.slice(0, 10) : 'N/A'}</div><div><b>Father:</b> {selectedStudent.fatherName || 'N/A'}</div><div><b>Mother:</b> {selectedStudent.motherName || 'N/A'}</div><div><b>Guardian:</b> {selectedStudent.guardianName || selectedStudent.parentId?.name || 'N/A'} ({selectedStudent.guardianPhone || selectedStudent.parentId?.phone || 'N/A'})</div><hr className="border-border" /><div><b>Student ID:</b> {selectedStudent._id}</div></div>}</DialogContent></Dialog></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="space-y-2"><span className="text-sm font-medium">{label}</span>{children}</label>; }