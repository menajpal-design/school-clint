'use client';

import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { api } from '@/lib/api';

export function FeeChart() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.dashboard.feeOverview();
        // expected array of {_id: status, count, total}
        if (Array.isArray(res)) {
          setData(
            res.map((r: any) => ({
              month: r._id,
              total: r.total || r.count || 0,
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
    return <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">No fee data available yet.</div>;
  }

  return (
    <div style={{ width: '100%', height: 280 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
