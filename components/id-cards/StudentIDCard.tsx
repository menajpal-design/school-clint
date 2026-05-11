'use client'

import React from 'react'
import Image from 'next/image'
import { QRCodeCanvas } from 'qrcode.react'

export type IDCardProps = {
  name: string
  id: string
  role?: string
  className?: string
  photoUrl?: string
  institution?: {
    name?: string
    logoUrl?: string
    headName?: string
  }
  validity?: string
  qrData?: string
  barcode?: string
}

export function StudentIDCard({
  name,
  id,
  role = 'Student',
  className = '',
  photoUrl,
  institution,
  validity,
  qrData,
  barcode,
}: IDCardProps) {
  return (
    <div className={`max-w-xs w-[320px] p-4 bg-white border shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {institution?.logoUrl ? (
            // next/image requires remote config; fallback to img
            // eslint-disable-next-line @next/next/no-img-element
            <img src={institution.logoUrl} alt="logo" className="h-10 w-10 object-contain" />
          ) : (
            <div className="h-10 w-10 bg-slate-100 rounded flex items-center justify-center text-sm">Logo</div>
          )}
          <div>
            <div className="text-sm font-semibold">{institution?.name || 'My Institution'}</div>
            <div className="text-xs text-muted-foreground">ID Card</div>
          </div>
        </div>
        <div className="text-xs text-right">
          <div className="font-semibold">Validity</div>
          <div className="text-sm">{validity || '2026-12-31'}</div>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <div className="h-20 w-16 bg-slate-100 flex items-center justify-center overflow-hidden">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt={name} className="object-cover h-full w-full" />
          ) : (
            <div className="text-xs text-center">Photo</div>
          )}
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold">{name}</div>
          <div className="text-xs text-muted-foreground">{role}</div>
          <div className="text-xs mt-2">ID: {id}</div>
          <div className="text-xs">Class: { ("className" in ({} as any)) ? '' : ''}</div>
        </div>
        <div>
          {qrData ? (
            <QRCodeCanvas value={qrData} size={64} />
          ) : (
            <div className="h-16 w-16 bg-slate-100" />
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="text-xs">
          <div className="font-semibold">Head</div>
          <div className="text-muted-foreground text-sm">{institution?.headName || 'Head Name'}</div>
        </div>
        <div className="text-xs text-right">
          <div className="font-semibold">Seal</div>
          <div className="h-8 w-12 bg-slate-100 inline-block" />
        </div>
      </div>

      <div className="mt-2 text-center text-xs text-muted-foreground">This card is the property of the institution</div>

      <div className="mt-2 pt-2 border-t text-center text-xs">{barcode ? barcode : '|| ||| |||||'}</div>
    </div>
  )
}

export default StudentIDCard
