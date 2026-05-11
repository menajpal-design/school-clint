"use client";

import React from "react";

export type DataTableColumn<T> = {
  label: string;
  render: (item: T, index: number) => React.ReactNode;
};

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  getKey?: (item: T, index: number) => string;
}

export function DataTable<T extends Record<string, any>>({ columns, data, getKey }: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <div className="grid bg-slate-50 text-xs font-semibold uppercase text-slate-500" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
        {columns.map((column) => (
          <div key={column.label} className="px-4 py-3">{column.label}</div>
        ))}
      </div>
      <div className="divide-y divide-slate-100 bg-white">
        {data.map((item, index) => (
          <div
            key={getKey ? getKey(item, index) : item?._id || item?.id || index}
            className="grid items-center text-sm text-slate-700"
            style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
          >
            {columns.map((column) => (
              <div key={column.label} className="min-w-0 px-4 py-3">
                <div className="truncate">{column.render(item, index)}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
