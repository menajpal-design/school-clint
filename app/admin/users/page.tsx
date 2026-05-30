'use client';

import { useEffect, useMemo, useState } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { KeyRound, Search, ShieldCheck, UserCog, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const roleHierarchy = ['super_admin', 'admin', 'head', 'assistant_head', 'class_teacher', 'subject_teacher', 'teacher', 'finance_officer', 'staff', 'student', 'parent', 'committee_member'];
const getManagedRoles = (role?: string) => {
  const index = roleHierarchy.indexOf(role || '');
  return index >= 0 ? roleHierarchy.slice(index + 1) : [];
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [role, setRole] = useState('all');
  const [institutionId, setInstitutionId] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [nextRole, setNextRole] = useState('');
  const [profile, setProfile] = useState<any>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newInstitution, setNewInstitution] = useState('');

  const load = async (prof?: any) => {
    setLoading(true);
    try {
      const params: any = {};
      if (role !== 'all') params.role = role;
      if (institutionId !== 'all') params.institutionId = institutionId;
      if (search) params.search = search;
      // If profile indicates platform admin, use admin API; otherwise use scoped users API
      const isPlatformAdmin = (prof?.role || profile?.role) === 'admin' || (prof?.role || profile?.role) === 'super_admin';
      if (isPlatformAdmin) {
        try {
          const data: any = await api.admin.users(params);
          const usersList = Array.isArray(data?.users) ? data.users : Array.isArray(data) ? data : [];
          if (usersList.length) {
            setUsers(usersList);
          } else {
            // Fallback: try scoped users endpoint in case admin API returned empty
            const scoped: any = await api.users.getAllUsers();
            setUsers(Array.isArray(scoped?.users) ? scoped.users : Array.isArray(scoped) ? scoped : []);
          }
        } catch (e) {
          // If admin API fails (permissions or other), try scoped users
          try {
            const scoped: any = await api.users.getAllUsers();
            setUsers(Array.isArray(scoped?.users) ? scoped.users : Array.isArray(scoped) ? scoped : []);
          } catch {
            setUsers([]);
          }
        }
      } else {
        const data = await api.users.getAllUsers();
        setUsers(Array.isArray(data?.users) ? data.users : Array.isArray(data) ? data : []);
      }
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.admin.schools().then((data: any) => setSchools(data.schools || [])).catch(() => setSchools([]));
    api.auth.profile()
      .then((data: any) => {
        const p = data.user || data;
        setProfile(p);
        load(p);
      })
      .catch(() => {
        setProfile(null);
        load(null);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const roleOptions = useMemo(() => getManagedRoles(profile?.role), [profile?.role]);

  const roleCounts = useMemo(() => users.reduce((acc: any, user) => ({ ...acc, [user.role]: (acc[user.role] || 0) + 1 }), {}), [users]);

  const [breakdownOpen, setBreakdownOpen] = useState(false);

  const refresh = () => load();

  const changeStatus = async (user: any, isActive: boolean) => {
    await api.users.updateStatus(user._id, isActive);
    await refresh();
  };

  const openRoleDialog = (user: any) => {
    setSelectedUser(user);
    setNextRole(roleOptions.includes(user.role) ? user.role : roleOptions[0] || '');
  };

  const saveRole = async () => {
    if (!selectedUser || !nextRole) return;
    if (!roleOptions.includes(nextRole)) return;
    await api.users.updateRole(selectedUser._id, nextRole);
    setSelectedUser(null);
    await refresh();
  };

  const resetPassword = async (user: any) => {
    const response: any = await api.users.resetPassword(user._id);
    const tempPassword = response?.temporaryPassword || 'User@123';
    window.alert(`Temporary password set for ${user.name}: ${tempPassword}`);
  };

  const openCreateDialog = () => {
    setNewName(''); setNewEmail(''); setNewPassword(''); setNewInstitution('');
    setCreateOpen(true);
  };

  const createAdmin = async () => {
    if (!newName || !newEmail || !newPassword || !newInstitution) {
      window.alert('Please fill all fields');
      return;
    }
    try {
      await api.admin.createUser({ name: newName, email: newEmail, password: newPassword, role: 'admin', institutionId: newInstitution });
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Success', message: 'Admin created', type: 'success', duration: 3000 } }));
      setCreateOpen(false);
      await refresh();
    } catch (e: any) {
      const msg = e?.message || 'Failed to create admin';
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Error', message: msg, type: 'error', duration: 6000 } }));
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">Filter platform users role-wise and school-wise, then update status, role, or password.</p>
        </div>
        <div className="flex items-center gap-2">
          {profile?.role === 'super_admin' && (
            <Button variant="secondary" onClick={openCreateDialog}><Users className="mr-2 h-4 w-4" />Create Admin</Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_220px_220px_auto]">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, phone, username, email" />
          <Select value={role} onValueChange={setRole}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">all</SelectItem>{roleOptions.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
          <Select value={institutionId} onValueChange={setInstitutionId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">all schools</SelectItem>{schools.map((school) => <SelectItem key={school._id} value={school._id}>{school.name}</SelectItem>)}</SelectContent></Select>
          <Button onClick={load} disabled={loading}><Search className="mr-2 h-4 w-4" />{loading ? 'Loading' : 'Search'}</Button>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="cursor-pointer" onClick={() => setBreakdownOpen(true)}>Total users: {String(users.length)}</Badge>
      </div>

      <Dialog open={breakdownOpen} onOpenChange={(open) => setBreakdownOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User counts by role</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {Object.keys(roleCounts).length === 0 ? (
              <div className="text-sm text-muted-foreground">No users</div>
            ) : (
              Object.entries(roleCounts).map(([name, count]) => (
                <div key={name} className="flex justify-between">
                  <div className="capitalize">{name.replace(/_/g, ' ')}</div>
                  <div>{String(count)}</div>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBreakdownOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted hover:bg-muted">
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>School</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-28 text-center text-muted-foreground">No users found.</TableCell>
              </TableRow>
            ) : users.map((user) => (
              <TableRow key={user._id}>
                <TableCell>
                  <div className="font-medium text-slate-950">{user.name}</div>
                  <div className="text-xs text-slate-500">{user.username || user.email || '-'}</div>
                </TableCell>
                <TableCell><Badge>{user.role}</Badge></TableCell>
                <TableCell>{user.institutionId?.name || '-'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch checked={user.isActive !== false} onCheckedChange={(checked) => changeStatus(user, checked)} />
                    <Badge variant="outline">{user.isActive !== false ? 'Active' : 'Inactive'}</Badge>
                  </div>
                </TableCell>
                <TableCell>{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" disabled={!roleOptions.includes(user.role)} onClick={() => openRoleDialog(user)}><UserCog className="mr-2 h-4 w-4" />Role</Button>
                    <Button size="sm" variant="outline" disabled={!roleOptions.includes(user.role)} onClick={() => resetPassword(user)}><KeyRound className="mr-2 h-4 w-4" />Reset</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Selected user: {selectedUser?.name || '-'}</div>
            <Select value={nextRole} onValueChange={setNextRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{roleOptions.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUser(null)}>Cancel</Button>
            <Button onClick={saveRole}><ShieldCheck className="mr-2 h-4 w-4" />Save Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={(open) => setCreateOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Admin</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={newName} onChange={(e) => setNewName((e.target as HTMLInputElement).value)} placeholder="Full name" />
            <Input value={newEmail} onChange={(e) => setNewEmail((e.target as HTMLInputElement).value)} placeholder="Email" />
            <Input value={newPassword} onChange={(e) => setNewPassword((e.target as HTMLInputElement).value)} placeholder="Password" />
            <Select value={newInstitution} onValueChange={setNewInstitution}><SelectTrigger><SelectValue placeholder="Select school" /></SelectTrigger><SelectContent><SelectItem value="">Choose</SelectItem>{schools.map((s) => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}</SelectContent></Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={createAdmin}><ShieldCheck className="mr-2 h-4 w-4" />Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
