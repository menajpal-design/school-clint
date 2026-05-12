'use client'

import React from 'react'
import { QRCodeSVG } from 'qrcode.react'

export interface ProfessionalIDCardProps {
  name: string
  idNumber: string
  role: 'student' | 'teacher' | 'staff'
  className?: string
  photoUrl?: string
  institutionName?: string
  institutionLogo?: string
  validityDate?: string
  headName?: string
  dateOfBirth?: string
  fatherName?: string
  motherName?: string
  admissionNumber?: string
  registrationNumber?: string
  stream?: string
}

const formatDisplayDate = (value?: string) => {
  if (!value) return ''

  const parsedDate = new Date(value)
  return Number.isNaN(parsedDate.getTime()) ? value : parsedDate.toLocaleDateString()
}

export const ProfessionalIDCard = React.forwardRef<HTMLDivElement, ProfessionalIDCardProps>(
  (
    {
      name,
      idNumber,
      role,
      className = '',
      photoUrl,
      institutionName = 'Educational Institution',
      institutionLogo,
      validityDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      headName = 'Dr. Principal',
      dateOfBirth,
      fatherName,
      motherName,
      admissionNumber,
      registrationNumber,
      stream,
    },
    ref
  ) => {
    const qrData = JSON.stringify({
      name,
      id: idNumber,
      role,
      institution: institutionName,
      validity: validityDate,
      stream,
      dateOfBirth,
      admissionNumber,
      registrationNumber,
    })

    const displayValidityDate = formatDisplayDate(validityDate)
    const displayIssueDate = formatDisplayDate(new Date().toISOString())

    const roleLabel = {
      student: 'Student ID Card',
      teacher: 'Faculty ID Card',
      staff: 'Staff ID Card',
    }[role]

    const roleColor = {
      student: 'bg-gradient-to-br from-blue-600 to-blue-800',
      teacher: 'bg-gradient-to-br from-green-600 to-green-800',
      staff: 'bg-gradient-to-br from-purple-600 to-purple-800',
    }[role]

    return (
      <div ref={ref} className={`w-full max-w-md ${className}`}>
        <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
          <div className={`absolute inset-x-0 top-0 h-24 ${roleColor}`} />
          <div className="pointer-events-none absolute -right-8 top-10 h-28 w-28 rounded-full bg-white/20 blur-2xl" />
          <div className="pointer-events-none absolute -left-10 bottom-10 h-32 w-32 rounded-full bg-slate-200/50 blur-3xl" />

          <div className="relative px-6 pb-5 pt-5 text-white">
            <div className="mb-3 flex items-center justify-between">
              {institutionLogo ? (
                <img
                  src={institutionLogo}
                  alt="Logo"
                  className="h-14 w-14 rounded-2xl border border-white/25 bg-white/20 p-1 object-contain shadow-sm"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/25 bg-white/20 shadow-sm">
                  <span className="text-sm font-bold">Logo</span>
                </div>
              )}
              <div className="mx-4 flex-1 text-center">
                <h2 className="text-xl font-bold leading-tight">{institutionName}</h2>
                <p className="text-sm font-semibold tracking-wide text-white/90">{roleLabel}</p>
              </div>
              <div className="rounded-full border border-white/25 bg-white/15 px-3 py-1 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-white/90 backdrop-blur">
                Verified
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
                    Photo
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-2">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/70">Full Name</p>
                  <p className="truncate text-lg font-bold">{name}</p>
                </div>
                <div className="mb-2">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/70">ID Number</p>
                  <p className="font-mono text-sm font-bold">{idNumber}</p>
                </div>
                {stream && (
                  <div className="mb-2">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-white/70">Class / Stream</p>
                    <p className="text-sm font-semibold">{stream}</p>
                  </div>
                )}
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/70">Valid Until</p>
                  <p className="text-sm font-semibold">{displayValidityDate || validityDate}</p>
                </div>
              </div>

              <div className="shrink-0 rounded-2xl bg-white p-2 shadow-md ring-1 ring-white/40">
                  <QRCodeSVG value={qrData} size={80} level="M" includeMargin={false} />
                </div>
            </div>

            {(dateOfBirth || admissionNumber || registrationNumber || fatherName || motherName) && (
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-white/95">
                {dateOfBirth && (
                  <div>
                    <p className="uppercase tracking-[0.16em] text-white/70">Date of Birth</p>
                    <p className="font-semibold">{dateOfBirth}</p>
                  </div>
                )}
                {admissionNumber && (
                  <div>
                    <p className="uppercase tracking-[0.16em] text-white/70">Admission No.</p>
                    <p className="font-semibold">{admissionNumber}</p>
                  </div>
                )}
                {registrationNumber && (
                  <div>
                    <p className="uppercase tracking-[0.16em] text-white/70">Registration No.</p>
                    <p className="font-semibold">{registrationNumber}</p>
                  </div>
                )}
                {motherName && (
                  <div>
                    <p className="uppercase tracking-[0.16em] text-white/70">Mother's Name</p>
                    <p className="font-semibold">{motherName}</p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 grid grid-cols-[1.2fr_0.8fr_1fr] items-end gap-3 border-t border-white/20 pt-3 text-xs text-white/95">
              <div>
                <p className="uppercase tracking-[0.18em] text-white/70">Authorized By</p>
                <p className="text-sm font-semibold">{headName}</p>
                <p className="text-white/70">Principal</p>
              </div>
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/70 bg-white/10 text-[10px] font-semibold backdrop-blur">
                  Seal
                </div>
              </div>
              <div className="text-right text-xs">
                <p className="uppercase tracking-[0.18em] text-white/70">Issue Date</p>
                <p className="font-semibold">{displayIssueDate}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-950 px-6 py-2 text-center text-xs italic text-white/85">
            This card is the official property of {institutionName}. Loss must be reported immediately.
          </div>
        </div>
      </div>
    )
  }
)

ProfessionalIDCard.displayName = 'ProfessionalIDCard'

export default ProfessionalIDCard
