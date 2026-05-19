'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { CreditCard, Loader2, LogOut } from 'lucide-react';
import { api } from '@/lib/api';
import { authManager } from '@/lib/auth';
import { useAuth } from '@/hooks/useAuth';
import { calculatePlanDue, getPlanByCode } from '@/lib/plans';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

declare global {
  interface Window {
    GatewayWidget?: {
      open: (options: {
        amount: number;
        callback?: string;
        onComplete?: (result: any) => void;
      }) => void;
    };
  }
}

const paymentWidgetUrl = process.env.NEXT_PUBLIC_PAYMENT_WIDGET_URL || 'https://your-gateway.example.com/widget.js';

type BillingInfo = {
  planCode: string;
  billingCycle: 'monthly' | 'yearly';
  useEasySchoolStorage: boolean;
};

type PopupPaymentResult = {
  paymentGateway?: string;
  paymentReference?: string;
  customerReference?: string;
  receivedAmount: number;
};

export default function BillingPage() {
  const router = useRouter();
  const { user: authUser, isLoading: authLoading } = useAuth();
  const [institution, setInstitution] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [isWidgetReady, setIsWidgetReady] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [billingInfo, setBillingInfo] = useState<BillingInfo>({
    planCode: 'students_100',
    billingCycle: 'monthly',
    useEasySchoolStorage: true,
  });

  const logout = () => {
    authManager.clear();
    router.replace('/login');
  };

  useEffect(() => {
    const user = authUser || authManager.getUser();
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!['head', 'admin', 'super_admin'].includes(user.role)) {
      setLoading(false);
      return;
    }
    api.institution.profile()
      .then((data: any) => {
        const item = data.institution || {};
        const billing = item.billing || {};
        setInstitution(item);
        setBillingInfo({
          planCode: billing.planCode || 'students_100',
          billingCycle: billing.billingCycle === 'yearly' ? 'yearly' : 'monthly',
          useEasySchoolStorage: billing.useEasySchoolStorage !== false,
        });
      })
      .finally(() => setLoading(false));
  }, [router, authUser]);

  const due = useMemo(
    () => calculatePlanDue(billingInfo.planCode, billingInfo.billingCycle, billingInfo.useEasySchoolStorage),
    [billingInfo]
  );

  const plan = getPlanByCode(billingInfo.planCode);

  const submitPopupPayment = async (payment: PopupPaymentResult) => {
    setStatus('Submitting popup payment...');
    setIsPaying(true);
    try {
      const popupAmount = Number(payment.receivedAmount || 0);
      if (!popupAmount || popupAmount !== Number(due.total)) {
        setStatus(`Payment amount mismatch. Required amount is ${formatCurrency(due.total)}.`);
        return;
      }

      const response = await api.institution.recordPayment({
        ...billingInfo,
        paymentGateway: payment.paymentGateway || 'popup',
        paymentTrxId: payment.paymentReference || '',
        paymentSenderNumber: payment.customerReference || '',
        receivedAmount: popupAmount,
      }) as any;
      setInstitution(response.institution);
      setStatus(response.message || 'Popup payment submitted successfully.');
    } catch (error: any) {
      setStatus(error?.message || 'Popup payment submit failed.');
    } finally {
      setIsPaying(false);
    }
  };

  const openPopupPayment = () => {
    if (typeof window === 'undefined' || !window.GatewayWidget?.open) {
      setStatus('Payment popup is not loaded yet. Please try again.');
      return;
    }

    const callbackUrl = `${window.location.origin}${window.location.pathname}`;
    setStatus('Opening popup payment...');
    window.GatewayWidget.open({
      amount: due.total,
      callback: callbackUrl,
      onComplete: (result: any) => {
        const receivedAmount = Number(result?.amount ?? result?.paidAmount ?? due.total);
        const payment: PopupPaymentResult = {
          paymentGateway: result?.gateway || result?.paymentGateway || 'popup',
          paymentReference: result?.trxId || result?.transactionId || result?.trx_id || '',
          customerReference: result?.senderNumber || result?.mobileNumber || result?.phone || '',
          receivedAmount,
        };

        setStatus(result?.message || 'Popup payment completed. Saving payment details...');
        void submitPopupPayment(payment);
      },
    });
  };

  if (loading || authLoading) {
    return <main className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="h-6 w-6 animate-spin" /></main>;
  }

  const user = authUser || authManager.getUser();
  if (user && !['head', 'admin', 'super_admin'].includes(user.role)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6 text-center">
        <div className="space-y-4">
          <p className="text-xl font-semibold">Contact the institution head.</p>
          <Button variant="outline" onClick={logout}><LogOut className="mr-2 h-4 w-4" />Logout</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background p-4 sm:p-8">
      <Script
        id="payment-widget"
        src={paymentWidgetUrl}
        strategy="afterInteractive"
        onLoad={() => setIsWidgetReady(true)}
        onError={() => setStatus('Payment popup failed to load. Check NEXT_PUBLIC_PAYMENT_WIDGET_URL.')}
      />
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Billing Required</h1>
            <p className="mt-2 text-sm text-slate-600">এই page-এ কোনো manual form নেই। Pay with Popup চাপলে payment popup খুলবে, সেখানে প্রয়োজনীয় তথ্য দেওয়া হবে।</p>
          </div>
          <Button variant="outline" onClick={logout}><LogOut className="mr-2 h-4 w-4" />Logout</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Pay School Bill</CardTitle>
            <CardDescription>Registration bill এবং monthly bill শুধু hosted popup payment দিয়ে pay হবে।</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border bg-card p-4">
                <div className="text-sm text-slate-500">Plan</div>
                <div className="mt-1 font-semibold">{plan.name}</div>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <div className="text-sm text-slate-500">Billing Cycle</div>
                <div className="mt-1 font-semibold capitalize">{billingInfo.billingCycle}</div>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <div className="text-sm text-slate-500">Storage</div>
                <div className="mt-1 font-semibold">{billingInfo.useEasySchoolStorage ? `EASY SCHOOL storage - ${formatCurrency(100)}/month` : 'Own MongoDB + ImgBB - no cost'}</div>
              </div>
            </div>

            <div className="rounded-lg border bg-slate-50 p-4 text-sm">
              Due amount: {formatCurrency(due.baseAmount)} + storage {formatCurrency(due.storageAmount)} = <span className="font-semibold">{formatCurrency(due.total)}</span>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600">{status}</p>
              <Button onClick={openPopupPayment} disabled={!isWidgetReady || isPaying} className="w-full sm:w-auto">
                {isPaying ? 'Saving...' : 'Pay with Popup'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{institution?.name || 'School'}</CardTitle>
            <CardDescription>Current billing status</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm md:grid-cols-3">
            <div className="rounded-md border p-3"><span className="text-slate-500">Status</span><div className="font-semibold">{institution?.isActive ? 'Active' : 'Pending / Inactive'}</div></div>
            <div className="rounded-md border p-3"><span className="text-slate-500">Billing</span><div className="font-semibold">{institution?.billing?.billingStatus || 'pending'}</div></div>
            <div className="rounded-md border p-3"><span className="text-slate-500">Paid</span><div className="font-semibold">{formatCurrency(Number(institution?.billing?.receivedAmount || 0))}</div></div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
