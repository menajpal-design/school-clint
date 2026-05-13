'use client'

import React from 'react'
import { QRCodeSVG } from 'qrcode.react'

export interface ProfessionalIDCardProps {
  name: string
  idNumber: string
  role: 'student' | 'teacher' | 'head' | 'staff'
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

const cardCopy = {
  student: {
    title: 'STUDENT',
    subtitle: 'Student ID Card',
    leftBg: '#073b49',
    rightBg: '#053441',
    gold: '#d4a63b',
  },
  teacher: {
    title: 'TEACHER',
    subtitle: 'Teacher ID Card',
    leftBg: '#063844',
    rightBg: '#053441',
    gold: '#d3a23a',
  },
  head: {
    title: 'HEAD',
    subtitle: 'Head ID Card',
    leftBg: '#4b2f08',
    rightBg: '#3c2809',
    gold: '#d4a63b',
  },
  staff: {
    title: 'STAFF',
    subtitle: 'Staff ID Card',
    leftBg: '#263241',
    rightBg: '#1f2937',
    gold: '#d4a63b',
  },
}

const formatDisplayDate = (value?: string) => {
  if (!value) return ''
  const parsedDate = new Date(value)
  return Number.isNaN(parsedDate.getTime()) ? value : parsedDate.toLocaleDateString()
}

function LogoMark({
  logoUrl,
  institutionName,
  tone = '#d4a63b',
}: {
  logoUrl?: string
  institutionName: string
  tone?: string
}) {
  if (logoUrl) {
    return <img src={logoUrl} alt="Logo" style={{ width: 72, height: 56, objectFit: 'contain' }} />
  }

  const initial = institutionName.trim().charAt(0).toUpperCase() || 'I'
  return (
    <div
      style={{
        width: 68,
        height: 54,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: tone,
        fontFamily: 'Georgia, serif',
        fontSize: 34,
        fontWeight: 800,
      }}
    >
      {initial}
    </div>
  )
}

function PhotoFrame({ name, photoUrl }: { name: string; photoUrl?: string }) {
  return (
    <div
      style={{
        width: 174,
        height: 174,
        padding: 6,
        background: '#ffffff',
        clipPath: 'polygon(50% 0%, 88% 14%, 100% 48%, 94% 78%, 50% 100%, 7% 78%, 0% 48%, 12% 14%)',
        filter: 'drop-shadow(0 3px 2px rgba(0,0,0,0.18))',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#e5e7eb',
          clipPath: 'polygon(50% 0%, 88% 14%, 100% 48%, 94% 78%, 50% 100%, 7% 78%, 0% 48%, 12% 14%)',
          overflow: 'hidden',
        }}
      >
        {photoUrl ? (
          <img src={photoUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              fontSize: 13,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #f8fafc, #dbeafe)',
            }}
          >
            PHOTO
          </div>
        )}
      </div>
    </div>
  )
}

