"use client";

import { useEffect, useState } from "react";
import { CreditCard, ExternalLink, Save, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api";

const GATEWAYFLOW_ORIGIN = "https://payment-gateway-server-ten.vercel.app";
const GATEWAYFLOW_WIDGET = "https://payment-gateway-server-ten.vercel.app/widget.js";

const providerOptions = [
  { id: "recommended_gateway", label: "GatewayFlow Recommended", note: "Hosted popup. Only website API key/secret, receiver number and methods are needed." },
  { id: "bkash", label: "bKash Official", note: "Official merchant fields: app key, app secret, username, password, merchant number." },
  { id: "nagad", label: "Nagad Official", note: "Official merchant fields: merchant ID, merchant number, public/private key." },
  { id: "sslcommerz", label: "SSLCommerz", note: "Store ID, store password and return/IPN URLs." },
  { id: "manual_bank", label: "Manual Bank", note: "Bank transfer/manual verification inside school." },
  { id: "manual_cash", label: "Cash", note: "Cash payment and receipt inside school." },
  { id: "custom", label: "Custom Gateway", note: "Any other school-owned gateway." },
];

export function PaymentSettingsPanel() {
  const [enabledProviders, setEnabledProviders] = useState<string[]>(["recommended_gateway", "manual_cash"]);
  const [defaultProvider, setDefaultProvider] = useState("recommended_gateway");
  const [bkash, setBkash] = useState({ merchantNumber: "", appKey: "", appSecret: "", username: "", password: "", mode: "live" });
  const [nagad, setNagad] = useState({ merchantNumber: "", merchantId: "", publicKey: "", privateKey: "", mode: "live" });
  const [sslcommerz, setSslcommerz] = useState({ storeId: "", storePassword: "", mode: "live", ipnUrl: "", successUrl: "", failUrl: "", cancelUrl: "" });
  const [recommendedGateway, setRecommendedGateway] = useState({ origin: GATEWAYFLOW_ORIGIN, widgetScript: GATEWAYFLOW_WIDGET, apiKey: "", secretKey: "", receiverNumber: "", receiverName: "", paymentMethods: "bkash,nagad" });
  const [manualBank, setManualBank] = useState({ bankName: "", accountName: "", accountNumber: "", branch: "", instructions: "" });
  const [custom, setCustom] = useState({ name: "", endpoint: "", apiKey: "", secretKey: "" });
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiClient.get("/site-settings/site-config", { skipToast: true }).then((res: any) => {
      const cfg = res?.config?.paymentGatewaySettings || {};
      if (Array.isArray(cfg.enabledProviders)) setEnabledProviders(cfg.enabledProviders.length ? cfg.enabledProviders : ["recommended_gateway", "manual_cash"]);
      if (cfg.defaultProvider) setDefaultProvider(cfg.defaultProvider);
      if (cfg.bkash) setBkash((x) => ({ ...x, ...cfg.bkash, appKey: "", appSecret: "", username: "", password: "" }));
      if (cfg.nagad) setNagad((x) => ({ ...x, ...cfg.nagad, publicKey: "", privateKey: "" }));
      if (cfg.sslcommerz) setSslcommerz((x) => ({ ...x, ...cfg.sslcommerz, storePassword: "" }));
      if (cfg.recommendedGateway) setRecommendedGateway((x) => ({ ...x, ...cfg.recommendedGateway, origin: GATEWAYFLOW_ORIGIN, widgetScript: GATEWAYFLOW_WIDGET, apiKey: "", secretKey: "", paymentMethods: Array.isArray(cfg.recommendedGateway.paymentMethods) ? cfg.recommendedGateway.paymentMethods.join(",") : (cfg.recommendedGateway.paymentMethods || "bkash,nagad") }));
      if (cfg.manualBank) setManualBank((x) => ({ ...x, ...cfg.manualBank }));
      if (cfg.custom) setCustom((x) => ({ ...x, ...cfg.custom, apiKey: "", secretKey: "" }));
    }).catch(() => undefined);
  }, []);

  const toggle = (id: string) => setEnabledProviders((current) => current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  const save = async () => {
    setSaving(true); setStatus("");
    try {
      const methods = String(recommendedGateway.paymentMethods || "bkash,nagad").split(",").map((x) => x.trim()).filter(Boolean);
      const payload = {
        onlinePaymentEnabled: enabledProviders.some((p) => !["manual_cash", "manual_bank"].includes(p)),
        enabledProviders: enabledProviders.includes("recommended_gateway") ? enabledProviders : ["recommended_gateway", ...enabledProviders],
        defaultProvider: defaultProvider || "recommended_gateway",
        bkash,
        nagad,
        sslcommerz,
        recommendedGateway: { ...recommendedGateway, origin: GATEWAYFLOW_ORIGIN, endpoint: GATEWAYFLOW_ORIGIN, widgetScript: GATEWAYFLOW_WIDGET, paymentMethods: methods },
        manualBank,
        custom,
        transactionOwner: "school",
        siteCommissionEnabled: false,
        recommendedGatewayUrl: GATEWAYFLOW_ORIGIN,
      };
      await apiClient.put("/site-settings/site-config", { paymentGatewaySettings: payload });
      setStatus("✅ Payment settings saved. Recommended GatewayFlow uses only API key/secret, receiver number and allowed methods.");
    } catch (e: any) { setStatus(`❌ ${e?.message || "Payment settings save failed"}`); }
    finally { setSaving(false); }
  };

  return <Card className="border-2 border-violet-200">
    <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-violet-700" />School Payment System</CardTitle><CardDescription>প্রতি স্কুল নিজের payment system চালু করবে। Recommended GatewayFlow popup এ customer TrxID দেবে না; sender number + exact amount + SMS receive time match হবে। Official bKash/Nagad/SSLCommerz হলে তাদের merchant credentials লাগবে।</CardDescription></CardHeader>
    <CardContent className="space-y-5">
      <div className="rounded-lg border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900"><ShieldCheck className="mb-2 h-4 w-4" /> GatewayFlow origin: <b>{GATEWAYFLOW_ORIGIN}</b><br />Widget script: <b>{GATEWAYFLOW_WIDGET}</b><br /><a className="inline-flex items-center gap-1 font-bold underline" href={GATEWAYFLOW_ORIGIN} target="_blank" rel="noreferrer">Open GatewayFlow<ExternalLink className="h-3 w-3" /></a></div>
      <div className="grid gap-3 md:grid-cols-3">{providerOptions.map((p) => <label key={p.id} className={`rounded-lg border p-3 text-sm ${enabledProviders.includes(p.id) ? "border-violet-500 bg-violet-50" : ""}`}><div className="flex items-center gap-2"><input type="checkbox" checked={enabledProviders.includes(p.id)} onChange={() => toggle(p.id)} /><b>{p.label}</b></div><p className="mt-1 text-xs text-muted-foreground">{p.note}</p></label>)}</div>
      <label className="block space-y-2"><span className="text-sm font-medium">Default payment method</span><select className="h-10 w-full rounded-md border px-3 text-sm" value={defaultProvider} onChange={(e) => setDefaultProvider(e.target.value)}>{providerOptions.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}</select></label>
      <GatewayBox title="GatewayFlow Recommended"><Read value={recommendedGateway.origin} label="Gateway Origin" /><Read value={recommendedGateway.widgetScript} label="Widget Script" /><Text value={recommendedGateway.apiKey} label="Website API Key" secret onChange={(v)=>setRecommendedGateway({...recommendedGateway, apiKey:v})}/><Text value={recommendedGateway.secretKey} label="Secret Key" secret onChange={(v)=>setRecommendedGateway({...recommendedGateway, secretKey:v})}/><Text value={recommendedGateway.receiverNumber} label="Receiver Wallet Number" onChange={(v)=>setRecommendedGateway({...recommendedGateway, receiverNumber:v})}/><Text value={recommendedGateway.receiverName} label="Receiver Name" onChange={(v)=>setRecommendedGateway({...recommendedGateway, receiverName:v})}/><Text value={recommendedGateway.paymentMethods} label="Popup Methods comma separated" onChange={(v)=>setRecommendedGateway({...recommendedGateway, paymentMethods:v})}/></GatewayBox>
      <GatewayBox title="bKash Official"><Text value={bkash.merchantNumber} label="Merchant Number" onChange={(v)=>setBkash({...bkash, merchantNumber:v})}/><Text value={bkash.appKey} label="App Key" secret onChange={(v)=>setBkash({...bkash, appKey:v})}/><Text value={bkash.appSecret} label="App Secret" secret onChange={(v)=>setBkash({...bkash, appSecret:v})}/><Text value={bkash.username} label="Username" secret onChange={(v)=>setBkash({...bkash, username:v})}/><Text value={bkash.password} label="Password" secret onChange={(v)=>setBkash({...bkash, password:v})}/><Mode value={bkash.mode} onChange={(v)=>setBkash({...bkash, mode:v})}/></GatewayBox>
      <GatewayBox title="Nagad Official"><Text value={nagad.merchantNumber} label="Merchant Number" onChange={(v)=>setNagad({...nagad, merchantNumber:v})}/><Text value={nagad.merchantId} label="Merchant ID" onChange={(v)=>setNagad({...nagad, merchantId:v})}/><Text value={nagad.publicKey} label="Public Key" secret onChange={(v)=>setNagad({...nagad, publicKey:v})}/><Text value={nagad.privateKey} label="Private Key" secret onChange={(v)=>setNagad({...nagad, privateKey:v})}/><Mode value={nagad.mode} onChange={(v)=>setNagad({...nagad, mode:v})}/></GatewayBox>
      <GatewayBox title="SSLCommerz"><Text value={sslcommerz.storeId} label="Store ID" onChange={(v)=>setSslcommerz({...sslcommerz, storeId:v})}/><Text value={sslcommerz.storePassword} label="Store Password" secret onChange={(v)=>setSslcommerz({...sslcommerz, storePassword:v})}/><Mode value={sslcommerz.mode} onChange={(v)=>setSslcommerz({...sslcommerz, mode:v})}/><Text value={sslcommerz.ipnUrl} label="IPN URL" onChange={(v)=>setSslcommerz({...sslcommerz, ipnUrl:v})}/><Text value={sslcommerz.successUrl} label="Success URL" onChange={(v)=>setSslcommerz({...sslcommerz, successUrl:v})}/><Text value={sslcommerz.failUrl} label="Fail URL" onChange={(v)=>setSslcommerz({...sslcommerz, failUrl:v})}/><Text value={sslcommerz.cancelUrl} label="Cancel URL" onChange={(v)=>setSslcommerz({...sslcommerz, cancelUrl:v})}/></GatewayBox>
      <GatewayBox title="Manual Bank"><Text value={manualBank.bankName} label="Bank Name" onChange={(v)=>setManualBank({...manualBank, bankName:v})}/><Text value={manualBank.accountName} label="Account Name" onChange={(v)=>setManualBank({...manualBank, accountName:v})}/><Text value={manualBank.accountNumber} label="Account Number" onChange={(v)=>setManualBank({...manualBank, accountNumber:v})}/><Text value={manualBank.branch} label="Branch" onChange={(v)=>setManualBank({...manualBank, branch:v})}/><Text value={manualBank.instructions} label="Instructions" onChange={(v)=>setManualBank({...manualBank, instructions:v})}/></GatewayBox>
      <GatewayBox title="Custom Gateway"><Text value={custom.name} label="Gateway Name" onChange={(v)=>setCustom({...custom, name:v})}/><Text value={custom.endpoint} label="Endpoint URL" onChange={(v)=>setCustom({...custom, endpoint:v})}/><Text value={custom.apiKey} label="API Key" secret onChange={(v)=>setCustom({...custom, apiKey:v})}/><Text value={custom.secretKey} label="Secret Key" secret onChange={(v)=>setCustom({...custom, secretKey:v})}/></GatewayBox>
      <div className="flex items-center gap-3"><Button onClick={save} disabled={saving}><Save className="mr-2 h-4 w-4" />{saving ? "Saving..." : "Save Payment Settings"}</Button>{status && <span className="text-sm font-medium">{status}</span>}</div>
    </CardContent>
  </Card>;
}

