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
      <div ref={ref} className={`w-full max-w-md ${className}`}>
        <div className="relative overflow-hidden rounded-[32px] border border-amber-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-emerald-700 via-green-600 to-teal-600" />
          <div className="pointer-events-none absolute -right-10 top-12 h-28 w-28 rounded-full bg-white/15 blur-2xl" />
          <div className="pointer-events-none absolute -left-10 bottom-12 h-32 w-32 rounded-full bg-amber-100/70 blur-3xl" />

          <div className="relative px-6 pb-5 pt-5 text-white">
            <div className="mb-3 flex items-center justify-between gap-3">
              {institutionLogo ? (
                <img
                  src={institutionLogo}
                  alt="Logo"
                  className="h-14 w-14 rounded-2xl border border-white/25 bg-white/20 p-1 object-contain shadow-sm"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/25 bg-white/20 text-sm font-bold shadow-sm">
                  Logo
                </div>
              )}
              <div className="mx-4 flex-1 text-center">
                <h1 className="text-xl font-bold leading-tight">{institutionName}</h1>
                <p className="text-sm font-semibold tracking-wide text-white/90">Admit Card</p>
              </div>
              <div className="rounded-full border border-white/25 bg-white/15 px-3 py-1 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-white/90 backdrop-blur">
                Hall Ticket
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-[28px] bg-white/10 px-4 py-3 backdrop-blur-sm">
              <div className="shrink-0">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={name}
                    className="h-28 w-24 rounded-2xl border-2 border-white object-cover shadow-md"
                  />
                ) : (
                  <div className="flex h-28 w-24 items-center justify-center rounded-2xl border-2 border-white bg-white/15 text-center text-xs text-white/90">
                    Student
                    <br />Photo
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/70">Student Name</p>
                <p className="truncate text-lg font-bold">{name}</p>
                <div className="mt-2 grid gap-2 text-sm text-white/95">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/70">Roll No</p>
                    <p className="font-mono text-sm font-bold">{rollNumber}</p>
                  </div>
                  {stream && (
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-white/70">Class / Stream</p>
                      <p className="font-semibold">{stream}</p>
                    </div>
                  )}
                  {dateOfBirth && (
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-white/70">Date of Birth</p>
                      <p className="font-semibold">{dateOfBirth}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="shrink-0 rounded-2xl bg-white p-2 shadow-md ring-1 ring-white/40">
                <QRCodeSVG value={qrData} size={96} level="M" includeMargin={false} />
              </div>
            </div>

            {(examName || examDate || examCenter || centerCode) && (
              <div className="mt-4 rounded-[24px] border border-amber-100 bg-amber-50/90 px-4 py-3 text-xs text-slate-800 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-800">Examination Details</p>
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
                <div className="col-span-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Father's Name</p>
                  <p className="mt-1 font-semibold text-slate-900">{fatherName}</p>
                </div>
              )}
              <div className="col-span-2 rounded-2xl border border-red-100 bg-red-50 px-3 py-2 shadow-sm">
                <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-red-700">Important Instructions</p>
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
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Issue Date</p>
                <p className="font-semibold text-slate-900">{displayIssueDate}</p>
              </div>
              <div className="text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-emerald-600 bg-emerald-50 text-xs font-bold text-emerald-700">
                  Seal
                </div>
              </div>
              <div className="text-right">
                <p className="mb-1 text-[11px] uppercase tracking-[0.18em] text-slate-500">Authorized by</p>
                <p className="text-sm font-bold text-emerald-700">{headName}</p>
                <p className="text-xs text-slate-500">Principal</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-950 px-6 py-2 text-center text-xs text-white/85">
            <p className="font-semibold">This admit card is valid only for the prescribed examination</p>
          </div>
        </div>
      </div>
    )
  }
)

AdmitCard.displayName = 'AdmitCard'

export default AdmitCard
