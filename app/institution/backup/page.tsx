'use client';

import { useEffect, useState, useRef } from 'react';
import { Archive, DatabaseBackup, RotateCcw, Download, Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

const collectionOptions = [
  { name: 'students', label: 'Students', color: 'bg-blue-500' },
  { name: 'teachers', label: 'Teachers', color: 'bg-green-500' },
  { name: 'staff', label: 'Staff', color: 'bg-purple-500' },
  { name: 'users', label: 'Users', color: 'bg-orange-500' },
  { name: 'attendance', label: 'Attendance', color: 'bg-red-500' },
  { name: 'finance', label: 'Finance', color: 'bg-indigo-500' },
  { name: 'documents', label: 'Documents', color: 'bg-pink-500' },
  { name: 'idcards', label: 'ID Cards', color: 'bg-teal-500' },
  { name: 'notices', label: 'Notices', color: 'bg-yellow-500' },
  { name: 'classes', label: 'Classes', color: 'bg-cyan-500' },
  { name: 'subjects', label: 'Subjects', color: 'bg-lime-500' },
  { name: 'exams', label: 'Exams', color: 'bg-emerald-500' },
  { name: 'results', label: 'Results', color: 'bg-violet-500' },
];

export default function InstitutionBackupPage() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [frequency, setFrequency] = useState('daily');
  const [location, setLocation] = useState('local');
  const [collections, setCollections] = useState<string[]>(['students', 'teachers', 'staff']);
  const [status, setStatus] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const exportData = async () => {
    setIsExporting(true);
    setStatus('Exporting data...');
    try {
      const response = await api.backup.export(collections);
      const blob = new Blob([response as BlobPart], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatus('Data exported successfully!');
    } catch (error: any) {
      setStatus(error?.message || 'Export failed.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportProgress(0);
    setStatus('Reading file...');

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      setImportProgress(25);
      setStatus('Importing data...');

      const response = await api.backup.import(data) as { results: any };
      setImportResults(response.results);
      setImportProgress(100);
      setStatus('Import completed successfully!');
    } catch (error: any) {
      setStatus(error?.message || 'Import failed.');
    } finally {
      setIsImporting(false);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-red-100 p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-orange-600 to-red-600 shadow-lg">
            <DatabaseBackup className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900">Backup & Restore</h1>
          <p className="mt-2 text-lg text-slate-600">Secure your institution&apos;s data with professional backup solutions</p>
        </div>

        {status && (
          <div className={`rounded-lg border-2 p-4 ${status.includes('success') ? 'border-green-200 bg-green-50' : status.includes('failed') ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50'}`}>
            <div className="flex items-center gap-3">
              {status.includes('success') ? <CheckCircle className="h-5 w-5 text-green-600" /> : status.includes('failed') ? <AlertCircle className="h-5 w-5 text-red-600" /> : <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />}
              <p className={`text-sm font-medium ${status.includes('success') ? 'text-green-800' : status.includes('failed') ? 'text-red-800' : 'text-blue-800'}`}>
                {status}
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Backup Settings */}
          <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-red-50 shadow-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-orange-500 p-3 text-white shadow-lg">
                  <Archive className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-slate-900">Backup Settings</CardTitle>
                  <CardDescription className="text-slate-600">Configure automatic backups</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Backup Schedule</Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger className="border-border bg-card/80 backdrop-blur-sm focus:border-orange-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Storage Location</Label>
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger className="border-border bg-card/80 backdrop-blur-sm focus:border-orange-500\">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">Local</SelectItem>
                    <SelectItem value="google_drive">Google Drive</SelectItem>
                    <SelectItem value="dropbox">Dropbox</SelectItem>
                    <SelectItem value="ftp">FTP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold text-slate-700">Select Collections</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {collectionOptions.map((option) => (
                    <label key={option.name} className="flex items-center gap-2 rounded-lg border border-border bg-card/60 p-3 text-sm capitalize shadow-sm backdrop-blur-sm transition-colors hover:bg-card/80">
                      <Checkbox
                        checked={collections.includes(option.name)}
                        onCheckedChange={() => toggleCollection(option.name)}
                        className="border-slate-300"
                      />
                      <div className={`h-3 w-3 rounded-full ${option.color}`}></div>
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full border-orange-300 bg-card/80 text-orange-700 hover:bg-orange-50"
                  onClick={() => createBackup(false)}
                >
                  <Archive className="mr-2 h-4 w-4" />
                  Save Schedule
                </Button>
                <Button
                  className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:opacity-90 text-white shadow-lg"
                  onClick={() => createBackup(true)}
                >
                  <DatabaseBackup className="mr-2 h-4 w-4" />
                  Backup Now
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Export/Import */}
          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-green-500 p-3 text-white shadow-lg">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-slate-900">Data Transfer</CardTitle>
                  <CardDescription className="text-slate-600">Export and import your data</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Button
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:opacity-90 text-white shadow-lg"
                  onClick={exportData}
                  disabled={isExporting}
                >
                  {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                  {isExporting ? 'Exporting...' : 'Export Data'}
                </Button>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Import Data</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileImport}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    className="w-full border-green-300 bg-card/80 text-green-700 hover:bg-green-50\"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                  >
                    {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    {isImporting ? 'Importing...' : 'Import Data'}
                  </Button>
                </div>

                {isImporting && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">Import Progress</Label>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full transition-all duration-300" style={{ width: `${importProgress}%` }}></div>
                    </div>
                  </div>
                )}

                {importResults && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">Import Results</Label>
                    <div className="rounded-lg border border-border bg-card/60 p-3 text-sm">
                      {Object.entries(importResults).map(([collection, result]: [string, any]) => (
                        <div key={collection} className="flex justify-between capitalize">
                          <span>{collection}:</span>
                          <span className="text-green-600">{result.imported} imported</span>
                          <span className="text-orange-600">{result.skipped} skipped</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Backup History */}
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-xl lg:col-span-1">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-500 p-3 text-white shadow-lg">
                  <RotateCcw className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-slate-900">Backup History</CardTitle>
                  <CardDescription className="text-slate-600">{backups.length} backup records</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {backups.map((backup) => (
                  <div key={backup._id} className="rounded-lg border border-border bg-card/60 p-4 shadow-sm backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-slate-900 capitalize">{backup.frequency}</span>
                      <Badge variant={backup.isActive === false ? 'outline' : 'secondary'} className={backup.isActive === false ? 'border-slate-300' : 'bg-blue-100 text-blue-800'}>
                        {backup.isActive === false ? 'Inactive' : 'Active'}
                      </Badge>
                    </div>
                    <div className="text-sm text-slate-600 space-y-1">
                      <div>Location: {(backup.location || 'local').replace('_', ' ')}</div>
                      <div>Collections: {(backup.collections || []).join(', ') || 'N/A'}</div>
                      <div>Last: {backup.lastBackup ? new Date(backup.lastBackup).toLocaleString() : 'Pending'}</div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-3 w-full text-blue-700 hover:bg-blue-50"
                      onClick={() => restore(backup)}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Restore
                    </Button>
                  </div>
                ))}
                {backups.length === 0 && (
                  <div className="text-center text-slate-500 py-8">
                    <DatabaseBackup className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>No backup history yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