function GatewayBox({ title, children }: { title: string; children: React.ReactNode }) { return <div className="rounded-xl border p-4"><h3 className="mb-3 font-semibold">{title}</h3><div className="grid gap-3 md:grid-cols-2">{children}</div></div>; }
function Text({ label, value, onChange, secret }: { label: string; value: string; onChange: (v: string) => void; secret?: boolean }) { return <label className="space-y-1"><span className="text-xs font-bold uppercase text-muted-foreground">{label}</span><input type={secret ? "password" : "text"} className="h-10 w-full rounded-md border px-3 text-sm" value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={secret ? "New secret only" : label} /></label>; }
function Read({ label, value }: { label: string; value: string }) { return <label className="space-y-1"><span className="text-xs font-bold uppercase text-muted-foreground">{label}</span><input readOnly className="h-10 w-full rounded-md border bg-muted px-3 text-sm" value={value || ""} /></label>; }
function Mode({ value, onChange }: { value: string; onChange: (v: string) => void }) { return <label className="space-y-1"><span className="text-xs font-bold uppercase text-muted-foreground">Mode</span><select className="h-10 w-full rounded-md border px-3 text-sm" value={value || "live"} onChange={(e)=>onChange(e.target.value)}><option value="sandbox">Sandbox</option><option value="live">Live</option></select></label>; }
