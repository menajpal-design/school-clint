"use client";

import SettingsFullClient from "./SettingsFullClient";
import { PaymentSettingsPanel } from "./PaymentSettingsPanel";

export default function SettingsPageWithPayments() {
  return (
    <div className="space-y-5">
      <SettingsFullClient />
      <div className="p-3 pt-0 md:p-6 md:pt-0">
        <PaymentSettingsPanel />
      </div>
    </div>
  );
}
