'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, CreditCard, Globe2, ImagePlus, Loader2, Save, Server, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import RoleGuard from '@/components/RoleGuard';
import { calculatePlanDue, schoolPlans } from '@/lib/plans';
import { formatCurrency } from '@/lib/utils';
import { uploadInstitutionImage, deleteImage, resolveImageUrl } from '@/lib/imageUpload';

const profileSchema = z.object({
  name: z.string().min(2, 'Institution name is required'),
  eiin: z.string().optional(),
  type: z.enum(['school', 'madrasah']),
  address: z.string().min(5, 'Address is required'),
  phone: z.string().min(5, 'Phone is required'),
  email: z.string().email('Valid email is required'),
  website: z.string().optional(),
  subdomain: z.string().optional(),
  domainsText: z.string().optional(),
  mongodbUri: z.string().optional(),
  imgbbApiKey: z.string().optional().describe('legacy — kept for backward compat, not used for new uploads'),
  smsEnabled: z.boolean().default(true),
  smsProvider: z.string().optional(),
  smsApiUrl: z.string().optional(),
  smsApiKey: z.string().optional(),
  activeAcademicYear: z.string().optional(),
  academicYearsText: z.string().optional(),
  logo: z.string().optional(),
  seal: z.string().optional(),
  headSignature: z.string().optional(),
  planCode: z.string().optional(),
  billingCycle: z.enum(['monthly', 'yearly']).default('monthly'),
  useEasySchoolStorage: z.boolean().default(true),
  isPaymentReceived: z.boolean().default(false),
  receivedAmount: z.string().optional(),
  paymentGateway: z.string().optional(),
  paymentTrxId: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

// No longer used — images upload directly to GridFS via the server
const _unused_fileToDataUrl = null;

const getMainDomainLink = (sub: string) => {
  if (typeof window === 'undefined') return `https://${sub}.easyschool.live`;
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port ? `:${window.location.port}` : '';
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//${sub}.localhost${port}`;
  }
  const envMainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || '';
  if (envMainDomain) {
    return `${protocol}//${sub}.${envMainDomain}`;
  }
  if (hostname.endsWith('easyschool.live')) {
    return `${protocol}//${sub}.easyschool.live`;
  }
  const parts = hostname.split('.');
  const domain = parts.length >= 2 ? parts.slice(-2).join('.') : hostname;
  return `${protocol}//${sub}.${domain}`;
};

export default function InstitutionProfilePage() {
  const [status, setStatus] = useState('');
  const [uploadingAsset, setUploadingAsset] = useState<string | null>(null);
  const [subdomainAvailability, setSubdomainAvailability] = useState<string | null>(null);
  const [savedSubdomain, setSavedSubdomain] = useState<string | null>(null);
  const slugify = (input?: string) => String(input || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      eiin: '',
      type: 'school',
      address: '',
      phone: '',
      email: '',
      website: '',
      subdomain: '',
      domainsText: '',
      mongodbUri: '',
      imgbbApiKey: '',
      smsEnabled: true,
      smsProvider: 'anoncify',
      smsApiUrl: '',
      smsApiKey: '',
      activeAcademicYear: '',
      academicYearsText: '',
      logo: '',
      seal: '',
      headSignature: '',
      planCode: 'students_100',
      billingCycle: 'monthly',
      useEasySchoolStorage: true,
      isPaymentReceived: false,
      receivedAmount: '',
      paymentGateway: 'bkash',
      paymentTrxId: '',
    },
  });

  useEffect(() => {
    api.institution.profile()
      .then((data: any) => {
        const institution = data.institution || {};
        const billing = institution.billing || {};
        if (institution.subdomain) {
          setSavedSubdomain(institution.subdomain);
        }
        form.reset({
          name: institution.name || '',
          eiin: institution.eiin || '',
          type: institution.type || 'school',
          address: institution.address || '',
          phone: institution.phone || '',
          email: institution.email || '',
          website: institution.website || '',
          subdomain: institution.subdomain || '',
          domainsText: (institution.domains || []).join('\n'),
          mongodbUri: institution.settings?.mongodbUri || '',
          imgbbApiKey: institution.settings?.imgbbApiKey || '',
          smsEnabled: institution.settings?.smsEnabled !== false,
          smsProvider: institution.settings?.smsProvider || 'anoncify',
          smsApiUrl: institution.settings?.smsApiUrl || '',
          smsApiKey: institution.settings?.smsApiKey || '',
          activeAcademicYear: institution.settings?.activeAcademicYear || '',
          academicYearsText: (institution.settings?.academicYears || [])
            .map((item: any) => [item.year, item.mongodbUri, item.imgbbApiKey].filter(Boolean).join(' | '))
            .join('\n'),
          logo: institution.logo || '',
          seal: institution.seal || '',
          headSignature: institution.headSignature || '',
          planCode: billing.planCode || 'students_100',
          billingCycle: billing.billingCycle || 'monthly',
          useEasySchoolStorage: billing.useEasySchoolStorage !== false,
          isPaymentReceived: billing.isPaymentReceived === true,
          receivedAmount: billing.receivedAmount ? String(billing.receivedAmount) : '',
          paymentGateway: billing.paymentGateway || 'bkash',
          paymentTrxId: billing.paymentTrxId || '',
        });
      })
      .catch(() => setStatus('Profile endpoint is ready, but no profile was returned yet.'));
  }, [form]);

  const values = form.watch();
  const billingDue = useMemo(
    () => calculatePlanDue(values.planCode, values.billingCycle, values.useEasySchoolStorage),
    [values.planCode, values.billingCycle, values.useEasySchoolStorage]
  );
  const assets = useMemo(
    () => [
      { name: 'logo' as const, label: 'Logo', value: values.logo },
      { name: 'seal' as const, label: 'Seal', value: values.seal },
      { name: 'headSignature' as const, label: 'প্রধান শিক্ষকের স্বাক্ষর', value: values.headSignature },
    ],
    [values.logo, values.seal, values.headSignature]
  );

  // Upload logo/seal/headSignature directly to GridFS
  const onUpload = async (field: keyof Pick<ProfileFormValues, 'logo' | 'seal' | 'headSignature'>, file?: File) => {
    if (!file) return;
    setUploadingAsset(field);
    try {
      const result = await uploadInstitutionImage(file, field);
      form.setValue(field, result.url, { shouldDirty: true });
    } catch (err: any) {
      setStatus(err?.message || 'Image upload failed');
    } finally {
      setUploadingAsset(null);
    }
  };

  // Delete institution image from GridFS
  const onDeleteAsset = async (field: keyof Pick<ProfileFormValues, 'logo' | 'seal' | 'headSignature'>) => {
    const currentUrl = form.getValues(field);
    if (!currentUrl) return;
    setUploadingAsset(field);
    try {
      // Try server-side delete (removes from institution + GridFS)
      await api.institution.deleteImage(field).catch(() => {
        // fallback: try direct image delete
        if (currentUrl) deleteImage(currentUrl).catch(() => undefined);
      });
      form.setValue(field, '', { shouldDirty: true });
    } catch (err: any) {
      setStatus(err?.message || 'Image delete failed');
    } finally {
      setUploadingAsset(null);
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    setStatus('Saving...');
    try {
      const academicYears = String(data.academicYearsText || '')
        .split('\n')
        .map((line) => {
          const [year, mongodbUri, imgbbApiKey] = line.split('|').map((part) => part.trim());
          return year ? { year, mongodbUri, imgbbApiKey, isActive: year === data.activeAcademicYear } : null;
        })
        .filter(Boolean);
      await api.institution.updateProfile({
        name: data.name,
        subdomain: data.subdomain,
        eiin: data.eiin,
        type: data.type,
        address: data.address,
        phone: data.phone,
        email: data.email,
        website: data.website,
        domains: String(data.domainsText || '').split('\n').map((item) => item.trim()).filter(Boolean),
        logo: data.logo,
        seal: data.seal,
        headSignature: data.headSignature,
        billing: {
          planCode: data.planCode,
          billingCycle: data.billingCycle,
          useEasySchoolStorage: data.useEasySchoolStorage,
          isPaymentReceived: data.isPaymentReceived,
          receivedAmount: Number(data.receivedAmount || 0),
          paymentGateway: data.paymentGateway,
          paymentTrxId: data.paymentTrxId,
        },
        settings: {
          mongodbUri: data.mongodbUri,
          imgbbApiKey: data.imgbbApiKey,
          smsEnabled: data.smsEnabled,
          smsProvider: data.smsProvider,
          smsApiUrl: data.smsApiUrl,
          smsApiKey: data.smsApiKey,
          activeAcademicYear: data.activeAcademicYear,
          academicYears,
        },
      });
      if (data.subdomain) {
        setSavedSubdomain(data.subdomain);
      }
      setStatus('Institution profile saved.');
    } catch (error: any) {
      setStatus(error?.message || 'Profile API placeholder is ready, but saving failed.');
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">প্রতিষ্ঠান প্রোফাইল</h1>
        <p className="mt-2 text-sm text-muted-foreground">পরিচয়, যোগাযোগের বিবরণ এবং অফিশিয়াল অ্যাসেট সম্পাদনা করুন।</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>প্রোফাইলের বিবরণ</CardTitle>
            <CardDescription>এই বিবরণগুলো ভর্তি, রিপোর্ট, কার্ড এবং সার্টিফিকেটে ব্যবহৃত হয়।</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>প্রতিষ্ঠানের নাম</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="eiin" render={({ field }) => (
                    <FormItem>
                      <FormLabel>EIIN</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="school">School</SelectItem>
                          <SelectItem value="madrasah">Madrasah</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input type="email" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="website" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl><Input placeholder="https://www.easyschool.live" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="subdomain" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subdomain</FormLabel>
                      <FormControl>
                        <Input
                           placeholder="my-school"
                           disabled={!!savedSubdomain}
                           {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {savedSubdomain
                          ? 'Your subdomain is locked and cannot be changed.'
                          : 'Enter a subdomain in lowercase (letters, numbers, hyphens). It will be set as subdomain.MAIN_DOMAIN.'}
                      </FormDescription>
                      <div className="mt-2 flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={!!savedSubdomain}
                          onClick={() => {
                            const name = form.getValues('name') || values.name || '';
                            const slug = slugify(name || field.value || '');
                            form.setValue('subdomain', slug, { shouldDirty: true });
                            setSubdomainAvailability(null);
                          }}
                        >
                          Generate
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          disabled={!!savedSubdomain}
                          onClick={async () => {
                            const value = String(form.getValues('subdomain') || field.value || '').trim();
                            if (!value) { setSubdomainAvailability('Enter a subdomain first'); return; }
                            setSubdomainAvailability('Checking...');
                            try {
                              const res: any = await api.institution.checkSubdomain(value);
                              setSubdomainAvailability(res?.available ? 'Available' : 'Not available');
                            } catch (err) {
                              setSubdomainAvailability('Check failed');
                            }
                          }}
                        >
                          Check
                        </Button>
                        {subdomainAvailability ? <div className="text-sm text-muted-foreground">{subdomainAvailability}</div> : null}
                      </div>
                      {field.value && (
                        <div className="mt-2 text-xs">
                          <span className="text-muted-foreground font-medium">আপনার সাইটের লিঙ্ক: </span>
                          <a
                            href={getMainDomainLink(field.value)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline font-semibold transition-colors duration-150 inline-flex items-center gap-1"
                          >
                            {getMainDomainLink(field.value)}
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>ঠিকানা</FormLabel>
                      <FormControl><Textarea {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="border-dashed">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base"><Globe2 className="h-4 w-4" /> ডোমেনসমূহ</CardTitle>
                      <CardDescription>প্রতি লাইনে একটি করে ডোমেন দিন। পাবলিক রেজাল্ট দেখার পেজটি এই ডোমেনগুলো থেকে ডাটা খুঁজে বের করতে পারবে।</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <FormField control={form.control} name="domainsText" render={({ field }) => (
                        <FormItem>
                          <FormControl><Textarea rows={4} placeholder={'school.example.com\nwww.school.example.com'} {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </CardContent>
                  </Card>
                  <Card className="border-dashed">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base"><Server className="h-4 w-4" /> স্টোরেজ</CardTitle>
                      <CardDescription>ছবিগুলো মঙ্গোডিবি গ্রিডএফএস (GridFS)-এ সংরক্ষিত হয়। আলাদা স্টোরেজের জন্য স্কুল প্রতি একটি মঙ্গোডিবি ইউআরআই সেট করুন।</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <FormField control={form.control} name="mongodbUri" render={({ field }) => (
                        <FormItem><FormLabel>MongoDB URI (ঐচ্ছিক)</FormLabel><FormControl><Input type="password" placeholder="mongodb+srv://..." {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <div className="rounded-md border bg-blue-50 border-blue-200 p-3 text-xs text-blue-800">
                        ✅ ছবিগুলো এখন <strong>MongoDB GridFS</strong> — কোনো এক্সটার্নাল এপিআই কি প্রয়োজন নেই।
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <RoleGuard roles={["head"]}>
                  <Card className="border-dashed">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base"><Globe2 className="h-4 w-4" /> এসএমএস সেটিংস</CardTitle>
                      <CardDescription>এসএমএস প্রোভাইডার এবং এপিআই কি কনফিগার করুন। শুধুমাত্র প্রধান শিক্ষকের জন্য দৃশ্যমান।</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <FormField control={form.control} name="smsEnabled" render={({ field }) => (
                        <FormItem>
                          <FormLabel>এসএমএস চালু করুন</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-3">
                              <Switch checked={Boolean(field.value)} onCheckedChange={(v) => field.onChange(v)} />
                              <div className="text-sm text-muted-foreground">এই প্রতিষ্ঠানের জন্য এসএমএস নোটিফিকেশন চালু/বন্ধ করুন।</div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="smsProvider" render={({ field }) => (
                        <FormItem>
                          <FormLabel>প্রোভাইডার</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="smsApiUrl" render={({ field }) => (
                        <FormItem>
                          <FormLabel>এপিআই ইউআরএল</FormLabel>
                          <FormControl><Input placeholder="https://anoncify.xyz/api/sms" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="smsApiKey" render={({ field }) => (
                        <FormItem>
                          <FormLabel>এপিআই কি</FormLabel>
                          <FormControl><Input type="password" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </CardContent>
                  </Card>
                </RoleGuard>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="border-dashed">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">শিক্ষাবর্ষের সেটিংস</CardTitle>
                      <CardDescription>প্রতি বছরের জন্য একটি করে লাইন ব্যবহার করুন: শিক্ষাবর্ষ | মঙ্গোডিবি ইউআরআই | ইমজবিবি এপিআই কি</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <FormField control={form.control} name="activeAcademicYear" render={({ field }) => (
                        <FormItem><FormLabel>সক্রিয় শিক্ষাবর্ষ</FormLabel><FormControl><Input placeholder="2026" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="academicYearsText" render={({ field }) => (
                        <FormItem><FormLabel>বছর-ভিত্তিক স্টোরেজ</FormLabel><FormControl><Textarea rows={4} placeholder={'2026 | mongodb+srv://...\n2027 | mongodb+srv://...'} {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-dashed">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base"><CreditCard className="h-4 w-4" /> বিলিং এবং অ্যাক্টিভেশন</CardTitle>
                    <CardDescription>প্রাপ্ত পেমেন্ট রেকর্ড করার পর স্কুলটি সক্রিয় করুন।</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <FormField control={form.control} name="planCode" render={({ field }) => (
                      <FormItem>
                        <FormLabel>প্ল্যান</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            {schoolPlans.map((plan) => (
                              <SelectItem key={plan.code} value={plan.code}>{plan.name} - {formatCurrency(plan.monthlyPrice)}/মাস</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="billingCycle" render={({ field }) => (
                      <FormItem>
                        <FormLabel>বিলিং চক্র</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="monthly">মাসিক</SelectItem>
                            <SelectItem value="yearly">বার্ষিক</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="useEasySchoolStorage" render={({ field }) => (
                      <FormItem>
                        <FormLabel>স্টোরেজ</FormLabel>
                        <Select onValueChange={(value) => field.onChange(value === 'true')} value={String(field.value)}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="true">EASY SCHOOL storage - {formatCurrency(100)}/মাস</SelectItem>
                            <SelectItem value="false">নিজস্ব মঙ্গোডিবি ইউআরআই এবং ইমজবিবি এপিআই - কোনো অতিরিক্ত খরচ নেই</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="rounded-md border bg-muted/40 p-4 text-sm">
                      <div className="font-medium">স্কুলের অবস্থা</div>
                      <p className="mt-1 text-muted-foreground">শুধুমাত্র প্ল্যাটফর্ম এডমিন কোনো স্কুল সক্রিয় বা স্থগিত করতে পারেন।</p>
                    </div>
                    <FormField control={form.control} name="isPaymentReceived" render={({ field }) => (
                      <FormItem>
                        <FormLabel>প্রাপ্ত পেমেন্ট</FormLabel>
                        <Select onValueChange={(value) => field.onChange(value === 'true')} value={String(field.value)}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="true">প্রাপ্ত হয়েছে</SelectItem>
                            <SelectItem value="false">প্রাপ্ত হয়নি</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="receivedAmount" render={({ field }) => (
                      <FormItem><FormLabel>প্রাপ্ত পরিমাণ</FormLabel><FormControl><Input type="number" placeholder={String(billingDue.total)} {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="paymentGateway" render={({ field }) => (
                      <FormItem><FormLabel>গেটওয়ে</FormLabel><FormControl><Input placeholder="bkash" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="paymentTrxId" render={({ field }) => (
                      <FormItem><FormLabel>TrxID</FormLabel><FormControl><Input placeholder="পেমেন্ট ট্রানজেকশন আইডি" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div className="md:col-span-2 rounded-md border bg-muted/40 p-4 text-sm">
                      প্ল্যান বকেয়া: {formatCurrency(billingDue.baseAmount)} + স্টোরেজ {formatCurrency(billingDue.storageAmount)} = <span className="font-semibold">{formatCurrency(billingDue.total)}</span>. বার্ষিক ছাড়: {billingDue.plan.yearlyDiscountPercent}%.
                    </div>
                  </CardContent>
                </Card>

                <RoleGuard roles={["head", "assistant_head"]}>
                  <Card className="border-dashed">
                    <CardHeader className="pb-3">
                      <CardTitle>সাবস্ক্রিপশন</CardTitle>
                      <CardDescription>সাবস্ক্রিপশন পরিচালনা করুন এবং সক্রিয় প্যাকেজ দেখুন।</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Button onClick={() => window.location.assign('/institution/subscription')}>সাবস্ক্রিপশন পরিচালনা করুন</Button>
                        <Button onClick={() => window.location.assign('/institution/billing')}>বিলিং ড্যাশবোর্ড</Button>
                      </div>
                    </CardContent>
                  </Card>
                </RoleGuard>

                <div className="grid gap-4 md:grid-cols-3">
                  {assets.map((asset) => (
                    <div key={asset.name} className="rounded-md border p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm font-medium">{asset.label}</span>
                        {asset.value && (
                          <button
                            type="button"
                            onClick={() => onDeleteAsset(asset.name)}
                            className="text-destructive hover:text-destructive/80 p-1"
                            title={`Remove ${asset.label}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <label className="flex h-28 cursor-pointer items-center justify-center rounded-md border border-dashed bg-muted/40 relative">
                        {uploadingAsset === asset.name ? (
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <span className="text-xs">আপলোড হচ্ছে...</span>
                          </div>
                        ) : asset.value ? (
                          <img src={resolveImageUrl(asset.value)} alt="" className="h-full w-full rounded-md object-contain p-2" />
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-muted-foreground">
                            <ImagePlus className="h-7 w-7" />
                            <span className="text-xs">আপলোড করতে ক্লিক করুন</span>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          disabled={uploadingAsset === asset.name}
                          onChange={(event) => onUpload(asset.name, event.target.files?.[0])}
                        />
                      </label>
                      <p className="mt-1 text-center text-xs text-muted-foreground">সর্বোচ্চ ৫এমবি · JPG, PNG, WebP</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">{status}</p>
                  <Button type="submit">
                    <Save className="mr-2 h-4 w-4" />
                    প্রোফাইল সংরক্ষণ করুন
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>কার্ড প্রিভিউ</CardTitle>
            <CardDescription>অফিশিয়াল হেডার ও আইডি কার্ডে কীভাবে প্রতিষ্ঠানের তথ্য দেখাবে তার প্রিভিউ।</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border bg-card p-5 text-center shadow-sm">
              <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                {values.logo ? <img src={values.logo} alt="" className="h-full w-full object-contain" /> : <Building2 className="h-8 w-8 text-primary" />}
              </div>
              <h2 className="mt-4 text-xl font-bold">{values.name || 'প্রতিষ্ঠানের নাম'}</h2>
              <p className="mt-1 text-sm text-muted-foreground">EIIN {values.eiin || 'Not set'} · {values.type === 'school' ? 'বিদ্যালয়' : values.type === 'madrasah' ? 'মাদ্রাসা' : values.type}</p>
              <p className="mt-3 text-sm">{values.address || 'ঠিকানা'}</p>
              <p className="mt-2 text-sm text-muted-foreground">{values.phone || 'ফোন নম্বর'} · {values.email || 'ইমেইল'}</p>
              <div className="mt-5 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                <div className="rounded-md border p-3">
                  {values.seal ? <img src={values.seal} alt="" className="mx-auto h-12 object-contain" /> : 'অফিশিয়াল সিল'}
                </div>
                <div className="rounded-md border p-3">
                  {values.headSignature ? <img src={values.headSignature} alt="" className="mx-auto h-12 object-contain" /> : 'প্রধান শিক্ষকের স্বাক্ষর'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
