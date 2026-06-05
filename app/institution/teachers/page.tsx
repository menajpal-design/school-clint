'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { CreditCard, Edit, Plus, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api } from '@/lib/api';

type TeacherRecord = {
  _id?: string;
  employeeId?: string;
  designation?: string;
  department?: string;
  salary?: number;
  joiningDate?: string;
  qualification?: string;
  userId?: { _id?: string; name?: string; email?: string; username?: string; phone?: string; avatar?: string };
  assignedClasses?: { name?: string }[];
  subjects?: { name?: string }[];
};

type TeacherForm = {
  name: string;
  email: string;
  phone: string;
  employeeId: string;
  designation: string;
  department: string;
  assignedClasses: string[];
  newAssignedClasses: string;
  subjects: string[];
  newSubjects: string;
  salary: string;
  joiningDate: string;
  qualification: string;
  experience: string;
  photo: string;
  autoIdCard: boolean;
  sendAppointmentLetter: boolean;
};

const emptyForm: TeacherForm = {
  name: '',
  email: '',
  phone: '',
  employeeId: '',
  designation: 'Teacher',
  department: '',
  assignedClasses: [],
  newAssignedClasses: '',
  subjects: [],
  newSubjects: '',
  salary: '',
  joiningDate: new Date().toISOString().slice(0, 10),
  qualification: '',
  experience: '0',
  photo: '',
  autoIdCard: true,
  sendAppointmentLetter: false,
};

