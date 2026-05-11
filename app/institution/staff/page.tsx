'use client';

import { useEffect, useState } from 'react';
import { CreditCard, Edit, Plus, UserRoundCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api } from '@/lib/api';

type StaffRecord = {
  _id?: string;
  employeeId?: string;
  designation?: string;
  department?: string;
  salary?: number;
  joiningDate?: string;
  userId?: { name?: string; email?: string; phone?: string; avatar?: string };
};

type StaffForm = {
  name: string;
  email: string;
  phone: string;
  employeeId: string;
  designation: string;
  department: string;
  salary: string;
  joiningDate: string;
  photo: string;
  autoIdCard: boolean;
};

const emptyForm: StaffForm = {
  name: '',
  email: '',
  phone: '',
  employeeId: '',
  designation: '',
  department: '',
  salary: '',
  joiningDate: new Date().toISOString().slice(0, 10),
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

export default function InstitutionStaffPage() {
  const [staff, setStaff] = useState<StaffRecord[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<StaffForm>(emptyForm);
  const [status, setStatus] = useState('');

  const loadStaff = () => {
    api.staff.getAll().then((data: any) => setStaff(data.staff || [])).catch(() => setStaff([]));
  };

  useEffect(loadStaff, []);

  const update = (key: keyof StaffForm, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));

  const openEdit = (member: StaffRecord) => {
    setEditingId(member._id || null);
    setForm({
      ...emptyForm,
      name: member.userId?.name || '',
      email: member.userId?.email || '',
      phone: member.userId?.phone || '',
      photo: member.userId?.avatar || '',
      employeeId: member.employeeId || '',
      designation: member.designation || '',
      department: member.department || '',
      salary: String(member.salary || ''),
      joiningDate: member.joiningDate ? member.joiningDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
      autoIdCard: false,
    });
    setOpen(true);
  };

  const submit = async () => {
    setStatus('Saving staff member...');
    try {
      if (editingId) await api.staff.update(editingId, form);
      else await api.staff.create(form);
      setStatus('Staff member saved.');
      setOpen(false);
      setForm(emptyForm);
      setEditingId(null);
      loadStaff();
    } catch (error: any) {
      setStatus(error?.message || 'Staff API failed.');
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
          <p className="mt-2 text-sm text-muted-foreground">Staff table with designation, department, salary, joining date, account, and ID card setup.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setForm(emptyForm); setEditingId(null); }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Staff' : 'Add Staff'}</DialogTitle>
              <DialogDescription>Manage staff details, account creation, and ID card generation.</DialogDescription>
            </DialogHeader>
            <div className="grid max-h-[70vh] gap-4 overflow-y-auto pr-1 md:grid-cols-2">
              <TextInput form={form} update={update} name="name" label="Name" />
              <TextInput form={form} update={update} name="email" label="Email" type="email" />
              <TextInput form={form} update={update} name="phone" label="Phone" />
              <TextInput form={form} update={update} name="employeeId" label="Employee ID" />
              <TextInput form={form} update={update} name="designation" label="Designation" />
              <TextInput form={form} update={update} name="department" label="Department" />
              <TextInput form={form} update={update} name="salary" label="Salary" type="number" />
              <TextInput form={form} update={update} name="joiningDate" label="Joining Date" type="date" />
              <div className="space-y-2">
                <Label>Photo</Label>
                <Input type="file" accept="image/*" onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (file) update('photo', await fileToDataUrl(file));
                }} />
              </div>
              <label className="flex items-center gap-3 rounded-md border p-3 text-sm">
                <Checkbox checked={form.autoIdCard} onCheckedChange={(value) => update('autoIdCard', Boolean(value))} />
                <CreditCard className="h-4 w-4" />
                Auto generate account and ID card
              </label>
            </div>
            <DialogFooter>
              <Button onClick={submit}>{editingId ? 'Save Changes' : 'Create Staff'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff</CardTitle>
          <CardDescription>{staff.length} staff records from /api/staff.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Salary</TableHead>
                <TableHead>Joining Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((member) => (
                <TableRow key={member._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border bg-muted">
                        {member.userId?.avatar ? <img src={member.userId.avatar} alt="" className="h-full w-full object-cover" /> : <UserRoundCog className="h-5 w-5" />}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{member.userId?.name || 'Staff Member'}</div>
                        <div className="text-xs text-muted-foreground">{member.employeeId || 'No employee ID'}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{member.designation || 'N/A'}</TableCell>
                  <TableCell>{member.department || 'N/A'}</TableCell>
                  <TableCell>{Number(member.salary || 0).toLocaleString()}</TableCell>
                  <TableCell>{member.joiningDate ? new Date(member.joiningDate).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(member)}>
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

function TextInput({ form, update, name, label, type = 'text' }: { form: StaffForm; update: (key: keyof StaffForm, value: string) => void; name: keyof StaffForm; label: string; type?: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type={type} value={String(form[name] || '')} onChange={(event) => update(name, event.target.value)} />
    </div>
  );
}
