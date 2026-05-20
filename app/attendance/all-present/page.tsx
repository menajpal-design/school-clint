'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Barcode, Camera, CheckCircle2, Keyboard, QrCode, ScanLine, Users } from 'lucide-react';
import { WebcamScanner } from '@/components/id-cards/WebcamScanner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/useToast';
import { apiClient } from '@/lib/api';

type PersonKind = 'student' | 'teacher' | 'head' | 'assistant_head' | 'staff' | 'all_staff';
type ScanMode = 'camera' | 'barcode' | 'qr' | 'manual';

type PersonRow = {
  _id: string;
  name: string;
  role: string;
  code: string;
  className: string;
  sectionName: string;
  userType: 'student' | 'teacher' | 'staff';
  studentId?: string;
  userId?: string;
  status?: 'present' | 'pending' | 'error';
};

type ScanLog = {
  code: string;
  name: string;
  className: string;
  sectionName: string;
  time: string;
  status: 'success' | 'error';
  message: string;
};

const today = () => new Date().toISOString().slice(0, 10);
const staffRoles = ['head', 'assistant_head', 'teacher', 'class_teacher', 'subject_teacher', 'staff', 'finance_officer'];
const teacherRoles = ['teacher', 'class_teacher', 'subject_teacher'];
const toUserType = (role: string): 'teacher' | 'staff' => teacherRoles.includes(role) || ['head', 'assistant_head'].includes(role) ? 'teacher' : 'staff';

