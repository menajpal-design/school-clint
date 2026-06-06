'use client';

import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { api } from '@/lib/api';

const COLORS = ['#60a5fa', '#34d399', '#f59e0b', '#f97316', '#ef4444'];

export function CompositionChart() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.dashboard.composition();
        if (Array.isArray(res)) {
          setData(
            res.map((r: any) => ({
              name: r._id || r.name,
              value: r.count || r.value || r.total || 0,
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
    { name: 'Students', value: 320 },
    { name: 'Teachers', value: 24 },
    { name: 'Staff', value: 12 },
  ];

  return (
    <div style={{ width: '100%', height: 240 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie data={displayData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
            {displayData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
