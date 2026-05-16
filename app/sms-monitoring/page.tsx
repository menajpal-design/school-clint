"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, MessageSquare, RefreshCw, Send, XCircle } from "lucide-react";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/i18n";

function currentMonth() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

export default function SmsMonitoringPage() {
  const { t } = useLanguage();
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
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
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const recipients = Array.isArray(data?.recipients) ? data.recipients : [];
  const sentRecipients = useMemo(() => recipients.filter((item: any) => item.smsSent), [recipients]);
  const notSentRecipients = useMemo(() => recipients.filter((item: any) => !item.smsSent), [recipients]);

  const stats = [
    { label: "Monthly SMS Limit", value: data?.limit?.monthlySmsLimit || 0, icon: MessageSquare },
    { label: "Used This Month", value: data?.limit?.usedThisMonth || 0, icon: Send },
    { label: "Remaining", value: data?.limit?.remainingThisMonth || 0, icon: CheckCircle2 },
    { label: "Not Sent", value: data?.summary?.notSentRecipients || 0, icon: XCircle },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{t("SMS Monitoring")}</h1>
            <p className="mt-1 text-sm text-slate-600">{t("View who received SMS this month and who did not. Logs are automatically deleted after one month.")}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2">
              <CalendarDays className="h-4 w-4 text-slate-500" />
              <input
                type="month"
                value={month}
                onChange={(event) => setMonth(event.target.value)}
                className="bg-transparent text-sm outline-none"
              />
            </div>
            <Button onClick={loadData} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {t("Refresh")}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">{t(stat.label)}</CardTitle>
                  <Icon className="h-5 w-5 text-slate-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">{Number(stat.value).toLocaleString()}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-700"><CheckCircle2 className="h-5 w-5" /> {t("SMS Sent")}</CardTitle>
              <CardDescription>{t("Recipients whose guardian or parent numbers received SMS this month.")}</CardDescription>
            </CardHeader>
            <CardContent className="max-h-[520px] overflow-auto">
              <div className="space-y-3">
                {sentRecipients.length === 0 ? <p className="text-sm text-slate-500">{t("No sent SMS recipients found.")}</p> : sentRecipients.map((item: any) => (
                  <div key={`${item.studentId}-sent`} className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{item.studentName}</p>
                        <p className="text-sm text-slate-600">{t("Guardian")}: {item.guardianName} • {item.guardianPhone}</p>
                        <p className="text-xs text-slate-500">{t("Last sent")}: {formatDate(item.lastSentAt)}</p>
                      </div>
                      <Badge className="bg-emerald-600">{t("Sent")} {item.sentCount}</Badge>
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
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{item.studentName}</p>
                        <p className="text-sm text-slate-600">{t("Guardian")}: {item.guardianName} • {item.guardianPhone}</p>
                        <p className="text-xs text-slate-500">{t("Roll")}: {item.rollNumber || "-"}</p>
                      </div>
                      <Badge variant="destructive">{t("Not Sent")}</Badge>
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
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead>
                <tr className="border-b text-slate-600">
                  <th className="py-3">{t("Date")}</th>
                  <th>{t("Recipient")}</th>
                  <th>{t("Phone")}</th>
                  <th>{t("Purpose")}</th>
                  <th>{t("Status")}</th>
                  <th>{t("Message")}</th>
                </tr>
              </thead>
              <tbody>
                {(Array.isArray(data?.logs) ? data.logs : []).map((log: any) => (
                  <tr key={log._id} className="border-b last:border-0">
                    <td className="py-3 text-slate-600">{formatDate(log.sentAt)}</td>
                    <td>{log.recipientName}</td>
                    <td>{log.recipientPhone}</td>
                    <td>{log.purpose || "-"}</td>
                    <td><Badge variant={log.status === "sent" ? "default" : log.status === "failed" ? "destructive" : "outline"}>{log.status}</Badge></td>
                    <td className="max-w-[280px] truncate">{log.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
