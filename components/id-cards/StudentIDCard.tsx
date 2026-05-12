'use client'

import React from 'react'
import { QRCodeCanvas } from 'qrcode.react'

export type IDCardProps = {
  name: string
  id: string
  role?: string
  className?: string
  photoUrl?: string
  studentClass?: string
  headName?: string
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
  studentClass,
  headName,
  institution,
  validity,
  qrData,
  barcode,
}: IDCardProps) {
  const qrPayload =
    qrData ||
    JSON.stringify({
      name,
      id,
      role,
      studentClass,
      institution: institution?.name || 'My Institution',
      validity: validity || '2026-12-31',
    })

  return (
    <div
      className={`relative w-[340px] max-w-xs overflow-hidden rounded-[28px] border border-sky-200 bg-gradient-to-br from-white via-sky-50 to-cyan-100 p-4 shadow-[0_24px_60px_rgba(15,23,42,0.18)] ${className}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-r from-sky-700 via-cyan-600 to-teal-500" />
      <div className="pointer-events-none absolute -right-10 top-8 h-28 w-28 rounded-full bg-white/25 blur-2xl" />
      <div className="relative flex items-center justify-between text-white">
        <div className="flex items-center space-x-2">
          {institution?.logoUrl ? (
            // next/image requires remote config; fallback to img
            // eslint-disable-next-line @next/next/no-img-element
            <img src={institution.logoUrl} alt="logo" className="h-10 w-10 object-contain" />
          ) : (
            <div className="h-10 w-10 rounded bg-white/20 flex items-center justify-center text-sm font-semibold backdrop-blur">
              Logo
            </div>
          )}
          <div>
            <div className="text-sm font-semibold text-white">{institution?.name || 'My Institution'}</div>
            <div className="text-xs text-white/80">Student ID Card</div>
          </div>
        </div>
        <div className="text-right text-xs">
          <div className="font-semibold text-white/80">Validity</div>
          <div className="text-sm font-semibold text-white">{validity || '2026-12-31'}</div>
        </div>
      </div>

      <div className="relative mt-4 rounded-[22px] bg-white/90 p-3 shadow-sm ring-1 ring-sky-100 backdrop-blur">
        <div className="flex items-start space-x-3">
          <div className="h-22 w-18 overflow-hidden rounded-2xl border border-sky-200 bg-slate-100">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt={name} className="object-cover h-full w-full" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-center text-slate-500">
              Photo
            </div>
          )}
        </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] uppercase tracking-[0.18em] text-sky-600">Identity profile</div>
            <div className="mt-1 truncate text-base font-bold text-slate-900">{name}</div>
            <div className="text-xs font-medium text-slate-500">{role}</div>
            <div className="mt-2 text-xs text-slate-600">ID: <span className="font-semibold text-slate-900">{id}</span></div>
            <div className="text-xs text-slate-600">
              Class: <span className="font-semibold text-slate-900">{studentClass || role || 'General'}</span>
            </div>
          </div>
          <div className="shrink-0 rounded-2xl border border-sky-100 bg-white p-2 shadow-sm">
            <QRCodeCanvas value={qrPayload} size={64} />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-200 pt-3 text-xs">
          <div>
            <div className="font-semibold text-slate-700">Head</div>
            <div className="text-sm text-slate-500">{headName || institution?.headName || 'Head Name'}</div>
          </div>
          <div className="text-right">
            <div className="font-semibold text-slate-700">Seal</div>
            <div className="ml-auto mt-1 inline-flex h-8 w-12 items-center justify-center rounded-lg border border-sky-200 bg-sky-50 text-[10px] font-semibold text-sky-700">
              Official
            </div>
          </div>
        </div>
        <div className="mt-3 rounded-2xl bg-sky-950 px-3 py-2 text-center text-[11px] text-white/85">
          This card is the property of the institution
        </div>

        <div className="mt-2 border-t border-dashed border-sky-200 pt-2 text-center text-xs font-mono text-slate-500">
          {barcode ? barcode : '|| ||| |||||'}
        </div>
      </div>
    </div>
  )
}

export default StudentIDCard
