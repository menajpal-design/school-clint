"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BarChartCardProps {
  title: string;
  data: Array<Record<string, string | number>>;
  xKey?: string;
  yKey?: string;
}

export function BarChartCard({ title, data, xKey = "name", yKey = "value" }: BarChartCardProps) {
  return (
    <Card className="border-border bg-card shadow-lg shadow-slate-900/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.45} />
            <XAxis dataKey={xKey} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
            <YAxis tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
            <Tooltip cursor={{ fill: 'hsl(var(--muted) / 0.45)' }} />
            <Bar dataKey={yKey} fill="url(#barGradient)" radius={[10, 10, 0, 0]} />
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.95} />
                <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0.85} />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
