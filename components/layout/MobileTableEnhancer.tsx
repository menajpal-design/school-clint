'use client';

import { useEffect } from 'react';

function enhanceTables() {
  if (typeof document === 'undefined') return;

  document.querySelectorAll<HTMLTableElement>('table').forEach((table) => {
    table.classList.add('mobile-card-table');

    const headers = Array.from(table.querySelectorAll('thead th')).map((header) => header.textContent?.trim() || '');
    if (!headers.length) return;

    table.querySelectorAll('tbody tr').forEach((row) => {
      const cells = Array.from(row.children) as HTMLElement[];
      cells.forEach((cell, index) => {
        if (!cell.getAttribute('data-label')) {
          cell.setAttribute('data-label', headers[index] || 'Details');
        }
      });
    });
  });
}

export function MobileTableEnhancer() {
  useEffect(() => {
    enhanceTables();
    const observer = new MutationObserver(() => {
      window.requestAnimationFrame(enhanceTables);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
