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
  institutionAddress?: string
  institutionPhone?: string
  institutionEmail?: string
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
  return Number.isNaN(parsedDate.getTime()) ? value : parsedDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function AdmitLogo({ logoUrl }: { logoUrl?: string }) {
  if (logoUrl) {
    return <img src={logoUrl} alt="Logo" style={{ width: 94, height: 94, objectFit: 'contain' }} />
  }

  return (
    <svg width="96" height="96" viewBox="0 0 96 96" aria-label="Institution logo">
      <circle cx="48" cy="48" r="38" fill="none" stroke="#2096c5" strokeWidth="8" />
      <circle cx="48" cy="48" r="24" fill="none" stroke="#2096c5" strokeWidth="7" />
      <path d="M48 12v34h24" fill="none" stroke="#2096c5" strokeWidth="8" strokeLinecap="round" />
      <circle cx="48" cy="48" r="9" fill="#2096c5" />
      <path d="M18 18v44c0 10 12 19 30 22 18-3 30-12 30-22V18" fill="none" stroke="#2096c5" strokeWidth="6" strokeLinecap="round" />
    </svg>
  )
}

const InfoLine = ({ label, value }: { label: string; value?: string }) => (
  value ? (
    <div className="admit-info-line" style={{ display: 'grid', gridTemplateColumns: '230px 1fr', alignItems: 'baseline', gap: 9, minHeight: 38, fontSize: 26, lineHeight: '34px', color: '#111111' }}>
      <strong style={{ fontWeight: 900, whiteSpace: 'nowrap' }}>{label}:</strong>
      <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  ) : null
)

export const AdmitCard = React.forwardRef<HTMLDivElement, AdmitCardProps>(
  (
    {
      name,
      rollNumber,
      className = '',
      photoUrl,
      institutionName = '',
      institutionLogo,
      institutionAddress,
      institutionPhone,
      institutionEmail,
      examName = 'Admit Card',
      examDate,
      examCenter,
      centerCode,
      dateOfBirth,
      stream,
    },
    ref
  ) => {
    const displayExamDate = formatDisplayDate(examDate)
    const qrData = JSON.stringify({
      name,
      roll: rollNumber,
      exam: examName,
      date: displayExamDate || examDate,
      center: examCenter,
      code: centerCode,
      institution: institutionName,
      address: institutionAddress,
      phone: institutionPhone,
      email: institutionEmail,
    })

    return (
      <div ref={ref} className={`admit-card ${className}`} style={{ width: 850, maxWidth: '100%', background: '#fbf6e8', padding: 0, fontFamily: 'Arial, Helvetica, sans-serif' }}>
        <section
          style={{
            width: 850,
            maxWidth: '100%',
            minHeight: 600,
            position: 'relative',
            background: '#fbf6e8',
            border: '2px solid #161616',
            color: '#111111',
            padding: '22px 22px 18px',
            overflow: 'hidden',
          }}
        >
          <header style={{ display: 'grid', gridTemplateColumns: '112px 1fr', gap: 18, alignItems: 'start' }}>
            <div style={{ paddingTop: 1 }}>
              <AdmitLogo logoUrl={institutionLogo} />
            </div>
            <div style={{ paddingTop: 4 }}>
              <h1 style={{ margin: 0, maxWidth: 570, fontSize: 28, lineHeight: '34px', fontWeight: 900, letterSpacing: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{institutionName}</h1>
              <h2 style={{ margin: '8px 0 0', maxWidth: 570, fontSize: 28, lineHeight: '34px', fontWeight: 900, letterSpacing: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{examName}</h2>
              <div style={{ marginTop: 4, display: 'grid', gap: 2, fontSize: 12, fontWeight: 700, color: '#334155' }}>
                {institutionAddress && <span>{institutionAddress}</span>}
                {(institutionPhone || institutionEmail) && <span>{[institutionPhone, institutionEmail].filter(Boolean).join(' | ')}</span>}
              </div>
              <div style={{ marginTop: 12, width: 142, height: 28, borderRadius: 18, background: 'rgba(34, 34, 34, 0.16)', filter: 'blur(7px)' }} />
            </div>
          </header>

          <div
            className="admit-photo"
            style={{
              position: 'absolute',
              right: 21,
              top: 102,
              width: 178,
              height: 230,
              border: '2px solid #222222',
              background: '#d7cfc4',
              overflow: 'hidden',
            }}
          >
            {photoUrl ? (
              <img src={photoUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(#d8c7ad, #f2d19c)' }} />
            )}
          </div>

          <main style={{ marginTop: 20, paddingRight: 208 }}>
            <InfoLine label="Student Name" value={name} />
            <InfoLine label="Roll Number" value={rollNumber} />
            <InfoLine label="Class / Programme" value={stream} />
            <InfoLine label="Date of Birth" value={dateOfBirth} />
          </main>

          <table style={{ position: 'relative', zIndex: 1, width: '100%', marginTop: 5, borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: 22, background: 'transparent' }}>
            <thead>
              <tr>
                <th style={{ border: '2px solid #1f1f1f', padding: '6px 8px', width: '20%', fontSize: 21, fontWeight: 900, textAlign: 'center' }}>Class / Subject</th>
                <th style={{ border: '2px solid #1f1f1f', padding: '6px 8px', width: '20%', fontSize: 21, fontWeight: 900, textAlign: 'center' }}>Exam Date</th>
                <th style={{ border: '2px solid #1f1f1f', padding: '6px 8px', width: '23%', fontSize: 21, fontWeight: 900, textAlign: 'center' }}>Exam Time</th>
                <th style={{ border: '2px solid #1f1f1f', padding: '6px 8px', width: '37%', fontSize: 21, fontWeight: 900, textAlign: 'center' }}>Exam Centre</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: '2px solid #1f1f1f', padding: '5px 12px', height: 37, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stream || ''}</td>
                <td style={{ border: '2px solid #1f1f1f', padding: '5px 10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayExamDate || ''}</td>
                <td style={{ border: '2px solid #1f1f1f', padding: '5px 12px', fontWeight: 500 }}></td>
                <td style={{ border: '2px solid #1f1f1f', padding: '5px 12px', fontWeight: 500 }}>
                  <div style={{ display: 'grid', gap: 4, lineHeight: 1.15, wordBreak: 'break-word' }}>
                    <span style={{ fontWeight: 900 }}>{centerCode || ''}</span>
                    <span>{examCenter || ''}</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="admit-qr" style={{ position: 'absolute', right: 35, bottom: 28, width: 100, height: 100, background: '#ffffff', padding: 4 }}>
            <QRCodeSVG value={qrData} size={92} level="M" includeMargin={false} />
          </div>
        </section>
      </div>
    )
  }
)

AdmitCard.displayName = 'AdmitCard'

export default AdmitCard
