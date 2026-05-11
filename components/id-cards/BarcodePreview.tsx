'use client'

import React from 'react'

export function BarcodePreview({ code = '' }: { code?: string }) {
  // Simple styled barcode placeholder — replace with proper library if needed
  return (
    <div className="inline-block p-2 bg-white border text-center">
      <div className="tracking-widest font-mono text-sm">{code || '1234567890'}</div>
      <div className="mt-1 h-6 flex items-center justify-center">
        <div className="h-6 w-full bg-gradient-to-r from-black to-black/70" />
      </div>
    </div>
  )
}

export default BarcodePreview
