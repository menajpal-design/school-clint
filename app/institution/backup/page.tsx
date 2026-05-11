'use client';

import { useEffect, useState } from 'react';
import { Archive, DatabaseBackup, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api } from '@/lib/api';

type Backup = {
  _id?: string;
  frequency?: string;
  location?: string;
  collections?: string[];
  lastBackup?: string;
  nextBackup?: string;
  isActive?: boolean;
  createdAt?: string;
};

const collectionOptions = ['students', 'teachers', 'staff', 'users', 'attendance', 'finance', 'documents', 'idcards'];

export default function InstitutionBackupPage() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [frequency, setFrequency] = useState('daily');
  const [location, setLocation] = useState('local');
  const [collections, setCollections] = useState<string[]>(['students', 'teachers', 'staff']);
  const [status, setStatus] = useState('');

  const loadBackups = () => {
    api.backup.getAll().then((data: any) => setBackups(data.backups || [])).catch(() => setBackups([]));
  };

  useEffect(loadBackups, []);

  const toggleCollection = (name: string) => {
    setCollections((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name]);
  };

  const createBackup = async (runNow: boolean) => {
    setStatus(runNow ? 'Starting backup...' : 'Saving schedule...');
    try {
      await api.backup.create({ frequency, location, collections, runNow, time: '02:00', retentionDays: 30 });
      setStatus(runNow ? 'Backup started and history updated.' : 'Backup schedule saved.');
      loadBackups();
    } catch (error: any) {
      setStatus(error?.message || 'Backup API failed.');
    }
  };

  const restore = async (backup: Backup) => {
    if (!backup._id) return;
    setStatus('Queueing restore...');
    try {
      await api.backup.restore(backup._id);
      setStatus('Restore action queued.');
    } catch (error: any) {
      setStatus(error?.message || 'Restore API failed.');
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Backup and Restore</h1>
          <p className="mt-2 text-sm text-muted-foreground">Schedule backups, select storage targets, choose collections, and restore previous snapshots.</p>
        </div>
        <Button onClick={() => createBackup(true)}>
          <DatabaseBackup className="mr-2 h-4 w-4" />
          Backup Now
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Backup Settings</CardTitle>
            <CardDescription>Configure schedule, storage location, and data collections.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Backup Schedule</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Storage Location</Label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">Local</SelectItem>
                  <SelectItem value="google_drive">Google Drive</SelectItem>
                  <SelectItem value="dropbox">Dropbox</SelectItem>
                  <SelectItem value="ftp">FTP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Select Collections</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {collectionOptions.map((name) => (
                  <label key={name} className="flex items-center gap-2 rounded-md border p-3 text-sm capitalize">
                    <Checkbox checked={collections.includes(name)} onCheckedChange={() => toggleCollection(name)} />
                    {name}
                  </label>
                ))}
              </div>
            </div>

            <Button variant="outline" className="w-full" onClick={() => createBackup(false)}>
              <Archive className="mr-2 h-4 w-4" />
              Save Schedule
            </Button>
            <p className="text-sm text-muted-foreground">{status}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Backup History</CardTitle>
            <CardDescription>{backups.length} backup records from /api/backup.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Collections</TableHead>
                  <TableHead>Last Backup</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Restore</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backups.map((backup) => (
                  <TableRow key={backup._id}>
                    <TableCell className="capitalize">{backup.frequency || 'N/A'}</TableCell>
                    <TableCell>{(backup.location || 'local').replace('_', ' ')}</TableCell>
                    <TableCell>{(backup.collections || []).join(', ') || 'N/A'}</TableCell>
                    <TableCell>{backup.lastBackup ? new Date(backup.lastBackup).toLocaleString() : 'Pending'}</TableCell>
                    <TableCell><Badge variant={backup.isActive === false ? 'outline' : 'secondary'}>{backup.isActive === false ? 'Inactive' : 'Active'}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => restore(backup)}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Restore
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
