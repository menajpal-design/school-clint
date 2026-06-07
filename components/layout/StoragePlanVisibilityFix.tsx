"use client";

import { useEffect } from "react";
import { apiClient } from "@/lib/api";

function isEasySchoolStorageActive(data: any) {
  const billing = data?.institution?.billing || data?.billing || data?.profile?.institution?.billing || data?.user?.institution?.billing || {};
  return billing.useEasySchoolStorage === true || String(billing.storagePlan || "").toLowerCase().includes("easy") || Number(billing.storageAmount || billing.storageMonthlyPrice || 0) > 0;
}

function hideMongoDbSetupCard() {
  if (!window.location.pathname.startsWith("/settings")) return;
  document.querySelectorAll(".rounded-2xl, .rounded-xl, .rounded-lg, [data-slot='card'], section, div").forEach((node) => {
    const text = node.textContent || "";
    if (text.includes("MongoDB Storage Setup") || text.includes("Personal MongoDB URI")) {
      const el = node as HTMLElement;
      if (el.querySelector("input[placeholder*='MongoDB']") || text.includes("New MongoDB URI")) el.style.display = "none";
    }
  });
  if (!document.querySelector("[data-easy-storage-note]")) {
    const container = document.querySelector("main, .space-y-5") || document.body;
    const note = document.createElement("div");
    note.setAttribute("data-easy-storage-note", "true");
    note.className = "rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800";
    note.textContent = "✅ EasySchool storage plan active — এই স্কুলের জন্য আলাদা MongoDB setup প্রয়োজন নেই।";
    container.insertBefore(note, container.firstChild);
  }
}

export function StoragePlanVisibilityFix() {
  useEffect(() => {
    if (!window.location.pathname.startsWith("/settings")) return;
    let enabled = false;
    apiClient.get("/auth/profile", { skipToast: true }).then((data: any) => {
      enabled = isEasySchoolStorageActive(data);
      if (enabled) hideMongoDbSetupCard();
    }).catch(() => undefined);
    const id = window.setInterval(() => { if (enabled) hideMongoDbSetupCard(); }, 700);
    return () => window.clearInterval(id);
  }, []);
  return null;
}
