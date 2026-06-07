"use client";

import "@/lib/attendance-api-compat";
import { useEffect } from "react";
import { StudentFormExtraFields } from "@/components/layout/StudentFormExtraFields";
import { StoragePlanVisibilityFix } from "@/components/layout/StoragePlanVisibilityFix";
import { FinanceGlobalPeriodFilter } from "@/components/layout/FinanceGlobalPeriodFilter";
import { PdfPrintSafetyStyles } from "@/components/layout/PdfPrintSafetyStyles";
import { StudentFeePaymentPanel } from "@/components/layout/StudentFeePaymentPanel";

function hideStudentFeeField() {
  if (!window.location.pathname.includes("/institution/students") && !window.location.pathname.includes("/institution/admission")) return;
  document.querySelectorAll("label").forEach((label) => {
    const text = (label.textContent || "").trim();
    if (text === "Fee Amount" || text.startsWith("Fee Amount")) (label as HTMLElement).style.display = "none";
  });
  document.querySelectorAll("input").forEach((input) => {
    const parent = input.closest("label") as HTMLElement | null;
    if (parent && (parent.textContent || "").trim().startsWith("Fee Amount")) parent.style.display = "none";
  });
}

function fixPublicButtonColors() {
  if (!["/admission", "/"].includes(window.location.pathname)) return;
  document.querySelectorAll("button, a").forEach((el) => {
    const text = (el.textContent || "").trim().toLowerCase();
    if (text.includes("submit application") || text.includes("learn more")) {
      const node = el as HTMLElement;
      node.style.color = "#ffffff";
      node.style.backgroundColor = "#4338ca";
      node.style.borderColor = "#4338ca";
      node.style.opacity = "1";
      node.style.textShadow = "none";
    }
  });
}

export function AttendanceApiCompatLoader() {
  useEffect(() => {
    const run = () => { hideStudentFeeField(); fixPublicButtonColors(); };
    run();
    const id = window.setInterval(run, 500);
    return () => window.clearInterval(id);
  }, []);
  return <><StudentFormExtraFields /><StoragePlanVisibilityFix /><FinanceGlobalPeriodFilter /><PdfPrintSafetyStyles /><StudentFeePaymentPanel /></>;
}
