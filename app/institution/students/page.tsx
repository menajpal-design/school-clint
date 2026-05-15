'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { CalendarCheck, CreditCard, Edit, GraduationCap, Plus, Search, UserRound, type LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

type Option = { _id: string; name?: string; grade?: string; sections?: Option[] };

type StudentRecord = {
  _id?: string;
  rollNumber?: string;
  admissionDate?: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  address?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  isActive?: boolean;
  userId?: { name?: string; email?: string; phone?: string; avatar?: string };
  classId?: { _id?: string; name?: string; grade?: string } | string;
  sectionId?: { _id?: string; name?: string } | string;
  parentId?: { name?: string; email?: string; phone?: string };
};

type StudentForm = {
  name: string;
  email: string;
  phone: string;
  photo: string;
  rollNumber: string;
  className: string;
  sectionName: string;
  admissionDate: string;
  dateOfBirth: string;
  bloodGroup: string;
  address: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  autoParentAccount: boolean;
  autoIdCard: boolean;
  feeAmount: string;
  feeType: string;
  feeMonth: string;
  feeYear: string;
  feeWaiverType: string;
  feeWaiverAmount: string;
  feeWaiverReason: string;
};

const today = new Date().toISOString().slice(0, 10);
const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
const currentYear = String(new Date().getFullYear());

const emptyForm: StudentForm = {
  name: '',
  email: '',
  phone: '',
  photo: '',
  rollNumber: '',
  className: '',
  sectionName: 'A',
  admissionDate: today,
  dateOfBirth: '',
  bloodGroup: '',
  address: '',
  guardianName: '',
  guardianPhone: '',
  guardianEmail: '',
  autoParentAccount: true,
  autoIdCard: true,
  feeAmount: '',
  feeType: 'monthly',
  feeMonth: currentMonth,
  feeYear: currentYear,
  feeWaiverType: 'none',
  feeWaiverAmount: '',
  feeWaiverReason: '',
};

const teacherRoles = ['head', 'assistant_head', 'class_teacher', 'subject_teacher', 'teacher'];
const managerRoles = ['head', 'assistant_head', 'class_teacher', 'subject_teacher'];

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const idOf = (value?: StudentRecord['classId'] | StudentRecord['sectionId']) => (typeof value === 'string' ? value : value?._id || '');
const nameOf = (value?: StudentRecord['classId'] | StudentRecord['sectionId']) => (typeof value === 'string' ? value : value?.name || '');

