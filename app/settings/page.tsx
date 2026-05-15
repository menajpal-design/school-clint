"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getPreferredCurrency, setPreferredCurrency } from "@/lib/utils";

export default function SettingsPage() {
  const [currency, setCurrency] = useState<'BDT' | 'USD'>(() => getPreferredCurrency());
  useEffect(() => setCurrency(getPreferredCurrency()), []);

  const save = () => {
    setPreferredCurrency(currency);
    // small feedback could be added later
  };

  return (
    <div className="p-6">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Personalize application preferences.</p>
      </div>

      <div className="mt-6 grid max-w-3xl gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Currency</CardTitle>
            <CardDescription>Choose display currency for finance pages. Default is Bangladeshi Taka (৳).</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input type="radio" name="currency" value="BDT" checked={currency === 'BDT'} onChange={() => setCurrency('BDT')} />
                <span>BDT (৳)</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="currency" value="USD" checked={currency === 'USD'} onChange={() => setCurrency('USD')} />
                <span>USD ($)</span>
              </label>
            </div>
            <div className="mt-4">
              <Button onClick={save}>Save preference</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
