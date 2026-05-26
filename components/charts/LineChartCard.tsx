"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LineChartCardProps {
  title: string;
  data: Array<Record<string, string | number>>;
  xKey?: string;
  yKey?: string;
}

export function LineChartCard({ title, data, xKey = "name", yKey = "value" }: LineChartCardProps) {
  return (
    <Card className="border-border bg-card shadow-lg shadow-slate-900/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.45} />
            <XAxis dataKey={xKey} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
            <YAxis tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
            <Tooltip cursor={{ stroke: 'hsl(var(--primary))', strokeOpacity: 0.12 }} />
            <Line type="monotone" dataKey={yKey} stroke="hsl(var(--primary))" strokeWidth={3.5} dot={{ r: 3, strokeWidth: 2, fill: 'hsl(var(--background))' }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
