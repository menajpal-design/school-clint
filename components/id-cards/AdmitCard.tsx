'use client'

import React from 'react'
import { QRCodeSVG } from 'qrcode.react'

export interface AdmitCardExamItem {
  courseCode?: string
  examDate?: string
  examTime?: string
  examCentre?: string
  centreCode?: string
  centreName?: string
  centre?: string
  code?: string
  date?: string
  time?: string
}

export interface AdmitCardProps {
  name: string
  rollNumber?: string
  roll?: string
  className?: string
  photoUrl?: string
  institutionName?: string
  institutionLogo?: string
  institutionAddress?: string
  institutionPhone?: string
  institutionEmail?: string
  institutionSeal?: string
  headSignature?: string
  qrData?: string
  examName?: string
  examDate?: string
  examCenter?: string
  centerCode?: string
  headName?: string
  dateOfBirth?: string
  fatherName?: string
  stream?: string
  examData?: AdmitCardExamItem[]
}

const formatDisplayDate = (value?: string) => {
  if (!value) return ''
  const parsedDate = new Date(value)
  return Number.isNaN(parsedDate.getTime())
    ? value
    : parsedDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      })
}

function AdmitLogo({ logoUrl }: { logoUrl?: string }) {
  if (logoUrl) {
    return <img src={logoUrl} alt="Logo" style={{ width: 88, height: 88, objectFit: 'contain' }} />
  }

  return (
    <svg width="88" height="88" viewBox="0 0 96 96" aria-label="Institution logo">
      <circle cx="48" cy="48" r="38" fill="none" stroke="#0A66A3" strokeWidth="8" />
      <circle cx="48" cy="48" r="24" fill="none" stroke="#0A66A3" strokeWidth="7" />
      <path d="M48 12v34h24" fill="none" stroke="#0A66A3" strokeWidth="8" strokeLinecap="round" />
      <circle cx="48" cy="48" r="9" fill="#0A66A3" />
      <path d="M18 18v44c0 10 12 19 30 22 18-3 30-12 30-22V18" fill="none" stroke="#0A66A3" strokeWidth="6" strokeLinecap="round" />
    </svg>
  )
}

const InfoRow = ({ label, value }: { label: string; value?: string }) => (
  <div className="grid grid-cols-[140px_1fr] gap-3 items-start border-b border-slate-200 py-2 text-sm text-slate-700">
    <span className="uppercase tracking-[0.18em] text-slate-500">{label}</span>
    <span>{value || ''}</span>
  </div>
)

