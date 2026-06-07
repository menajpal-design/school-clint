"use client";

import { useEffect, useState } from "react";
import { CreditCard, Save, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api";

const providerOptions = [
  { id: "recommended_gateway", label: "Recommended Gateway", note: "Easy School suggested hosted gateway. Money will go to the school configured account." },
  { id: "bkash", label: "bKash", note: "School Head adds own bKash merchant credentials." },
  { id: "nagad", label: "Nagad", note: "School Head adds own Nagad merchant credentials." },
  { id: "manual_bank", label: "Manual Bank", note: "Bank transfer/manual verification inside school." },
  { id: "manual_cash", label: "Cash", note: "Cash payment and receipt inside school." },
  { id: "custom", label: "Custom Gateway", note: "Any other school-owned gateway." },
];

export function PaymentSettingsPanel() {
  const [enabledProviders, setEnabledProviders] = useState<string[]>(["manual_cash"]);
  const [defaultProvider, setDefaultProvider] = useState("manual_cash");
  const [bkash, setBkash] = useState({ merchantNumber: "", appKey: "", appSecret: "", username: "", password: "" });
  const [nagad, setNagad] = useState({ merchantNumber: "", merchantId: "", publicKey: "", privateKey: "" });
  const [recommendedGateway, setRecommendedGateway] = useState({ accountId: "", apiKey: "", secretKey: "" });
  const [manualBank, setManualBank] = useState({ bankName: "", accountName: "", accountNumber: "", branch: "", instructions: "" });
  const [custom, setCustom] = useState({ name: "", endpoint: "", apiKey: "", secretKey: "" });
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiClient.get("/site-settings/site-config", { skipToast: true }).then((res: any) => {
      const cfg = res?.config?.paymentGatewaySettings || {};
      if (Array.isArray(cfg.enabledProviders)) setEnabledProviders(cfg.enabledProviders);
      if (cfg.defaultProvider) setDefaultProvider(cfg.defaultProvider);
      if (cfg.bkash) setBkash((x) => ({ ...x, ...cfg.bkash, appKey: "", appSecret: "", username: "", password: "" }));
      if (cfg.nagad) setNagad((x) => ({ ...x, ...cfg.nagad, publicKey: "", privateKey: "" }));
      if (cfg.recommendedGateway) setRecommendedGateway((x) => ({ ...x, ...cfg.recommendedGateway, apiKey: "", secretKey: "" }));
      if (cfg.manualBank) setManualBank((x) => ({ ...x, ...cfg.manualBank }));
      if (cfg.custom) setCustom((x) => ({ ...x, ...cfg.custom, apiKey: "", secretKey: "" }));
    }).catch(() => undefined);
  }, []);

  const toggle = (id: string) => setEnabledProviders((current) => current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  const save = async () => {
    setSaving(true); setStatus("");
    try {
      await apiClient.put("/site-settings/site-config", { paymentGatewaySettings: { enabledProviders, defaultProvider, bkash, nagad, recommendedGateway, manualBank, custom, transactionOwner: "school", siteCommissionEnabled: false } });
      setStatus("✅ Payment settings saved. Secret values are not shown after saving.");
    } catch (e: any) { setStatus(`❌ ${e?.message || "Payment settings save failed"}`); }
    finally { setSaving(false); }
  };

  return <Card className="border-2 border-violet-200">
    <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-violet-700" />School Payment System</CardTitle><CardDescription>প্রতি স্কুল নিজের payment system চালু করবে। bKash/Nagad/manual/custom credential Head গোপনে save করবে। টাকা স্কুলের account-এ যাবে; Easy School শুধু recommended gateway suggest করবে।</CardDescription></CardHeader>
    <CardContent className="space-y-5">
      <div className="rounded-lg border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900"><ShieldCheck className="mb-2 h-4 w-4" /> Saved gateway secrets plain text দেখানো হবে না। প্রয়োজন হলে নতুন credential দিয়ে replace করুন।</div>
      <div className="grid gap-3 md:grid-cols-3">{providerOptions.map((p) => <label key={p.id} className={`rounded-lg border p-3 text-sm ${enabledProviders.includes(p.id) ? "border-violet-500 bg-violet-50" : ""}`}><div className="flex items-center gap-2"><input type="checkbox" checked={enabledProviders.includes(p.id)} onChange={() => toggle(p.id)} /><b>{p.label}</b></div><p className="mt-1 text-xs text-muted-foreground">{p.note}</p></label>)}</div>
      <label className="block space-y-2"><span className="text-sm font-medium">Default payment method</span><select className="h-10 w-full rounded-md border px-3 text-sm" value={defaultProvider} onChange={(e) => setDefaultProvider(e.target.value)}>{providerOptions.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}</select></label>
      <GatewayBox title="Recommended Gateway"><Text value={recommendedGateway.accountId} label="School Account ID" onChange={(v)=>setRecommendedGateway({...recommendedGateway, accountId:v})}/><Text value={recommendedGateway.apiKey} label="API Key" secret onChange={(v)=>setRecommendedGateway({...recommendedGateway, apiKey:v})}/><Text value={recommendedGateway.secretKey} label="Secret Key" secret onChange={(v)=>setRecommendedGateway({...recommendedGateway, secretKey:v})}/></GatewayBox>
      <GatewayBox title="bKash"><Text value={bkash.merchantNumber} label="Merchant Number" onChange={(v)=>setBkash({...bkash, merchantNumber:v})}/><Text value={bkash.appKey} label="App Key" secret onChange={(v)=>setBkash({...bkash, appKey:v})}/><Text value={bkash.appSecret} label="App Secret" secret onChange={(v)=>setBkash({...bkash, appSecret:v})}/><Text value={bkash.username} label="Username" secret onChange={(v)=>setBkash({...bkash, username:v})}/><Text value={bkash.password} label="Password" secret onChange={(v)=>setBkash({...bkash, password:v})}/></GatewayBox>
      <GatewayBox title="Nagad"><Text value={nagad.merchantNumber} label="Merchant Number" onChange={(v)=>setNagad({...nagad, merchantNumber:v})}/><Text value={nagad.merchantId} label="Merchant ID" onChange={(v)=>setNagad({...nagad, merchantId:v})}/><Text value={nagad.publicKey} label="Public Key" secret onChange={(v)=>setNagad({...nagad, publicKey:v})}/><Text value={nagad.privateKey} label="Private Key" secret onChange={(v)=>setNagad({...nagad, privateKey:v})}/></GatewayBox>
      <GatewayBox title="Manual Bank"><Text value={manualBank.bankName} label="Bank Name" onChange={(v)=>setManualBank({...manualBank, bankName:v})}/><Text value={manualBank.accountName} label="Account Name" onChange={(v)=>setManualBank({...manualBank, accountName:v})}/><Text value={manualBank.accountNumber} label="Account Number" onChange={(v)=>setManualBank({...manualBank, accountNumber:v})}/><Text value={manualBank.branch} label="Branch" onChange={(v)=>setManualBank({...manualBank, branch:v})}/><Text value={manualBank.instructions} label="Instructions" onChange={(v)=>setManualBank({...manualBank, instructions:v})}/></GatewayBox>
      <GatewayBox title="Custom Gateway"><Text value={custom.name} label="Gateway Name" onChange={(v)=>setCustom({...custom, name:v})}/><Text value={custom.endpoint} label="Endpoint URL" onChange={(v)=>setCustom({...custom, endpoint:v})}/><Text value={custom.apiKey} label="API Key" secret onChange={(v)=>setCustom({...custom, apiKey:v})}/><Text value={custom.secretKey} label="Secret Key" secret onChange={(v)=>setCustom({...custom, secretKey:v})}/></GatewayBox>
      <div className="flex items-center gap-3"><Button onClick={save} disabled={saving}><Save className="mr-2 h-4 w-4" />{saving ? "Saving..." : "Save Payment Settings"}</Button>{status && <span className="text-sm font-medium">{status}</span>}</div>
    </CardContent>
  </Card>;
}

function GatewayBox({ title, children }: { title: string; children: React.ReactNode }) { return <div className="rounded-xl border p-4"><h3 className="mb-3 font-semibold">{title}</h3><div className="grid gap-3 md:grid-cols-2">{children}</div></div>; }
function Text({ label, value, onChange, secret }: { label: string; value: string; onChange: (v: string) => void; secret?: boolean }) { return <label className="space-y-1"><span className="text-xs font-bold uppercase text-muted-foreground">{label}</span><input type={secret ? "password" : "text"} className="h-10 w-full rounded-md border px-3 text-sm" value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={secret ? "New secret only" : label} /></label>; }
