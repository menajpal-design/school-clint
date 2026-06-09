'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Fingerprint, RefreshCw, Save, Search, Trash2, Users } from 'lucide-react';
import ResponsiveTable from '@/components/shared/ResponsiveTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/useToast';
import { apiClient } from '@/lib/api';

type PersonType = 'student' | 'teacher' | 'staff' | 'employees';

type PersonRow = {
  _id: string;
  personId?: string;
  personType?: 'student' | 'teacher' | 'staff' | 'user';
  userType?: 'student' | 'teacher' | 'staff';
  userId?: any;
  userIdValue?: string;
  name?: string;
  role?: string;
  rollNumber?: string;
  employeeId?: string;
  designation?: string;
  department?: string;
  classId?: any;
  sectionId?: any;
  fingerprintId?: string;
  biometricId?: string;
};

const getName = (person: PersonRow) => person.userId?.name || person.name || 'Unnamed';
const getRole = (person: PersonRow) => person.role || person.userId?.role || person.personType || '-';
const getCode = (person: PersonRow) => person.rollNumber || person.employeeId || person.userId?.username || person.userId?.phone || person._id;
const getClassGroup = (person: PersonRow) => person.classId?.name || person.designation || person.department || '-';
const getSection = (person: PersonRow) => person.sectionId?.name || '-';
const getFingerprint = (person: PersonRow) => person.fingerprintId || person.biometricId || person.userId?.fingerprintId || person.userId?.biometricId || '';

export default function AddFingerprintPage() {
  const { addToast } = useToast();
  const [personType, setPersonType] = useState<PersonType>('student');
  const [people, setPeople] = useState<PersonRow[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<PersonRow | null>(null);
  const [fingerprintId, setFingerprintId] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const visiblePeople = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return people;
    return people.filter((person) => [getName(person), getRole(person), getCode(person), getClassGroup(person), getSection(person), getFingerprint(person)].join(' ').toLowerCase().includes(q));
  }, [people, search]);

  const registeredCount = useMemo(() => people.filter((person) => getFingerprint(person)).length, [people]);

  const loadPeople = useCallback(async () => {
    setLoading(true);
    try {
      const data: any = await apiClient.get('/attendance/fingerprint/people', { params: { personType } });
      setPeople(data.people || []);
      setSelected(null);
      setFingerprintId('');
    } catch (error: any) {
      addToast({ title: 'Load failed', message: error?.message || 'Failed to load people.', type: 'error', duration: 3500 });
    } finally {
      setLoading(false);
    }
  }, [addToast, personType]);

  useEffect(() => {
    loadPeople().catch(() => undefined);
  }, [loadPeople]);

  const choosePerson = (person: PersonRow) => {
    setSelected(person);
    setFingerprintId(getFingerprint(person));
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const saveFingerprint = async () => {
    const clean = fingerprintId.trim();
    if (!selected || !clean) return;
    setSaving(true);
    try {
      await apiClient.post('/attendance/fingerprint/register', {
        personType: selected.personType || (personType === 'employees' ? selected.userType || 'staff' : personType),
        personId: selected.personId || selected._id,
        fingerprintId: clean,
        biometricId: clean,
      });
      addToast({ title: 'Fingerprint saved', message: `${getName(selected)} fingerprint registered.`, type: 'success', duration: 2500 });
      await loadPeople();
    } catch (error: any) {
      addToast({ title: 'Save failed', message: error?.message || 'Failed to save fingerprint.', type: 'error', duration: 4000 });
    } finally {
      setSaving(false);
    }
  };

  const removeFingerprint = async (person: PersonRow) => {
    setSaving(true);
    try {
      await apiClient.delete(`/attendance/fingerprint/${person.personType || personType}/${person.personId || person._id}`);
      addToast({ title: 'Fingerprint removed', message: `${getName(person)} fingerprint removed.`, type: 'success', duration: 2500 });
      await loadPeople();
    } catch (error: any) {
      addToast({ title: 'Remove failed', message: error?.message || 'Failed to remove fingerprint.', type: 'error', duration: 3500 });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Fingerprint</h1>
          <p className="mt-1 text-sm text-muted-foreground">Student, teacher বা staff-এর fingerprint/biometric device ID register করুন। Fingerprint scanner keyboard mode হলে input box-এ scan করলেই code বসবে।</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">People: {people.length}</Badge>
          <Badge variant="default">Registered: {registeredCount}</Badge>
          <Button variant="outline" onClick={loadPeople} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Fingerprint className="h-5 w-5" />Register Fingerprint</CardTitle>
            <CardDescription>প্রথমে একজন person select করুন, তারপর scanner দিয়ে fingerprint ID scan/type করে save করুন।</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Person Type</label>
              <Select value={personType} onValueChange={(value) => setPersonType(value as PersonType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Students</SelectItem>
                  <SelectItem value="teacher">Teachers</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="employees">All Employees</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-xl border bg-muted/40 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold"><Users className="h-4 w-4" />Selected Person</div>
              {selected ? (
                <div className="mt-3 space-y-1 text-sm">
                  <p className="font-semibold">{getName(selected)}</p>
                  <p className="text-muted-foreground">{getRole(selected)} · {getCode(selected)}</p>
                  <p className="text-muted-foreground">{getClassGroup(selected)} {getSection(selected) !== '-' ? `· ${getSection(selected)}` : ''}</p>
                </div>
              ) : <p className="mt-3 text-sm text-muted-foreground">Table থেকে Select চাপুন।</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Fingerprint / Biometric ID</label>
              <Input ref={inputRef} value={fingerprintId} onChange={(event) => setFingerprintId(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') saveFingerprint(); }} placeholder="Scanner output বা device user ID লিখুন" />
              <p className="text-xs text-muted-foreground">USB fingerprint device যদি keyboard/HID mode হয়, scan করলে এখানে code বসবে। SDK-based device হলে আগে vendor app/agent থেকে unique ID নিতে হবে।</p>
            </div>

            <Button className="w-full" onClick={saveFingerprint} disabled={saving || !selected || !fingerprintId.trim()}><Save className="mr-2 h-4 w-4" />Save Fingerprint</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>People List</CardTitle>
            <CardDescription>যার fingerprint add/update করতে চান তাকে select করুন।</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, roll, employee, role, fingerprint..." className="pl-9" />
            </div>

            <ResponsiveTable
              columns={[
                { key: 'name', label: 'Name' },
                { key: 'role', label: 'Role' },
                { key: 'code', label: 'Code' },
                { key: 'class', label: 'Class / Group' },
                { key: 'fingerprint', label: 'Fingerprint ID' },
                { key: 'actions', label: 'Actions' },
              ]}
              data={visiblePeople.map((person) => ({
                name: <div><p className="font-medium">{getName(person)}</p><p className="text-xs text-muted-foreground">{getSection(person)}</p></div>,
                role: getRole(person),
                code: getCode(person),
                class: getClassGroup(person),
                fingerprint: getFingerprint(person) ? <Badge variant="default">{getFingerprint(person)}</Badge> : <Badge variant="secondary">Not added</Badge>,
                actions: <div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => choosePerson(person)}>Select</Button><Button size="sm" variant="outline" disabled={!getFingerprint(person) || saving} onClick={() => removeFingerprint(person)}><Trash2 className="mr-1 h-3 w-3" />Remove</Button></div>,
              }))}
              emptyMessage={loading ? 'Loading...' : 'No people found.'}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