export default function AllPresentScannerPage() {
  const { addToast } = useToast();
  const [date, setDate] = useState(today());
  const [code, setCode] = useState('');
  const [scanMode, setScanMode] = useState<ScanMode>('camera');
  const [personKind, setPersonKind] = useState<PersonKind>('student');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingPeople, setLoadingPeople] = useState(false);
  const [people, setPeople] = useState<PersonRow[]>([]);
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const lastCodeRef = useRef<{ code: string; time: number } | null>(null);

  const successCount = useMemo(() => logs.filter((item) => item.status === 'success').length, [logs]);
  const errorCount = useMemo(() => logs.filter((item) => item.status === 'error').length, [logs]);
  const visiblePeople = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return people;
    return people.filter((person) => [person.name, person.role, person.code, person.className, person.sectionName].join(' ').toLowerCase().includes(q));
  }, [people, search]);

  const addLog = (log: ScanLog) => setLogs((current) => [log, ...current].slice(0, 50));

  const loadPeople = async () => {
    setLoadingPeople(true);
    try {
      if (personKind === 'student') {
        const data: any = await apiClient.get('/attendance/people', { params: { personType: 'student' } });
        setPeople((data.people || []).map((student: any) => ({
          _id: student._id,
          studentId: student._id,
          name: student.userId?.name || 'Student',
          role: 'student',
          code: student.idCardNumber || student.rollNumber || student._id,
          className: student.classId?.name || '-',
          sectionName: student.sectionId?.name || '-',
          userType: 'student',
        })));
        return;
      }

      const data: any = await apiClient.get('/users/all');
      const roles = personKind === 'all_staff'
        ? staffRoles
        : personKind === 'teacher'
          ? teacherRoles
          : [personKind];
      setPeople((data.users || [])
        .filter((user: any) => roles.includes(user.role) && user.isActive !== false)
        .map((user: any) => ({
          _id: user._id,
          userId: user._id,
          name: user.name || user.email || user.username || 'User',
          role: user.role,
          code: user.username || user.email || user.phone || user._id,
          className: user.role,
          sectionName: '-',
          userType: toUserType(user.role),
        })));
    } catch (error: any) {
      addToast({ title: 'Load failed', message: error?.message || 'Failed to load people list.', type: 'error', duration: 3500 });
    } finally {
      setLoadingPeople(false);
    }
  };

  useEffect(() => {
    loadPeople().catch(() => undefined);
  }, [personKind]);

  const markPresent = async (rawCode: string, mode: ScanMode = scanMode) => {
    const cleanCode = rawCode.trim();
    if (!cleanCode) return;

    const now = Date.now();
    if (lastCodeRef.current?.code === cleanCode && now - lastCodeRef.current.time < 2000) return;
    lastCodeRef.current = { code: cleanCode, time: now };

    setSaving(true);
    try {
      const data: any = await apiClient.post('/attendance/scan-present', { code: cleanCode, date, scanMode: mode });
      const student = data.student || {};
      const name = student.userId?.name || 'Student';
      const className = student.classId?.name || '-';
      const sectionName = student.sectionId?.name || '-';
      const message = data.message || `${name} marked present.`;
      addToast({ title: 'Present marked', message, type: 'success', duration: 2500 });
      addLog({ code: cleanCode, name, className, sectionName, time: new Date().toLocaleTimeString(), status: 'success', message });
      setCode('');
      setPeople((current) => current.map((person) => person.code === cleanCode ? { ...person, status: 'present' } : person));
    } catch (error: any) {
      const message = error?.message || 'Scan failed.';
      addToast({ title: 'Scan failed', message, type: 'error', duration: 3500 });
      addLog({ code: cleanCode, name: '-', className: '-', sectionName: '-', time: new Date().toLocaleTimeString(), status: 'error', message });
    } finally {
      setSaving(false);
    }
  };

  const markRowPresent = async (person: PersonRow) => {
    setSaving(true);
    try {
      const payload: any = {
        date,
        status: 'present',
        notes: 'Present from All Present route',
        userType: person.userType,
      };
      if (person.userType === 'student') {
        payload.studentId = person.studentId || person._id;
      } else {
        payload.userId = person.userId || person._id;
      }
      await apiClient.post('/attendance/mark', payload);
      setPeople((current) => current.map((item) => item._id === person._id ? { ...item, status: 'present' } : item));
      const message = `${person.name} present marked.`;
      addToast({ title: 'Present marked', message, type: 'success', duration: 2500 });
      addLog({ code: person.code, name: person.name, className: person.className, sectionName: person.sectionName, time: new Date().toLocaleTimeString(), status: 'success', message });
    } catch (error: any) {
      const message = error?.message || 'Failed to mark present.';
      setPeople((current) => current.map((item) => item._id === person._id ? { ...item, status: 'error' } : item));
      addToast({ title: 'Present failed', message, type: 'error', duration: 3500 });
      addLog({ code: person.code, name: person.name, className: person.className, sectionName: person.sectionName, time: new Date().toLocaleTimeString(), status: 'error', message });
    } finally {
      setSaving(false);
    }
  };

  const markAllVisible = async () => {
    for (const person of visiblePeople) {
      // eslint-disable-next-line no-await-in-loop
      await markRowPresent(person);
    }
  };

  const submitManual = () => markPresent(code, scanMode === 'camera' ? 'manual' : scanMode);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Present Scanner</h1>
          <p className="mt-1 text-sm text-muted-foreground">Student, teacher, Head, Assistant Head এবং staff—সবাইকে scanner বা table button দিয়ে present দেওয়া যাবে।</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="default">Present: {successCount}</Badge>
          <Badge variant="secondary">Failed: {errorCount}</Badge>
          <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="w-40" />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ScanLine className="h-5 w-5" />QR / Barcode / Camera Scanner</CardTitle>
            <CardDescription>USB/Bluetooth barcode scanner input box-এ focus রাখলেই Enter দিয়ে auto present হবে।</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-4">
              <Button variant={scanMode === 'camera' ? 'default' : 'outline'} onClick={() => setScanMode('camera')}><Camera className="mr-2 h-4 w-4" />Camera</Button>
              <Button variant={scanMode === 'qr' ? 'default' : 'outline'} onClick={() => setScanMode('qr')}><QrCode className="mr-2 h-4 w-4" />QR</Button>
              <Button variant={scanMode === 'barcode' ? 'default' : 'outline'} onClick={() => setScanMode('barcode')}><Barcode className="mr-2 h-4 w-4" />Barcode</Button>
              <Button variant={scanMode === 'manual' ? 'default' : 'outline'} onClick={() => setScanMode('manual')}><Keyboard className="mr-2 h-4 w-4" />Manual</Button>
            </div>

            {scanMode === 'camera' ? (
              <WebcamScanner onScan={(scannedCode) => markPresent(scannedCode, 'camera')} enabled />
            ) : (
              <div className="rounded-xl border bg-card p-4">
                <label className="text-sm font-semibold">QR / Barcode / ID card code</label>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <Input value={code} onChange={(event) => setCode(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') submitManual(); }} autoFocus placeholder="Scan barcode/QR or type card code then press Enter" />
                  <Button onClick={submitManual} disabled={saving || !code.trim()}><CheckCircle2 className="mr-2 h-4 w-4" />Present</Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Barcode scanner usually works like keyboard. Scan করলে code লিখে Enter পাঠাবে, তখন automatic present হবে।</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scan Result Log</CardTitle>
            <CardDescription>Latest 50 scan result এখানে দেখা যাবে।</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[560px] space-y-3 overflow-auto">
            {logs.map((log, index) => (
              <div key={`${log.code}-${log.time}-${index}`} className="rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between gap-2"><div className="font-semibold">{log.name}</div><Badge variant={log.status === 'success' ? 'default' : 'destructive'}>{log.status}</Badge></div>
                <div className="mt-1 text-xs text-muted-foreground">Code: {log.code}</div>
                <div className="text-xs text-muted-foreground">Group: {log.className} · {log.sectionName}</div>
                <div className="text-xs text-muted-foreground">{log.time} · {log.message}</div>
              </div>
            ))}
            {!logs.length && <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No scan yet.</div>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />All Present Table</CardTitle>
          <CardDescription>প্রত্যেক row-তে Present button আছে। চাইলে visible list একসাথে present দিতে পারবেন।</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 md:grid-cols-[220px_1fr_auto_auto]">
            <Select value={personKind} onValueChange={(value) => setPersonKind(value as PersonKind)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Students</SelectItem>
                <SelectItem value="teacher">Teachers</SelectItem>
                <SelectItem value="head">Head</SelectItem>
                <SelectItem value="assistant_head">Assistant Head</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="all_staff">All Teacher/Head/Staff</SelectItem>
              </SelectContent>
            </Select>
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, role, code, class..." />
            <Button variant="outline" onClick={loadPeople} disabled={loadingPeople}>{loadingPeople ? 'Loading...' : 'Reload'}</Button>
            <Button onClick={markAllVisible} disabled={saving || !visiblePeople.length}>Mark all visible present</Button>
          </div>

          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Code</th>
                  <th className="p-3">Class / Group</th>
                  <th className="p-3">Section</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Present</th>
                </tr>
              </thead>
              <tbody>
                {visiblePeople.map((person) => (
                  <tr key={person._id} className="border-t hover:bg-muted/30">
                    <td className="p-3 font-medium">{person.name}</td>
                    <td className="p-3"><Badge variant="outline">{person.role}</Badge></td>
                    <td className="p-3 text-muted-foreground">{person.code}</td>
                    <td className="p-3">{person.className}</td>
                    <td className="p-3">{person.sectionName}</td>
                    <td className="p-3">{person.status === 'present' ? <Badge>Present</Badge> : person.status === 'error' ? <Badge variant="destructive">Error</Badge> : <Badge variant="secondary">Pending</Badge>}</td>
                    <td className="p-3 text-right"><Button size="sm" onClick={() => markRowPresent(person)} disabled={saving}><CheckCircle2 className="mr-2 h-4 w-4" />Present</Button></td>
                  </tr>
                ))}
                {!visiblePeople.length && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No people found.</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
