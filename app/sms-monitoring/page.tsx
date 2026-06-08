"use client";

export const dynamic = 'force-dynamic';
import { useEffect, useMemo, useState } from "react";
import Script from "next/script";
import { CalendarDays, CheckCircle2, MessageSquare, RefreshCw, Send, ShoppingCart, XCircle } from "lucide-react";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import ResponsiveTable from '@/components/shared/ResponsiveTable';
import { normalizeUserRole } from '@/lib/permissions';

declare global { interface Window { GATEWAY_WIDGET_URL?: string; GatewayWidget?: { open: (options: any) => void } } }
const gatewayOrigin = 'https://payment-gateway-server-ten.vercel.app';
const paymentWidgetUrl = `${gatewayOrigin}/widget.js`;
const gatewayApiKey = process.env.NEXT_PUBLIC_GATEWAY_API_KEY || '';
const gatewayDomain = process.env.NEXT_PUBLIC_GATEWAY_DOMAIN || '';
const gatewayReceiverNumber = process.env.NEXT_PUBLIC_GATEWAY_RECEIVER_NUMBER || '';
const gatewayPaymentMethods = ['bkash', 'nagad'];
function currentMonth() { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; }
function formatDate(value?: string | null) { if (!value) return "-"; return new Date(value).toLocaleString(); }
function money(value: any) { const n = Number(value || 0); return n > 0 ? `BDT ${n.toLocaleString()}` : "-"; }
function normalizedPopup(result: any, fallback: any) { const v = result?.verification || result?.data?.verification || {}; const p = result?.data || result || {}; return { paymentOrderId: p.orderId || p.order_id || v.orderId || v.order_id || fallback.orderId, paymentTrxId: p.transaction_id || p.payment_ref || p.trxId || v.transaction_id || v.payment_ref || '', paymentSenderNumber: p.payer_number || p.senderNumber || p.phone || v.payer_number || fallback.phone || '', receivedAmount: Number(p.amount ?? v.amount ?? fallback.amount), paymentTime: p.verifiedAt || p.paymentTime || v.verifiedAt || fallback.paymentTime, rawResponse: result, popupVerification: v }; }