const teacherRoles = ['teacher', 'subject_teacher', 'class_teacher'];
const roleTitle = (role?: string) => role === 'class_teacher' ? 'Class Teacher' : role === 'subject_teacher' ? 'Subject Teacher' : 'Teacher';
const teacherRowsFromUsers = (users: any[]): TeacherRecord[] => users
  .filter((user) => teacherRoles.includes(user?.role))
  .map((user, index) => ({
    _id: `user-${user._id}`,
    employeeId: user.employeeId || `T-${String(index + 1).padStart(3, '0')}`,
    designation: roleTitle(user.role),
    department: user.department || '',
    salary: Number(user.salary || 0),
    joiningDate: user.createdAt,
    qualification: user.qualification || '',
    userId: { _id: user._id, name: user.name, email: user.email, username: user.username, phone: user.phone, avatar: user.avatar },
    assignedClasses: [],
    subjects: [],
  }));

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function InstitutionTeachersPage() {
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [classes, setClasses] = useState<{ _id: string; name?: string }[]>([]);
  const [subjects, setSubjects] = useState<{ _id: string; name?: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TeacherForm>(emptyForm);
  const [status, setStatus] = useState('');

  const nameList = (value: string) => value.split(/[\n,]/).map((item) => item.trim()).filter(Boolean);
  const unique = (items: string[]) => Array.from(new Set(items.filter(Boolean)));

  const loadTeachersFromUsers = async () => {
    const usersData: any = await api.users.getAll();
    const users = Array.isArray(usersData?.users) ? usersData.users : [];
    const teacherRows = teacherRowsFromUsers(users);
    setTeachers(teacherRows);
    setStatus(teacherRows.length ? `Loaded ${teacherRows.length} teacher accounts from /api/users.` : 'No teacher accounts found in /api/users.');
  };

  const loadTeachers = async () => {
    try {
      const data: any = await api.teachers.getAll();
      const apiTeachers = Array.isArray(data?.teachers) ? data.teachers : [];
      if (apiTeachers.length) {
        setTeachers(apiTeachers);
        setStatus(`Loaded ${apiTeachers.length} teacher records from /api/teachers.`);
        return;
      }
      await loadTeachersFromUsers();
    } catch (error: any) {
      try {
        await loadTeachersFromUsers();
      } catch (fallbackError: any) {
        setTeachers([]);
        setStatus(fallbackError?.message || error?.message || 'Teacher list failed to load.');
      }
    }
  };

  const loadAcademicOptions = () => {
    Promise.all([
      api.academic.classes.getAll() as Promise<{ classes: { _id: string; name?: string }[] }>,
      api.academic.subjects.getAll() as Promise<{ subjects: { _id: string; name?: string }[] }>,
    ])
      .then(([classData, subjectData]) => {
        setClasses(classData.classes || []);
        setSubjects(subjectData.subjects || []);
      })
      .catch(() => {
        setClasses([]);
        setSubjects([]);
      });
  };

  useEffect(() => {
    loadTeachers();
    loadAcademicOptions();
  }, []);

  const update = (key: keyof TeacherForm, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));

  const classNameById = useMemo(() => new Map(classes.map((item) => [item._id, item.name || ''])), [classes]);
  const classIdByName = useMemo(() => new Map(classes.map((item) => [item.name || '', item._id])), [classes]);
  const subjectNameById = useMemo(() => new Map(subjects.map((item) => [item._id, item.name || ''])), [subjects]);
  const subjectIdByName = useMemo(() => new Map(subjects.map((item) => [item.name || '', item._id])), [subjects]);

  const openEdit = (teacher: TeacherRecord) => {
    const selectedClasses = (teacher.assignedClasses || []).map((item) => classIdByName.get(item.name || '') || '').filter(Boolean);
    const selectedSubjects = (teacher.subjects || []).map((item) => subjectIdByName.get(item.name || '') || '').filter(Boolean);
    setEditingId(teacher._id || null);
    setForm({
      ...emptyForm,
      name: teacher.userId?.name || '',
      email: teacher.userId?.email || '',
      phone: teacher.userId?.phone || '',
      photo: teacher.userId?.avatar || '',
      employeeId: teacher.employeeId || '',
      designation: teacher.designation || '',
      department: teacher.department || '',
      assignedClasses: selectedClasses,
      newAssignedClasses: '',
      subjects: selectedSubjects,
      newSubjects: '',
      salary: String(teacher.salary || ''),
      joiningDate: teacher.joiningDate ? teacher.joiningDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
      qualification: teacher.qualification || '',
      experience: '0',
      autoIdCard: false,
      sendAppointmentLetter: false,
    });
    setOpen(true);
  };

  const submit = async () => {
    setStatus('Saving teacher...');
    try {
      const assignedClasses = unique([
        ...form.assignedClasses.map((id) => classNameById.get(id) || id),
        ...nameList(form.newAssignedClasses),
      ]);
      const resolvedSubjects = unique([
        ...form.subjects.map((id) => subjectNameById.get(id) || id),
        ...nameList(form.newSubjects),
      ]);
      const payload = { ...form, assignedClasses: assignedClasses.join(', '), subjects: resolvedSubjects.join(', ') };
      if (editingId && !editingId.startsWith('user-')) await api.teachers.update(editingId, payload);
      else if (editingId?.startsWith('user-')) await api.users.updateRole(editingId.replace(/^user-/, ''), 'subject_teacher');
      else await api.teachers.create(payload);
      setStatus('Teacher saved.');
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Teacher saved', message: 'Teacher account/profile saved successfully.', type: 'success', duration: 4500 } }));
      setOpen(false);
      setForm(emptyForm);
      setEditingId(null);
      await loadTeachers();
      loadAcademicOptions();
    } catch (error: any) {
      setStatus(error?.message || 'Teacher API failed.');
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Teacher API Error', message: error?.message || 'Teacher API failed.', type: 'error', duration: 6000 } }));
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">শিক্ষক ব্যবস্থাপনা</h1>
          <p className="mt-2 text-sm text-muted-foreground">শিক্ষক তালিকা, ক্লাস/বিষয় বরাদ্দ, বেতন, অ্যাকাউন্ট এবং আইডি কার্ড সেটআপ।</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setForm(emptyForm); setEditingId(null); }}>
              <Plus className="mr-2 h-4 w-4" />
              শিক্ষক যুক্ত করুন
            </Button>
          </DialogTrigger>
          <TeacherDialog form={form} update={update} submit={submit} editing={!!editingId} classes={classes} subjects={subjects} />
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>শিক্ষকবৃন্দ</CardTitle>
          <CardDescription>এই প্রতিষ্ঠানের জন্য {teachers.length} জন শিক্ষকের তথ্য লোড করা হয়েছে।</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>নাম</TableHead>
                <TableHead>শিক্ষক আইডি (Employee ID)</TableHead>
                <TableHead>ক্লাস / বিষয়</TableHead>
                <TableHead>বেতন</TableHead>
                <TableHead>যোগদানের তারিখ</TableHead>
                <TableHead className="text-right">অ্যাকশন</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.map((teacher) => (
                <TableRow key={teacher._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border bg-muted">
                        {teacher.userId?.avatar ? <img src={teacher.userId.avatar} alt="" className="h-full w-full object-cover" /> : <UserCog className="h-5 w-5" />}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{teacher.userId?.name || 'Teacher'}</div>
                        <div className="text-xs text-muted-foreground">{teacher.userId?.username || teacher.userId?.email || 'No username'}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{teacher.employeeId || 'N/A'}</TableCell>
                  <TableCell>{(teacher.assignedClasses || []).map((item) => item.name).join(', ') || 'বরাদ্দহীন'} · {(teacher.subjects || []).map((item) => item.name).join(', ') || 'কোনো বিষয় নেই'}</TableCell>
                  <TableCell>{Number(teacher.salary || 0).toLocaleString()}</TableCell>
                  <TableCell>{teacher.joiningDate ? new Date(teacher.joiningDate).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => openEdit(teacher)}><Edit className="mr-2 h-4 w-4" />সম্পাদনা করুন</Button></TableCell>
                </TableRow>
              ))}
              {teachers.length === 0 && (
                <TableRow><TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">কোনো শিক্ষকের তথ্য পাওয়া যায়নি।</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
          <p className="mt-4 text-sm text-muted-foreground">{status}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function TeacherDialog({ form, update, submit, editing, classes, subjects }: { form: TeacherForm; update: (key: keyof TeacherForm, value: string | boolean) => void; submit: () => void; editing: boolean; classes: { _id: string; name?: string }[]; subjects: { _id: string; name?: string }[]; }) {
  const upload = async (file?: File) => { if (file) update('photo', await fileToDataUrl(file)); };
  return (
    <DialogContent className="max-w-3xl">
      <DialogHeader><DialogTitle>{editing ? 'শিক্ষকের তথ্য সম্পাদনা' : 'শিক্ষক যুক্ত করুন'}</DialogTitle><DialogDescription>ক্লাস, বিষয়, বেতন, যোগদানের তারিখ, অ্যাকাউন্ট এবং আইডি কার্ডের সেটিংস নির্ধারণ করুন।</DialogDescription></DialogHeader>
      <div className="grid max-h-[70vh] gap-4 overflow-y-auto pr-1 md:grid-cols-2">
        <TextInput form={form} update={update} name="name" label="নাম" />
        <TextInput form={form} update={update} name="email" label="ইমেইল (ঐচ্ছিক)" type="email" placeholder="স্বয়ংক্রিয়ভাবে তৈরি করতে খালি রাখুন" />
        <TextInput form={form} update={update} name="phone" label="ফোন নম্বর" />
        <TextInput form={form} update={update} name="employeeId" label="শিক্ষক আইডি (Employee ID)" />
        <TextInput form={form} update={update} name="designation" label="পদবী" />
        <TextInput form={form} update={update} name="department" label="বিভাগ" />
        <MultiSelectField label="বরাদ্দকৃত ক্লাসসমূহ" options={classes} value={form.assignedClasses} onChange={(value) => update('assignedClasses', value as any)} placeholder="বিদ্যমান ক্লাসগুলো নির্বাচন করুন" />
        <FieldNote>উপরে বিদ্যমান ক্লাসগুলো নির্বাচন করুন, তারপর নতুন কোনো ক্লাস তৈরি করতে নিচে নাম লিখুন (কমা দিয়ে আলাদা করুন)।</FieldNote>
        <TextInput form={form} update={update} name="newAssignedClasses" label="নতুন ক্লাস" placeholder="শ্রেণী ৬, শ্রেণী ৭" />
        <MultiSelectField label="বিষয়সমূহ" options={subjects} value={form.subjects} onChange={(value) => update('subjects', value as any)} placeholder="বিদ্যমান বিষয়গুলো নির্বাচন করুন" />
        <FieldNote>উপরে বিদ্যমান বিষয়গুলো নির্বাচন করুন, তারপর নতুন কোনো বিষয় তৈরি করতে নিচে নাম লিখুন (কমা দিয়ে আলাদা করুন)।</FieldNote>
        <TextInput form={form} update={update} name="newSubjects" label="নতুন বিষয়" placeholder="বাংলা, গণিত" />
        <TextInput form={form} update={update} name="salary" label="বেতন" type="number" />
        <TextInput form={form} update={update} name="joiningDate" label="যোগদানের তারিখ" type="date" />
        <TextInput form={form} update={update} name="qualification" label="যোগ্যতা" />
        <TextInput form={form} update={update} name="experience" label="অভিজ্ঞতা (বছর)" type="number" />
        <div className="space-y-2"><Label>ছবি</Label><Input type="file" accept="image/*" onChange={(event) => upload(event.target.files?.[0])} /></div>
        <label className="flex items-center gap-3 rounded-md border p-3 text-sm"><Checkbox checked={form.autoIdCard} onCheckedChange={(value) => update('autoIdCard', Boolean(value))} /><CreditCard className="h-4 w-4" />স্বয়ংক্রিয়ভাবে অ্যাকাউন্ট ও আইডি কার্ড তৈরি করুন</label>
        {form.email && <label className="flex items-center gap-3 rounded-md border p-3 text-sm"><Checkbox checked={form.sendAppointmentLetter} onCheckedChange={(value) => update('sendAppointmentLetter', Boolean(value))} /><span>ইমেইলের মাধ্যমে নিয়োগপত্র পাঠান</span></label>}
      </div>
      <DialogFooter><Button onClick={submit}>{editing ? 'পরিবর্তন সংরক্ষণ করুন' : 'শিক্ষক তৈরি করুন'}</Button></DialogFooter>
    </DialogContent>
  );
}

function TextInput({ form, update, name, label, type = 'text', placeholder }: { form: TeacherForm; update: (key: keyof TeacherForm, value: string) => void; name: keyof TeacherForm; label: string; type?: string; placeholder?: string }) {
  return <div className="space-y-2"><Label>{label}</Label><Input type={type} placeholder={placeholder} value={String(form[name] || '')} onChange={(event) => update(name, event.target.value)} /></div>;
}
function MultiSelectField({ label, options, value, onChange, placeholder }: { label: string; options: { _id: string; name?: string }[]; value: string[]; onChange: (value: string[]) => void; placeholder: string; }) {
  return <div className="space-y-2"><Label>{label}</Label><select multiple className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={value} onChange={(event) => onChange(Array.from(event.target.selectedOptions).map((option) => option.value))}>{options.length === 0 ? <option value="">{placeholder}</option> : null}{options.map((item) => <option key={item._id} value={item._id}>{item.name || item._id}</option>)}</select></div>;
}
function FieldNote({ children }: { children: ReactNode }) { return <p className="-mt-2 text-xs text-slate-500 md:col-span-2">{children}</p>; }
