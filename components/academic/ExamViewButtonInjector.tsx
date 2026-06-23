"use client";

import { useEffect } from "react";
import { apiClient } from "@/lib/api";

const normalize = (value: string) => String(value || "").trim().toLowerCase();

export function ExamViewButtonInjector() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!["/academic/exams", "/academic/exam-management"].includes(window.location.pathname)) return;
    let disposed = false;
    let exams: any[] = [];

    const addButtons = () => {
      if (disposed || !exams.length) return;
      document.querySelectorAll("table tbody tr").forEach((row) => {
        const firstCell = row.querySelector("td");
        if (!firstCell || firstCell.querySelector("[data-exam-view-button]")) return;
        const text = normalize(firstCell.textContent || "");
        const exam = exams.find((item) => text.includes(normalize(item.name)) || normalize(item.name).includes(text));
        const id = exam?._id || exam?.id;
        if (!id) return;
        const link = document.createElement("a");
        link.href = `/academic/exams/${id}`;
        link.setAttribute("data-exam-view-button", "true");
        link.className = "ml-2 inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100";
        link.textContent = "View";
        firstCell.appendChild(link);
      });
    };

    apiClient.get("/academic/exams", { skipToast: true }).then((data: any) => {
      if (disposed) return;
      exams = Array.isArray(data?.exams) ? data.exams : [];
      addButtons();
    }).catch(() => undefined);

    const id = window.setInterval(addButtons, 1000);
    return () => { disposed = true; window.clearInterval(id); };
  }, []);
  return null;
}