const Row = ({ label, value }: { label: string; value?: string }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '92px 1fr', minHeight: 18, borderBottom: '1px solid rgba(255,255,255,0.62)' }}>
    <div style={{ borderRight: '1px solid rgba(255,255,255,0.62)', padding: '2px 7px', fontSize: 12, fontWeight: 800, color: '#ffffff' }}>
      {label}
    </div>
    <div style={{ padding: '2px 8px', fontSize: 12, fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
      {value || '-'}
    </div>
  </div>
)

export const ProfessionalIDCard = React.forwardRef<HTMLDivElement, ProfessionalIDCardProps>(
  (
    {
      name,
      idNumber,
      role,
      className = '',
      photoUrl,
      institutionName = 'Institute Logo',
      institutionLogo,
      institutionSeal,
      headSignature,
      validityDate,
      headName = 'Principal',
      dateOfBirth,
      fatherName,
      admissionNumber,
      registrationNumber,
      stream,
    },
    ref
  ) => {
    const theme = cardCopy[role] || cardCopy.student
    const displayValidityDate = formatDisplayDate(validityDate) || 'Valid Session'
    const qrData = JSON.stringify({
      name,
      id: idNumber,
      role,
      institution: institutionName,
      validity: displayValidityDate,
      class: stream,
      dob: dateOfBirth,
      admission: admissionNumber,
      registration: registrationNumber,
    })

    const qualificationLabel = role === 'teacher' || role === 'head' ? 'Qualification' : 'Class'
    const qualificationValue = stream || (role === 'teacher' ? 'M.Sc' : role === 'staff' ? 'Administration' : 'General')
    const sinceLabel = role === 'teacher' || role === 'head' || role === 'staff' ? 'Working Since' : 'Session'
    const sinceValue = role === 'student' ? displayValidityDate : displayValidityDate

    return (
      <div ref={ref} className={className} style={{ width: 624, maxWidth: '100%', background: '#ffffff', padding: 0 }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'stretch', justifyContent: 'center', flexWrap: 'wrap' }}>
          <section
            style={{
              position: 'relative',
              width: 302,
              height: 444,
              overflow: 'hidden',
              background: theme.leftBg,
              fontFamily: 'Arial, Helvetica, sans-serif',
              color: '#ffffff',
            }}
          >
            <div style={{ position: 'absolute', inset: 0, background: theme.leftBg }} />
            <div style={{ position: 'absolute', top: -58, left: -54, width: 142, height: 142, borderRadius: '50%', background: theme.gold }} />
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 300,
                height: 215,
                background: '#ffffff',
                borderBottomLeftRadius: '48% 14%',
                borderBottomRightRadius: '62% 20%',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 64,
                right: -68,
                width: 168,
                height: 188,
                background: theme.leftBg,
                transform: 'rotate(21deg)',
              }}
            />

            <div style={{ position: 'absolute', top: 18, left: 63 }}>
              <PhotoFrame name={name} photoUrl={photoUrl} />
            </div>

            <h1
              style={{
                position: 'absolute',
                top: 226,
                left: 0,
                right: 0,
                margin: 0,
                textAlign: 'center',
                fontSize: 52,
                lineHeight: '58px',
                fontWeight: 900,
                letterSpacing: 0,
                color: '#ffffff',
                fontFamily: 'Arial Black, Impact, Arial, sans-serif',
              }}
            >
              {theme.title}
            </h1>

            <div style={{ position: 'absolute', left: 25, right: 25, top: 312, border: '1px solid rgba(255,255,255,0.72)' }}>
              <Row label="Name:" value={name} />
              <Row label={qualificationLabel + ':'} value={qualificationValue} />
              <Row label="ID Number:" value={idNumber} />
              <Row label={sinceLabel + ':'} value={sinceValue} />
            </div>

            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <LogoMark logoUrl={institutionLogo} institutionName={institutionName} tone={theme.gold} />
              <div>
                <div style={{ color: theme.gold, fontFamily: 'Georgia, serif', fontSize: 23, fontWeight: 800, lineHeight: '22px' }}>{institutionName}</div>
                <div style={{ color: theme.gold, fontSize: 10, letterSpacing: 1.4 }}>slogan text line goes here</div>
              </div>
            </div>
          </section>

          <section
            style={{
              position: 'relative',
              width: 302,
              height: 444,
              overflow: 'hidden',
              background: '#ffffff',
              fontFamily: 'Arial, Helvetica, sans-serif',
              color: '#082f3a',
            }}
          >
            <div style={{ position: 'absolute', inset: 0, background: '#ffffff' }} />
            <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 86, background: theme.rightBg }} />
            <div style={{ position: 'absolute', right: -92, top: 72, width: 250, height: 210, borderRadius: '50%', background: theme.rightBg }} />
            <div style={{ position: 'absolute', left: -70, top: 78, width: 300, height: 125, borderRadius: '50%', background: '#ffffff' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 17, background: theme.gold }} />

            <div style={{ position: 'absolute', top: 25, left: 28 }}>
              <div style={{ color: theme.gold, fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 800, lineHeight: '22px' }}>{institutionName}</div>
              <div style={{ color: theme.gold, fontSize: 10, letterSpacing: 1.3 }}>slogan text line goes here</div>
            </div>
            <div style={{ position: 'absolute', top: 31, right: 30 }}>
              <LogoMark logoUrl={institutionSeal || institutionLogo} institutionName={institutionName} tone={theme.gold} />
            </div>

            <div style={{ position: 'absolute', left: 15, top: 112, width: 186 }}>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 500, color: '#082f3a' }}>Terms & Conditions</h2>
              <ul style={{ margin: '12px 0 0', paddingLeft: 18, fontSize: 8, lineHeight: '12px', color: '#111827', fontWeight: 700 }}>
                <li>This card is non-transferable and must be carried on campus.</li>
                <li>Loss or damage must be reported to the office immediately.</li>
                <li>Finder is requested to return this card to the issuing institute.</li>
              </ul>
            </div>

            <div style={{ position: 'absolute', left: 45, top: 236, width: 86, height: 86, background: '#ffffff' }}>
              <QRCodeSVG value={qrData} size={82} level="M" includeMargin={false} />
            </div>

            <div style={{ position: 'absolute', left: 158, top: 239, width: 114, textAlign: 'center' }}>
              <div style={{ fontSize: 8, fontWeight: 800 }}>Signature Authority</div>
              <div style={{ fontSize: 7, fontStyle: 'italic', fontWeight: 700 }}>Principal</div>
              {headSignature ? (
                <img src={headSignature} alt="Signature" style={{ marginTop: 12, width: 88, height: 34, objectFit: 'contain' }} />
              ) : (
                <div style={{ margin: '16px auto 0', width: 80, height: 26, borderBottom: '1px solid #334155', transform: 'rotate(-8deg)' }} />
              )}
              <div style={{ marginTop: 2, fontSize: 8, fontWeight: 700, color: '#334155' }}>{headName}</div>
            </div>

            <div style={{ position: 'absolute', left: 52, right: 24, bottom: 38, display: 'grid', gap: 7, fontSize: 9, fontWeight: 700, color: '#082f3a' }}>
              <div>123 street address, City State, Zip Code</div>
              <div>email@OfficeTemplatesOnline.com</div>
              <div>123-456-7890, 444-555-COMP</div>
              <div>https://www.OfficeTemplatesOnline.com</div>
            </div>
          </section>
        </div>
      </div>
    )
  }
)

ProfessionalIDCard.displayName = 'ProfessionalIDCard'

export default ProfessionalIDCard
