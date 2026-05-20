'use client';

import { useMemo, useRef, useState } from 'react';
import { Barcode, Camera, CheckCircle2, Keyboard, QrCode, ScanLine } from 'lucide-react';
import { WebcamScanner } from '@/components/id-cards/WebcamScanner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/useToast';
import { apiClient } from '@/lib/api';

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

export default function AllPresentScannerPage() {
  const { addToast } = useToast();
  const [date, setDate] = useState(today());
  const [code, setCode] = useState('');
  const [scanMode, setScanMode] = useState<'camera' | 'barcode' | 'qr' | 'manual'>('camera');
  const [saving, setSaving] = useState(false);
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const lastCodeRef = useRef<{ code: string; time: number } | null>(null);

  const successCount = useMemo(() => logs.filter((item) => item.status === 'success').length, [logs]);
  const errorCount = useMemo(() => logs.filter((item) => item.status === 'error').length, [logs]);

  const addLog = (log: ScanLog) => setLogs((current) => [log, ...current].slice(0, 50));

  const markPresent = async (rawCode: string, mode: 'camera' | 'barcode' | 'qr' | 'manual' = scanMode) => {
    const cleanCode = rawCode.trim();
    if (!cleanCode) return;

    const now = Date.now();
    if (lastCodeRef.current?.code === cleanCode && now - lastCodeRef.current.time < 2000) return;
    lastCodeRef.current = { code: cleanCode, time: now };

    setSaving(true);
    try {
      const data: any = await apiClient.post('/attendance/scan-present', {
        code: cleanCode,
        date,
        scanMode: mode,
      });
      const student = data.student || {};
      const name = student.userId?.name || 'Student';
      const className = student.classId?.name || '-';
      const sectionName = student.sectionId?.name || '-';
      const message = data.message || `${name} marked present.`;
      addToast({ title: 'Present marked', message, type: 'success', duration: 2500 });
      addLog({ code: cleanCode, name, className, sectionName, time: new Date().toLocaleTimeString(), status: 'success', message });
      setCode('');
    } catch (error: any) {
      const message = error?.message || 'Scan failed.';
      addToast({ title: 'Scan failed', message, type: 'error', duration: 3500 });
      addLog({ code: cleanCode, name: '-', className: '-', sectionName: '-', time: new Date().toLocaleTimeString(), status: 'error', message });
    } finally {
      setSaving(false);
    }
  };

  const submitManual = () => markPresent(code, scanMode === 'camera' ? 'manual' : scanMode);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Present Scanner</h1>
          <p className="mt-1 text-sm text-muted-foreground">QR code, barcode scanner, manual code, or device camera দিয়ে যেকোনো class-এর student scan করলেই present হবে।</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="default">Present: {successCount}</Badge>
          <Badge variant="secondary">Failed: {errorCount}</Badge>
          <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="w-40" />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ScanLine className="h-5 w-5" />Scanner Panel</CardTitle>
            <CardDescription>USB/Bluetooth barcode scanner input box-এ focus রাখলেই Enter দিয়ে auto present হবে। Camera scanner-এ code detect/manual paste করলেও present হবে।</CardDescription>
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
                  <Input
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') submitManual();
                    }}
                    autoFocus
                    placeholder="Scan barcode/QR or type card code then press Enter"
                  />
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
          <CardContent className="space-y-3">
            {logs.map((log, index) => (
              <div key={`${log.code}-${log.time}-${index}`} className="rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold">{log.name}</div>
                  <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>{log.status}</Badge>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">Code: {log.code}</div>
                <div className="text-xs text-muted-foreground">Class: {log.className} · Section: {log.sectionName}</div>
                <div className="text-xs text-muted-foreground">{log.time} · {log.message}</div>
              </div>
            ))}
            {!logs.length && <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No scan yet.</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