export const AdmitCard = React.forwardRef<HTMLDivElement, AdmitCardProps>(
  (
    {
      name,
      rollNumber,
      roll,
      className = '',
      photoUrl,
      institutionName = '',
      institutionLogo,
      institutionAddress,
      institutionPhone,
      institutionEmail,
      institutionSeal,
      headSignature,
      examName = 'Admit Card',
      examDate,
      examCenter,
      centerCode,
      qrData,
      dateOfBirth,
      fatherName,
      stream,
      examData,
      headName,
    },
    ref
  ) => {
    const displayExamDate = formatDisplayDate(examDate)
    const resolvedRoll = rollNumber || roll || ''
    const resolvedQrData = qrData || JSON.stringify({ name, rollNumber, examName, examDate: displayExamDate || examDate, examCenter, centerCode, institutionName })
    const instructions = [
      'This card is non-transferable and must be carried on campus.',
      'Loss or damage must be reported to the office immediately.',
      'Finder is requested to return this card to the issuing institute.',
    ]
    const rows = Array.isArray(examData) && examData.length > 0 ? examData : [
      { courseCode: '', examDate: displayExamDate || '', examTime: '', examCentre: examCenter || '', centreCode: centerCode || '' },
    ]

    return (
      <div
        ref={ref}
        className={`admit-card ${className}`}
        style={{
          width: 850,
          minHeight: 600,
          maxWidth: 'none',
          maxHeight: 'none',
          background: '#f8fafc',
          padding: 0,
          fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
          flex: '0 0 auto',
        }}
      >
        <section
          style={{
            width: 850,
            minHeight: 600,
            background: '#ffffff',
            borderRadius: 32,
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
            boxSizing: 'border-box',
            position: 'relative',
          }}
        >
          <div className="bg-slate-950 text-white px-8 py-6 grid gap-4 md:grid-cols-[1fr_auto] items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Admit Card</p>
              <h1 className="mt-2 text-3xl font-black leading-tight">{institutionName || ''}</h1>
              <p className="mt-1 text-sm text-slate-300">{examName || ''}</p>
            </div>

            <div className="flex items-center gap-4 justify-end">
              <div className="rounded-[24px] border border-white/10 bg-white/10 p-3">
                <AdmitLogo logoUrl={institutionLogo} />
              </div>
              <div className="text-right text-[10px] uppercase tracking-[0.35em] text-slate-400">
                <div>Verify</div>
                <div>Admit Card</div>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
                <div className="grid gap-3">
                  <InfoRow label="Candidate Name" value={name} />
                  <InfoRow label="Roll Number" value={resolvedRoll} />
                  <InfoRow label="Class / Group" value={stream} />
                  <InfoRow label="Date of Birth" value={dateOfBirth} />
                  <InfoRow label="Father Name" value={fatherName} />
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-6">
                <div className="text-[11px] uppercase tracking-[0.32em] text-slate-500">Exam Details</div>
                <div className="mt-4 grid gap-4 text-sm text-slate-700">
                  <div className="grid grid-cols-[110px_1fr] gap-3">
                    <span className="uppercase tracking-[0.24em] text-slate-500">Center</span>
                    <span>{examCenter || ''}</span>
                  </div>
                  <div className="grid grid-cols-[110px_1fr] gap-3">
                    <span className="uppercase tracking-[0.24em] text-slate-500">Date</span>
                    <span>{displayExamDate}</span>
                  </div>
                  <div className="grid grid-cols-[110px_1fr] gap-3">
                    <span className="uppercase tracking-[0.24em] text-slate-500">Center Code</span>
                    <span>{centerCode || ''}</span>
                  </div>
                  <div className="mt-4 rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-center text-slate-900">
                    <div className="text-[10px] uppercase tracking-[0.34em] text-slate-500">Student Photo</div>
                    <div className="mt-3 h-40 overflow-hidden rounded-[20px] bg-slate-100">
                      {photoUrl ? <img src={photoUrl} alt={name || 'Photo'} className="h-full w-full object-cover" /> : <div className="h-full w-full bg-slate-200" />}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm text-slate-700">
                <thead>
                  <tr className="bg-slate-100 text-left text-[11px] uppercase tracking-[0.24em] text-slate-500">
                    <th className="border border-slate-200 px-4 py-3">Course Code</th>
                    <th className="border border-slate-200 px-4 py-3">Exam Date</th>
                    <th className="border border-slate-200 px-4 py-3">Exam Time</th>
                    <th className="border border-slate-200 px-4 py-3">Exam Centre</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((exam, index) => (
                    <tr key={index} className="last:border-b-0">
                      <td className="border border-slate-200 px-4 py-3">{exam.courseCode || exam.code || ''}</td>
                      <td className="border border-slate-200 px-4 py-3">{exam.examDate || exam.date || ''}</td>
                      <td className="border border-slate-200 px-4 py-3">{exam.examTime || exam.time || ''}</td>
                      <td className="border border-slate-200 px-4 py-3">{exam.examCentre || exam.centreName || exam.centre || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
                <div className="text-[11px] uppercase tracking-[0.32em] text-slate-500">Important Instructions</div>
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-700">
                  {instructions.map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-6">
                <div className="grid gap-4 text-sm text-slate-700">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.32em] text-slate-500">Authorized by</div>
                    <div className="mt-3 text-base font-semibold text-slate-900">{headName || ''}</div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.32em] text-slate-500">Institution</div>
                    <div className="mt-2 text-slate-700">{institutionName || ''}</div>
                    <div className="mt-1 text-slate-500 text-sm">{institutionAddress || ''}</div>
                    <div className="mt-1 text-slate-500 text-sm">{institutionPhone || ''}</div>
                    <div className="mt-1 text-slate-500 text-sm">{institutionEmail || ''}</div>
                  </div>
                  <div className="rounded-[20px] border border-slate-200 bg-slate-950 p-3 text-center text-white">
                    <div className="text-[10px] uppercase tracking-[0.34em]">Verified QR</div>
                    <div className="mt-3 inline-flex items-center justify-center rounded-[18px] bg-white p-3">
                      <QRCodeSVG value={resolvedQrData} size={80} level="M" includeMargin={false} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  }
)

AdmitCard.displayName = 'AdmitCard'

export default AdmitCard
