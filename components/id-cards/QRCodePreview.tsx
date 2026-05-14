'use client'

import React from 'react'
import { QRCodeCanvas } from 'qrcode.react'

export function QRCodePreview({ data = '' }: { data?: string }) {
  if (!data) return null

  return (
    <div className="inline-block p-1 bg-white border">
      <QRCodeCanvas value={data} size={100} />
    </div>
  )
}

export default QRCodePreview
