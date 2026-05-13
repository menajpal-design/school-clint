'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { CreditCard, Edit, Plus, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  userId?: { name?: string; email?: string; phone?: string; avatar?: string };
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
};

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

  const loadTeachers = () => {
    api.teachers.getAll().then((data: any) => setTeachers(data.teachers || [])).catch(() => setTeachers([]));
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
      autoIdCard: false,
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
      const payload = {
        ...form,
        assignedClasses: assignedClasses.join(', '),
        subjects: resolvedSubjects.join(', '),
      };

      if (editingId) await api.teachers.update(editingId, payload);
      else await api.teachers.create(payload);
      setStatus('Teacher saved.');
      setOpen(false);
      setForm(emptyForm);
      setEditingId(null);
      loadTeachers();
      loadAcademicOptions();
    } catch (error: any) {
      setStatus(error?.message || 'Teacher API failed.');
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teacher Management</h1>
          <p className="mt-2 text-sm text-muted-foreground">Teacher list, class/subject assignment, salary, account, and ID card setup.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setForm(emptyForm); setEditingId(null); }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Teacher
            </Button>
          </DialogTrigger>
          <TeacherDialog form={form} update={update} submit={submit} editing={!!editingId} classes={classes} subjects={subjects} />
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Teachers</CardTitle>
          <CardDescription>{teachers.length} teacher records from /api/teachers.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Employee ID</TableHead>
                <TableHead>Class / Subject</TableHead>
                <TableHead>Salary</TableHead>
                <TableHead>Joining Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
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
                        <div className="text-xs text-muted-foreground">{teacher.userId?.email || 'No email'}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{teacher.employeeId || 'N/A'}</TableCell>
                  <TableCell>{(teacher.assignedClasses || []).map((item) => item.name).join(', ') || 'Unassigned'} · {(teacher.subjects || []).map((item) => item.name).join(', ') || 'No subject'}</TableCell>
                  <TableCell>{Number(teacher.salary || 0).toLocaleString()}</TableCell>
                  <TableCell>{teacher.joiningDate ? new Date(teacher.joiningDate).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(teacher)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="mt-4 text-sm text-muted-foreground">{status}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function TeacherDialog({ form, update, submit, editing, classes, subjects }: { form: TeacherForm; update: (key: keyof TeacherForm, value: string | boolean) => void; submit: () => void; editing: boolean; classes: { _id: string; name?: string }[]; subjects: { _id: string; name?: string }[]; }) {
  const upload = async (file?: File) => {
    if (file) update('photo', await fileToDataUrl(file));
  };

  return (
    <DialogContent className="max-w-3xl">
      <DialogHeader>
        <DialogTitle>{editing ? 'Edit Teacher' : 'Add Teacher'}</DialogTitle>
        <DialogDescription>Assign class, subject, salary, joining date, account, and ID card settings.</DialogDescription>
      </DialogHeader>
      <div className="grid max-h-[70vh] gap-4 overflow-y-auto pr-1 md:grid-cols-2">
        <TextInput form={form} update={update} name="name" label="Name" />
        <TextInput form={form} update={update} name="email" label="Email" type="email" />
        <TextInput form={form} update={update} name="phone" label="Phone" />
        <TextInput form={form} update={update} name="employeeId" label="Employee ID" />
        <TextInput form={form} update={update} name="designation" label="Designation" />
        <TextInput form={form} update={update} name="department" label="Department" />
        <MultiSelectField
          label="Assigned Classes"
          options={classes}
          value={form.assignedClasses}
          onChange={(value) => update('assignedClasses', value as any)}
          placeholder="Select existing classes"
        />
        <FieldNote>Choose existing classes above, then type any new class names below to create them automatically.</FieldNote>
        <TextInput form={form} update={update} name="newAssignedClasses" label="New Classes" placeholder="Class 6, Class 7" />
        <MultiSelectField
          label="Subjects"
          options={subjects}
          value={form.subjects}
          onChange={(value) => update('subjects', value as any)}
          placeholder="Select existing subjects"
        />
        <FieldNote>Choose existing subjects above, then type any new subject names below to create them automatically.</FieldNote>
        <TextInput form={form} update={update} name="newSubjects" label="New Subjects" placeholder="Bangla, Math" />
        <TextInput form={form} update={update} name="salary" label="Salary" type="number" />
        <TextInput form={form} update={update} name="joiningDate" label="Joining Date" type="date" />
        <TextInput form={form} update={update} name="qualification" label="Qualification" />
        <TextInput form={form} update={update} name="experience" label="Experience" type="number" />
        <div className="space-y-2">
          <Label>Photo</Label>
          <Input type="file" accept="image/*" onChange={(event) => upload(event.target.files?.[0])} />
        </div>
        <label className="flex items-center gap-3 rounded-md border p-3 text-sm">
          <Checkbox checked={form.autoIdCard} onCheckedChange={(value) => update('autoIdCard', Boolean(value))} />
          <CreditCard className="h-4 w-4" />
          Auto generate account and ID card
        </label>
      </div>
      <DialogFooter>
        <Button onClick={submit}>{editing ? 'Save Changes' : 'Create Teacher'}</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function TextInput({ form, update, name, label, type = 'text', placeholder }: { form: TeacherForm; update: (key: keyof TeacherForm, value: string) => void; name: keyof TeacherForm; label: string; type?: string; placeholder?: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type={type} placeholder={placeholder} value={String(form[name] || '')} onChange={(event) => update(name, event.target.value)} />
    </div>
  );
}

function MultiSelectField({
  label,
  options,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  options: { _id: string; name?: string }[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <select
        multiple
        className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        value={value}
        onChange={(event) => onChange(Array.from(event.target.selectedOptions).map((option) => option.value))}
      >
        {options.length === 0 ? <option value="">{placeholder}</option> : null}
        {options.map((item) => (
          <option key={item._id} value={item._id}>
            {item.name || item._id}
          </option>
        ))}
      </select>
    </div>
  );
}

function FieldNote({ children }: { children: ReactNode }) {
  return <p className="-mt-2 text-xs text-slate-500 md:col-span-2">{children}</p>;
}
