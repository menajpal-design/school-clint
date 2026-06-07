"use client";

import { useEffect } from "react";

function buildField(name: string, title: string) {
  const label = document.createElement("label");
  label.className = "space-y-2";
  label.dataset.studentExtraField = name;
  const span = document.createElement("span");
  span.className = "text-sm font-medium";
  span.textContent = title;
  const input = document.createElement("input");
  input.name = name;
  input.className = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";
  label.appendChild(span);
  label.appendChild(input);
  return label;
}

function runStudentFormPatch() {
  const path = window.location.pathname;
  if (!path.includes("/institution/students") && !path.includes("/institution/admission")) return;
  document.querySelectorAll("label").forEach((label) => {
    const text = (label.textContent || "").trim();
    const span = label.querySelector("span");
    if (text === "Class" && span) span.textContent = "Requested Class";
    if (text === "Address" && span) span.textContent = "Full Address";
    if (text === "Fee Amount" || text.startsWith("Fee Amount")) (label as HTMLElement).style.display = "none";
  });
  if (document.querySelector("[data-student-extra-field='previousSchool']")) return;
  const dialog = document.querySelector("[role='dialog']");
  if (!dialog) return;
  const grid = Array.from(dialog.querySelectorAll(".grid")).find((node) => {
    const t = node.textContent || "";
    return t.includes("Guardian Email") && t.includes("Full Address");
  });
  if (!grid) return;
  const address = Array.from(grid.querySelectorAll("label")).find((node) => (node.textContent || "").trim() === "Full Address") || null;
  grid.insertBefore(buildField("previousSchool", "Previous School (Optional)"), address);
  grid.insertBefore(buildField("previousResult", "Previous Result (Optional)"), address);
}

export function StudentFormExtraFields() {
  useEffect(() => {
    runStudentFormPatch();
    const timer = window.setInterval(runStudentFormPatch, 500);
    return () => window.clearInterval(timer);
  }, []);
  return null;
}