export default function InstitutionStudentsPage() {
  const { user, isLoading } = useAuth();
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [classes, setClasses] = useState<Option[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<StudentForm>(emptyForm);
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const canView = !user || teacherRoles.includes(user.role);
  const canManage = !!user && managerRoles.includes(user.role);

  const loadStudents = () => {
    setLoading(true);
    api.students.getAll()
      .then((data: any) => setStudents(data.students || []))
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  };

  const loadClasses = () => {
    api.academic.classes.getAll()
      .then((data: any) => setClasses(data.classes || []))
      .catch(() => setClasses([]));
  };

  useEffect(() => {
    loadStudents();
    loadClasses();
  }, []);

  const update = (key: keyof StudentForm, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));

  const selectedSections = useMemo(() => classes.find((item) => item._id === classFilter || item.name === form.className)?.sections || [], [classes, classFilter, form.className]);
  const studentClassOptions = useMemo(() => {
    const map = new Map<string, Option>();
    students.forEach((student) => {
      const classId = idOf(student.classId);
      if (classId && !map.has(classId)) map.set(classId, { _id: classId, name: nameOf(student.classId) || classId, sections: [] });
      const sectionId = idOf(student.sectionId);
      if (classId && sectionId) {
        const classItem = map.get(classId);
        if (classItem && !classItem.sections?.some((section) => section._id === sectionId)) {
          classItem.sections = [...(classItem.sections || []), { _id: sectionId, name: nameOf(student.sectionId) || sectionId }];
        }
      }
    });
    return Array.from(map.values());
  }, [students]);
  const filterClasses = classes.length ? classes : studentClassOptions;
  const sectionsForFilter = useMemo(() => filterClasses.find((item) => item._id === classFilter)?.sections || [], [classFilter, filterClasses]);

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase();
    return students.filter((student) => {
      const classId = idOf(student.classId);
      const sectionId = idOf(student.sectionId);
      const classMatch = !classFilter || classId === classFilter;
      const sectionMatch = !sectionFilter || sectionId === sectionFilter;
      const haystack = [
        student.userId?.name,
        student.userId?.email,
        student.userId?.phone,
        student.rollNumber,
        nameOf(student.classId),
        nameOf(student.sectionId),
        student.guardianName,
        student.guardianPhone,
      ].join(' ').toLowerCase();
      return classMatch && sectionMatch && (!term || haystack.includes(term));
    });
  }, [classFilter, search, sectionFilter, students]);

  const stats = useMemo(() => {
    const active = filteredStudents.filter((student) => student.isActive !== false).length;
    const guardians = new Set(filteredStudents.map((student) => student.guardianPhone).filter(Boolean));
    return { active, guardians: guardians.size, inactive: filteredStudents.length - active };
  }, [filteredStudents]);

  const resetForm = () => {
    setEditingId(null);
    setForm({ ...emptyForm, className: classes[0]?.name || '', sectionName: classes[0]?.sections?.[0]?.name || 'A' });
    setStatus('');
  };

  const openEdit = (student: StudentRecord) => {
    setEditingId(student._id || null);
    setForm({
      ...emptyForm,
      name: student.userId?.name || '',
      email: student.userId?.email || '',
      phone: student.userId?.phone || '',
      photo: student.userId?.avatar || '',
      rollNumber: student.rollNumber || '',
      className: nameOf(student.classId),
      sectionName: nameOf(student.sectionId) || 'A',
      admissionDate: student.admissionDate ? student.admissionDate.slice(0, 10) : today,
      dateOfBirth: student.dateOfBirth ? student.dateOfBirth.slice(0, 10) : '',
      bloodGroup: student.bloodGroup || '',
      address: student.address || '',
      guardianName: student.guardianName || student.parentId?.name || '',
      guardianPhone: student.guardianPhone || student.parentId?.phone || '',
      guardianEmail: student.guardianEmail || student.parentId?.email || '',
      autoIdCard: false,
      autoParentAccount: false,
    });
    setOpen(true);
  };

  const submit = async () => {
    if (!form.name.trim() || !form.rollNumber.trim() || !form.className.trim() || !form.sectionName.trim() || !form.guardianPhone.trim()) {
      setStatus('Name, roll, class, section, and guardian phone are required.');
      return;
    }

    setStatus(editingId ? 'Saving student...' : 'Admitting student...');
    try {
      const payload = {
        ...form,
        feeAmount: form.feeAmount ? Number(form.feeAmount) : undefined,
        feeYear: form.feeYear ? Number(form.feeYear) : undefined,
        feeWaiverAmount: form.feeWaiverAmount ? Number(form.feeWaiverAmount) : undefined,
      };
      if (editingId) await api.students.update(editingId, payload);
      else await api.students.create(payload);
      setStatus(editingId ? 'Student updated.' : 'Student admitted.');
      setOpen(false);
      resetForm();
      loadStudents();
      loadClasses();
    } catch (error: any) {
      setStatus(error?.message || 'Student API failed.');
    }
  };

  if (!isLoading && !canView) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Students</CardTitle>
            <CardDescription>You do not have access to student records.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Management</h1>
          <p className="mt-2 text-sm text-muted-foreground">Student list, class/section filter, admission details, guardian account, fee setup, and ID card shortcuts.</p>
        </div>
        {canManage && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Add Student
              </Button>
            </DialogTrigger>
            <StudentDialog form={form} update={update} submit={submit} editing={!!editingId} classes={classes} sections={selectedSections} />
          </Dialog>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Visible Students" value={filteredStudents.length} icon={GraduationCap} />
        <Stat label="Active Students" value={stats.active} icon={UserRound} />
        <Stat label="Guardians" value={stats.guardians} icon={CalendarCheck} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <CardTitle>Students</CardTitle>
              <CardDescription>{loading ? 'Loading records...' : `${filteredStudents.length} of ${students.length} student records from /api/students.`}</CardDescription>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[220px_180px_260px]">
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={classFilter}
                onChange={(event) => { setClassFilter(event.target.value); setSectionFilter(''); }}
              >
                <option value="">All classes</option>
                {filterClasses.map((item) => <option key={item._id} value={item._id}>{item.name || item.grade || item._id}</option>)}
              </select>
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={sectionFilter}
                onChange={(event) => setSectionFilter(event.target.value)}
                disabled={!classFilter}
              >
                <option value="">All sections</option>
                {sectionsForFilter.map((item) => <option key={item._id} value={item._id}>{item.name || item._id}</option>)}
              </select>
              <div className="relative sm:col-span-2 xl:col-span-1">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, roll, guardian" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Roll</TableHead>
                <TableHead>Class / Section</TableHead>
                <TableHead>Guardian</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border bg-muted">
                        {student.userId?.avatar ? <img src={student.userId.avatar} alt="" className="h-full w-full object-cover" /> : <GraduationCap className="h-5 w-5" />}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{student.userId?.name || 'Student'}</div>
                        <div className="text-xs text-muted-foreground">{student.userId?.email || student.userId?.phone || 'No contact'}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{student.rollNumber || 'N/A'}</TableCell>
                  <TableCell>{nameOf(student.classId) || 'Unassigned'} / {nameOf(student.sectionId) || 'No section'}</TableCell>
                  <TableCell>
                    <div className="text-sm">{student.guardianName || student.parentId?.name || 'Guardian'}</div>
                    <div className="text-xs text-muted-foreground">{student.guardianPhone || student.parentId?.phone || 'No phone'}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={student.isActive === false ? 'secondary' : 'default'}>{student.isActive === false ? 'Inactive' : 'Active'}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/academic/report-card?studentId=${student._id || ''}`}>Result</Link>
                      </Button>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/id-cards/generate?ownerType=student&ownerId=${student._id || ''}`}>
                          <CreditCard className="mr-2 h-4 w-4" />
                          ID
                        </Link>
                      </Button>
                      {canManage && (
                        <Button variant="ghost" size="sm" onClick={() => openEdit(student)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && filteredStudents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">No students match this class, section, or search.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <p className="mt-4 text-sm text-muted-foreground">{status}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: number; icon: LucideIcon }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
      </CardContent>
    </Card>
  );
}

function StudentDialog({ form, update, submit, editing, classes, sections }: { form: StudentForm; update: (key: keyof StudentForm, value: string | boolean) => void; submit: () => void; editing: boolean; classes: Option[]; sections: Option[]; }) {
  const upload = async (file?: File) => {
    if (file) update('photo', await fileToDataUrl(file));
  };

  return (
    <DialogContent className="max-w-4xl">
      <DialogHeader>
        <DialogTitle>{editing ? 'Edit Student' : 'Add Student'}</DialogTitle>
        <DialogDescription>Manage admission, class, section, guardian account, fee setup, and ID card settings.</DialogDescription>
      </DialogHeader>
      <div className="grid max-h-[70vh] gap-4 overflow-y-auto pr-1 md:grid-cols-2">
        <TextInput form={form} update={update} name="name" label="Name" />
        <TextInput form={form} update={update} name="rollNumber" label="Roll Number" />
        <TextInput form={form} update={update} name="email" label="Email (Optional)" type="email" placeholder="Leave blank to auto-generate" />
        <TextInput form={form} update={update} name="phone" label="Student Phone" />
        <SelectField label="Class" value={form.className} onChange={(value) => update('className', value)}>
          <option value="">Select class</option>
          {classes.map((item) => <option key={item._id} value={item.name || item.grade || item._id}>{item.name || item.grade || item._id}</option>)}
        </SelectField>
        <SelectField label="Section" value={form.sectionName} onChange={(value) => update('sectionName', value)}>
          <option value="">Select section</option>
          {sections.map((item) => <option key={item._id} value={item.name || item._id}>{item.name || item._id}</option>)}
          {sections.length === 0 && <option value={form.sectionName || 'A'}>{form.sectionName || 'A'}</option>}
        </SelectField>
        <TextInput form={form} update={update} name="admissionDate" label="Admission Date" type="date" />
        <TextInput form={form} update={update} name="dateOfBirth" label="Date of Birth" type="date" />
        <SelectField label="Blood Group" value={form.bloodGroup} onChange={(value) => update('bloodGroup', value)}>
          <option value="">Not set</option>
          {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((item) => <option key={item} value={item}>{item}</option>)}
        </SelectField>
        <div className="space-y-2">
          <Label>Photo</Label>
          <Input type="file" accept="image/*" onChange={(event) => upload(event.target.files?.[0])} />
        </div>
        <TextInput form={form} update={update} name="guardianName" label="Guardian Name" />
        <TextInput form={form} update={update} name="guardianPhone" label="Guardian Phone" />
        <TextInput form={form} update={update} name="guardianEmail" label="Guardian Email" type="email" />
        <TextareaField form={form} update={update} name="address" label="Address" />
        {!editing && (
          <>
            <TextInput form={form} update={update} name="feeAmount" label="Fee Amount" type="number" />
            <SelectField label="Fee Type" value={form.feeType} onChange={(value) => update('feeType', value)}>
              <option value="monthly">Monthly</option>
              <option value="admission">Admission</option>
              <option value="exam">Exam</option>
              <option value="other">Other</option>
            </SelectField>
            <TextInput form={form} update={update} name="feeMonth" label="Fee Month" />
            <TextInput form={form} update={update} name="feeYear" label="Fee Year" type="number" />
            <SelectField label="Waiver" value={form.feeWaiverType} onChange={(value) => update('feeWaiverType', value)}>
              <option value="none">None</option>
              <option value="half">Half</option>
              <option value="free">Free</option>
              <option value="partial">Partial</option>
            </SelectField>
            <TextInput form={form} update={update} name="feeWaiverAmount" label="Waiver Amount" type="number" />
            <TextareaField form={form} update={update} name="feeWaiverReason" label="Waiver Reason" />
          </>
        )}
        {!editing && (
          <label className="flex items-center gap-3 rounded-md border p-3 text-sm">
            <Checkbox checked={form.autoParentAccount} onCheckedChange={(value) => update('autoParentAccount', Boolean(value))} />
            <span>Create parent account and send credentials</span>
          </label>
        )}
        <label className="flex items-center gap-3 rounded-md border p-3 text-sm">
          <Checkbox checked={form.autoIdCard} onCheckedChange={(value) => update('autoIdCard', Boolean(value))} />
          <CreditCard className="h-4 w-4" />
          Auto generate account and ID card
        </label>
      </div>
      <DialogFooter>
        <Button onClick={submit}>{editing ? 'Save Changes' : 'Admit Student'}</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function TextInput({ form, update, name, label, type = 'text', placeholder }: { form: StudentForm; update: (key: keyof StudentForm, value: string) => void; name: keyof StudentForm; label: string; type?: string; placeholder?: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type={type} placeholder={placeholder} value={String(form[name] || '')} onChange={(event) => update(name, event.target.value)} />
    </div>
  );
}

function TextareaField({ form, update, name, label }: { form: StudentForm; update: (key: keyof StudentForm, value: string) => void; name: keyof StudentForm; label: string }) {
  return (
    <div className="space-y-2 md:col-span-2">
      <Label>{label}</Label>
      <Textarea value={String(form[name] || '')} onChange={(event) => update(name, event.target.value)} />
    </div>
  );
}

function SelectField({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
    </div>
  );
}
