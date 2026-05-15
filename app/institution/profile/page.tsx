'use client';

import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, CreditCard, Globe2, ImagePlus, Save, Server } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { calculatePlanDue, schoolPlans } from '@/lib/plans';
import { formatCurrency } from '@/lib/utils';

const profileSchema = z.object({
  name: z.string().min(2, 'Institution name is required'),
  eiin: z.string().optional(),
  type: z.enum(['school', 'madrasah']),
  address: z.string().min(5, 'Address is required'),
  phone: z.string().min(5, 'Phone is required'),
  email: z.string().email('Valid email is required'),
  website: z.string().optional(),
  domainsText: z.string().optional(),
  mongodbUri: z.string().optional(),
  imgbbApiKey: z.string().optional(),
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

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function InstitutionProfilePage() {
  const [status, setStatus] = useState('');
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
        form.reset({
          name: institution.name || '',
          eiin: institution.eiin || '',
          type: institution.type || 'school',
          address: institution.address || '',
          phone: institution.phone || '',
          email: institution.email || '',
          website: institution.website || '',
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
      { name: 'headSignature' as const, label: 'Head Signature', value: values.headSignature },
    ],
    [values.logo, values.seal, values.headSignature]
  );

  const onUpload = async (field: keyof Pick<ProfileFormValues, 'logo' | 'seal' | 'headSignature'>, file?: File) => {
    if (!file) return;
    form.setValue(field, await fileToDataUrl(file), { shouldDirty: true });
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
      setStatus('Institution profile saved.');
    } catch (error: any) {
      setStatus(error?.message || 'Profile API placeholder is ready, but saving failed.');
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Institution Profile</h1>
        <p className="mt-2 text-sm text-muted-foreground">Edit identity, contact details, and official assets.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>These details are used across admission, reports, cards, and certificates.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Institution Name</FormLabel>
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
                      <FormLabel>Phone</FormLabel>
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
                  <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Address</FormLabel>
                      <FormControl><Textarea {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="border-dashed">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base"><Globe2 className="h-4 w-4" /> Domains</CardTitle>
                      <CardDescription>One domain per line. Public result lookup can resolve school data from these domains.</CardDescription>
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
                      <CardTitle className="flex items-center gap-2 text-base"><Server className="h-4 w-4" /> Storage</CardTitle>
                      <CardDescription>Save this school&apos;s MongoDB URI and ImgBB key for institution-specific storage settings.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <FormField control={form.control} name="mongodbUri" render={({ field }) => (
                        <FormItem><FormLabel>MongoDB URI</FormLabel><FormControl><Input type="password" placeholder="mongodb+srv://..." {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="imgbbApiKey" render={({ field }) => (
                        <FormItem><FormLabel>ImgBB API Key</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="border-dashed">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Year Settings</CardTitle>
                      <CardDescription>Use one line per year: year | mongodb uri | imgbb api key</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <FormField control={form.control} name="activeAcademicYear" render={({ field }) => (
                        <FormItem><FormLabel>Active Academic Year</FormLabel><FormControl><Input placeholder="2026" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="academicYearsText" render={({ field }) => (
                        <FormItem><FormLabel>Year-wise Storage</FormLabel><FormControl><Textarea rows={4} placeholder={'2026 | mongodb+srv://... | imgbb-key\n2027 | mongodb+srv://... | imgbb-key'} {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-dashed">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base"><CreditCard className="h-4 w-4" /> Billing and Activation</CardTitle>
                    <CardDescription>Activate the school after received payment is recorded.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <FormField control={form.control} name="planCode" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plan</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            {schoolPlans.map((plan) => (
                              <SelectItem key={plan.code} value={plan.code}>{plan.name} - {formatCurrency(plan.monthlyPrice)}/mo</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="billingCycle" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Billing Cycle</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="useEasySchoolStorage" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Storage</FormLabel>
                        <Select onValueChange={(value) => field.onChange(value === 'true')} value={String(field.value)}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="true">EASY SCHOOL storage - {formatCurrency(100)}/month</SelectItem>
                            <SelectItem value="false">Own MongoDB URI and ImgBB API - no extra cost</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="rounded-md border bg-muted/40 p-4 text-sm">
                      <div className="font-medium">School Status</div>
                      <p className="mt-1 text-muted-foreground">Only platform admin can activate or suspend a school.</p>
                    </div>
                    <FormField control={form.control} name="isPaymentReceived" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Received Money</FormLabel>
                        <Select onValueChange={(value) => field.onChange(value === 'true')} value={String(field.value)}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="true">Received</SelectItem>
                            <SelectItem value="false">Not received</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="receivedAmount" render={({ field }) => (
                      <FormItem><FormLabel>Received Amount</FormLabel><FormControl><Input type="number" placeholder={String(billingDue.total)} {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="paymentGateway" render={({ field }) => (
                      <FormItem><FormLabel>Gateway</FormLabel><FormControl><Input placeholder="bkash" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="paymentTrxId" render={({ field }) => (
                      <FormItem><FormLabel>TrxID</FormLabel><FormControl><Input placeholder="Payment transaction ID" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div className="md:col-span-2 rounded-md border bg-muted/40 p-4 text-sm">
                      Plan due: {formatCurrency(billingDue.baseAmount)} + storage {formatCurrency(billingDue.storageAmount)} = <span className="font-semibold">{formatCurrency(billingDue.total)}</span>. Yearly discount: {billingDue.plan.yearlyDiscountPercent}%.
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-3">
                  {assets.map((asset) => (
                    <div key={asset.name} className="rounded-md border p-4">
                      <div className="mb-3 text-sm font-medium">{asset.label}</div>
                      <label className="flex h-28 cursor-pointer items-center justify-center rounded-md border border-dashed bg-muted/40">
                        {asset.value ? <img src={asset.value} alt="" className="h-full w-full rounded-md object-contain p-2" /> : <ImagePlus className="h-7 w-7 text-muted-foreground" />}
                        <input type="file" accept="image/*" className="sr-only" onChange={(event) => onUpload(asset.name, event.target.files?.[0])} />
                      </label>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">{status}</p>
                  <Button type="submit">
                    <Save className="mr-2 h-4 w-4" />
                    Save Profile
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preview Card</CardTitle>
            <CardDescription>How official headers and cards can identify the institution.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border bg-card p-5 text-center shadow-sm">
              <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                {values.logo ? <img src={values.logo} alt="" className="h-full w-full object-contain" /> : <Building2 className="h-8 w-8 text-primary" />}
              </div>
              <h2 className="mt-4 text-xl font-bold">{values.name || 'Institution Name'}</h2>
              <p className="mt-1 text-sm text-muted-foreground">EIIN {values.eiin || 'Not set'} · {values.type}</p>
              <p className="mt-3 text-sm">{values.address || 'Institution address'}</p>
              <p className="mt-2 text-sm text-muted-foreground">{values.phone || 'Phone'} · {values.email || 'Email'}</p>
              <div className="mt-5 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                <div className="rounded-md border p-3">
                  {values.seal ? <img src={values.seal} alt="" className="mx-auto h-12 object-contain" /> : 'Official Seal'}
                </div>
                <div className="rounded-md border p-3">
                  {values.headSignature ? <img src={values.headSignature} alt="" className="mx-auto h-12 object-contain" /> : 'Head Signature'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