export default function SmsMonitoringPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState<any>(null);
  const [topups, setTopups] = useState<any[]>([]);
  const [unitPrice, setUnitPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [buying, setBuying] = useState(false);
  const [widgetReady, setWidgetReady] = useState(false);
  const [status, setStatus] = useState('');
  const [buyQty, setBuyQty] = useState(100);
  const [buyPhone, setBuyPhone] = useState('');
  const [buyNote, setBuyNote] = useState('');
  const normalizedRole = normalizeUserRole(user?.role) || user?.role;
  const isDenied = normalizedRole === 'student' || normalizedRole === 'parent';
  const buyAmount = unitPrice > 0 ? buyQty * unitPrice : 0;

  const loadTopups = async () => { try { const result: any = await apiClient.get('/sms-monitoring/purchases', { skipToast: true }); setTopups(Array.isArray(result?.requests) ? result.requests : []); setUnitPrice(Number(result?.unitPrice || 0)); } catch { setTopups([]); } };
  const loadData = async () => { if (isDenied) return; setLoading(true); try { setData(await apiClient.get(`/sms/head/monthly?month=${month}`)); } catch { setData(null); } finally { await loadTopups(); setLoading(false); } };
  useEffect(() => { if (!isDenied) loadData(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [month, isDenied]);

  const savePaidRecharge = async (payment: any) => { await apiClient.post('/sms-monitoring/purchases', { quantity: buyQty, contactNumber: buyPhone, paymentMethod: 'popup', notes: buyNote, unitPrice, totalAmount: buyAmount, ...payment, popupPaymentResponse: payment.rawResponse, popupVerification: payment.popupVerification }); setBuyNote(''); await loadTopups(); await loadData(); setStatus('SMS recharge payment successful. Balance updated.'); };
  const openPopup = () => {
    if (buyQty <= 0) { setStatus('SMS quantity must be positive'); return; }
    if (!buyPhone.trim()) { setStatus('Custom contact number is required'); return; }
    if (!buyAmount || buyAmount <= 0) { setStatus('SMS unit price is not set. Set SMS_UNIT_PRICE in server env.'); return; }
    if (!window.GatewayWidget?.open) { setStatus('Payment popup is not loaded yet. Please try again.'); return; }
    const orderId = `SMS-RECHARGE-${Date.now()}`; const paymentTime = new Date().toISOString(); setBuying(true); setStatus('Opening SMS recharge payment popup...'); window.GATEWAY_WIDGET_URL = gatewayOrigin;
    window.GatewayWidget.open({ apiKey: gatewayApiKey, domain: gatewayDomain || window.location.hostname, amount: buyAmount, callback: `${window.location.origin}${window.location.pathname}`, orderId, receiverNumber: gatewayReceiverNumber || undefined, paymentMethods: gatewayPaymentMethods, preferredMethods: gatewayPaymentMethods, customerPhone: buyPhone, onComplete: async (result: any) => { try { const pay = normalizedPopup(result, { orderId, paymentTime, amount: buyAmount, phone: buyPhone }); if (Number(pay.receivedAmount || 0) !== Number(buyAmount)) { setStatus(`Payment amount mismatch. Required ${money(buyAmount)}.`); return; } await savePaidRecharge(pay); } catch (e: any) { setStatus(e?.message || 'SMS recharge payment save failed.'); } finally { setBuying(false); } } });
  };

  const recipients = Array.isArray(data?.recipients) ? data.recipients : [];
  const logs = Array.isArray(data?.logs) ? data.logs : [];
  const sentRecipients = useMemo(() => recipients.filter((item: any) => item.smsSent), [recipients]);
  const notSentRecipients = useMemo(() => recipients.filter((item: any) => !item.smsSent), [recipients]);
  if (isDenied) return <div className="flex min-h-[50vh] items-center justify-center p-6 text-center bg-slate-50"><div className="rounded-2xl border border-red-200 bg-red-50 p-6 max-w-md shadow-sm"><XCircle className="mx-auto h-12 w-12 text-red-600 mb-3" /><h2 className="text-xl font-bold text-red-950">Access Denied</h2><p className="mt-2 text-sm text-red-700">You do not have permission to access the SMS Monitoring logs.</p></div></div>;
  const stats = [{ label: "Monthly SMS Limit", value: data?.limit?.monthlySmsLimit || 0, icon: MessageSquare }, { label: "Used This Month", value: data?.limit?.usedThisMonth || 0, icon: Send }, { label: "Remaining", value: data?.limit?.remainingThisMonth || 0, icon: CheckCircle2 }, { label: "Not Sent", value: data?.summary?.notSentRecipients || 0, icon: XCircle }];
  return <div className="min-h-screen bg-slate-50 p-3 md:p-6"><Script src={paymentWidgetUrl} strategy="afterInteractive" onLoad={() => { window.GATEWAY_WIDGET_URL = gatewayOrigin; setWidgetReady(true); }} /><div className="mx-auto max-w-7xl space-y-5 md:space-y-6">
    <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between md:p-6"><div><h1 className="text-2xl font-bold text-slate-900 md:text-3xl">{t("SMS Monitoring")}</h1><p className="mt-1 text-sm leading-6 text-slate-600">{t("View who received SMS this month and who did not. Logs are automatically deleted after one month.")}</p></div><div className="flex flex-col gap-2 sm:flex-row sm:items-center"><div className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2"><CalendarDays className="h-4 w-4 text-slate-500" /><input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="w-full bg-transparent text-sm outline-none" /></div><Button onClick={loadData} disabled={loading} className="w-full sm:w-auto"><RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />{t("Refresh")}</Button></div></div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{stats.map((stat) => { const Icon = stat.icon; return <Card key={stat.label} className="shadow-sm"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-slate-600">{t(stat.label)}</CardTitle><Icon className="h-5 w-5 text-slate-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-slate-900 md:text-3xl">{Number(stat.value).toLocaleString()}</div></CardContent></Card>; })}</div>
    <Card className="border-emerald-200 shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2 text-emerald-700"><ShoppingCart className="h-5 w-5" /> SMS Recharge Popup Payment</CardTitle><CardDescription>Subscription billing-এর মতো popup payment দিয়ে SMS কিনুন। Custom contact number থাকবে।</CardDescription></CardHeader><CardContent className="space-y-4"><div className="flex flex-wrap gap-2">{[100, 500, 1000].map((q) => <Button key={q} size="sm" variant={buyQty === q ? 'default' : 'outline'} onClick={() => setBuyQty(q)}>{q} SMS</Button>)}</div><div className="grid gap-3 md:grid-cols-4"><input className="rounded-lg border px-3 py-2 text-sm" type="number" min={1} value={buyQty} onChange={(e) => setBuyQty(Number(e.target.value || 0))} placeholder="Quantity" /><input className="rounded-lg border px-3 py-2 text-sm" value={buyPhone} onChange={(e) => setBuyPhone(e.target.value)} placeholder="Custom contact number" /><div className="rounded-lg border bg-slate-50 px-3 py-2 text-sm font-bold">{unitPrice > 0 ? money(buyAmount) : 'Unit price not set'}</div><Button onClick={openPopup} disabled={buying || !widgetReady}>{buying ? 'Processing...' : 'Pay with Popup'}</Button></div><textarea className="w-full rounded-lg border px-3 py-2 text-sm" rows={2} value={buyNote} onChange={(e) => setBuyNote(e.target.value)} placeholder="Notes optional" />{status && <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">{status}</p>}<div className="space-y-2"><h3 className="text-sm font-semibold text-slate-700">Recharge History</h3>{topups.length === 0 ? <p className="text-sm text-slate-500">No recharge found.</p> : topups.slice(0, 6).map((item: any) => <div key={item._id} className="flex flex-col gap-2 rounded-lg border bg-white p-3 text-sm sm:flex-row sm:items-center sm:justify-between"><div><b>{Number(item.quantity || 0).toLocaleString()} SMS</b> · {item.contactNumber || '-'} · {money(item.totalAmount)}<div className="text-xs text-slate-500">{formatDate(item.createdAt)}</div></div><Badge variant={item.status === 'rejected' ? 'destructive' : item.status === 'approved' || item.status === 'paid' ? 'default' : 'outline'}>{item.status}</Badge></div>)}</div></CardContent></Card>
    <div className="grid gap-5 lg:grid-cols-2"><Card className="shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2 text-emerald-700"><CheckCircle2 className="h-5 w-5" /> {t("SMS Sent")}</CardTitle><CardDescription>{t("Recipients whose guardian or parent numbers received SMS this month.")}</CardDescription></CardHeader><CardContent className="max-h-[520px] overflow-auto"><div className="space-y-3">{sentRecipients.length === 0 ? <p className="text-sm text-slate-500">{t("No sent SMS recipients found.")}</p> : sentRecipients.map((item: any) => <div key={`${item.studentId}-sent`} className="rounded-xl border border-emerald-100 bg-emerald-50 p-4"><p className="font-semibold text-slate-900">{item.studentName}</p><p className="break-words text-sm text-slate-600">{t("Guardian")}: {item.guardianName} • {item.guardianPhone}</p><Badge className="mt-2 w-fit bg-emerald-600">{t("Sent")} {item.sentCount}</Badge></div>)}</div></CardContent></Card><Card className="shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2 text-red-700"><XCircle className="h-5 w-5" /> {t("SMS Not Sent")}</CardTitle><CardDescription>{t("Recipients who did not receive SMS this month.")}</CardDescription></CardHeader><CardContent className="max-h-[520px] overflow-auto"><div className="space-y-3">{notSentRecipients.length === 0 ? <p className="text-sm text-slate-500">{t("All recipients have SMS logs for this month.")}</p> : notSentRecipients.map((item: any) => <div key={`${item.studentId}-not-sent`} className="rounded-xl border border-red-100 bg-red-50 p-4"><p className="font-semibold text-slate-900">{item.studentName}</p><p className="break-words text-sm text-slate-600">{t("Guardian")}: {item.guardianName} • {item.guardianPhone}</p><Badge variant="destructive" className="mt-2 w-fit">{t("Not Sent")}</Badge></div>)}</div></CardContent></Card></div>
    <Card className="shadow-sm"><CardHeader><CardTitle>{t("Recent SMS Logs")}</CardTitle><CardDescription>{t("This list will be automatically deleted from the database after one month.")}</CardDescription></CardHeader><CardContent><ResponsiveTable columns={[t('Date'), t('Recipient'), t('Phone'), t('Purpose'), t('Status'), t('Message')]} rows={logs.map((log: any) => [<div key="date" className="text-slate-600">{formatDate(log.sentAt)}</div>, <div key="recipient">{log.recipientName || '-'}</div>, <div key="phone">{log.recipientPhone}</div>, <div key="purpose">{log.purpose || '-'}</div>, <Badge key="status" variant={log.status === 'sent' ? 'default' : log.status === 'failed' ? 'destructive' : 'outline'}>{log.status}</Badge>, <div key="message" className="max-w-[340px] whitespace-normal break-words">{log.message}</div>])} empty={t('No data found')} /></CardContent></Card>
  </div></div>;
}
