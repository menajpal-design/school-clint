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

type StaffRecord = { _id?: string; employeeId?: string; designation?: string; department?: string; salary?: number; joiningDate?: string; userId?: { _id?: string; name?: string; username?: string; email?: string; phone?: string; avatar?: string; gender?: string } };
type StaffForm = { name: string; email: string; phone: string; department: string; salary: string; joiningDate: string; photo: string; gender: string; autoIdCard: boolean };

const emptyForm: StaffForm = { name: '', email: '', phone: '', department: 'General', salary: '', joiningDate: new Date().toISOString().slice(0, 10), photo: '', gender: '', autoIdCard: true };
const toast = (title: string, message: string, type: 'success' | 'error' = 'success') => window.dispatchEvent(new CustomEvent('app-toast', { detail: { title, message, type, duration: type === 'success' ? 4500 : 6000 } }));
const userRows = (users: any[]): StaffRecord[] => users.filter((u) => u?.role === 'staff').map((u, index) => ({ _id: `user-${u._id}`, employeeId: u.employeeId || `S-${String(index + 1).padStart(3, '0')}`, designation: u.designation || 'Staff', department: u.department || 'General', salary: Number(u.salary || 0), joiningDate: u.createdAt, userId: { _id: u._id, name: u.name, username: u.username, email: u.email, phone: u.phone, avatar: u.avatar, gender: u.gender } }));
const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); });

export default function InstitutionStaffPage() {
  const [staff, setStaff] = useState<StaffRecord[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<StaffForm>(emptyForm);
  const [status, setStatus] = useState('');

  const loadFromUsers = async () => { const data: any = await api.users.getAll(); const rows = userRows(Array.isArray(data?.users) ? data.users : []); setStaff(rows); setStatus(rows.length ? `Loaded ${rows.length} staff accounts from /api/users.` : 'No staff accounts found.'); };
  const loadStaff = async () => {
    try { const data: any = await api.staff.getAll(); const rows = Array.isArray(data?.staff) ? data.staff : []; if (rows.length) { setStaff(rows); setStatus(`Loaded ${rows.length} staff records from /api/staff.`); return; } await loadFromUsers(); }
    catch (error: any) { try { await loadFromUsers(); } catch (fallback: any) { setStaff([]); setStatus(fallback?.message || error?.message || 'Staff list failed to load.'); } }
  };

  useEffect(() => { loadStaff(); }, []);
  const update = (key: keyof StaffForm, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));
  const openEdit = (member: StaffRecord) => { setEditingId(member._id || null); setForm({ ...emptyForm, name: member.userId?.name || '', email: member.userId?.email || '', phone: member.userId?.phone || '', photo: member.userId?.avatar || '', gender: member.userId?.gender || '', department: member.department || 'General', salary: String(member.salary || ''), joiningDate: member.joiningDate ? member.joiningDate.slice(0, 10) : new Date().toISOString().slice(0, 10), autoIdCard: false }); setOpen(true); };
  const submit = async () => {
    setStatus('Saving staff member...');
    try { const payload: any = { ...form }; if (!payload.email) delete payload.email; if (!editingId) { delete payload.employeeId; delete payload.designation; } if (editingId) await api.staff.update(editingId, payload); else await api.staff.create(payload); setStatus('Staff member saved.'); toast('Staff saved', 'Staff account/profile saved successfully.'); setOpen(false); setForm(emptyForm); setEditingId(null); await loadStaff(); }
    catch (error: any) { const message = error?.message || 'Staff API failed.'; setStatus(message); toast('Staff API Error', message, 'error'); }
  };

  return <div className="space-y-6 p-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-3xl font-bold tracking-tight">Staff Management</h1><p className="mt-2 text-sm text-muted-foreground">Staff table with auto employee ID, default designation, department, salary, joining date, account, and ID card setup.</p></div><Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button onClick={() => { setForm(emptyForm); setEditingId(null); }}><Plus className="mr-2 h-4 w-4" />Add Staff</Button></DialogTrigger><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{editingId ? 'Edit Staff' : 'Add Staff'}</DialogTitle><DialogDescription>Email is optional. Employee ID and designation will be generated automatically.</DialogDescription></DialogHeader><div className="grid max-h-[70vh] gap-4 overflow-y-auto pr-1 md:grid-cols-2"><TextInput form={form} update={update} name="name" label="Name" /><div className="space-y-2"><Label>Gender</Label><select className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.gender} onChange={(e) => update('gender', e.target.value)}><option value="">Select gender</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div><TextInput form={form} update={update} name="email" label="Email (Optional)" type="email" placeholder="Optional" /><TextInput form={form} update={update} name="phone" label="Phone" /><TextInput form={form} update={update} name="department" label="Department" /><TextInput form={form} update={update} name="salary" label="Salary" type="number" /><TextInput form={form} update={update} name="joiningDate" label="Joining Date" type="date" /><div className="space-y-2"><Label>Photo</Label><Input type="file" accept="image/*" onChange={async (event) => { const file = event.target.files?.[0]; if (file) update('photo', await fileToDataUrl(file)); }} /></div><label className="flex items-center gap-3 rounded-md border p-3 text-sm md:col-span-2"><Checkbox checked={form.autoIdCard} onCheckedChange={(value) => update('autoIdCard', Boolean(value))} /><CreditCard className="h-4 w-4" />Auto generate account and ID card</label></div><DialogFooter><Button onClick={submit}>{editingId ? 'Save Changes' : 'Create Staff'}</Button></DialogFooter></DialogContent></Dialog></div>
    <Card><CardHeader><CardTitle>Staff</CardTitle><CardDescription>{staff.length} staff records loaded for this institution.</CardDescription></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Employee ID</TableHead><TableHead>Designation</TableHead><TableHead>Department</TableHead><TableHead>Salary</TableHead><TableHead>Joining Date</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader><TableBody>{staff.map((member) => <TableRow key={member._id}><TableCell><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border bg-muted">{member.userId?.avatar ? <img src={member.userId.avatar} alt="" className="h-full w-full object-cover" /> : <UserRoundCog className="h-5 w-5" />}</div><div><div className="font-medium text-slate-900">{member.userId?.name || 'Staff Member'}</div><div className="text-xs text-muted-foreground">{member.userId?.username || 'No username'}</div></div></div></TableCell><TableCell>{member.employeeId || 'Auto'}</TableCell><TableCell>{member.designation || 'Staff'}</TableCell><TableCell>{member.department || 'General'}</TableCell><TableCell>{Number(member.salary || 0).toLocaleString()}</TableCell><TableCell>{member.joiningDate ? new Date(member.joiningDate).toLocaleDateString() : 'N/A'}</TableCell><TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => openEdit(member)}><Edit className="mr-2 h-4 w-4" />Edit</Button></TableCell></TableRow>)}{staff.length === 0 && <TableRow><TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">No staff records found.</TableCell></TableRow>}</TableBody></Table><p className="mt-4 text-sm text-muted-foreground">{status}</p></CardContent></Card>
  </div>;
}

function TextInput({ form, update, name, label, type = 'text', placeholder }: { form: StaffForm; update: (key: keyof StaffForm, value: string) => void; name: keyof StaffForm; label: string; type?: string; placeholder?: string }) { return <div className="space-y-2"><Label>{label}</Label><Input type={type} placeholder={placeholder} value={String(form[name] || '')} onChange={(event) => update(name, event.target.value)} /></div>; }
