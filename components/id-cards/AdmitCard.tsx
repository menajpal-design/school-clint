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
  qrData?: string
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
    return <img src={logoUrl} alt="Logo" style={{ width: 88, height: 88, objectFit: 'contain' }} />
  }

  return (
    <svg width="88" height="88" viewBox="0 0 96 96" aria-label="Institution logo">
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
    <div className="admit-info-line" style={{ display: 'grid', gridTemplateColumns: '184px 1fr', alignItems: 'start', gap: 8, minHeight: 32, fontSize: 19, lineHeight: '24px', color: '#111111' }}>
      <strong style={{ fontWeight: 900, whiteSpace: 'nowrap' }}>{label}:</strong>
      <span style={{ fontWeight: 500, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{value}</span>
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
      qrData,
      dateOfBirth,
      stream,
    },
    ref
  ) => {
    const displayExamDate = formatDisplayDate(examDate)
    const resolvedQrData = qrData || JSON.stringify({
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
            padding: '18px 22px 16px',
            overflow: 'hidden',
          }}
        >
          <header style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 14, alignItems: 'start' }}>
            <div style={{ paddingTop: 0 }}>
              <AdmitLogo logoUrl={institutionLogo} />
            </div>
            <div style={{ paddingTop: 0 }}>
              <h1 style={{ margin: 0, maxWidth: 570, fontSize: 23, lineHeight: '27px', fontWeight: 900, letterSpacing: 0, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{institutionName}</h1>
              <h2 style={{ margin: '4px 0 0', maxWidth: 570, fontSize: 23, lineHeight: '27px', fontWeight: 900, letterSpacing: 0, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{examName}</h2>
              <div style={{ marginTop: 2, display: 'grid', gap: 2, fontSize: 11, fontWeight: 700, color: '#334155' }}>
                {institutionAddress && <span>{institutionAddress}</span>}
                {(institutionPhone || institutionEmail) && <span>{[institutionPhone, institutionEmail].filter(Boolean).join(' | ')}</span>}
              </div>
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

          <main style={{ marginTop: 12, paddingRight: 198 }}>
            <InfoLine label="Student Name" value={name} />
            <InfoLine label="Roll Number" value={rollNumber} />
            <InfoLine label="Class / Programme" value={stream} />
            <InfoLine label="Date of Birth" value={dateOfBirth} />
          </main>

          <div style={{ position: 'relative', zIndex: 1, marginTop: 4, paddingRight: 198 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: 19, background: 'transparent' }}>
              <thead>
                <tr>
                  <th style={{ border: '2px solid #1f1f1f', padding: '5px 8px', width: '20%', fontSize: 18, fontWeight: 900, textAlign: 'center' }}>Class / Subject</th>
                  <th style={{ border: '2px solid #1f1f1f', padding: '5px 8px', width: '20%', fontSize: 18, fontWeight: 900, textAlign: 'center' }}>Exam Date</th>
                  <th style={{ border: '2px solid #1f1f1f', padding: '5px 8px', width: '23%', fontSize: 18, fontWeight: 900, textAlign: 'center' }}>Exam Time</th>
                  <th style={{ border: '2px solid #1f1f1f', padding: '5px 8px', width: '37%', fontSize: 18, fontWeight: 900, textAlign: 'center' }}>Exam Centre</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: '2px solid #1f1f1f', padding: '4px 10px', height: 32, fontWeight: 900, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{stream || ''}</td>
                  <td style={{ border: '2px solid #1f1f1f', padding: '4px 10px', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{displayExamDate || ''}</td>
                  <td style={{ border: '2px solid #1f1f1f', padding: '4px 10px', fontWeight: 500 }}></td>
                  <td style={{ border: '2px solid #1f1f1f', padding: '4px 10px', fontWeight: 500 }}>
                    <div style={{ display: 'grid', gap: 2, lineHeight: 1.05, wordBreak: 'break-word' }}>
                      <span style={{ fontWeight: 900 }}>{centerCode || ''}</span>
                      <span>{examCenter || ''}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="admit-qr" style={{ position: 'absolute', right: 35, bottom: 28, width: 100, height: 100, background: '#ffffff', padding: 4 }}>
            <QRCodeSVG value={resolvedQrData} size={92} level="M" includeMargin={false} />
          </div>
        </section>
      </div>
    )
  }
)

AdmitCard.displayName = 'AdmitCard'

export default AdmitCard
