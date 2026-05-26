'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { CreditCard, Loader2, LogOut } from 'lucide-react';
import { api } from '@/lib/api';
import { authManager } from '@/lib/auth';
import { useAuth } from '@/hooks/useAuth';
import { calculatePlanDue, getPlanByCode, schoolPlans } from '@/lib/plans';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChartCard } from '@/components/charts/PieChartCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

declare global {
  interface Window {
    GATEWAY_WIDGET_URL?: string;
    GatewayWidget?: {
      open: (options: {
        apiKey?: string;
        domain?: string;
        amount: number;
        callback?: string;
        orderId?: string;
        customerName?: string;
        customerPhone?: string;
        receiverNumber?: string;
        paymentMethods?: string[];
        preferredMethods?: string[];
        onComplete?: (result: any) => void;
      }) => void;
    };
  }
}

// GatewayFlow expects the widget script and checkout origin to be the gateway
// server origin, not the merchant website or client portal.
const gatewayOrigin = 'https://payment-gateway-server-ten.vercel.app';
const paymentWidgetUrl = `${gatewayOrigin}/widget.js`;
const gatewayApiKey = process.env.NEXT_PUBLIC_GATEWAY_API_KEY || 'pg_live_ebb11c91cb7d814c0949eeebbc549524fc0debe8543a9a40';
const configuredGatewayDomain = process.env.NEXT_PUBLIC_GATEWAY_DOMAIN || '';
const gatewayReceiverNumber = process.env.NEXT_PUBLIC_GATEWAY_RECEIVER_NUMBER || '';
const gatewayPaymentMethods = ['bkash', 'nagad'];
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
const stripeModeEnabled = Boolean(stripePublishableKey);

type BillingInfo = {
  planCode: string;
  billingCycle: 'monthly' | 'yearly';
  useEasySchoolStorage: boolean;
  receivedAmount: string;
  paymentGateway: string;
  paymentOrderId: string;
  paymentTime: string;
  paymentTrxId: string;
  paymentSenderNumber: string;
};

type PopupPaymentResult = {
  paymentGateway?: string;
  paymentReference?: string;
  customerReference?: string;
  orderId?: string;
  paymentOrderId?: string;
  paymentTime?: string;
  paymentTrxId?: string;
  paymentSenderNumber?: string;
  receivedAmount: number;
  rawResponse?: any;
};

const normalizePopupPaymentResult = (result: any, fallback: { orderId: string; paymentTime: string; amount: number; gateway: string; senderNumber?: string }): PopupPaymentResult => {
  const verification = result?.verification || result?.data?.verification || {};
  const payload = result?.data || result || {};

  const paymentTrxId =
    payload.transaction_id ||
    payload.payment_ref ||
    payload.transactionId ||
    payload.trxId ||
    payload.trx_id ||
    verification.transaction_id ||
    verification.payment_ref ||
    verification.transactionId ||
    verification.trxId ||
    '';

  const paymentOrderId =
    payload.orderId ||
    payload.order_id ||
    payload.paymentOrderId ||
    verification.orderId ||
    verification.order_id ||
    fallback.orderId;

  const paymentSenderNumber =
    payload.payer_number ||
    payload.payerNumber ||
    payload.senderNumber ||
    payload.mobileNumber ||
    payload.phone ||
    verification.payer_number ||
    verification.payerNumber ||
    fallback.senderNumber ||
    '';

  const receivedAmount = Number(
    payload.amount ??
    payload.paidAmount ??
    payload.receivedAmount ??
    verification.amount ??
    fallback.amount
  );

  const paymentTime =
    payload.verifiedAt ||
    payload.verified_at ||
    payload.payment_time ||
    payload.paymentTime ||
    payload.time ||
    verification.verifiedAt ||
    verification.verified_at ||
    fallback.paymentTime;

  return {
    paymentGateway: payload.gateway || payload.paymentGateway || fallback.gateway || 'popup',
    paymentOrderId,
    orderId: paymentOrderId,
    paymentTime,
    paymentTrxId,
    paymentReference: paymentTrxId,
    paymentSenderNumber,
    customerReference: paymentSenderNumber,
    receivedAmount,
    rawResponse: result,
  };
};

