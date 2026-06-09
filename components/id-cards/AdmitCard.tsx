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
  motherName?: string
  stream?: string
  examData?: AdmitCardExamItem[]
}

const formatDisplayDate = (value?: string) => {
  if (!value) return ''
  const parsedDate = new Date(value)
  return Number.isNaN(parsedDate.getTime())
    ? String(value).split('T')[0]
    : parsedDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      })
}

function AdmitLogo({ logoUrl }: { logoUrl?: string }) {
  if (logoUrl) return <img src={logoUrl} alt="Logo" style={{ width: 78, height: 78, objectFit: 'contain' }} />
  return (
    <svg width="78" height="78" viewBox="0 0 96 96" aria-label="Institution logo">
      <circle cx="48" cy="48" r="39" fill="#ffffff" stroke="#0f172a" strokeWidth="4" />
      <path d="M25 42 48 26l23 16-23 16-23-16Z" fill="#0f766e" />
      <path d="M33 51v12c8 6 22 6 30 0V51" fill="none" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" />
      <path d="M72 43v18" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
      <circle cx="72" cy="65" r="4" fill="#f59e0b" />
    </svg>
  )
}

const InfoLine = ({ label, value }: { label: string; value?: string }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '118px 1fr', gap: 10, alignItems: 'start', borderBottom: '1px solid #e2e8f0', padding: '7px 0', color: '#1e293b', fontSize: 12 }}>
    <span style={{ color: '#64748b', fontSize: 9, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase' }}>{label}</span>
    <span style={{ fontWeight: 700 }}>{value || '-'}</span>
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
      motherName,
      stream,
      examData,
      headName,
    },
    ref
  ) => {
    const displayExamDate = formatDisplayDate(examDate)
    const displayDateOfBirth = formatDisplayDate(dateOfBirth)
    const resolvedRoll = rollNumber || roll || ''
    const resolvedQrData = qrData || JSON.stringify({ name, rollNumber: resolvedRoll, examName, examDate: displayExamDate || examDate, examCenter, centerCode, institutionName })
    const rows = Array.isArray(examData) && examData.length > 0 ? examData : [{ courseCode: '', examDate: displayExamDate || '', examTime: '', examCentre: examCenter || '', centreCode: centerCode || '' }]
    const contact = [institutionPhone, institutionEmail].filter(Boolean).join(' | ')

    return (
      <div ref={ref} className={`admit-card ${className}`} style={{ width: '190mm', height: '134mm', maxWidth: 'none', maxHeight: 'none', background: '#eef2f7', padding: 0, fontFamily: 'Inter, Arial, ui-sans-serif, system-ui, sans-serif', flex: '0 0 auto' }}>
        <section style={{ width: '190mm', height: '134mm', background: '#ffffff', borderRadius: '6mm', overflow: 'hidden', border: '1px solid #cbd5e1', boxSizing: 'border-box', position: 'relative', display: 'flex', flexDirection: 'column' }}>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: .035, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 78, fontWeight: 900, color: '#0f172a', transform: 'rotate(-22deg)', letterSpacing: '.1em' }}>ADMIT CARD</div>
          <div style={{ height: 10, background: 'linear-gradient(90deg,#0f172a,#0f766e,#f59e0b)' }} />

          <header style={{ padding: '15px 22px 13px', display: 'grid', gridTemplateColumns: '86px 1fr 94px', gap: 14, alignItems: 'center', borderBottom: '1px solid #e2e8f0', background: 'linear-gradient(180deg,#ffffff,#f8fafc)' }}>
            <div style={{ width: 86, height: 86, border: '1px solid #cbd5e1', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', overflow: 'hidden' }}><AdmitLogo logoUrl={institutionLogo} /></div>
            <div style={{ textAlign: 'center', minWidth: 0 }}>
              <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 999, background: '#ecfdf5', color: '#047857', fontSize: 10, fontWeight: 900, letterSpacing: '.18em', textTransform: 'uppercase' }}>Official Admit Card</div>
              <h1 style={{ margin: '7px 0 3px', color: '#0f172a', fontSize: 26, lineHeight: 1.05, fontWeight: 950, letterSpacing: '-.02em' }}>{institutionName || 'Institution'}</h1>
              {institutionAddress && <p style={{ margin: 0, color: '#475569', fontSize: 11, lineHeight: 1.35 }}>{institutionAddress}</p>}
              {contact && <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: 10 }}>{contact}</p>}
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 78, height: 78, borderRadius: 16, border: '1px solid #cbd5e1', background: '#fff', padding: 7 }}>
                <QRCodeSVG value={resolvedQrData} size={62} level="M" includeMargin={false} />
              </div>
              <div style={{ marginTop: 4, color: '#64748b', fontSize: 8, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase' }}>Verify QR</div>
            </div>
          </header>

          <main style={{ flex: 1, padding: '14px 22px 12px', display: 'grid', gridTemplateRows: 'auto auto 1fr auto', gap: 10, minHeight: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 14, alignItems: 'center' }}>
              <div style={{ borderRadius: 18, background: '#0f172a', color: '#fff', padding: '10px 16px' }}>
                <div style={{ fontSize: 10, letterSpacing: '.22em', textTransform: 'uppercase', color: '#a7f3d0', fontWeight: 900 }}>Examination</div>
                <div style={{ marginTop: 3, fontSize: 19, fontWeight: 950, lineHeight: 1.15 }}>{examName || 'Admit Card'}</div>
              </div>
              <div style={{ borderRadius: 18, border: '1px solid #cbd5e1', background: '#f8fafc', padding: '9px 14px', minWidth: 155 }}>
                <div style={{ fontSize: 9, color: '#64748b', letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 }}>Center Code</div>
                <div style={{ marginTop: 2, color: '#0f172a', fontSize: 15, fontWeight: 900 }}>{centerCode || '-'}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 150px .9fr', gap: 12, minHeight: 0 }}>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 18, background: '#ffffff', padding: '10px 14px' }}>
                <div style={{ marginBottom: 2, color: '#0f766e', fontSize: 10, fontWeight: 950, letterSpacing: '.18em', textTransform: 'uppercase' }}>Candidate Information</div>
                <InfoLine label="Name" value={name} />
                <InfoLine label="Roll / ID" value={resolvedRoll} />
                <InfoLine label="Class / Group" value={stream} />
                <InfoLine label="Date of Birth" value={displayDateOfBirth} />
                <InfoLine label="Father" value={fatherName} />
                <InfoLine label="Mother" value={motherName} />
              </div>

              <div style={{ border: '1px solid #e2e8f0', borderRadius: 18, background: '#f8fafc', padding: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: '#64748b', fontWeight: 900, letterSpacing: '.14em', textTransform: 'uppercase' }}>Candidate Photo</div>
                <div style={{ margin: '8px auto 0', width: 112, height: 134, overflow: 'hidden', borderRadius: 14, border: '1px solid #cbd5e1', background: '#e2e8f0' }}>
                  {photoUrl ? <img src={photoUrl} alt={name || 'Student photo'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 11 }}>PHOTO</div>}
                </div>
                <div style={{ marginTop: 8, fontSize: 10, color: '#334155', fontWeight: 800 }}>Roll: {resolvedRoll || '-'}</div>
              </div>

              <div style={{ border: '1px solid #e2e8f0', borderRadius: 18, background: '#ffffff', padding: '10px 14px' }}>
                <div style={{ marginBottom: 8, color: '#0f766e', fontSize: 10, fontWeight: 950, letterSpacing: '.18em', textTransform: 'uppercase' }}>Exam Center</div>
                <div style={{ color: '#0f172a', fontSize: 12, lineHeight: 1.55, fontWeight: 700 }}>{examCenter || institutionAddress || '-'}</div>
                <div style={{ marginTop: 12, borderTop: '1px dashed #cbd5e1', paddingTop: 10 }}>
                  <div style={{ color: '#64748b', fontSize: 9, fontWeight: 900, letterSpacing: '.14em', textTransform: 'uppercase' }}>Exam Date</div>
                  <div style={{ color: '#0f172a', fontSize: 13, fontWeight: 900 }}>{displayExamDate || '-'}</div>
                </div>
              </div>
            </div>

            <div style={{ overflow: 'hidden', borderRadius: 16, border: '1px solid #cbd5e1', minHeight: 0 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: 10.5, color: '#1e293b' }}>
                <thead><tr style={{ background: '#0f172a', color: '#fff' }}><th style={{ width: 40, border: '1px solid #334155', padding: '7px 8px' }}>SL</th><th style={{ border: '1px solid #334155', padding: '7px 8px', textAlign: 'left' }}>Subject / Course</th><th style={{ width: 100, border: '1px solid #334155', padding: '7px 8px' }}>Exam Date</th><th style={{ width: 92, border: '1px solid #334155', padding: '7px 8px' }}>Duration</th><th style={{ border: '1px solid #334155', padding: '7px 8px', textAlign: 'left' }}>Centre</th></tr></thead>
                <tbody>{rows.slice(0, 6).map((exam, index) => <tr key={index} style={{ background: index % 2 ? '#f8fafc' : '#ffffff' }}><td style={{ border: '1px solid #e2e8f0', padding: '6px 8px', textAlign: 'center', fontWeight: 800 }}>{index + 1}</td><td style={{ border: '1px solid #e2e8f0', padding: '6px 8px', fontWeight: 800 }}>{exam.courseCode || exam.code || '-'}</td><td style={{ border: '1px solid #e2e8f0', padding: '6px 8px', textAlign: 'center' }}>{exam.examDate || exam.date || '-'}</td><td style={{ border: '1px solid #e2e8f0', padding: '6px 8px', textAlign: 'center' }}>{exam.examTime || exam.time || '-'}</td><td style={{ border: '1px solid #e2e8f0', padding: '6px 8px' }}>{exam.examCentre || exam.centreName || exam.centre || '-'}</td></tr>)}</tbody>
              </table>
            </div>

            <footer style={{ display: 'grid', gridTemplateColumns: '1.3fr .9fr .9fr', gap: 12, alignItems: 'end' }}>
              <div style={{ borderRadius: 16, background: '#fff7ed', border: '1px solid #fed7aa', padding: '10px 12px' }}>
                <div style={{ color: '#9a3412', fontSize: 9, fontWeight: 950, letterSpacing: '.16em', textTransform: 'uppercase' }}>Instructions</div>
                <ol style={{ margin: '6px 0 0', paddingLeft: 16, color: '#475569', fontSize: 9.5, lineHeight: 1.45 }}>
                  <li>Bring this admit card and school ID card to the exam hall.</li>
                  <li>Mobile phone, smart watch and unauthorized notes are not allowed.</li>
                  <li>Report to the exam hall at least 20 minutes before exam time.</li>
                </ol>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ height: 42, display: 'flex', alignItems: 'end', justifyContent: 'center' }}>{headSignature ? <img src={headSignature} alt="Signature" style={{ maxWidth: 110, maxHeight: 38, objectFit: 'contain' }} /> : null}</div>
                <div style={{ borderTop: '1px solid #0f172a', paddingTop: 5, color: '#334155', fontSize: 10, fontWeight: 800 }}>{headName || 'Head Teacher'}</div>
                <div style={{ color: '#64748b', fontSize: 8, textTransform: 'uppercase', letterSpacing: '.12em' }}>Authorized Signature</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ height: 42, display: 'flex', alignItems: 'end', justifyContent: 'center' }}>{institutionSeal ? <img src={institutionSeal} alt="Seal" style={{ maxWidth: 70, maxHeight: 42, objectFit: 'contain' }} /> : <div style={{ width: 58, height: 38, border: '1px dashed #94a3b8', borderRadius: 999, color: '#94a3b8', fontSize: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>SEAL</div>}</div>
                <div style={{ borderTop: '1px solid #0f172a', paddingTop: 5, color: '#334155', fontSize: 10, fontWeight: 800 }}>Office Seal</div>
                <div style={{ color: '#64748b', fontSize: 8, textTransform: 'uppercase', letterSpacing: '.12em' }}>Institution Verification</div>
              </div>
            </footer>
          </main>
        </section>
      </div>
    )
  }
)

AdmitCard.displayName = 'AdmitCard'

export default AdmitCard
