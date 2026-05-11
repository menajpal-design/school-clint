'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { api } from '@/lib/api';

export function AttendanceChart() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.dashboard.attendanceOverview();
        // res may be an array of { _id: status, count }
        if (Array.isArray(res)) {
          setData(
            res.map((r: any) => ({
              status: r._id,
              count: r.count,
            }))
          );
        } else {
          setData([]);
        }
      } catch (err) {
        setData([]);
      }
    };
    load();
  }, []);

  if (!data.length) {
    return <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">No attendance data available yet.</div>;
  }

  return (
    <div style={{ width: '100%', height: 240 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="status" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
