import React from 'react';

export default function ResponsiveTable({ columns, rows, empty }: { columns: string[]; rows: React.ReactNode[][]; empty?: string }) {
  if (!rows || rows.length === 0) {
    return <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">{empty || 'No records'}</p>;
  }

  return (
    <div>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col} className="p-2 text-left">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="border-t">
                {row.map((cell, ci) => (
                  <td key={ci} className="p-2 align-top">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {rows.map((row, idx) => (
          <div key={idx} className="rounded-lg border p-3">
            {row.map((cell, ci) => (
              <div key={ci} className="flex justify-between gap-4 text-sm py-1">
                <div className="text-muted-foreground">{columns[ci]}</div>
                <div className="font-medium text-foreground">{cell}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
