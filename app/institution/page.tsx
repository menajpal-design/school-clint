'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Archive, Building2, GraduationCap, HardDrive, ShieldCheck, UserRoundCog, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';

type Profile = {
  name?: string;
  eiin?: string;
  type?: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
  isActive?: boolean;
  billing?: {
    planName?: string;
    dueAmount?: number;
    billingStatus?: string;
    monthlySmsLimit?: number;
    smsUsed?: number;
    subscriptionExpiresAt?: string;
  };
};

type BackupConfig = {
  _id?: string;
  frequency?: string;
  location?: string;
  collections?: string[];
  lastBackup?: string;
  nextBackup?: string;
  isActive?: boolean;
};

const quickLinks = [
  { href: '/institution/profile', label: 'Profile', icon: Building2 },
  { href: '/institution/admission', label: 'Admission', icon: GraduationCap },
  { href: '/institution/teachers', label: 'Teachers', icon: Users },
  { href: '/institution/staff', label: 'Staff', icon: UserRoundCog },
  { href: '/institution/backup', label: 'Backup', icon: Archive },
];

const countFrom = (data: any, key: string) => (Array.isArray(data?.[key]) ? data[key].length : Array.isArray(data) ? data.length : 0);

export default function InstitutionPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [students, setStudents] = useState(0);
  const [teachers, setTeachers] = useState(0);
  const [staff, setStaff] = useState(0);
  const [backups, setBackups] = useState<BackupConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.institution.profile(),
      api.students.getAll(),
      api.teachers.getAll(),
      api.staff.getAll(),
      api.backup.getAll(),
    ]).then(([profileResult, studentResult, teacherResult, staffResult, backupResult]) => {
      if (profileResult.status === 'fulfilled') setProfile((profileResult.value as any).institution || null);
      if (studentResult.status === 'fulfilled') setStudents(countFrom(studentResult.value, 'students'));
      if (teacherResult.status === 'fulfilled') setTeachers(countFrom(teacherResult.value, 'teachers'));
      if (staffResult.status === 'fulfilled') setStaff(countFrom(staffResult.value, 'staff'));
      if (backupResult.status === 'fulfilled') setBackups((backupResult.value as any).backups || []);
      setLoading(false);
    });
  }, []);

  const activeBackup = backups.find((backup) => backup.isActive !== false) || backups[0];
  const storageUsage = useMemo(() => {
    const records = students + teachers + staff + backups.length;
    const usedMb = Math.max(128, records * 4);
    const limitMb = 5120;
    return {
      used: `${usedMb.toLocaleString()} MB`,
      percent: Math.min(100, Math.round((usedMb / limitMb) * 100)),
    };
  }, [students, teachers, staff, backups.length]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-border bg-card">
              {profile?.logo ? <img src={profile.logo} alt="" className="h-full w-full object-cover" /> : <Building2 className="h-6 w-6 text-primary" />}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{profile?.name || 'Institution Overview'}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{profile?.address || 'Profile summary, people, storage, and backup health.'}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{profile?.type || 'institution'}</Badge>
            <Badge variant="outline">EIIN {profile?.eiin || 'Not set'}</Badge>
            <Badge variant="outline">{profile?.phone || 'Phone not set'}</Badge>
            <Badge variant={profile?.isActive ? 'default' : 'secondary'}>{profile?.isActive ? 'Active school' : 'Pending activation'}</Badge>
          </div>
        </div>
        <Button asChild>
          <Link href="/institution/profile">Edit Profile</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          { label: 'Total Students', value: students, icon: GraduationCap },
          { label: 'Teachers', value: teachers, icon: Users },
          { label: 'Staff', value: staff, icon: UserRoundCog },
          { label: 'Storage Usage', value: storageUsage.used, icon: HardDrive },
          { label: 'Plan', value: profile?.billing?.planName || 'Not selected', icon: ShieldCheck },
        ].map((item) => (
          <Card key={item.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.label}</CardTitle>
              <item.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : item.value}</div>
              {item.label === 'Storage Usage' && <div className="mt-3 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${storageUsage.percent}%` }} /></div>}
              {item.label === 'Plan' && <p className="mt-2 text-xs text-muted-foreground">Due BDT {Number(profile?.billing?.dueAmount || 0).toLocaleString()} · SMS {Number(profile?.billing?.smsUsed || 0).toLocaleString()}/{profile?.billing?.monthlySmsLimit || 0}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Profile Summary</CardTitle>
            <CardDescription>Core public identity and contact details.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {[
              ['Institution', profile?.name],
              ['EIIN', profile?.eiin],
              ['Type', profile?.type],
              ['Phone', profile?.phone],
              ['Email', profile?.email],
              ['Address', profile?.address],
              ['Billing Status', profile?.billing?.billingStatus || (profile?.isActive ? 'active' : 'pending')],
              ['Subscription Expiry', profile?.billing?.subscriptionExpiresAt ? new Date(profile.billing.subscriptionExpiresAt).toLocaleDateString() : 'Not active'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md border p-4">
                <div className="text-xs font-medium uppercase text-muted-foreground">{label}</div>
                <div className="mt-1 text-sm font-medium">{value || 'Not configured'}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
            <CardDescription>Jump into common institution workflows.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {quickLinks.map((link) => (
              <Button key={link.href} asChild variant="outline" className="justify-start">
                <Link href={link.href}>
                  <link.icon className="mr-2 h-4 w-4" />
                  {link.label}
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
