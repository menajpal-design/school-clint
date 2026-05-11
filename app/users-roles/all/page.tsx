"use client";

import { useEffect, useMemo, useState } from "react";
import { KeyRound, Search, UserCog, Users } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

const roles = ["head", "assistant_head", "class_teacher", "subject_teacher", "finance_officer", "staff", "student", "parent", "committee_member"];

export default function UsersAllPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selected, setSelected] = useState<any>(null);
  const [role, setRole] = useState("");

  const load = async () => {
    const data = await api.users.getAllUsers() as any;
    setUsers(data.users || []);
  };
  useEffect(() => { load().catch(() => undefined); }, []);

  const filtered = useMemo(() => users.filter((user) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || [user.name, user.email, user.role].some((value) => String(value || "").toLowerCase().includes(q));
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  }), [roleFilter, search, users]);

  const changeStatus = async (user: any, checked: boolean) => {
    const data = await api.users.updateStatus(user._id, checked) as any;
    setUsers((current) => current.map((item) => item._id === user._id ? data.user : item));
  };

  const saveRole = async () => {
    if (!selected) return;
    const data = await api.users.updateRole(selected._id, role) as any;
    setUsers((current) => current.map((item) => item._id === selected._id ? data.user : item));
    setSelected(null);
  };

  const resetPassword = async (user: any) => {
    await api.users.resetPassword(user._id);
    window.alert(`Temporary password set for ${user.name}: User@123`);
  };

  return (
    <div className="space-y-5">
      <PageHeader title="All Users" description="Search users, update status, reset passwords and assign roles." icon={Users} />
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_240px]">
          <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email or role" /></div>
          <Select value={roleFilter} onValueChange={setRoleFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All roles</SelectItem>{roles.map((item) => <SelectItem key={item} value={item}>{item.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select>
        </div>
      </section>
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <Table><TableHeader><TableRow className="bg-slate-50 hover:bg-slate-50"><TableHead>User</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Last Login</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
          {filtered.length === 0 ? <TableRow><TableCell colSpan={5} className="h-28 text-center text-slate-500">No users found.</TableCell></TableRow> : filtered.map((user) => (
            <TableRow key={user._id}>
              <TableCell><div className="font-medium text-slate-950">{user.name}</div><div className="text-xs text-slate-500">{user.email}</div></TableCell>
              <TableCell className="capitalize">{user.role?.replace(/_/g, " ")}</TableCell>
              <TableCell><div className="flex items-center gap-2"><Switch checked={user.isActive !== false} onCheckedChange={(checked) => changeStatus(user, checked)} /><Badge variant="outline">{user.isActive !== false ? "Active" : "Inactive"}</Badge></div></TableCell>
              <TableCell>{user.lastLogin ? formatDate(user.lastLogin) : "Never"}</TableCell>
              <TableCell><div className="flex justify-end gap-2"><Button size="sm" variant="outline" onClick={() => { setSelected(user); setRole(user.role); }}><UserCog className="mr-2 h-4 w-4" />Role</Button><Button size="sm" variant="outline" onClick={() => resetPassword(user)}><KeyRound className="mr-2 h-4 w-4" />Reset</Button></div></TableCell>
            </TableRow>
          ))}
        </TableBody></Table>
      </section>
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign Role</DialogTitle></DialogHeader>
          <Select value={role} onValueChange={setRole}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{roles.map((item) => <SelectItem key={item} value={item}>{item.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select>
          <DialogFooter><Button onClick={saveRole}>Save Role</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
