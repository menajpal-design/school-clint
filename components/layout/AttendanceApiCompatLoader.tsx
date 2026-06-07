"use client";

import "@/lib/attendance-api-compat";
import { useEffect } from "react";

function hideStudentFeeField() {
  if (!window.location.pathname.includes("/institution/students") && !window.location.pathname.includes("/institution/admission")) return;
  document.querySelectorAll("label").forEach((label) => {
    const text = (label.textContent || "").trim();
    if (text === "Fee Amount" || text.startsWith("Fee Amount")) {
      (label as HTMLElement).style.display = "none";
    }
  });
  document.querySelectorAll("input").forEach((input) => {
    const parent = input.closest("label") as HTMLElement | null;
    if (parent && (parent.textContent || "").trim().startsWith("Fee Amount")) parent.style.display = "none";
  });
}

export function AttendanceApiCompatLoader() {
  useEffect(() => {
    hideStudentFeeField();
    const id = window.setInterval(hideStudentFeeField, 500);
    return () => window.clearInterval(id);
  }, []);
  return null;
}
