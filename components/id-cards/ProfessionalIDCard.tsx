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
  institutionAddress?: string
  institutionPhone?: string
  institutionEmail?: string
  institutionWebsite?: string
  headSignature?: string
  qrData?: string
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
  student: { leftBg: '#073b49', rightBg: '#053441', gold: '#d4a63b' },
  teacher: { leftBg: '#063844', rightBg: '#053441', gold: '#d3a23a' },
  head: { leftBg: '#4b2f08', rightBg: '#3c2809', gold: '#d4a63b' },
  staff: { leftBg: '#263241', rightBg: '#1f2937', gold: '#d4a63b' },
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

  const initial = institutionName.trim().charAt(0).toUpperCase()
  if (!initial) return <div style={{ width: 68, height: 54 }} />

  return (
    <div style={{ width: 68, height: 54, display: 'flex', alignItems: 'center', justifyContent: 'center', color: tone, fontFamily: 'Georgia, serif', fontSize: 34, fontWeight: 800 }}>
      {initial}
    </div>
  )
}

function PhotoFrame({ name, photoUrl }: { name: string; photoUrl?: string }) {
  return (
    <div style={{ width: 174, height: 174, padding: 6, background: '#ffffff', clipPath: 'polygon(50% 0%, 88% 14%, 100% 48%, 94% 78%, 50% 100%, 7% 78%, 0% 48%, 12% 14%)', filter: 'drop-shadow(0 3px 2px rgba(0,0,0,0.18))' }}>
      <div style={{ width: '100%', height: '100%', background: '#e5e7eb', clipPath: 'polygon(50% 0%, 88% 14%, 100% 48%, 94% 78%, 50% 100%, 7% 78%, 0% 48%, 12% 14%)', overflow: 'hidden' }}>
        {photoUrl ? <img src={photoUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #f8fafc, #dbeafe)' }} />}
      </div>
    </div>
  )
}

const Row = ({ label, value, withBottomBorder = true }: { label: string; value?: string; withBottomBorder?: boolean }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '104px 1fr', alignItems: 'start', minHeight: 28, borderBottom: withBottomBorder ? '1px solid rgba(255,255,255,0.9)' : 'none' }}>
    <div style={{ borderRight: '1px solid rgba(255,255,255,0.9)', padding: '6px 10px', fontSize: 12, fontWeight: 800, color: '#ffffff' }}>{label}</div>
    <div style={{ padding: '6px 10px', fontSize: 11, lineHeight: '15px', fontWeight: 700, color: '#ffffff', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{value || ''}</div>
  </div>
)

const ContactLine = ({ value }: { value?: string }) => (value ? <div style={{ lineHeight: '13px', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{value}</div> : null)

const BackRow = ({ label, value }: { label: string; value?: string }) =>
  value ? (
    <div style={{ display: 'grid', gridTemplateColumns: '58px 1fr', gap: 6, alignItems: 'start', minHeight: 18, fontSize: 8.5, lineHeight: '11px', color: '#111827' }}>
      <span style={{ fontWeight: 800, color: '#0f3f49' }}>{label}</span>
      <span style={{ fontWeight: 700, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{value}</span>
    </div>
  ) : null

export const ProfessionalIDCard = React.forwardRef<HTMLDivElement, ProfessionalIDCardProps>(
  (
    {
      name,
      idNumber,
      role,
      className = '',
      photoUrl,
      institutionName = '',
      institutionLogo,
      institutionSeal,
      institutionAddress,
      institutionPhone,
      institutionEmail,
      institutionWebsite,
      headSignature,
      qrData,
      validityDate,
      headName = '',
      dateOfBirth,
      fatherName,
      motherName,
      admissionNumber,
      registrationNumber,
      stream,
    },
    ref
  ) => {
    const theme = cardCopy[role] || cardCopy.student
    const displayValidityDate = formatDisplayDate(validityDate)
    const resolvedQrData = qrData || JSON.stringify({
      name,
      id: idNumber,
      role,
      institution: institutionName,
      address: institutionAddress,
      phone: institutionPhone,
      email: institutionEmail,
      website: institutionWebsite,
      validity: displayValidityDate,
      class: stream,
      dob: dateOfBirth,
      admission: admissionNumber,
      registration: registrationNumber,
    })
    const roleText = role === 'head' ? 'Head' : role.charAt(0).toUpperCase() + role.slice(1)

    const titleText = institutionName || 'hridoy School12w'
    const sloganText = 'slogan text line goes here'

    return (
      <div
        ref={ref}
        className={`professional-id-card ${className}`}
        style={{
          position: 'relative',
          width: 800,
          height: 500,
          minWidth: 800,
          maxWidth: 800,
          minHeight: 500,
          maxHeight: 500,
          boxSizing: 'border-box',
          overflow: 'hidden',
          background: '#ffffff',
          padding: 0,
          flex: '0 0 auto',
          marginBottom: 18,
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 28px', background: 'rgba(255,255,255,0.95)', borderBottom: '1px solid rgba(15,23,42,0.08)', zIndex: 20, minHeight: 56 }}>
          <div style={{ fontSize: 10, lineHeight: '12px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: '#0f172a' }}>PHOTO STUDENT</div>
          <div style={{ display: 'grid', gap: 2, fontSize: 10, lineHeight: '12px', color: '#0f172a', textAlign: 'left' }}>
            <span style={{ fontWeight: 700 }}>Name: {name || 'Select person'}</span>
            <span style={{ fontWeight: 700 }}>Class: {stream || 'General'}</span>
            <span style={{ fontWeight: 700 }}>ID Number: {idNumber || 'ID'}</span>
            <span style={{ fontWeight: 700 }}>ID Session: {displayValidityDate || 'Valid Session'}</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', lineHeight: '18px' }}>{titleText}</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#475569', lineHeight: '14px', marginTop: 2 }}>{sloganText}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 30, alignItems: 'stretch', justifyContent: 'center', flexWrap: 'nowrap', width: 800, height: 500, paddingTop: 68 }}>
          <section style={{ position: 'relative', width: 380, height: 500, overflow: 'hidden', background: theme.leftBg, fontFamily: 'Arial, Helvetica, sans-serif', color: '#ffffff' }}>
            <div style={{ position: 'absolute', inset: 0, background: theme.leftBg }} />
            <div style={{ position: 'absolute', top: -58, left: -54, width: 142, height: 142, borderRadius: '50%', background: theme.gold }} />
            <div style={{ position: 'absolute', top: 0, left: 0, width: 300, height: 215, background: '#ffffff', borderBottomLeftRadius: '48% 14%', borderBottomRightRadius: '62% 20%' }} />
            <div style={{ position: 'absolute', top: 64, right: -68, width: 168, height: 188, background: theme.leftBg, transform: 'rotate(21deg)' }} />

            <div style={{ position: 'absolute', top: 30, left: 80 }}>
              <PhotoFrame name={name} photoUrl={photoUrl} />
            </div>

            <div style={{ position: 'absolute', left: 25, right: 25, top: 306, border: '1px solid rgba(255,255,255,0.9)', background: 'rgba(255,255,255,0.03)', paddingBottom: 8 }}>
              <Row label="Name:" value={name} />
              <Row label="Role:" value={roleText} />
              <Row label="ID Number:" value={idNumber} />
              <Row label="Class:" value={stream} withBottomBorder={false} />
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.95)' }} />
            </div>

            {/* place institution title below the photo to avoid overlap */}
            <div style={{ position: 'absolute', left: 0, right: 0, top: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '0 12px' }}>
              <LogoMark logoUrl={institutionLogo} institutionName={institutionName} tone={theme.gold} />
              <div>
                <div style={{ maxWidth: 190, color: theme.gold, fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 800, lineHeight: '19px', overflowWrap: 'anywhere', wordBreak: 'break-word', textAlign: 'center' }}>{institutionName}</div>
              </div>
            </div>
          </section>

          <section style={{ position: 'relative', width: 380, height: 500, overflow: 'hidden', background: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif', color: '#082f3a', flex: '0 0 auto' }}>
            <div style={{ position: 'absolute', inset: 0, background: '#ffffff' }} />
            <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 86, background: theme.rightBg }} />
            <div style={{ position: 'absolute', right: -92, top: 72, width: 250, height: 210, borderRadius: '50%', background: theme.rightBg }} />
            <div style={{ position: 'absolute', left: -70, top: 78, width: 300, height: 125, borderRadius: '50%', background: '#ffffff' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 17, background: theme.gold }} />

            <div style={{ position: 'absolute', top: 30, left: 30 }}>
              <div style={{ maxWidth: 160, color: theme.gold, fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 800, lineHeight: '20px', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{institutionName}</div>
            </div>
            <div style={{ position: 'absolute', top: 30, right: 35 }}>
              <LogoMark logoUrl={institutionSeal || institutionLogo} institutionName={institutionName} tone={theme.gold} />
            </div>

            <div style={{ position: 'absolute', left: 15, top: 112, width: 320, display: 'grid', gap: 6 }}>
              <BackRow label="Auth." value={headName} />
              <BackRow label="Name" value={name} />
              <BackRow label="ID" value={idNumber} />
              <BackRow label="Role" value={roleText} />
              <BackRow label="Class" value={stream} />
              <BackRow label="DOB" value={dateOfBirth} />
              <BackRow label="Guardian" value={fatherName || motherName} />
              <BackRow label="Adm." value={admissionNumber} />
              <BackRow label="Reg." value={registrationNumber} />
              <BackRow label="Valid" value={displayValidityDate} />
              
            </div>

            <div style={{ position: 'absolute', left: 50, top: 280, width: 100, height: 100, background: '#ffffff' }}>
              <QRCodeSVG value={resolvedQrData} size={96} level="M" includeMargin={false} />
            </div>

            <div style={{ position: 'absolute', left: 170, top: 280, width: 150, textAlign: 'center' }}>
              {headSignature ? <img src={headSignature} alt="Signature" style={{ marginTop: 18, width: 88, height: 34, objectFit: 'contain' }} /> : <div style={{ margin: '28px auto 0', width: 80, height: 1, background: '#334155' }} />}
            </div>

            <div style={{ position: 'absolute', left: 44, right: 18, bottom: 36, display: 'grid', gap: 7, fontSize: 8.5, lineHeight: '12px', fontWeight: 700, color: '#082f3a' }}>
              <ContactLine value={institutionAddress} />
              <ContactLine value={institutionPhone} />
              <ContactLine value={institutionEmail} />
              <ContactLine value={institutionWebsite} />
            </div>
          </section>
        </div>
      </div>
    )
  }
)

ProfessionalIDCard.displayName = 'ProfessionalIDCard'

export default ProfessionalIDCard
