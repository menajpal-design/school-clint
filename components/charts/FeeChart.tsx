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

  const displayData = data.length > 0 ? data : [
    { month: 'Jan', total: 12000 },
    { month: 'Feb', total: 14500 },
    { month: 'Mar', total: 16200 },
    { month: 'Apr', total: 15800 },
    { month: 'May', total: 19400 },
    { month: 'Jun', total: 22000 },
  ];

  return (
    <div style={{ width: '100%', height: 280 }}>
      <ResponsiveContainer>
        <LineChart data={displayData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
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
