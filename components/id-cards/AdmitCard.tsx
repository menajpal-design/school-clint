'use client'

import React from 'react'
import { QRCodeSVG } from 'qrcode.react'

export interface AdmitCardProps {
  name: string
  rollNumber: string
  className?: string
  photoUrl?: string
  institutionName?: string
  institutionLogo?: string
  institutionSeal?: string
  headSignature?: string
  examName?: string
  examDate?: string
  examCenter?: string
  centerCode?: string
  headName?: string
  dateOfBirth?: string
  fatherName?: string
  stream?: string
}

const formatDisplayDate = (value?: string) => {
  if (!value) return ''

  const parsedDate = new Date(value)
  return Number.isNaN(parsedDate.getTime()) ? value : parsedDate.toLocaleDateString()
}

export const AdmitCard = React.forwardRef<HTMLDivElement, AdmitCardProps>(
  (
    {
      name,
      rollNumber,
      className = '',
      photoUrl,
      institutionName = 'Educational Institution',
      institutionLogo,
      institutionSeal,
      headSignature,
      examName = 'Annual Examination',
      examDate,
      examCenter,
      centerCode,
      headName = 'Dr. Principal',
      dateOfBirth,
      fatherName,
      stream,
    },
    ref
  ) => {
    const qrData = JSON.stringify({
      name,
      roll: rollNumber,
      exam: examName,
      center: centerCode,
      date: examDate,
      institution: institutionName,
      stream,
      fatherName,
      dateOfBirth,
    })

    const displayExamDate = formatDisplayDate(examDate)
    const displayIssueDate = formatDisplayDate(new Date().toISOString())

    return (
      <div ref={ref} className={`w-full max-w-[520px] bg-white ${className}`}>
        <div className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.16)]">
          <div className="bg-emerald-800 px-6 py-4 text-white">
            <div className="flex items-center justify-between gap-3">
              {institutionLogo ? (
                <img
                  src={institutionLogo}
                  alt="Logo"
                  className="h-14 w-14 rounded-md border border-white/40 bg-white p-1 object-contain shadow-sm"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-md border border-white/40 bg-white/15 text-sm font-bold shadow-sm">
                  Logo
                </div>
              )}
              <div className="min-w-0 flex-1 text-center">
                <h1 className="text-xl font-bold leading-tight">{institutionName}</h1>
                <p className="text-sm font-semibold text-white/90">Admit Card</p>
              </div>
              <div className="rounded-md border border-white/35 px-2 py-1 text-right text-[10px] font-semibold uppercase text-white/90">
                Hall Ticket
              </div>
            </div>
          </div>

          <div className="px-6 pb-5 pt-4">
            <div className="grid grid-cols-[96px_1fr_104px] gap-4">
              <div className="shrink-0">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={name}
                    className="h-28 w-24 rounded-md border border-slate-300 object-cover shadow-sm"
                  />
                ) : (
                  <div className="flex h-28 w-24 items-center justify-center rounded-md border border-slate-300 bg-slate-100 text-center text-xs text-slate-500">
                    Student
                    <br />Photo
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase text-slate-500">Student Name</p>
                <p className="truncate text-lg font-bold text-slate-950">{name}</p>
                <div className="mt-2 grid gap-2 text-sm text-slate-800">
                  <div>
                    <p className="text-[11px] font-semibold uppercase text-slate-500">Roll No</p>
                    <p className="font-mono text-sm font-bold">{rollNumber}</p>
                  </div>
                  {stream && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase text-slate-500">Class / Stream</p>
                      <p className="font-semibold">{stream}</p>
                    </div>
                  )}
                  {dateOfBirth && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase text-slate-500">Date of Birth</p>
                      <p className="font-semibold">{dateOfBirth}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="shrink-0 rounded-md border border-slate-200 bg-white p-2 shadow-sm">
                <QRCodeSVG value={qrData} size={96} level="M" includeMargin={false} />
                <p className="mt-1 text-center text-[10px] font-semibold text-slate-500">Scan QR</p>
              </div>
            </div>

            {(examName || examDate || examCenter || centerCode) && (
              <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-slate-800 shadow-sm">
                <p className="text-[11px] font-bold uppercase text-emerald-800">Examination Details</p>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <div>
                    <span className="font-semibold">Exam:</span> {examName}
                  </div>
                  {examDate && (
                    <div>
                      <span className="font-semibold">Date:</span> {displayExamDate || examDate}
                    </div>
                  )}
                  {examCenter && (
                    <div>
                      <span className="font-semibold">Center:</span> {examCenter}
                    </div>
                  )}
                  {centerCode && (
                    <div>
                      <span className="font-semibold">Code:</span> {centerCode}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-700">
              {fatherName && (
                <div className="col-span-2 rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase text-slate-500">Father's Name</p>
                  <p className="mt-1 font-semibold text-slate-900">{fatherName}</p>
                </div>
              )}
              <div className="col-span-2 rounded-md border border-red-100 bg-red-50 px-3 py-2 shadow-sm">
                <p className="mb-1 text-[11px] font-bold uppercase text-red-700">Important Instructions</p>
                <ul className="list-disc space-y-1 pl-4 text-red-900">
                  <li>Present this admit card along with valid ID</li>
                  <li>Arrive 30 minutes before exam start time</li>
                  <li>Keep original documents safe</li>
                  <li>Report any discrepancies to the office</li>
                </ul>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-end gap-3 border-t border-slate-200 pt-3">
              <div>
                <p className="text-[11px] font-semibold uppercase text-slate-500">Issue Date</p>
                <p className="font-semibold text-slate-900">{displayIssueDate}</p>
              </div>
              <div className="text-center">
                {institutionSeal ? (
                  <img src={institutionSeal} alt="Seal" className="h-14 w-14 rounded-full object-contain" />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-emerald-600 bg-emerald-50 text-xs font-bold text-emerald-700">Seal</div>
                )}
              </div>
              <div className="text-right">
                <p className="mb-1 text-[11px] font-semibold uppercase text-slate-500">Authorized by</p>
                {headSignature && <img src={headSignature} alt="Signature" className="ml-auto h-8 max-w-[120px] object-contain" />}
                <p className="text-sm font-bold text-emerald-700">{headName}</p>
                <p className="text-xs text-slate-500">Institution Head</p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 bg-slate-50 px-6 py-2 text-center text-xs text-slate-600">
            <p className="font-semibold">This admit card is valid only for the prescribed examination.</p>
          </div>
        </div>
      </div>
    )
  }
)

AdmitCard.displayName = 'AdmitCard'

export default AdmitCard
