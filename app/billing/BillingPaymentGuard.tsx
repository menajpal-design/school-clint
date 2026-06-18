'use client';

import { useEffect } from 'react';

const gatewayApiKey = process.env.NEXT_PUBLIC_GATEWAY_API_KEY || '';

const isMissingPhone = (value: unknown) => {
  const phone = String(value || '').trim();
  if (!phone) return true;
  return ['not provided', 'undefined', 'null', 'n/a'].includes(phone.toLowerCase());
};

const normalizePhone = (value: unknown) => String(value || '').replace(/\s+/g, '').trim();

export default function BillingPaymentGuard() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let stopped = false;

    const patchGatewayWidget = () => {
      const gateway = (window as any).GatewayWidget;
      if (!gateway || typeof gateway.open !== 'function' || gateway.__easySchoolPaymentPatched) {
        return;
      }

      const originalOpen = gateway.open.bind(gateway);
      gateway.open = (options: any = {}) => {
        const apiKey = options.apiKey || options.api_key || gatewayApiKey;
        if (!apiKey) {
          alert('Payment API key missing. Please configure NEXT_PUBLIC_GATEWAY_API_KEY before opening GatewayFlow checkout.');
          return;
        }

        let payerNumber = normalizePhone(
          options.payer_number ||
          options.payerNumber ||
          options.customerPhone ||
          options.senderNumber ||
          options.mobileNumber
        );

        if (isMissingPhone(payerNumber)) {
          const entered = window.prompt('Enter payer bKash/Nagad number for payment verification:') || '';
          payerNumber = normalizePhone(entered);
        }

        if (isMissingPhone(payerNumber)) {
          alert('Payer number is required for GatewayFlow payment verification.');
          return;
        }

        const amount = Number(options.amount || 0);
        if (!amount || amount <= 0) {
          alert('Valid payment amount is required.');
          return;
        }

        return originalOpen({
          ...options,
          apiKey,
          api_key: apiKey,
          amount,
          customerPhone: payerNumber,
          payerNumber,
          payer_number: payerNumber,
        });
      };
      gateway.__easySchoolPaymentPatched = true;
    };

    patchGatewayWidget();
    const timer = window.setInterval(() => {
      if (stopped) return;
      patchGatewayWidget();
    }, 500);

    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, []);

  return null;
}