export default function BillingPage() {
  const router = useRouter();
  const { user: authUser, isLoading: authLoading } = useAuth();
  const [institution, setInstitution] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [isWidgetReady, setIsWidgetReady] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'bkash' | 'stripe'>('bkash');
  const [stripeCardName, setStripeCardName] = useState('');
  const [stripeCardNumber, setStripeCardNumber] = useState('');
  const [stripeExpiry, setStripeExpiry] = useState('');
  const [stripeCvc, setStripeCvc] = useState('');
  const [billingInfo, setBillingInfo] = useState<BillingInfo>({
    planCode: 'students_100',
    billingCycle: 'monthly',
    useEasySchoolStorage: true,
    receivedAmount: '',
    paymentGateway: 'bkash',
    paymentOrderId: '',
    paymentTime: '',
    paymentTrxId: '',
    paymentSenderNumber: '',
  });

  const logout = () => {
    authManager.clear();
    router.replace('/login');
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment') === 'stripe' ? params.get('status') : null;
    if (paymentStatus === 'success') {
      setStatus('Stripe checkout completed. Refreshing billing status...');
    } else if (paymentStatus === 'cancelled') {
      setStatus('Stripe checkout was cancelled. You can try again anytime.');
    }

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
          receivedAmount: billing.receivedAmount ? String(billing.receivedAmount) : '',
          paymentGateway: billing.paymentGateway || 'bkash',
          paymentOrderId: billing.paymentOrderId || '',
          paymentTime: billing.paymentTime ? String(billing.paymentTime) : '',
          paymentTrxId: billing.paymentTrxId || '',
          paymentSenderNumber: billing.paymentSenderNumber || '',
        });
      })
      .finally(() => setLoading(false));
  }, [router, authUser]);

  const billingComposition = useMemo(() => {
    if (!institution) return [];
    const billing = institution.billing || {};
    return [
      { name: 'Received', value: Number(billing.receivedAmount || 0) },
      { name: 'Due', value: Number(billing.dueAmount || 0) || 0 },
    ];
  }, [institution]);

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
        paymentOrderId: payment.paymentOrderId || payment.orderId || '',
        paymentTime: payment.paymentTime || new Date().toISOString(),
        paymentTrxId: payment.paymentTrxId || payment.paymentReference || '',
        paymentSenderNumber: payment.paymentSenderNumber || payment.customerReference || '',
        receivedAmount: popupAmount,
        popupPaymentStatus: payment.rawResponse?.status || payment.rawResponse?.data?.status,
        popupVerification: payment.rawResponse?.verification || payment.rawResponse?.data?.verification,
        popupPaymentResponse: payment.rawResponse,
      }) as any;
      setInstitution(response.institution);
      if (response?.institution?.isActive) {
        try {
          const profileResponse = await api.auth.profile() as any;
          const freshUser = profileResponse?.user || profileResponse;
          if (freshUser) {
            authManager.setUser(freshUser);
          }
          router.refresh();
          router.replace('/dashboard');
        } catch (profileError) {
          console.warn('Failed to refresh auth session after payment:', profileError);
        }
      }
      setStatus(response.message || 'Popup payment submitted successfully.');
    } catch (error: any) {
      setStatus(error?.message || 'Popup payment submit failed.');
    } finally {
      setIsPaying(false);
    }
  };

  const submitStripeDemoPayment = async () => {
    const cardLast4 = stripeCardNumber.replace(/\D/g, '').slice(-4);
    if (!stripeCardName || !stripeCardNumber || !stripeExpiry || !stripeCvc) {
      setStatus('Please fill all Stripe card details before continuing.');
      return;
    }

    setStatus('Processing Stripe demo payment...');
    setIsPaying(true);

    try {
      const demoTrxId = `STRIPE-DEMO-${Date.now()}`;
      const payload = {
        ...billingInfo,
        paymentGateway: 'stripe',
        paymentOrderId: `STRIPE-ORDER-${Date.now()}`,
        paymentTime: new Date().toISOString(),
        paymentTrxId: demoTrxId,
        paymentSenderNumber: stripeCardName,
        receivedAmount: due.total,
        popupPaymentStatus: 'verified',
        popupVerification: {
          status: 'verified',
          stripeDemo: true,
          cardLast4,
          paymentMethod: 'card',
        },
        popupPaymentResponse: {
          gateway: 'stripe',
          mode: 'demo',
          cardLast4,
          paymentMethod: 'card',
          status: 'verified',
          transaction_id: demoTrxId,
        },
      };

      const response = await api.institution.recordPayment(payload) as any;
      setInstitution(response.institution);
      if (response?.institution?.isActive) {
        try {
          const profileResponse = await api.auth.profile() as any;
          const freshUser = profileResponse?.user || profileResponse;
          if (freshUser) {
            authManager.setUser(freshUser);
          }
          router.refresh();
          router.replace('/dashboard');
        } catch (profileError) {
          console.warn('Failed to refresh auth session after stripe payment:', profileError);
        }
      }
      setStatus(response.message || 'Stripe demo payment submitted successfully.');
    } catch (error: any) {
      setStatus(error?.message || 'Stripe payment submit failed.');
    } finally {
      setIsPaying(false);
    }
  };

  const startStripeCheckout = async () => {
    setStatus('Preparing Stripe checkout...');
    setIsPaying(true);
    try {
      const response = await api.institution.createStripeCheckout({
        planCode: billingInfo.planCode,
        billingCycle: billingInfo.billingCycle,
        useEasySchoolStorage: billingInfo.useEasySchoolStorage,
      }) as any;

      if (response?.url) {
        window.location.href = response.url;
        return;
      }

      setStatus(response?.message || 'Stripe checkout could not be started.');
    } catch (error: any) {
      setStatus(error?.message || 'Stripe checkout failed.');
    } finally {
      setIsPaying(false);
    }
  };

  const openPopupPayment = () => {
    if (typeof window === 'undefined' || !window.GatewayWidget?.open) {
      setStatus('Payment popup is not loaded yet. Please try again.');
      return;
    }

    window.GATEWAY_WIDGET_URL = gatewayOrigin;
    const domain = configuredGatewayDomain || window.location.hostname;
    const callbackUrl = `${window.location.origin}${window.location.pathname}`;
    const orderId = billingInfo.paymentOrderId || `BILL-${institution?._id || Date.now()}`;
    const paymentTime = billingInfo.paymentTime || new Date().toISOString();
    setStatus('Opening popup payment...');
    window.GatewayWidget.open({
      apiKey: gatewayApiKey,
      domain,
      amount: due.total,
      callback: callbackUrl,
      orderId,
      receiverNumber: gatewayReceiverNumber || undefined,
      paymentMethods: gatewayPaymentMethods,
      preferredMethods: gatewayPaymentMethods,
      customerPhone: billingInfo.paymentSenderNumber || institution?.phone || '',
      onComplete: (result: any) => {
        const normalizedPayment = normalizePopupPaymentResult(result, {
          orderId,
          paymentTime,
          amount: due.total,
          gateway: billingInfo.paymentGateway || 'popup',
          senderNumber: billingInfo.paymentSenderNumber || institution?.phone || '',
        });

        setBillingInfo((prev) => ({
          ...prev,
          paymentGateway: normalizedPayment.paymentGateway || prev.paymentGateway,
          paymentOrderId: normalizedPayment.paymentOrderId || prev.paymentOrderId,
          paymentTime: normalizedPayment.paymentTime || prev.paymentTime,
          paymentTrxId: normalizedPayment.paymentTrxId || prev.paymentTrxId,
          paymentSenderNumber: normalizedPayment.paymentSenderNumber || prev.paymentSenderNumber,
          receivedAmount: String(normalizedPayment.receivedAmount),
        }));

        setStatus(result?.message || 'Payment completed. Saving payment details...');
        void submitPopupPayment(normalizedPayment);
      },
    });
  };

  const startPayment = () => {
    if (selectedPaymentMethod === 'stripe') {
      if (stripeModeEnabled) {
        void startStripeCheckout();
        return;
      }
      void submitStripeDemoPayment();
      return;
    }
    openPopupPayment();
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
        id="payment-widget-config"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `window.GATEWAY_WIDGET_URL = ${JSON.stringify(gatewayOrigin)};`,
        }}
      />
      <Script
        id="payment-widget"
        src={paymentWidgetUrl}
        data-gateway-url={gatewayOrigin}
        strategy="afterInteractive"
        onLoad={() => {
          const gw = (window as any).GatewayWidget;
          const ready = Boolean(gw && typeof gw.open === 'function');
          setIsWidgetReady(ready);
          if (ready) setStatus('');
          else setStatus('Payment widget loaded but GatewayWidget is unavailable.');
        }}
        onError={() => {
          setIsWidgetReady(false);
          setStatus('Payment popup failed to load. Check gateway host or network.');
          console.error('Failed to load payment widget script:', paymentWidgetUrl);
        }}
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
            <div className="grid gap-4 md:grid-cols-3">
              <label className="space-y-2">
                <span className="text-sm font-medium">Subscription Plan</span>
                <Select
                  value={billingInfo.planCode}
                  onValueChange={(value) => setBillingInfo((current) => ({ ...current, planCode: value }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {schoolPlans.map((item) => (
                      <SelectItem key={item.code} value={item.code}>
                        {item.name} - {formatCurrency(item.monthlyPrice)}/mo
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium">Billing Cycle</span>
                <Select
                  value={billingInfo.billingCycle}
                  onValueChange={(value) => setBillingInfo((current) => ({ ...current, billingCycle: value as 'monthly' | 'yearly' }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly subscription</SelectItem>
                    <SelectItem value="yearly">Yearly subscription</SelectItem>
                  </SelectContent>
                </Select>
              </label>

              <label className="flex items-center gap-3 rounded-md border px-3 py-2">
                <input
                  type="checkbox"
                  checked={billingInfo.useEasySchoolStorage}
                  onChange={(event) => setBillingInfo((current) => ({ ...current, useEasySchoolStorage: event.target.checked }))}
                />
                <span className="text-sm font-medium">Use EASY SCHOOL storage</span>
              </label>
            </div>

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

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium">Choose payment method</p>
                <p className="text-sm text-slate-600">Use Bkash/Nagad popup or test Stripe card flow.</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('bkash')}
                  className={`rounded-lg border p-4 text-left transition ${selectedPaymentMethod === 'bkash' ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Bkash / Nagad popup</span>
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">Connected</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">Opens the GatewayFlow popup for wallet payment.</p>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('stripe')}
                  className={`rounded-lg border p-4 text-left transition ${selectedPaymentMethod === 'stripe' ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Stripe</span>
                    <span className="rounded-full bg-sky-100 px-2 py-1 text-xs font-medium text-sky-700">{stripeModeEnabled ? 'Configured' : 'Demo'}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {stripeModeEnabled
                      ? 'Stripe publishable key is present. The UI exposes Stripe mode, and the current demo card flow is available for testing until a real checkout session is connected.'
                      : 'Demo card entry for testing when no Stripe env key is set.'}
                  </p>
                </button>
              </div>

              {selectedPaymentMethod === 'stripe' && (
                <div className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-medium">Cardholder name</span>
                    <input
                      type="text"
                      value={stripeCardName}
                      onChange={(event) => setStripeCardName(event.target.value)}
                      placeholder="Ayesha Khan"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium">Card number</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={stripeCardNumber}
                      onChange={(event) => setStripeCardNumber(event.target.value.replace(/\D/g, '').slice(0, 16))}
                      placeholder="4242 4242 4242 4242"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium">Expiry</span>
                    <input
                      type="text"
                      value={stripeExpiry}
                      onChange={(event) => setStripeExpiry(event.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="12/28"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium">CVC</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={stripeCvc}
                      onChange={(event) => setStripeCvc(event.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="123"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600">{status}</p>
              <Button
                onClick={startPayment}
                disabled={isPaying || (selectedPaymentMethod === 'bkash' && !isWidgetReady)}
                className="w-full sm:w-auto"
              >
                {isPaying ? 'Saving...' : selectedPaymentMethod === 'stripe' ? 'Pay with Stripe' : 'Pay with Popup'}
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
