"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const DEFAULT_COLORS = {
  presentColor: "#bbf7d0",
  absentColor: "#fecaca",
  leaveColor: "#bae6fd",
  lateColor: "#fef3c7",
  weekendColor: "#ddd6fe",
  closureColor: "#fed7aa",
};
const DAY_INDEX: Record<string, number> = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
const MONTHS: Record<string, number> = { January: 0, February: 1, March: 2, April: 3, May: 4, June: 5, July: 6, August: 7, September: 8, October: 9, November: 10, December: 11 };
const rgba = (hex: string, alpha = 0.45) => {
  const raw = String(hex || "").replace("#", "");
  const full = raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw;
  if (!/^[0-9a-f]{6}$/i.test(full)) return hex;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
const safeJson = (key: string, fallback: any) => {
  try { return { ...fallback, ...(JSON.parse(localStorage.getItem(key) || "{}") || {}) }; } catch { return fallback; }
};
const textOf = (node: Element | null) => (node?.textContent || "").trim();
const findCard = (el: Element) => el.closest("label, .grid, .space-y-2, .space-y-4, .rounded-lg, div") as HTMLElement | null;

function cleanSmsSettingsText() {
  if (!location.pathname.includes("/settings")) return;
  document.querySelectorAll("*").forEach((el) => {
    const htmlEl = el as HTMLElement;
    const text = textOf(el);
    if (!text) return;
    if (text.includes("SMS Configuration (Anoncify)")) htmlEl.childNodes.forEach((n) => { if (n.nodeType === Node.TEXT_NODE && n.textContent?.includes("SMS Configuration")) n.textContent = "এসএমএস কনফিগারেশন"; });
    if (text.includes("anoncify.xyz") || text.includes("Anoncify")) {
      if (text.includes("এসএমএস এপিআই ইউআরএল") || text.includes("SMS API URL") || text.includes("https://anoncify.xyz")) {
        const card = findCard(el);
        if (card) card.style.display = "none";
      }
      if (text.includes("আপনার anoncify.xyz API key")) htmlEl.textContent = "এখান থেকে এসএমএস সেবা চালু/বন্ধ এবং এপিআই কী সংরক্ষণ করুন।";
      if (text.includes("Anoncify এপিআই")) htmlEl.textContent = htmlEl.textContent?.replace(/Anoncify এপিআই কি/g, "এসএমএস এপিআই কী").replace(/Anoncify/g, "এসএমএস") || "";
    }
    if (text.includes("Key source:") || text.includes("Provider:")) {
      htmlEl.style.display = "none";
    }
  });
  document.querySelectorAll("input").forEach((input) => {
    const el = input as HTMLInputElement;
    if ((el.value || "").includes("anoncify") || (el.placeholder || "").includes("anoncify")) {
      const card = el.closest("label, .grid, div") as HTMLElement | null;
      if (card) card.style.display = "none";
    }
    if ((el.placeholder || "").includes("Anoncify")) el.placeholder = "এসএমএস এপিআই কী এখানে পেস্ট করুন";
  });
}

function paintCell(cell: HTMLElement, color: string, badgeText: string) {
  cell.style.backgroundColor = rgba(color, 0.52);
  cell.style.borderColor = color;
  cell.style.boxShadow = `inset 0 0 0 2px ${color}`;
  const badge = Array.from(cell.querySelectorAll("span")).find((s) => textOf(s).toLowerCase() === badgeText.toLowerCase()) as HTMLElement | undefined;
  if (badge) {
    badge.style.backgroundColor = color;
    badge.style.color = "#111827";
  }
}

function applyAttendanceCalendarColors() {
  if (!location.pathname.includes("/attendance")) return;
  const colors = safeJson("easy_school_app_control_settings", DEFAULT_COLORS);
  const holiday = safeJson("easy_school_holiday_settings", { weeklyClosedDays: [] });
  const weeklyDays = new Set((holiday.weeklyClosedDays || []).map((d: string) => DAY_INDEX[d]).filter((d: number) => Number.isInteger(d)));
  const modalText = document.body.innerText || "";
  const match = modalText.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})/);
  const month = match ? MONTHS[match[1]] : new Date().getMonth();
  const year = match ? Number(match[2]) : new Date().getFullYear();
  document.querySelectorAll(".min-h-24.rounded-lg.border").forEach((raw) => {
    const cell = raw as HTMLElement;
    const txt = textOf(cell);
    const day = Number((txt.match(/^\d{1,2}/) || [])[0]);
    if (!day) return;
    const date = new Date(year, month, day);
    const status = txt.toLowerCase();
    if (status.includes("present")) paintCell(cell, colors.presentColor || DEFAULT_COLORS.presentColor, "present");
    if (status.includes("absent")) paintCell(cell, colors.absentColor || DEFAULT_COLORS.absentColor, "absent");
    if (status.includes("late")) paintCell(cell, colors.lateColor || DEFAULT_COLORS.lateColor, "late");
    if (status.includes("leave")) paintCell(cell, colors.leaveColor || DEFAULT_COLORS.leaveColor, "leave");
    if (weeklyDays.has(date.getDay()) || status.includes("weekly holiday")) {
      paintCell(cell, colors.weekendColor || DEFAULT_COLORS.weekendColor, "off");
      if (!status.includes("off")) {
        const label = document.createElement("div");
        label.className = "mt-1 rounded px-2 py-1 text-xs font-bold";
        label.textContent = "Weekly Holiday";
        label.style.backgroundColor = colors.weekendColor || DEFAULT_COLORS.weekendColor;
        cell.appendChild(label);
      }
      cell.querySelectorAll("button, [role='combobox']").forEach((el) => ((el as HTMLElement).style.display = "none"));
    }
  });
}

export function UiRuntimeFixes() {
  const pathname = usePathname();
  useEffect(() => {
    const run = () => { cleanSmsSettingsText(); applyAttendanceCalendarColors(); };
    run();
    const id = window.setInterval(run, 700);
    return () => window.clearInterval(id);
  }, [pathname]);
  return null;
}
