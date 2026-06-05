'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { CreditCard, Loader2, LogOut, MessageSquare, CheckCircle2, Zap } from 'lucide-react';
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
// Gateway API keys must never be embedded into client bundles.
// The payment gateway should issue short-lived tokens from a server-side endpoint.
// Keep this empty on the client and fetch a token from your backend when needed.
const gatewayApiKey = process.env.NEXT_PUBLIC_GATEWAY_API_KEY || '';
const configuredGatewayDomain = process.env.NEXT_PUBLIC_GATEWAY_DOMAIN || '';
const gatewayReceiverNumber = process.env.NEXT_PUBLIC_GATEWAY_RECEIVER_NUMBER || '';
const gatewayPaymentMethods = ['bkash', 'nagad'];
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
const stripeModeEnabled = Boolean(stripePublishableKey);

type BillingInfo = {
  planCode: string;
  billingCycle: 'monthly' | 'yearly';
  useEasySchoolStorage: boolean;
  smsChargeAmount: number;
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
  const [topupAmount, setTopupAmount] = useState('');
  const [isTopping, setIsTopping] = useState(false);
  const [smsTopupHistory, setSmsTopupHistory] = useState<any[]>([]);
  const [isLoadingTopups, setIsLoadingTopups] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'bkash' | 'stripe'>('bkash');
  const [stripeCardName, setStripeCardName] = useState('');
  const [stripeCardNumber, setStripeCardNumber] = useState('');
  const [stripeExpiry, setStripeExpiry] = useState('');
  const [stripeCvc, setStripeCvc] = useState('');

  // SMS Package state
  const SMS_PACKAGES = [
    { code: 'sms_50',   smsCount: 50,   price: 30,   label: '৫০ SMS',   pricePerSms: 0.60 },
    { code: 'sms_100',  smsCount: 100,  price: 55,   label: '১০০ SMS',  pricePerSms: 0.55 },
    { code: 'sms_200',  smsCount: 200,  price: 100,  label: '২০০ SMS',  pricePerSms: 0.50 },
    { code: 'sms_300',  smsCount: 300,  price: 150,  label: '৩০০ SMS',  pricePerSms: 0.50 },
    { code: 'sms_500',  smsCount: 500,  price: 250,  label: '৫০০ SMS',  pricePerSms: 0.50 },
    { code: 'sms_1000', smsCount: 1000, price: 500,  label: '১০০০ SMS', pricePerSms: 0.50 },
    { code: 'sms_2000', smsCount: 2000, price: 1000, label: '২০০০ SMS', pricePerSms: 0.50 },
    { code: 'sms_5000', smsCount: 5000, price: 2500, label: '৫০০০ SMS', pricePerSms: 0.50 },
  ];
  const [selectedSmsPackage, setSelectedSmsPackage] = useState<string>('');
  const [isPurchasingSms, setIsPurchasingSms] = useState(false);
  const [smsPackageStatus, setSmsPackageStatus] = useState('');
  const [billingInfo, setBillingInfo] = useState<BillingInfo>({
    planCode: 'students_100',
    billingCycle: 'monthly',
    useEasySchoolStorage: true,
    smsChargeAmount: 0,
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
          smsChargeAmount: Number(billing.smsChargeAmount || 0),
          receivedAmount: billing.receivedAmount ? String(billing.receivedAmount) : '',
          paymentGateway: billing.paymentGateway || 'bkash',
          paymentOrderId: billing.paymentOrderId || '',
          paymentTime: billing.paymentTime ? String(billing.paymentTime) : '',
          paymentTrxId: billing.paymentTrxId || '',
          paymentSenderNumber: billing.paymentSenderNumber || '',
        });
        setIsLoadingTopups(true);
        return api.institutionSmsTopupHistory({ limit: 10 });
      })
      .then((historyResponse: any) => {
        setSmsTopupHistory(Array.isArray(historyResponse?.history) ? historyResponse.history : []);
      })
      .catch(() => setSmsTopupHistory([]))
      .finally(() => {
        setIsLoadingTopups(false);
        setLoading(false);
      })
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
  const totalWithSms = useMemo(() => Number(due.total || 0) + Number(billingInfo.smsChargeAmount || 0), [due, billingInfo]);

  const plan = getPlanByCode(billingInfo.planCode);

  const refreshSmsTopupHistory = async () => {
    setIsLoadingTopups(true);
    try {
      const historyResponse: any = await api.institutionSmsTopupHistory({ limit: 10 });
      setSmsTopupHistory(Array.isArray(historyResponse?.history) ? historyResponse.history : []);
    } catch {
      setSmsTopupHistory([]);
    } finally {
      setIsLoadingTopups(false);
    }
  };

  const openSmsPackagePurchasePopup = () => {
    const pkg = SMS_PACKAGES.find((p) => p.code === selectedSmsPackage);
    if (!pkg) { setSmsPackageStatus('একটি প্যাকেজ বেছে নিন।'); return; }
    if (typeof window === 'undefined' || !window.GatewayWidget?.open) {
      setSmsPackageStatus('Payment popup লোড হয়নি। একটু পরে চেষ্টা করুন।');
      return;
    }
    window.GATEWAY_WIDGET_URL = gatewayOrigin;
    const domain = configuredGatewayDomain || window.location.hostname;
    const callbackUrl = `${window.location.origin}${window.location.pathname}`;
    const orderId = `SMS-PKG-${institution?._id || Date.now()}-${pkg.code}`;
    const paymentTime = new Date().toISOString();
    setSmsPackageStatus(`${pkg.label} কেনার জন্য পেমেন্ট পপআপ খুলছে...`);
    window.GatewayWidget.open({
      apiKey: gatewayApiKey,
      domain,
      amount: pkg.price,
      callback: callbackUrl,
      orderId,
      receiverNumber: gatewayReceiverNumber || undefined,
      paymentMethods: gatewayPaymentMethods,
      preferredMethods: gatewayPaymentMethods,
      customerPhone: institution?.phone || '',
      onComplete: async (result: any) => {
        setIsPurchasingSms(true);
        setSmsPackageStatus('পেমেন্ট সম্পন্ন। SMS প্যাকেজ activate করা হচ্ছে...');
        const normalized = normalizePopupPaymentResult(result, { orderId, paymentTime, amount: pkg.price, gateway: 'popup' });
        try {
          const response = await api.institutionSmsPurchasePackage({
            packageCode: pkg.code,
            paymentGateway: normalized.paymentGateway || 'popup',
            paymentOrderId: normalized.paymentOrderId || orderId,
            paymentTime: normalized.paymentTime || paymentTime,
            paymentTrxId: normalized.paymentTrxId || '',
            paymentSenderNumber: normalized.paymentSenderNumber || '',
            receivedAmount: normalized.receivedAmount || pkg.price,
            popupPaymentResponse: result,
            popupVerification: result?.verification || result?.data?.verification || {},
          }) as any;
          setInstitution((curr: any) => ({ ...curr, billing: response.billing || curr?.billing }));
          await refreshSmsTopupHistory();
          setSmsPackageStatus(`✅ ${pkg.label} সফলভাবে কেনা হয়েছে! ${pkg.smsCount} SMS credit যোগ হয়েছে।`);
        } catch (error: any) {
          setSmsPackageStatus(`❌ ${error?.message || 'SMS প্যাকেজ activate করতে সমস্যা হয়েছে।'}`);
        } finally {
          setIsPurchasingSms(false);
        }
      },
    });
  };

  const submitPopupPayment = async (payment: PopupPaymentResult) => {
    setStatus('Submitting popup payment...');
    setIsPaying(true);
    try {
      const popupAmount = Number(payment.receivedAmount || 0);
      if (!popupAmount || popupAmount !== Number(totalWithSms)) {
        setStatus(`Payment amount mismatch. Required amount is ${formatCurrency(totalWithSms)}.`);
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

  const submitSmsTopupPayment = async (payment: PopupPaymentResult, amount: number) => {
    setStatus('Submitting SMS top-up payment...');
    setIsTopping(true);
    try {
      const popupAmount = Number(payment.receivedAmount || 0);
      if (!popupAmount || popupAmount !== Number(amount)) {
        setStatus(`Top-up amount mismatch. Required amount is ${formatCurrency(amount)}.`);
        return;
      }

      const response = await api.institutionSmsTopupPayment({
        amount,
        paymentGateway: payment.paymentGateway || 'popup',
        paymentOrderId: payment.paymentOrderId || payment.orderId || '',
        paymentTime: payment.paymentTime || new Date().toISOString(),
        paymentTrxId: payment.paymentTrxId || payment.paymentReference || '',
        paymentSenderNumber: payment.paymentSenderNumber || payment.customerReference || '',
        popupPaymentResponse: payment.rawResponse,
        popupVerification: payment.rawResponse?.verification || payment.rawResponse?.data?.verification,
      }) as any;
      setInstitution((current: any) => ({ ...current, billing: response.billing || current?.billing }));
      await refreshSmsTopupHistory();
      setStatus(response.message || 'SMS balance topped up successfully.');
    } catch (error: any) {
      setStatus(error?.message || 'SMS top-up payment failed.');
    } finally {
      setIsTopping(false);
    }
  };

  const openSmsTopupPopup = () => {
    const amount = Number(topupAmount || 0);
    if (!amount || amount <= 0) {
      setStatus('Enter a valid SMS top-up amount.');
      return;
    }
    if (typeof window === 'undefined' || !window.GatewayWidget?.open) {
      setStatus('Payment popup is not loaded yet. Please try again.');
      return;
    }

    window.GATEWAY_WIDGET_URL = gatewayOrigin;
    const domain = configuredGatewayDomain || window.location.hostname;
    const callbackUrl = `${window.location.origin}${window.location.pathname}`;
    const orderId = `SMS-TOPUP-${institution?._id || Date.now()}`;
    const paymentTime = new Date().toISOString();
    setStatus('Opening SMS top-up popup...');
    window.GatewayWidget.open({
      apiKey: gatewayApiKey,
      domain,
      amount,
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
          amount,
          gateway: 'popup',
          senderNumber: billingInfo.paymentSenderNumber || institution?.phone || '',
        });
        setStatus(result?.message || 'SMS top-up payment completed. Saving payment details...');
        void submitSmsTopupPayment(normalizedPayment, amount);
      },
    });
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
        receivedAmount: totalWithSms,
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
      amount: totalWithSms,
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
          amount: totalWithSms,
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
          <p className="text-xl font-semibold">প্রতিষ্ঠান প্রধানের সাথে যোগাযোগ করুন।</p>
          <Button variant="outline" onClick={logout}><LogOut className="mr-2 h-4 w-4" />লগআউট</Button>
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
            <h1 className="text-3xl font-bold tracking-tight">💳 বিলিং ও এসএমএস</h1>
            <p className="mt-2 text-sm text-muted-foreground">আপনার সাবস্ক্রিপশন এবং এসএমএস ব্যালেন্স এখানে দেখুন ও পরিচালনা করুন।</p>
          </div>
          <Button variant="outline" onClick={logout}><LogOut className="mr-2 h-4 w-4" />লগআউট</Button>
        </div>

        {/* ── Active Package Status Card ───────────────────────────────── */}
        {institution && (
          <div className={`rounded-2xl border-2 p-5 ${
            institution.billingStatus === 'active' || institution.isActive
              ? 'border-emerald-300 bg-gradient-to-br from-emerald-50 to-green-50'
              : institution.billingStatus === 'trial'
              ? 'border-amber-300 bg-amber-50'
              : 'border-red-300 bg-red-50'
          }`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  institution.billingStatus === 'active' || institution.isActive ? 'bg-emerald-100' : 'bg-amber-100'
                }`}>
                  <CheckCircle2 className={`h-5 w-5 ${institution.billingStatus === 'active' || institution.isActive ? 'text-emerald-600' : 'text-amber-500'}`} />
                </div>
                <div>
                  <div className="text-lg font-bold">
                    {institution.billingStatus === 'active' || institution.isActive
                      ? '✅ সক্রিয় প্যাকেজ'
                      : institution.billingStatus === 'trial'
                      ? '🔄 Trial চলছে'
                      : '⚠️ Subscription নেই'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {institution.name || 'প্রতিষ্ঠান'}
                  </div>
                </div>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                institution.billingStatus === 'active' || institution.isActive
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {institution.billingStatus || (institution.isActive ? 'active' : 'inactive')}
              </span>
            </div>
            {(institution.billingStatus === 'active' || institution.isActive) && institution.billing && (
              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                <div className="rounded-xl bg-white/70 p-3 text-center">
                  <div className="text-xs text-muted-foreground">প্যাকেজ</div>
                  <div className="mt-1 font-bold text-emerald-700">
                    {getPlanByCode(institution.billing?.planCode || '')?.name || institution.billing?.planCode || '—'}
                  </div>
                </div>
                <div className="rounded-xl bg-white/70 p-3 text-center">
                  <div className="text-xs text-muted-foreground">বিলিং চক্র</div>
                  <div className="mt-1 font-bold capitalize">
                    {institution.billing?.billingCycle === 'yearly' ? 'বার্ষিক' : 'মাসিক'}
                  </div>
                </div>
                <div className="rounded-xl bg-white/70 p-3 text-center">
                  <div className="text-xs text-muted-foreground">ছাত্র সীমা</div>
                  <div className="mt-1 font-bold">
                    {getPlanByCode(institution.billing?.planCode || '')?.studentLimit || '—'} জন
                  </div>
                </div>
                <div className="rounded-xl bg-white/70 p-3 text-center">
                  <div className="text-xs text-muted-foreground">মাসিক ফ্রি SMS</div>
                  <div className="mt-1 font-bold text-emerald-600">
                    {getPlanByCode(institution.billing?.planCode || '')?.studentLimit || 0} টি
                  </div>
                </div>
              </div>
            )}
            {institution.billing?.planExpiry && (
              <div className="mt-3 text-xs text-muted-foreground">
                মেয়াদ শেষ: {new Date(institution.billing.planExpiry).toLocaleDateString('bn-BD')}
              </div>
            )}
          </div>
        )}

        {/* ── SMS Balance Card ─────────────────────────────────────────── */}
        {institution && (() => {
          const billing = institution.billing || {};
          const smsBalance = Number(billing.smsBalance ?? 0);
          const smsUsed = Number(billing.smsUsed ?? 0);
          const monthlySmsLimit = Number(billing.monthlySmsLimit ?? 0);
          const freeSmsFromPlan = getPlanByCode(billing.planCode || '')?.studentLimit ?? 0;
          const totalAvailable = smsBalance + freeSmsFromPlan;
          const lowBalance = smsBalance > 0 && smsBalance < 10;
          return (
            <div className={`rounded-2xl border-2 p-5 ${lowBalance ? 'border-amber-300 bg-amber-50' : 'border-blue-200 bg-gradient-to-br from-blue-50 to-sky-50'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${lowBalance ? 'bg-amber-100' : 'bg-blue-100'}`}>
                  <MessageSquare className={`h-5 w-5 ${lowBalance ? 'text-amber-600' : 'text-blue-600'}`} />
                </div>
                <div>
                  <div className="text-lg font-bold">📱 SMS ব্যালেন্স</div>
                  <div className="text-sm text-muted-foreground">আপনার অবশিষ্ট SMS সংখ্যা</div>
                </div>
              </div>
              {lowBalance && (
                <div className="mb-3 rounded-lg border border-amber-300 bg-amber-100 px-4 py-2 text-sm text-amber-800">
                  ⚠️ SMS ব্যালেন্স কম! নিচে থেকে SMS প্যাকেজ কিনুন।
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="rounded-xl bg-white/80 p-3 text-center">
                  <div className="text-xs text-muted-foreground">কেনা SMS বাকি</div>
                  <div className={`mt-1 text-2xl font-bold ${lowBalance ? 'text-amber-600' : 'text-blue-600'}`}>{smsBalance}</div>
                </div>
                <div className="rounded-xl bg-white/80 p-3 text-center">
                  <div className="text-xs text-muted-foreground">প্ল্যান থেকে ফ্রি</div>
                  <div className="mt-1 text-2xl font-bold text-emerald-600">{freeSmsFromPlan}</div>
                  <div className="text-[10px] text-muted-foreground">মাসিক</div>
                </div>
                <div className="rounded-xl bg-white/80 p-3 text-center">
                  <div className="text-xs text-muted-foreground">এ মাসে পাঠানো</div>
                  <div className="mt-1 text-2xl font-bold">{smsUsed}</div>
                </div>
                <div className="rounded-xl bg-white/80 p-3 text-center">
                  <div className="text-xs text-muted-foreground">মোট ব্যবহারযোগ্য</div>
                  <div className="mt-1 text-2xl font-bold text-primary">{totalAvailable > 0 ? totalAvailable : '∞'}</div>
                </div>
              </div>
            </div>
          );
        })()}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> স্কুল বিল পরিশোধ</CardTitle>
            <CardDescription>নিবন্ধন বিল এবং মাসিক বিল শুধুমাত্র পপআপ পেমেন্ট গেটওয়ে দিয়ে পরিশোধ করতে হবে।</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              <label className="space-y-2">
                <span className="text-sm font-medium">সাবস্ক্রিপশন প্ল্যান</span>
                <Select
                  value={billingInfo.planCode}
                  onValueChange={(value) => setBillingInfo((current) => ({ ...current, planCode: value }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {schoolPlans.map((item) => (
                      <SelectItem key={item.code} value={item.code}>
                        {item.name} - {formatCurrency(item.monthlyPrice)}/মাস
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium">বিলিং চক্র</span>
                <Select
                  value={billingInfo.billingCycle}
                  onValueChange={(value) => setBillingInfo((current) => ({ ...current, billingCycle: value as 'monthly' | 'yearly' }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">মাসিক সাবস্ক্রিপশন</SelectItem>
                    <SelectItem value="yearly">বার্ষিক সাবস্ক্রিপশন</SelectItem>
                  </SelectContent>
                </Select>
              </label>

              <label className="flex items-center gap-3 rounded-md border px-3 py-2">
                <input
                  type="checkbox"
                  checked={billingInfo.useEasySchoolStorage}
                  onChange={(event) => setBillingInfo((current) => ({ ...current, useEasySchoolStorage: event.target.checked }))}
                />
                <span className="text-sm font-medium">ইজি স্কুল স্টোরেজ ব্যবহার করুন</span>
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border bg-card p-4">
                <div className="text-sm text-slate-500">প্ল্যান</div>
                <div className="mt-1 font-semibold">{plan.name}</div>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <div className="text-sm text-slate-500">বিলিং চক্র</div>
                <div className="mt-1 font-semibold capitalize">{billingInfo.billingCycle === 'yearly' ? 'বার্ষিক' : 'মাসিক'}</div>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <div className="text-sm text-slate-500">স্টোরেজ</div>
                <div className="mt-1 font-semibold">{billingInfo.useEasySchoolStorage ? `ইজি স্কুল স্টোরেজ - ${formatCurrency(100)}/মাস` : 'নিজস্ব MongoDB + ImgBB - কোনো অতিরিক্ত খরচ নেই'}</div>
              </div>
            </div>

            <div className="rounded-lg border-2 border-emerald-200 bg-emerald-50 p-4 text-sm">
              <div className="flex items-start gap-2">
                <MessageSquare className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                <div>
                  <span className="font-semibold text-emerald-800">🎁 স্টুডেন্ট প্যাকেজে বিনামূল্যে SMS অন্তর্ভুক্ত!</span>
                  <p className="mt-1 text-emerald-700">
                    আপনি যতজন স্টুডেন্টের প্যাকেজ কিনবেন — প্রতি মাসে সেই পরিমাণ SMS <strong>ফ্রিতে</strong> পাবেন।
                    উদাহরণ: <strong>{plan.name} প্যাকেজ</strong> কিনলে <strong>{plan.studentLimit} SMS/মাস ফ্রি</strong>।
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-slate-50 p-4 text-sm">
              বকেয়া পরিমাণ: {formatCurrency(due.baseAmount)} + স্টোরেজ {formatCurrency(due.storageAmount)} + এসএমএস {formatCurrency(Number(billingInfo.smsChargeAmount || 0))} = <span className="font-semibold">{formatCurrency(totalWithSms)}</span>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium">পেমেন্ট পদ্ধতি বেছে নিন</p>
                <p className="text-sm text-slate-600">বিকাশ/নগদ পপআপ ব্যবহার করুন অথবা স্ট্রাইপ কার্ড টেস্ট করুন।</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('bkash')}
                  className={`rounded-lg border p-4 text-left transition ${selectedPaymentMethod === 'bkash' ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">বিকাশ / নগদ পপআপ</span>
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">সংযুক্ত</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">মোবাইল ওয়ালেট পেমেন্টের জন্য GatewayFlow পপআপ খুলবে।</p>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('stripe')}
                  className={`rounded-lg border p-4 text-left transition ${selectedPaymentMethod === 'stripe' ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">স্ট্রাইপ (Stripe)</span>
                    <span className="rounded-full bg-sky-100 px-2 py-1 text-xs font-medium text-sky-700">{stripeModeEnabled ? 'কনফিগার করা আছে' : 'ডেমো'}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {stripeModeEnabled
                      ? 'স্ট্রাইপ পাবলিশেবল কি পাওয়া গেছে। স্ট্রাইপ মোড চালু আছে এবং একটি আসল পেমেন্ট সেশনের পরিবর্তে ডেমো কার্ড দিয়ে পেমেন্ট টেস্ট করা যাবে।'
                      : 'কোনো স্ট্রাইপ এনভায়রনমেন্ট কি সেট করা না থাকলে টেস্ট করার জন্য ডেমো কার্ড এন্ট্রি।'}
                  </p>
                </button>
              </div>

              {selectedPaymentMethod === 'stripe' && (
                <div className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-medium">কার্ডধারীর নাম</span>
                    <input
                      type="text"
                      value={stripeCardName}
                      onChange={(event) => setStripeCardName(event.target.value)}
                      placeholder="Ayesha Khan"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium">কার্ড নম্বর</span>
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
                    <span className="text-sm font-medium">মেয়াদ উত্তীর্ণের তারিখ (Expiry)</span>
                    <input
                      type="text"
                      value={stripeExpiry}
                      onChange={(event) => setStripeExpiry(event.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="12/28"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium">সিভিসি (CVC)</span>
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
                {isPaying ? 'সংরক্ষণ করা হচ্ছে...' : selectedPaymentMethod === 'stripe' ? 'স্ট্রাইপ দিয়ে পেমেন্ট করুন' : 'পপআপ দিয়ে পেমেন্ট করুন'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{institution?.name || 'বিদ্যালয়'}</CardTitle>
            <CardDescription>বর্তমান বিলিং অবস্থা</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm md:grid-cols-3">
            <div className="rounded-md border p-3"><span className="text-slate-500">অবস্থা</span><div className="font-semibold">{institution?.isActive ? 'সক্রিয়' : 'পেন্ডিং / নিষ্ক্রিয়'}</div></div>
            <div className="rounded-md border p-3"><span className="text-slate-500">বিলিং</span><div className="font-semibold">{institution?.billing?.billingStatus === 'active' ? 'সক্রিয়' : institution?.billing?.billingStatus || 'pending'}</div></div>
            <div className="rounded-md border p-3"><span className="text-slate-500">পরিশোধিত</span><div className="font-semibold">{formatCurrency(Number(institution?.billing?.receivedAmount || 0))}</div></div>
            <div className="rounded-md border p-3"><span className="text-slate-500">মূল বিল</span><div className="font-semibold">{formatCurrency(Number(institution?.billing?.baseDueAmount || 0))}</div></div>
            <div className="rounded-md border p-3"><span className="text-slate-500">এসএমএস চার্জ</span><div className="font-semibold">{formatCurrency(Number(institution?.billing?.smsChargeAmount || 0))}</div></div>
            <div className="rounded-md border p-3"><span className="text-slate-500">মাসিক মোট</span><div className="font-semibold">{formatCurrency(Number(institution?.billing?.monthlyBillAmount || institution?.billing?.dueAmount || 0))}</div></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>এসএমএস ব্যালেন্স রিচার্জ</CardTitle>
            <CardDescription>পপআপ পেমেন্ট দিয়ে SMS balance recharge করুন; অনুমোদিত ব্যবহারকারীরাই এটি করতে পারবেন।</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-3">
              <label className="space-y-2">
                <span className="text-sm font-medium">পরিমাণ</span>
                <input
                  type="number"
                  min="1"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  placeholder="100"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </label>
              <div className="md:col-span-2 flex items-end">
                <Button
                  onClick={openSmsTopupPopup}
                  disabled={isTopping || !isWidgetReady}
                >
                  {isTopping ? 'প্রসেস করা হচ্ছে...' : 'এসএমএস রিচার্জ করুন'}
                </Button>
              </div>
            </div>
            <div className="text-sm text-slate-600">বর্তমান এসএমএস ব্যালেন্স: <span className="font-semibold">{formatCurrency(Number(institution?.billing?.smsBalance || 0))}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>সাম্প্রতিক এসএমএস রিচার্জ</CardTitle>
            <CardDescription>এই প্রতিষ্ঠানের সাম্প্রতিক রিচার্জ লেনদেনসমূহ।</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingTopups ? (
              <div className="text-sm text-slate-600">রিচার্জ ইতিহাস লোড করা হচ্ছে...</div>
            ) : smsTopupHistory.length ? (
              <div className="space-y-3">
                {smsTopupHistory.map((item) => (
                  <div key={item._id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                    <div>
                      <div className="font-semibold">{formatCurrency(Number(item.amount || 0))}</div>
                      <div className="text-slate-600">{(item.method === 'manual' ? 'ম্যানুয়াল' : item.method) || 'ম্যানুয়াল'} · {item.createdBy?.name || 'সিস্টেম'}</div>
                    </div>
                    <div className="text-right text-slate-600">
                      <div>{item.createdAt ? new Date(item.createdAt).toLocaleString('bn-BD') : ''}</div>
                      <div>{item.createdBy?.role === 'head' ? 'প্রধান শিক্ষক' : item.createdBy?.role === 'admin' ? 'এডমিন' : item.createdBy?.role || ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-600">এখনো কোনো এসএমএস রিচার্জ করা হয়নি।</div>
            )}
          </CardContent>
        </Card>

        {/* ===================== SMS PACKAGE PURCHASE SECTION ===================== */}
        <Card className="overflow-hidden border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
          <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              SMS প্যাকেজ কিনুন
            </CardTitle>
            <CardDescription className="text-emerald-100">
              প্রতি মাসে আপনার স্টুডেন্ট সংখ্যার সমান SMS প্যাকেজ কিনুন। ১ ক্রেডিট = ১ SMS।
              বর্তমান ব্যালেন্স: <span className="font-bold text-white">{Number(institution?.billing?.smsBalance ?? 0)} SMS credit</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            {/* Recommended notice based on plan */}
            {(() => {
              const planStudentLimit = institution?.billing?.studentLimit || plan?.studentLimit || 100;
              const recommended = SMS_PACKAGES.find((p) => p.smsCount >= planStudentLimit) || SMS_PACKAGES[SMS_PACKAGES.length - 1];
              return (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-100 px-4 py-3 text-sm text-emerald-800">
                  <Zap className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                  আপনার প্ল্যানে <strong>{planStudentLimit} জন স্টুডেন্ট</strong> — Recommended প্যাকেজ: <strong>{recommended.label} ({formatCurrency(recommended.price)})</strong>
                </div>
              );
            })()}

            {/* Package grid */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {SMS_PACKAGES.map((pkg) => {
                const planStudentLimit = institution?.billing?.studentLimit || plan?.studentLimit || 100;
                const isRecommended = pkg.smsCount >= planStudentLimit && (SMS_PACKAGES.find((p) => p.smsCount >= planStudentLimit)?.code === pkg.code);
                const isSelected = selectedSmsPackage === pkg.code;
                return (
                  <button
                    key={pkg.code}
                    type="button"
                    onClick={() => setSelectedSmsPackage(pkg.code)}
                    className={`relative rounded-xl border-2 p-4 text-left transition-all duration-200 ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 shadow-md scale-[1.02]'
                        : isRecommended
                          ? 'border-teal-400 bg-teal-50 hover:border-teal-500'
                          : 'border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50'
                    }`}
                  >
                    {isRecommended && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-teal-500 px-2.5 py-0.5 text-[10px] font-bold text-white whitespace-nowrap">
                        ⭐ RECOMMENDED
                      </span>
                    )}
                    {isSelected && (
                      <CheckCircle2 className="absolute right-2 top-2 h-4 w-4 text-emerald-500" />
                    )}
                    <div className="mt-1">
                      <div className="text-lg font-bold text-gray-800">{pkg.label}</div>
                      <div className="text-2xl font-extrabold text-emerald-700">{formatCurrency(pkg.price)}</div>
                      <div className="mt-1 text-xs text-gray-500">{pkg.pricePerSms === 0.50 ? '০.৫০ টাকা' : `${pkg.pricePerSms} টাকা`}/SMS</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected package summary + payment button */}
            {selectedSmsPackage && (() => {
              const pkg = SMS_PACKAGES.find((p) => p.code === selectedSmsPackage)!;
              return (
                <div className="rounded-xl border border-emerald-300 bg-white p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="font-semibold text-gray-800">নির্বাচিত: {pkg.label}</div>
                      <div className="text-sm text-gray-500">
                        {pkg.smsCount} SMS credit × ০.৫০ টাকা = <span className="font-semibold text-emerald-700">{formatCurrency(pkg.price)}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        কেনার পর মোট ব্যালেন্স: <span className="font-semibold">{Number(institution?.billing?.smsBalance ?? 0) + pkg.smsCount} SMS</span>
                      </div>
                    </div>
                    <Button
                      onClick={openSmsPackagePurchasePopup}
                      disabled={isPurchasingSms || !isWidgetReady}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-6"
                    >
                      {isPurchasingSms ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Activating...</> : `Bkash/Nagad দিয়ে কিনুন`}
                    </Button>
                  </div>
                </div>
              );
            })()}

            {smsPackageStatus && (
              <p className={`text-sm font-medium ${
                smsPackageStatus.startsWith('✅') ? 'text-emerald-700' :
                smsPackageStatus.startsWith('❌') ? 'text-red-600' : 'text-slate-600'
              }`}>
                {smsPackageStatus}
              </p>
            )}
          </CardContent>
        </Card>
        {/* ====================================================================== */}

      </div>
    </main>
  );
}
