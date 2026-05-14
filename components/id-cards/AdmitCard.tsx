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
          width: '186mm',
          height: '131.5mm',
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
            width: '186mm',
            height: '131.5mm',
            background: '#ffffff',
            borderRadius: '8mm',
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
            boxSizing: 'border-box',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div className="bg-slate-950 text-white px-6 py-4 grid grid-cols-[1fr_auto] gap-4 items-center">
            <div>
              <p className="text-[10px] uppercase tracking-[0.42em] text-slate-400">Admit Card</p>
              <h1 className="mt-1 text-[22px] font-black leading-tight">{institutionName || ''}</h1>
              <p className="mt-1 text-[11px] text-slate-300">{examName || ''}</p>
            </div>

            <div className="flex items-center gap-4 justify-end">
              <div className="rounded-[20px] border border-white/10 bg-white/10 p-2.5">
                <AdmitLogo logoUrl={institutionLogo} />
              </div>
              <div className="text-right text-[10px] uppercase tracking-[0.35em] text-slate-400">
                <div>Verify</div>
                <div>Admit Card</div>
              </div>
            </div>
          </div>

          <div className="flex-1 p-5 space-y-4 overflow-hidden">
            <div className="grid grid-cols-[1.32fr_0.96fr] gap-4">
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                <div className="grid gap-2.5">
                  <InfoRow label="Candidate Name" value={name} />
                  <InfoRow label="Roll Number" value={resolvedRoll} />
                  <InfoRow label="Class / Group" value={stream} />
                  <InfoRow label="Date of Birth" value={dateOfBirth} />
                  <InfoRow label="Father Name" value={fatherName} />
                </div>
              </div>

              <div className="rounded-[22px] border border-slate-200 bg-white p-4">
                <div className="text-[10px] uppercase tracking-[0.32em] text-slate-500">Exam Details</div>
                <div className="mt-3 grid gap-3 text-[12px] text-slate-700">
                  <div className="grid grid-cols-[80px_1fr] gap-2">
                    <span className="uppercase tracking-[0.22em] text-slate-500">Center</span>
                    <span>{examCenter || ''}</span>
                  </div>
                  <div className="grid grid-cols-[80px_1fr] gap-2">
                    <span className="uppercase tracking-[0.22em] text-slate-500">Date</span>
                    <span>{displayExamDate}</span>
                  </div>
                  <div className="grid grid-cols-[80px_1fr] gap-2">
                    <span className="uppercase tracking-[0.22em] text-slate-500">Code</span>
                    <span>{centerCode || ''}</span>
                  </div>
                  <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
                    <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-3 text-center text-slate-900">
                      <div className="text-[9px] uppercase tracking-[0.34em] text-slate-500">Student Photo</div>
                      <div className="admit-photo mt-2 h-28 overflow-hidden rounded-[16px] bg-slate-100">
                        {photoUrl ? <img src={photoUrl} alt={name || 'Photo'} className="h-full w-full object-cover" /> : <div className="h-full w-full bg-slate-200" />}
                      </div>
                    </div>
                    <div className="admit-qr rounded-[18px] border border-slate-200 bg-slate-950 p-2 text-center text-white">
                      <div className="text-[9px] uppercase tracking-[0.34em] text-slate-300">Verify QR</div>
                      <div className="mt-2 inline-flex items-center justify-center rounded-[14px] bg-white p-2">
                        <QRCodeSVG value={resolvedQrData} size={58} level="M" includeMargin={false} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[18px] border border-slate-200">
              <table className="w-full border-collapse text-[11px] text-slate-700 table-fixed">
                <thead>
                  <tr className="bg-slate-100 text-left text-[10px] uppercase tracking-[0.22em] text-slate-500">
                    <th className="border border-slate-200 px-3 py-2">Course Code</th>
                    <th className="border border-slate-200 px-3 py-2">Exam Date</th>
                    <th className="border border-slate-200 px-3 py-2">Exam Time</th>
                    <th className="border border-slate-200 px-3 py-2">Exam Centre</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((exam, index) => (
                    <tr key={index} className="last:border-b-0">
                      <td className="border border-slate-200 px-3 py-2">{exam.courseCode || exam.code || ''}</td>
                      <td className="border border-slate-200 px-3 py-2">{exam.examDate || exam.date || ''}</td>
                      <td className="border border-slate-200 px-3 py-2">{exam.examTime || exam.time || ''}</td>
                      <td className="border border-slate-200 px-3 py-2">{exam.examCentre || exam.centreName || exam.centre || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-[1fr_0.95fr] gap-4">
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                <div className="text-[10px] uppercase tracking-[0.32em] text-slate-500">Important Instructions</div>
                <ul className="mt-3 list-disc space-y-1.5 pl-4 text-[11px] text-slate-700">
                  {instructions.map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[22px] border border-slate-200 bg-white p-4">
                <div className="grid gap-3 text-[11px] text-slate-700">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.32em] text-slate-500">Authorized by</div>
                    <div className="mt-2 text-[13px] font-semibold text-slate-900">{headName || ''}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.32em] text-slate-500">Institution</div>
                    <div className="mt-1 text-slate-700">{institutionName || ''}</div>
                    <div className="mt-1 text-slate-500">{institutionAddress || ''}</div>
                    <div className="mt-1 text-slate-500">{institutionPhone || ''}</div>
                    <div className="mt-1 text-slate-500">{institutionEmail || ''}</div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      {headSignature ? <img src={headSignature} alt="Signature" style={{ width: 86, height: 30, objectFit: 'contain' }} /> : <div style={{ width: 86, height: 1, background: '#334155' }} />}
                      <div className="text-right text-[9px] uppercase tracking-[0.28em] text-slate-500">Scan QR to verify</div>
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
