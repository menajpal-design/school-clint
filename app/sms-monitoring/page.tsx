"use client";

export const dynamic = 'force-dynamic';
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, MessageSquare, RefreshCw, Send, XCircle } from "lucide-react";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import ResponsiveTable from '@/components/shared/ResponsiveTable';

function currentMonth() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

export default function SmsMonitoringPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const isDenied = user?.role === 'student' || user?.role === 'parent';

  const loadData = async () => {
    if (isDenied) return;
    setLoading(true);
    try {
      const result = await apiClient.get(`/sms/head/monthly?month=${month}`);
      setData(result);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isDenied) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, isDenied]);

  const recipients = Array.isArray(data?.recipients) ? data.recipients : [];
  const logs = Array.isArray(data?.logs) ? data.logs : [];
  const sentRecipients = useMemo(() => recipients.filter((item: any) => item.smsSent), [recipients]);
  const notSentRecipients = useMemo(() => recipients.filter((item: any) => !item.smsSent), [recipients]);

  if (isDenied) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6 text-center bg-slate-50">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 max-w-md shadow-sm">
          <XCircle className="mx-auto h-12 w-12 text-red-600 mb-3" />
          <h2 className="text-xl font-bold text-red-950">Access Denied</h2>
          <p className="mt-2 text-sm text-red-700">You do not have permission to access the SMS Monitoring logs.</p>
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Monthly SMS Limit", value: data?.limit?.monthlySmsLimit || 0, icon: MessageSquare },
    { label: "Used This Month", value: data?.limit?.usedThisMonth || 0, icon: Send },
    { label: "Remaining", value: data?.limit?.remainingThisMonth || 0, icon: CheckCircle2 },
    { label: "Not Sent", value: data?.summary?.notSentRecipients || 0, icon: XCircle },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-3 md:p-6">
      <div className="mx-auto max-w-7xl space-y-5 md:space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between md:p-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">{t("SMS Monitoring")}</h1>
            <p className="mt-1 text-sm leading-6 text-slate-600">{t("View who received SMS this month and who did not. Logs are automatically deleted after one month.")}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2">
              <CalendarDays className="h-4 w-4 text-slate-500" />
              <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="w-full bg-transparent text-sm outline-none" />
            </div>
            <Button onClick={loadData} disabled={loading} className="w-full sm:w-auto">
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {t("Refresh")}
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">{t(stat.label)}</CardTitle>
                  <Icon className="h-5 w-5 text-slate-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900 md:text-3xl">{Number(stat.value).toLocaleString()}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-700"><CheckCircle2 className="h-5 w-5" /> {t("SMS Sent")}</CardTitle>
              <CardDescription>{t("Recipients whose guardian or parent numbers received SMS this month.")}</CardDescription>
            </CardHeader>
            <CardContent className="max-h-[520px] overflow-auto">
              <div className="space-y-3">
                {sentRecipients.length === 0 ? <p className="text-sm text-slate-500">{t("No sent SMS recipients found.")}</p> : sentRecipients.map((item: any) => (
                  <div key={`${item.studentId}-sent`} className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">{item.studentName}</p>
                        <p className="break-words text-sm text-slate-600">{t("Guardian")}: {item.guardianName} • {item.guardianPhone}</p>
                        <p className="text-xs text-slate-500">{t("Last sent")}: {formatDate(item.lastSentAt)}</p>
                      </div>
                      <Badge className="w-fit bg-emerald-600">{t("Sent")} {item.sentCount}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700"><XCircle className="h-5 w-5" /> {t("SMS Not Sent")}</CardTitle>
              <CardDescription>{t("Recipients who did not receive SMS this month.")}</CardDescription>
            </CardHeader>
            <CardContent className="max-h-[520px] overflow-auto">
              <div className="space-y-3">
                {notSentRecipients.length === 0 ? <p className="text-sm text-slate-500">{t("All recipients have SMS logs for this month.")}</p> : notSentRecipients.map((item: any) => (
                  <div key={`${item.studentId}-not-sent`} className="rounded-xl border border-red-100 bg-red-50 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">{item.studentName}</p>
                        <p className="break-words text-sm text-slate-600">{t("Guardian")}: {item.guardianName} • {item.guardianPhone}</p>
                        <p className="text-xs text-slate-500">{t("Roll")}: {item.rollNumber || "-"}</p>
                      </div>
                      <Badge variant="destructive" className="w-fit">{t("Not Sent")}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>{t("Recent SMS Logs")}</CardTitle>
            <CardDescription>{t("This list will be automatically deleted from the database after one month.")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 md:hidden">
              {logs.length === 0 ? <p className="text-sm text-slate-500">{t("No data found")}</p> : logs.map((log: any) => (
                <div key={log._id} className="rounded-2xl border bg-white p-4 shadow-sm">
                  <div className="grid gap-3 text-sm">
                    <InfoRow label={t("Date")} value={formatDate(log.sentAt)} />
                    <InfoRow label={t("Recipient")} value={log.recipientName || "-"} />
                    <InfoRow label={t("Phone")} value={log.recipientPhone || "-"} />
                    <InfoRow label={t("Purpose")} value={log.purpose || "-"} />
                    <div className="grid grid-cols-[92px_1fr] gap-3">
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{t("Status")}</span>
                      <Badge className="w-fit" variant={log.status === "sent" ? "default" : log.status === "failed" ? "destructive" : "outline"}>{log.status}</Badge>
                    </div>
                    <InfoRow label={t("Message")} value={log.message || "-"} multiline />
                  </div>
                </div>
              ))}
            </div>

            <ResponsiveTable
              columns={[t('Date'), t('Recipient'), t('Phone'), t('Purpose'), t('Status'), t('Message')]}
              rows={logs.map((log: any) => ([
                <div key="date" className="text-slate-600">{formatDate(log.sentAt)}</div>,
                <div key="recipient">{log.recipientName || '-'}</div>,
                <div key="phone">{log.recipientPhone}</div>,
                <div key="purpose">{log.purpose || '-'}</div>,
                <Badge key="status" variant={log.status === 'sent' ? 'default' : log.status === 'failed' ? 'destructive' : 'outline'}>{log.status}</Badge>,
                <div key="message" className="max-w-[340px] whitespace-normal break-words">{log.message}</div>,
              ]))}
              empty={t('No data found')}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({ label, value, multiline = false }: { label: string; value: React.ReactNode; multiline?: boolean }) {
  return (
    <div className="grid grid-cols-[92px_1fr] gap-3">
      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
      <span className={`min-w-0 text-slate-800 ${multiline ? "whitespace-pre-wrap break-words leading-6" : "break-words"}`}>{value}</span>
    </div>
  );
}
