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
  const template = `repeat(${columns.length}, minmax(160px, 1fr))`;
  const minWidth = `${Math.max(columns.length * 160, 320)}px`;

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="w-full overflow-x-auto print:overflow-visible">
        <div className="grid bg-muted text-xs font-semibold uppercase text-muted-foreground" style={{ gridTemplateColumns: template, minWidth }}>
          {columns.map((column) => (
            <div key={column.label} className="px-4 py-3">{column.label}</div>
          ))}
        </div>
        <div className="divide-y divide-border bg-card" style={{ minWidth }}>
          {data.map((item, index) => (
            <div
              key={getKey ? getKey(item, index) : item?._id || item?.id || index}
              className="grid items-center text-sm text-foreground"
              style={{ gridTemplateColumns: template }}
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
    </div>
  );
}
