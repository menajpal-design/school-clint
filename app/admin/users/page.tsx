'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const roles = ['all', 'admin', 'super_admin', 'head', 'assistant_head', 'class_teacher', 'subject_teacher', 'teacher', 'finance_officer', 'staff', 'student', 'parent', 'committee_member'];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [role, setRole] = useState('all');
  const [institutionId, setInstitutionId] = useState('all');
  const [search, setSearch] = useState('');

  const load = async () => {
    const params: any = {};
    if (role !== 'all') params.role = role;
    if (institutionId !== 'all') params.institutionId = institutionId;
    if (search) params.search = search;
    const data = await api.admin.users(params) as any;
    setUsers(data.users || []);
  };

  useEffect(() => {
    api.admin.schools().then((data: any) => setSchools(data.schools || []));
    load().catch(() => setUsers([]));
  }, []);

  const roleCounts = useMemo(() => users.reduce((acc: any, user) => ({ ...acc, [user.role]: (acc[user.role] || 0) + 1 }), {}), [users]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Manage Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">Filter platform users role-wise and school-wise.</p>
      </div>
      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_220px_220px_auto]">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, phone, username, email" />
          <Select value={role} onValueChange={setRole}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{roles.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
          <Select value={institutionId} onValueChange={setInstitutionId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">all schools</SelectItem>{schools.map((school) => <SelectItem key={school._id} value={school._id}>{school.name}</SelectItem>)}</SelectContent></Select>
          <Button onClick={load}><Search className="mr-2 h-4 w-4" />Search</Button>
        </CardContent>
      </Card>
      <div className="flex flex-wrap gap-2">
        {Object.entries(roleCounts).map(([name, count]) => <Badge key={name} variant="outline">{name}: {String(count)}</Badge>)}
      </div>
      <div className="grid gap-3">
        {users.map((user) => (
          <Card key={user._id}>
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4" />{user.name}</CardTitle></CardHeader>
            <CardContent className="grid gap-2 text-sm md:grid-cols-5">
              <div><span className="text-muted-foreground">Username</span><div className="font-medium">{user.username || '-'}</div></div>
              <div><span className="text-muted-foreground">Role</span><div><Badge>{user.role}</Badge></div></div>
              <div><span className="text-muted-foreground">School</span><div className="font-medium">{user.institutionId?.name || '-'}</div></div>
              <div><span className="text-muted-foreground">Contact</span><div>{user.phone || user.email || '-'}</div></div>
              <div><span className="text-muted-foreground">Status</span><div>{user.isActive ? 'Active' : 'Inactive'}</div></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
