"use client";

import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PieChartCardProps {
  title: string;
  data: Array<{ name: string; value: number; color?: string }>;
}

const fallbackColors = ["#2563eb", "#059669", "#f59e0b", "#dc2626", "#7c3aed"];

export function PieChartCard({ title, data }: PieChartCardProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Card className="border-border bg-card shadow-lg shadow-slate-900/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {!mounted ? (
          <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-400 animate-pulse">
            Loading chart...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={88} paddingAngle={3}>
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={entry.color || fallbackColors[index % fallbackColors.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--popover))' }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
