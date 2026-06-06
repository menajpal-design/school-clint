'use client';

import { useEffect, useMemo, useState } from 'react';
import { Edit, Plus, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api } from '@/lib/api';

type Item = { _id: string; name?: string };
type TeacherRole = 'teacher' | 'subject_teacher' | 'class_teacher';
type TeacherRecord = { _id?: string; employeeId?: string; designation?: string; department?: string; salary?: number; joiningDate?: string; qualification?: string; userId?: { _id?: string; name?: string; email?: string; username?: string; phone?: string; avatar?: string; role?: string }; assignedClasses?: Item[]; subjects?: Item[] };
type TeacherForm = { name: string; email: string; phone: string; employeeId: string; role: TeacherRole; classTeacherClassId: string; designation: string; department: string; assignedClasses: string[]; subjects: string[]; salary: string; joiningDate: string; qualification: string; experience: string; gender: string; autoIdCard: boolean; sendAppointmentLetter: boolean };

const emptyForm: TeacherForm = { name: '', email: '', phone: '', employeeId: '', role: 'subject_teacher', classTeacherClassId: '', designation: 'Teacher', department: '', assignedClasses: [], subjects: [], salary: '', joiningDate: new Date().toISOString().slice(0, 10), qualification: '', experience: '0', gender: '', autoIdCard: true, sendAppointmentLetter: false };
const teacherRoles = ['teacher', 'subject_teacher', 'class_teacher'];
const roleTitle = (role?: string) => role === 'class_teacher' ? 'Class Teacher' : role === 'subject_teacher' ? 'Subject Teacher' : 'Teacher';
const roleFromTeacher = (teacher: TeacherRecord): TeacherRole => teacher.userId?.role === 'class_teacher' || /class teacher/i.test(teacher.designation || '') ? 'class_teacher' : teacher.userId?.role === 'teacher' ? 'teacher' : 'subject_teacher';

