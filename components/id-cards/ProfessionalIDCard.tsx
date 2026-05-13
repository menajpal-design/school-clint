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
  institutionSeal?: string
  headSignature?: string
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
      institutionSeal,
      headSignature,
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
      student: 'bg-sky-800',
      teacher: 'bg-emerald-800',
      staff: 'bg-slate-800',
    }[role]

    return (
      <div ref={ref} className={`w-full max-w-[430px] bg-white ${className}`}>
        <div className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.16)]">
          <div className={`${roleColor} px-5 py-4 text-white`}>
            <div className="flex items-center justify-between gap-3">
              {institutionLogo ? (
                <img
                  src={institutionLogo}
                  alt="Logo"
                  className="h-14 w-14 rounded-md border border-white/40 bg-white p-1 object-contain shadow-sm"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-md border border-white/40 bg-white/15 shadow-sm">
                  <span className="text-sm font-bold">Logo</span>
                </div>
              )}
              <div className="min-w-0 flex-1 text-center">
                <h2 className="text-xl font-bold leading-tight">{institutionName}</h2>
                <p className="text-sm font-semibold text-white/90">{roleLabel}</p>
              </div>
              <div className="rounded-md border border-white/35 px-2 py-1 text-right text-[10px] font-semibold uppercase text-white/90">
                Official
              </div>
            </div>
          </div>

          <div className="px-5 pb-4 pt-4">
            <div className="grid grid-cols-[96px_1fr_92px] gap-4">
              <div className="shrink-0">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={name}
                    className="h-28 w-24 rounded-md border border-slate-300 object-cover shadow-sm"
                  />
                ) : (
                  <div className="flex h-28 w-24 items-center justify-center rounded-md border border-slate-300 bg-slate-100 text-center text-xs text-slate-500">
                    Photo
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-2">
                  <p className="text-[11px] font-semibold uppercase text-slate-500">Full Name</p>
                  <p className="truncate text-lg font-bold text-slate-950">{name}</p>
                </div>
                <div className="mb-2">
                  <p className="text-[11px] font-semibold uppercase text-slate-500">ID Number</p>
                  <p className="font-mono text-sm font-bold text-slate-900">{idNumber}</p>
                </div>
                {stream && (
                  <div className="mb-2">
                    <p className="text-[11px] font-semibold uppercase text-slate-500">Class / Stream</p>
                    <p className="text-sm font-semibold text-slate-900">{stream}</p>
                  </div>
                )}
                <div>
                  <p className="text-[11px] font-semibold uppercase text-slate-500">Valid Until</p>
                  <p className="text-sm font-semibold text-slate-900">{displayValidityDate || validityDate}</p>
                </div>
              </div>

              <div className="shrink-0 rounded-md border border-slate-200 bg-white p-2 shadow-sm">
                  <QRCodeSVG value={qrData} size={80} level="M" includeMargin={false} />
                <p className="mt-1 text-center text-[10px] font-semibold text-slate-500">Scan QR</p>
              </div>
            </div>

            {(dateOfBirth || admissionNumber || registrationNumber || fatherName || motherName) && (
              <div className="mt-4 grid grid-cols-2 gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800">
                {dateOfBirth && (
                  <div>
                    <p className="font-semibold uppercase text-slate-500">Date of Birth</p>
                    <p className="font-semibold">{dateOfBirth}</p>
                  </div>
                )}
                {admissionNumber && (
                  <div>
                    <p className="font-semibold uppercase text-slate-500">Admission No.</p>
                    <p className="font-semibold">{admissionNumber}</p>
                  </div>
                )}
                {registrationNumber && (
                  <div>
                    <p className="font-semibold uppercase text-slate-500">Registration No.</p>
                    <p className="font-semibold">{registrationNumber}</p>
                  </div>
                )}
                {motherName && (
                  <div>
                    <p className="font-semibold uppercase text-slate-500">Mother's Name</p>
                    <p className="font-semibold">{motherName}</p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 grid grid-cols-[1.2fr_0.8fr_1fr] items-end gap-3 border-t border-slate-200 pt-3 text-xs text-slate-700">
              <div>
                <p className="font-semibold uppercase text-slate-500">Authorized By</p>
                {headSignature && <img src={headSignature} alt="Signature" className="mt-1 h-8 max-w-[120px] object-contain" />}
                <p className="text-sm font-semibold text-slate-950">{headName}</p>
                <p className="text-slate-500">Institution Head</p>
              </div>
              <div className="text-center">
                {institutionSeal ? (
                  <img src={institutionSeal} alt="Seal" className="mx-auto h-14 w-14 rounded-full object-contain" />
                ) : (
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-slate-400 bg-slate-50 text-[10px] font-semibold text-slate-600">Seal</div>
                )}
              </div>
              <div className="text-right text-xs">
                <p className="font-semibold uppercase text-slate-500">Issue Date</p>
                <p className="font-semibold text-slate-950">{displayIssueDate}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 bg-slate-50 px-6 py-2 text-center text-xs font-medium text-slate-600">
            This card is the official property of {institutionName}. Loss must be reported immediately.
          </div>
        </div>
      </div>
    )
  }
)

ProfessionalIDCard.displayName = 'ProfessionalIDCard'

export default ProfessionalIDCard
