"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminBackupPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.auth.profile().then((data: any) => { const p = data.user || data; setProfile(p); }).catch(() => setProfile(null));
  }, []);

  if (!profile) return <div className="p-6">Loading...</div>;
  if (profile.role !== 'super_admin') return <div className="p-6">Access denied. Only super_admin allowed.</div>;

  const handleExport = async () => {
    setLoading(true); setMessage('');
    try {
      const data = await api.admin.backupExportAll();
      const content = JSON.stringify(data, null, 2);
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `easy-school-full-backup-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMessage('Export successful — download started.');
    } catch (err: any) {
      setMessage(`Export failed: ${err?.message || 'Server error'}`);
    } finally { setLoading(false); }
  };

  const handleImport = async (file?: File) => {
    if (!file) return setMessage('Please choose a JSON file to import');
    setLoading(true); setMessage('');
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      // server expects collections object
      const payload = json.collections ? json : { collections: json };
      const res = await api.admin.backupImportAll(payload);
      setMessage(`Import completed: ${JSON.stringify(res?.results || res)}`);
    } catch (err: any) {
      setMessage(`Import failed: ${err?.message || 'Invalid file or server error'}`);
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Backup & Restore" description="Export or import full application data (super_admin only)." />
      <div className="space-y-3">
        <Button onClick={handleExport} disabled={loading}>{loading ? 'Working...' : 'Export All (Download JSON)'}</Button>
        <div className="pt-2">
          <Input type="file" accept="application/json" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImport(f); }} />
        </div>
        {message && <div className="text-sm text-muted-foreground">{message}</div>}
      </div>
    </div>
  );
}
