'use client'

import React, { useEffect, useState } from 'react'
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
    : parsedDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

const shortText = (value: any, max = 52) => {
  const text = String(value || '').replace(/\s+/g, ' ').trim()
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

function PrintSafeQr({ value, size = 56 }: { value: string; size?: number }) {
  const [dataUrl, setDataUrl] = useState('')
  useEffect(() => {
    let cancelled = false
    import('qrcode')
      .then((QRCode) => QRCode.toDataURL(value || '-', { width: size * 4, margin: 1, errorCorrectionLevel: 'M', color: { dark: '#0f172a', light: '#ffffff' } }))
      .then((url) => { if (!cancelled) setDataUrl(url) })
      .catch(() => { if (!cancelled) setDataUrl('') })
    return () => { cancelled = true }
  }, [value, size])
  return <div data-print-safe-qr="true" data-qr-value={value || '-'} data-qr-size={size} style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>{dataUrl ? <img data-qr-img="true" src={dataUrl} alt="Verification QR" style={{ width: size, height: size, objectFit: 'contain', display: 'block' }} /> : <QRCodeSVG value={value || '-'} size={size} level="M" includeMargin={false} />}</div>
}

function AdmitLogo({ logoUrl }: { logoUrl?: string }) {
  if (logoUrl) return <img src={logoUrl} alt="Logo" style={{ width: 58, height: 58, objectFit: 'contain' }} />
  return (
    <svg width="58" height="58" viewBox="0 0 96 96" aria-label="Institution logo">
      <circle cx="48" cy="48" r="39" fill="#ffffff" stroke="#0f172a" strokeWidth="4" />
      <path d="M25 42 48 26l23 16-23 16-23-16Z" fill="#0f766e" />
      <path d="M33 51v12c8 6 22 6 30 0V51" fill="none" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" />
    </svg>
  )
}

const InfoLine = ({ label, value }: { label: string; value?: string }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '104px 1fr', gap: 8, alignItems: 'center', borderBottom: '1px solid #e2e8f0', padding: '5px 0', color: '#1e293b', fontSize: 12, lineHeight: '15px', minHeight: 25 }}>
    <span style={{ color: '#64748b', fontSize: 8.5, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase' }}>{label}</span>
    <span style={{ fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value || '-'}</span>
  </div>
)

const TH = ({ children, width, align = 'left' }: { children: React.ReactNode; width?: number; align?: 'left' | 'center' }) => (
  <th style={{ width, border: '1px solid #334155', padding: '5px 6px', textAlign: align, fontSize: 10, lineHeight: '12px', fontWeight: 900 }}>{children}</th>
)
const TD = ({ children, align = 'left', bold = false }: { children: React.ReactNode; align?: 'left' | 'center'; bold?: boolean }) => (
  <td style={{ border: '1px solid #e2e8f0', padding: '4px 6px', textAlign: align, fontSize: 10.2, lineHeight: '12px', fontWeight: bold ? 800 : 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{children}</td>
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
    const rows = Array.isArray(examData) && examData.length > 0 ? examData.slice(0, 6) : [{ courseCode: '', examDate: displayExamDate || '', examTime: '', examCentre: examCenter || '', centreCode: centerCode || '' }]
    const contact = [institutionPhone, institutionEmail].filter(Boolean).join(' | ')
    const center = examCenter || institutionAddress || '-'

    return (
      <div ref={ref} className={`admit-card ${className}`} style={{ width: 1123, height: 794, minWidth: 1123, maxWidth: 1123, minHeight: 794, maxHeight: 794, background: '#e9eef5', padding: 18, fontFamily: 'Arial, Helvetica, sans-serif', flex: '0 0 auto', boxSizing: 'border-box', overflow: 'hidden', WebkitPrintColorAdjust: 'exact' as any, printColorAdjust: 'exact' as any }}>
        <section style={{ width: '100%', height: '100%', background: '#ffffff', borderRadius: 24, overflow: 'hidden', border: '1px solid #cbd5e1', boxSizing: 'border-box', position: 'relative', display: 'grid', gridTemplateRows: '8px 112px 78px 220px 200px 115px' }}>
          <div style={{ background: 'linear-gradient(90deg,#0f172a,#0f766e,#f59e0b)' }} />
          <header style={{ padding: '14px 24px 12px', display: 'grid', gridTemplateColumns: '82px 1fr 92px', gap: 16, alignItems: 'center', borderBottom: '1px solid #e2e8f0', background: 'linear-gradient(180deg,#ffffff,#f8fafc)' }}>
            <div style={{ width: 74, height: 74, border: '1px solid #cbd5e1', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', overflow: 'hidden' }}><AdmitLogo logoUrl={institutionLogo} /></div>
            <div style={{ textAlign: 'center', minWidth: 0 }}>
              <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 999, background: '#ecfdf5', color: '#047857', fontSize: 10, fontWeight: 900, letterSpacing: '.18em', textTransform: 'uppercase' }}>Official Admit Card</div>
              <h1 style={{ margin: '7px 0 3px', color: '#0f172a', fontSize: 28, lineHeight: '32px', fontWeight: 950, letterSpacing: '-.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{institutionName || 'Institution'}</h1>
              {institutionAddress && <p style={{ margin: 0, color: '#475569', fontSize: 11, lineHeight: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{institutionAddress}</p>}
              {contact && <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: 10, lineHeight: '13px' }}>{contact}</p>}
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 70, height: 70, borderRadius: 14, border: '1px solid #cbd5e1', background: '#fff', padding: 6 }}>
                <PrintSafeQr value={resolvedQrData} size={56} />
              </div>
              <div style={{ marginTop: 3, color: '#64748b', fontSize: 8, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase' }}>Verify QR</div>
            </div>
          </header>

          <div style={{ padding: '13px 24px 0', display: 'grid', gridTemplateColumns: '1fr 170px', gap: 14, alignItems: 'stretch' }}>
            <div style={{ borderRadius: 18, background: '#0f172a', color: '#fff', padding: '11px 16px', overflow: 'hidden' }}>
              <div style={{ fontSize: 10, letterSpacing: '.22em', textTransform: 'uppercase', color: '#a7f3d0', fontWeight: 900 }}>Examination</div>
              <div style={{ marginTop: 5, fontSize: 22, fontWeight: 950, lineHeight: '26px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{examName || 'Admit Card'}</div>
            </div>
            <div style={{ borderRadius: 18, border: '1px solid #cbd5e1', background: '#f8fafc', padding: '11px 14px' }}>
              <div style={{ fontSize: 9, color: '#64748b', letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 }}>Center Code</div>
              <div style={{ marginTop: 6, color: '#0f172a', fontSize: 18, fontWeight: 900 }}>{centerCode || '-'}</div>
            </div>
          </div>

          <div style={{ padding: '12px 24px 0', display: 'grid', gridTemplateColumns: '1.12fr 150px .88fr', gap: 12, minHeight: 0 }}>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 18, background: '#ffffff', padding: '11px 14px', overflow: 'hidden' }}>
              <div style={{ marginBottom: 3, color: '#0f766e', fontSize: 10, fontWeight: 950, letterSpacing: '.18em', textTransform: 'uppercase' }}>Candidate Information</div>
              <InfoLine label="Name" value={name} />
              <InfoLine label="Roll / ID" value={resolvedRoll} />
              <InfoLine label="Class / Group" value={stream} />
              <InfoLine label="Date of Birth" value={displayDateOfBirth} />
              <InfoLine label="Father" value={fatherName} />
              <InfoLine label="Mother" value={motherName} />
            </div>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: 18, background: '#f8fafc', padding: 10, textAlign: 'center', overflow: 'hidden' }}>
              <div style={{ fontSize: 9, color: '#64748b', fontWeight: 900, letterSpacing: '.14em', textTransform: 'uppercase' }}>Candidate Photo</div>
              <div style={{ margin: '7px auto 0', width: 112, height: 132, overflow: 'hidden', borderRadius: 14, border: '1px solid #cbd5e1', background: '#e2e8f0' }}>
                {photoUrl ? <img src={photoUrl} alt={name || 'Student photo'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 11 }}>PHOTO</div>}
              </div>
              <div style={{ marginTop: 7, fontSize: 10, color: '#334155', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Roll: {resolvedRoll || '-'}</div>
            </div>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: 18, background: '#ffffff', padding: '11px 14px', overflow: 'hidden' }}>
              <div style={{ marginBottom: 8, color: '#0f766e', fontSize: 10, fontWeight: 950, letterSpacing: '.18em', textTransform: 'uppercase' }}>Exam Center</div>
              <div style={{ color: '#0f172a', fontSize: 12, lineHeight: '17px', fontWeight: 700, height: 68, overflow: 'hidden' }}>{center}</div>
              <div style={{ marginTop: 10, borderTop: '1px dashed #cbd5e1', paddingTop: 9 }}>
                <div style={{ color: '#64748b', fontSize: 9, fontWeight: 900, letterSpacing: '.14em', textTransform: 'uppercase' }}>Exam Date</div>
                <div style={{ color: '#0f172a', fontSize: 14, fontWeight: 900, marginTop: 3 }}>{displayExamDate || '-'}</div>
              </div>
            </div>
          </div>

          <div style={{ padding: '12px 24px 0', overflow: 'hidden' }}>
            <div style={{ overflow: 'hidden', borderRadius: 15, border: '1px solid #cbd5e1', height: '100%' }}>
              <table style={{ width: '100%', height: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: 10.2, color: '#1e293b' }}>
                <thead><tr style={{ background: '#0f172a', color: '#fff', height: 27 }}><TH width={40} align="center">SL</TH><TH>Subject / Course</TH><TH width={110} align="center">Exam Date</TH><TH width={88} align="center">Duration</TH><TH>Centre</TH></tr></thead>
                <tbody>{rows.map((exam, index) => <tr key={index} style={{ background: index % 2 ? '#f8fafc' : '#ffffff', height: 28 }}><TD align="center" bold>{index + 1}</TD><TD bold>{shortText(exam.courseCode || exam.code || '-', 32)}</TD><TD align="center">{shortText(exam.examDate || exam.date || '-', 18)}</TD><TD align="center">{shortText(exam.examTime || exam.time || '-', 14)}</TD><TD>{shortText(exam.examCentre || exam.centreName || exam.centre || '-', 48)}</TD></tr>)}</tbody>
              </table>
            </div>
          </div>

          <footer style={{ padding: '12px 24px 18px', display: 'grid', gridTemplateColumns: '1.45fr .75fr .75fr', gap: 14, alignItems: 'end', overflow: 'hidden' }}>
            <div style={{ borderRadius: 16, background: '#fff7ed', border: '1px solid #fed7aa', padding: '10px 12px', height: 82, overflow: 'hidden' }}>
              <div style={{ color: '#9a3412', fontSize: 9, fontWeight: 950, letterSpacing: '.16em', textTransform: 'uppercase' }}>Instructions</div>
              <ol style={{ margin: '5px 0 0', paddingLeft: 16, color: '#475569', fontSize: 9.4, lineHeight: '13px' }}>
                <li>Bring this admit card and school ID card to the exam hall.</li>
                <li>Mobile phone, smart watch and unauthorized notes are not allowed.</li>
                <li>Report to the exam hall at least 20 minutes before exam time.</li>
              </ol>
            </div>
            <div style={{ textAlign: 'center', height: 82, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <div style={{ height: 34, display: 'flex', alignItems: 'end', justifyContent: 'center' }}>{headSignature ? <img src={headSignature} alt="Signature" style={{ maxWidth: 105, maxHeight: 30, objectFit: 'contain' }} /> : null}</div>
              <div style={{ borderTop: '1px solid #0f172a', paddingTop: 5, color: '#334155', fontSize: 10, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{headName || 'Head Teacher'}</div>
              <div style={{ color: '#64748b', fontSize: 8, textTransform: 'uppercase', letterSpacing: '.12em' }}>Authorized Signature</div>
            </div>
            <div style={{ textAlign: 'center', height: 82, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <div style={{ height: 34, display: 'flex', alignItems: 'end', justifyContent: 'center' }}>{institutionSeal ? <img src={institutionSeal} alt="Seal" style={{ maxWidth: 62, maxHeight: 34, objectFit: 'contain' }} /> : <div style={{ width: 54, height: 32, border: '1px dashed #94a3b8', borderRadius: 999, color: '#94a3b8', fontSize: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>SEAL</div>}</div>
              <div style={{ borderTop: '1px solid #0f172a', paddingTop: 5, color: '#334155', fontSize: 10, fontWeight: 800 }}>Office Seal</div>
              <div style={{ color: '#64748b', fontSize: 8, textTransform: 'uppercase', letterSpacing: '.12em' }}>Institution Verification</div>
            </div>
          </footer>
        </section>
      </div>
    )
  }
)

AdmitCard.displayName = 'AdmitCard'

export default AdmitCard
