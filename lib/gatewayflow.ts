const GATEWAYFLOW_ORIGIN = "https://payment-gateway-server-ten.vercel.app";
const GATEWAYFLOW_SCRIPT = `${GATEWAYFLOW_ORIGIN}/widget.js`;

type GatewayFlowOpenOptions = {
  apiKey: string;
  domain: string;
  amount: number;
  orderId: string;
  receiverNumber?: string;
  paymentMethods?: string[];
  callback?: string;
};

declare global {
  interface Window {
    GATEWAY_WIDGET_URL?: string;
    GatewayWidget?: { open: (options: GatewayFlowOpenOptions) => void };
  }
}

let loadingPromise: Promise<void> | null = null;

export function loadGatewayFlowWidget() {
  if (typeof window === "undefined") return Promise.reject(new Error("GatewayFlow can run only in browser."));
  window.GATEWAY_WIDGET_URL = GATEWAYFLOW_ORIGIN;
  if (window.GatewayWidget?.open) return Promise.resolve();
  if (loadingPromise) return loadingPromise;
  loadingPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GATEWAYFLOW_SCRIPT}"]`) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("GatewayFlow widget load failed.")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = GATEWAYFLOW_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("GatewayFlow widget load failed."));
    document.head.appendChild(script);
  });
  return loadingPromise;
}

export async function openGatewayFlow(options: GatewayFlowOpenOptions) {
  await loadGatewayFlowWidget();
  if (!window.GatewayWidget?.open) throw new Error("GatewayFlow widget is not available.");
  window.GatewayWidget.open(options);
}