export default function TeacherManagementClient() {
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [classes, setClasses] = useState<Item[]>([]);
  const [subjects, setSubjects] = useState<Item[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TeacherForm>(emptyForm);
  const [status, setStatus] = useState('');
  const classNameById = useMemo(() => new Map(classes.map((item) => [item._id, item.name || item._id])), [classes]);
  const subjectNameById = useMemo(() => new Map(subjects.map((item) => [item._id, item.name || item._id])), [subjects]);
  const classIdByName = useMemo(() => new Map(classes.map((item) => [item.name || item._id, item._id])), [classes]);
  const subjectIdByName = useMemo(() => new Map(subjects.map((item) => [item.name || item._id, item._id])), [subjects]);
  const unique = (items: string[]) => Array.from(new Set(items.filter(Boolean)));

  const loadTeachersFromUsers = async () => {
    const data: any = await api.users.getAll();
    const users = Array.isArray(data?.users) ? data.users : [];
    setTeachers(users.filter((user: any) => teacherRoles.includes(user?.role)).map((user: any, index: number) => ({ _id: `user-${user._id}`, employeeId: user.employeeId || `T-${String(index + 1).padStart(3, '0')}`, designation: roleTitle(user.role), salary: Number(user.salary || 0), joiningDate: user.createdAt, userId: { _id: user._id, name: user.name, email: user.email, username: user.username, phone: user.phone, avatar: user.avatar, role: user.role }, assignedClasses: [], subjects: [] })));
  };

  const loadTeachers = async () => {
    try {
      const data: any = await api.teachers.getAll();
      const rows = Array.isArray(data?.teachers) ? data.teachers : [];
      if (rows.length) { setTeachers(rows); setStatus(`Loaded ${rows.length} teacher records.`); return; }
      await loadTeachersFromUsers();
    } catch (error: any) { try { await loadTeachersFromUsers(); } catch { setStatus(error?.message || 'Teacher list failed.'); } }
  };
  const loadOptions = async () => {
    try {
      const [classData, subjectData]: any[] = await Promise.all([api.academic.classes.getAll(), api.academic.subjects.getAll()]);
      setClasses(classData.classes || []); setSubjects(subjectData.subjects || []);
    } catch { setClasses([]); setSubjects([]); }
  };
  useEffect(() => { loadTeachers(); loadOptions(); }, []);

  const update = (key: keyof TeacherForm, value: any) => setForm((current) => {
    const next: TeacherForm = { ...current, [key]: value };
    if (key === 'role' && value === 'class_teacher') next.designation = 'Class Teacher';
    if (key === 'classTeacherClassId') next.assignedClasses = unique([value, ...current.assignedClasses]);
    return next;
  });

  const openEdit = (teacher: TeacherRecord) => {
    const selectedClasses = (teacher.assignedClasses || []).map((item) => item._id || classIdByName.get(item.name || '') || '').filter(Boolean);
    const selectedSubjects = (teacher.subjects || []).map((item) => item._id || subjectIdByName.get(item.name || '') || '').filter(Boolean);
    const role = roleFromTeacher(teacher);
    setEditingId(teacher._id || null);
    setForm({ ...emptyForm, name: teacher.userId?.name || '', email: teacher.userId?.email || '', phone: teacher.userId?.phone || '', employeeId: teacher.employeeId || '', role, classTeacherClassId: role === 'class_teacher' ? selectedClasses[0] || '' : '', designation: teacher.designation || roleTitle(role), department: teacher.department || '', assignedClasses: selectedClasses, subjects: selectedSubjects, salary: String(teacher.salary || ''), joiningDate: teacher.joiningDate ? teacher.joiningDate.slice(0, 10) : new Date().toISOString().slice(0, 10), qualification: teacher.qualification || '', experience: '0', gender: (teacher.userId as any)?.gender || '', autoIdCard: false, sendAppointmentLetter: false });
    setOpen(true);
  };

  const submit = async () => {
    if (form.role === 'class_teacher' && !form.classTeacherClassId) { setStatus('Class Teacher হলে একটি ক্লাস নির্বাচন বাধ্যতামূলক।'); return; }
    setStatus('Saving teacher...');
    try {
      const assignedClasses = unique([...(form.classTeacherClassId ? [classNameById.get(form.classTeacherClassId) || form.classTeacherClassId] : []), ...form.assignedClasses.map((value) => classNameById.get(value) || value)]);
      const resolvedSubjects = unique(form.subjects.map((value) => subjectNameById.get(value) || value));
      const payload = { ...form, assignedClasses: assignedClasses.join(', '), subjects: resolvedSubjects.join(', ') };
      if (editingId) await api.teachers.update(editingId, payload); else await api.teachers.create(payload);
      setStatus('Teacher saved.');
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Teacher saved', message: 'Teacher role/class/subject saved.', type: 'success', duration: 4500 } }));
      setOpen(false); setForm(emptyForm); setEditingId(null); await loadTeachers();
    } catch (error: any) { setStatus(error?.message || 'Teacher API failed.'); }
  };

  return <div className="space-y-6 p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-3xl font-bold tracking-tight">শিক্ষক ব্যবস্থাপনা</h1><p className="mt-2 text-sm text-muted-foreground">Teacher, Subject Teacher এবং Class Teacher assignment।</p></div><Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button onClick={() => { setForm(emptyForm); setEditingId(null); }}><Plus className="mr-2 h-4 w-4" />শিক্ষক যুক্ত করুন</Button></DialogTrigger><TeacherDialog form={form} update={update} submit={submit} editing={!!editingId} classes={classes} subjects={subjects} /></Dialog></div><Card><CardHeader><CardTitle>শিক্ষকবৃন্দ</CardTitle><CardDescription>{teachers.length} জন শিক্ষক</CardDescription></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>নাম</TableHead><TableHead>রোল / আইডি</TableHead><TableHead>ক্লাস / বিষয়</TableHead><TableHead>বেতন</TableHead><TableHead className="text-right">অ্যাকশন</TableHead></TableRow></TableHeader><TableBody>{teachers.map((teacher) => <TableRow key={teacher._id}><TableCell><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-md border bg-muted">{teacher.userId?.avatar ? <img src={teacher.userId.avatar} alt="" className="h-full w-full object-cover" /> : <UserCog className="h-5 w-5" />}</div><div><div className="font-medium">{teacher.userId?.name || 'Teacher'}</div><div className="text-xs text-muted-foreground">{teacher.userId?.username || teacher.userId?.email || 'No username'}</div></div></div></TableCell><TableCell><div>{roleTitle(teacher.userId?.role) || teacher.designation}</div><div className="text-xs text-muted-foreground">{teacher.employeeId || 'N/A'}</div></TableCell><TableCell>{(teacher.assignedClasses || []).map((item) => item.name).join(', ') || 'বরাদ্দহীন'} · {(teacher.subjects || []).map((item) => item.name).join(', ') || 'কোনো বিষয় নেই'}</TableCell><TableCell>{Number(teacher.salary || 0).toLocaleString()}</TableCell><TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => openEdit(teacher)}><Edit className="mr-2 h-4 w-4" />সম্পাদনা</Button></TableCell></TableRow>)}{teachers.length === 0 && <TableRow><TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">কোনো শিক্ষক পাওয়া যায়নি।</TableCell></TableRow>}</TableBody></Table><p className="mt-4 text-sm text-muted-foreground">{status}</p></CardContent></Card></div>;
}

function TeacherDialog({ form, update, submit, editing, classes, subjects }: { form: TeacherForm; update: (key: keyof TeacherForm, value: any) => void; submit: () => void; editing: boolean; classes: Item[]; subjects: Item[]; }) {
  return <DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>{editing ? 'শিক্ষকের তথ্য সম্পাদনা' : 'শিক্ষক যুক্ত করুন'}</DialogTitle></DialogHeader><div className="grid max-h-[70vh] gap-4 overflow-y-auto pr-1 md:grid-cols-2"><TextInput form={form} update={update} name="name" label="নাম" /><SelectField label="লিঙ্গ (Gender)" value={form.gender} onChange={(value) => update('gender', value)} options={[{ _id: 'male', name: 'Male' }, { _id: 'female', name: 'Female' }, { _id: 'other', name: 'Other' }]} /><TextInput form={form} update={update} name="email" label="ইমেইল" type="email" /><TextInput form={form} update={update} name="phone" label="ফোন" /><TextInput form={form} update={update} name="employeeId" label="Employee ID" /><SelectField label="শিক্ষকের ধরন" value={form.role} onChange={(value) => update('role', value)} options={[{ _id: 'teacher', name: 'Teacher' }, { _id: 'subject_teacher', name: 'Subject Teacher' }, { _id: 'class_teacher', name: 'Class Teacher' }]} /><SelectField label="Class Teacher দায়িত্বপ্রাপ্ত ক্লাস" value={form.classTeacherClassId} onChange={(value) => update('classTeacherClassId', value)} options={classes} disabled={form.role !== 'class_teacher'} placeholder={form.role === 'class_teacher' ? 'ক্লাস নির্বাচন বাধ্যতামূলক' : 'শুধু Class Teacher হলে লাগবে'} /><TextInput form={form} update={update} name="designation" label="পদবী" /><TextInput form={form} update={update} name="department" label="বিভাগ" /><MultiSelectField label="ক্লাসসমূহ" options={classes} value={form.assignedClasses} onChange={(value) => update('assignedClasses', value)} /><MultiSelectField label="বিষয়সমূহ" options={subjects} value={form.subjects} onChange={(value) => update('subjects', value)} /><TextInput form={form} update={update} name="salary" label="বেতন" type="number" /><TextInput form={form} update={update} name="joiningDate" label="যোগদান" type="date" /><TextInput form={form} update={update} name="qualification" label="যোগ্যতা" /><TextInput form={form} update={update} name="experience" label="অভিজ্ঞতা" type="number" /></div><DialogFooter><Button onClick={submit}>{editing ? 'সংরক্ষণ করুন' : 'শিক্ষক তৈরি করুন'}</Button></DialogFooter></DialogContent>;
}
function TextInput({ form, update, name, label, type = 'text' }: { form: TeacherForm; update: (key: keyof TeacherForm, value: any) => void; name: keyof TeacherForm; label: string; type?: string }) { return <div className="space-y-2"><Label>{label}</Label><Input type={type} value={String(form[name] || '')} onChange={(event) => update(name, event.target.value)} /></div>; }
function SelectField({ label, value, onChange, options, disabled, placeholder = 'Select one' }: { label: string; value: string; onChange: (value: string) => void; options: Item[]; disabled?: boolean; placeholder?: string }) { return <div className="space-y-2"><Label>{label}</Label><select disabled={disabled} className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:bg-muted" value={value} onChange={(event) => onChange(event.target.value)}><option value="">{placeholder}</option>{options.map((item) => <option key={item._id} value={item._id}>{item.name || item._id}</option>)}</select></div>; }
function MultiSelectField({ label, options, value, onChange }: { label: string; options: Item[]; value: string[]; onChange: (value: string[]) => void }) { return <div className="space-y-2"><Label>{label}</Label><select multiple className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={value} onChange={(event) => onChange(Array.from(event.target.selectedOptions).map((option) => option.value))}>{options.map((item) => <option key={item._id} value={item._id}>{item.name || item._id}</option>)}</select></div>; }
