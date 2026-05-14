'use client'

import React from 'react'
import { QRCodeSVG } from 'qrcode.react'

type InstitutionInfo = {
  name?: string
  logoUrl?: string
  headName?: string
  address?: string
  email?: string
  phone?: string
  website?: string
}

export type IDCardProps = {
  name: string
  id?: string
  idNumber?: string
  role?: string
  className?: string
  photoUrl?: string
  studentClass?: string
  stream?: string
  headName?: string
  institution?: InstitutionInfo
  validity?: string
  validityDate?: string
  qrData?: string
  barcode?: string
  phone?: string
  email?: string
  institutionName?: string
  institutionLogo?: string
  institutionAddress?: string
  institutionPhone?: string
  institutionEmail?: string
  institutionWebsite?: string
}

const getSession = (value?: string) => {
  if (!value) {
    const year = new Date().getFullYear()
    return `${year} - ${year + 1}`
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const year = date.getFullYear()
  return `${year} - ${year + 1}`
}

const splitName = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return {
    first: parts[0] || name,
    rest: parts.slice(1).join(' '),
  }
}

const DataItem = ({ label, value }: { label: string; value?: string }) => (
  <div style={{ display: 'flex', marginBottom: 10 }}>
    <div style={{ fontWeight: 800, color: '#cccccc', width: 90, fontSize: 11, textTransform: 'uppercase' }}>{label}</div>
    <div style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{value || ''}</div>
  </div>
)

const Instruction = ({ children }: { children: React.ReactNode }) => (
  <li style={{ marginBottom: 6 }}>{children}</li>
)

export const StudentIDCard = React.forwardRef<HTMLDivElement, IDCardProps>(
  (
    {
      name,
      id,
      idNumber,
      className = '',
      photoUrl,
      studentClass,
      stream,
      institution,
      validity,
      validityDate,
      qrData,
      phone,
      email,
      institutionName,
      institutionAddress,
      institutionPhone,
      institutionEmail,
      institutionWebsite,
    },
    ref
  ) => {
    const resolvedId = idNumber || id || ''
    const resolvedInstitutionName = institutionName || institution?.name || 'LOGO'
    const resolvedAddress = institutionAddress || institution?.address || ''
    const resolvedPhone = institutionPhone || institution?.phone || phone || ''
    const resolvedEmail = institutionEmail || institution?.email || email || ''
    const resolvedWebsite = institutionWebsite || institution?.website || ''
    const session = getSession(validityDate || validity)
    const nameParts = splitName(name)
    const resolvedQrData = qrData || JSON.stringify({
      type: 'student-id',
      name,
      id: resolvedId,
      institution: resolvedInstitutionName,
      class: studentClass || stream,
    })

    return (
      <div ref={ref} className={`student-id-card ${className}`} style={{ width: 730, height: 500, maxWidth: 'none', maxHeight: 'none', display: 'flex', gap: 30, justifyContent: 'center', flexWrap: 'nowrap', fontFamily: '"Segoe UI", sans-serif', flex: '0 0 auto' }}>
        <section style={{ width: 350, height: 500, background: '#ffffff', borderRadius: 12, overflow: 'hidden', position: 'relative', flex: '0 0 auto' }}>
          <div style={{ height: 180, background: '#1A1A1A', position: 'relative' }}>
            <div style={{ position: 'absolute', bottom: 0, width: '110%', left: '-5%', height: 80, background: '#1E73BE', borderTopLeftRadius: '50% 100%', borderTopRightRadius: '50% 100%' }} />
            <div style={{ width: 120, height: 120, background: '#ffffff', borderRadius: '50%', border: '4px solid #ffffff', position: 'absolute', bottom: -60, left: '50%', transform: 'translateX(-50%)', zIndex: 10, overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
              {photoUrl ? (
                <img src={photoUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #f8fafc, #dbeafe)' }} />
              )}
            </div>
          </div>

          <div style={{ marginTop: 70, textAlign: 'center', padding: '0 30px' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#333333', lineHeight: '29px', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
              <span style={{ color: '#1E73BE' }}>{nameParts.first}</span>{nameParts.rest ? ` ${nameParts.rest}` : ''}
            </div>
            <div style={{ fontSize: 13, color: '#888888', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 800, marginTop: 5 }}>Student</div>

            <div style={{ marginTop: 30, textAlign: 'left', fontSize: 13, color: '#555555' }}>
              <DataItem label="ID No :" value={resolvedId} />
              <DataItem label="Session :" value={session} />
              <DataItem label="Phone :" value={resolvedPhone} />
              <DataItem label="Mail :" value={resolvedEmail} />
            </div>
          </div>

          <CardFooter logoText={resolvedInstitutionName} />
        </section>

        <section style={{ width: 350, height: 500, background: '#ffffff', borderRadius: 12, overflow: 'hidden', position: 'relative', flex: '0 0 auto' }}>
          <div style={{ height: 120, background: '#1A1A1A', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: 15 }}>
            <div style={{ position: 'absolute', bottom: -30, width: '100%', height: 60, background: '#1E73BE', borderBottomLeftRadius: '50% 100%', borderBottomRightRadius: '50% 100%' }} />
            <div style={{ width: 80, height: 80, background: '#ffffff', padding: 5, borderRadius: 8, zIndex: 5, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
              <QRCodeSVG value={resolvedQrData} size={70} level="M" includeMargin={false} />
            </div>
          </div>

          <div style={{ marginTop: 50, padding: '0 30px', textAlign: 'center' }}>
            <div style={{ color: '#1E73BE', fontWeight: 800, fontSize: 14, marginBottom: 15, textTransform: 'uppercase' }}>Instructions</div>
            <ul style={{ textAlign: 'left', fontSize: 11, color: '#777777', listStyle: 'square', paddingLeft: 15, margin: 0 }}>
              <Instruction>This card must be presented on demand by the authority.</Instruction>
              <Instruction>In case of loss, inform the registrar office immediately.</Instruction>
              <Instruction>Misuse of this card is a punishable offense.</Instruction>
              <Instruction>Return the card upon completion of the course.</Instruction>
            </ul>

            <div style={{ marginTop: 40, fontSize: 11, color: '#444444', borderTop: '1px solid #eeeeee', paddingTop: 15 }}>
              <b style={{ display: 'block', marginBottom: 5, color: '#333333' }}>OFFICE ADDRESS</b>
              {resolvedAddress && <p style={{ margin: 0 }}>{resolvedAddress}</p>}
              {(resolvedPhone || resolvedEmail) && <p style={{ margin: 0 }}>{[resolvedPhone, resolvedEmail].filter(Boolean).join(' | ')}</p>}
              {resolvedWebsite && <p style={{ margin: 0 }}>{resolvedWebsite}</p>}
            </div>
          </div>

          <CardFooter logoText={resolvedInstitutionName} />
        </section>
      </div>
    )
  }
)

function CardFooter({ logoText }: { logoText: string }) {
  return (
    <div style={{ position: 'absolute', bottom: 0, width: '100%', height: 60, background: '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 25 }}>
      <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '45%', background: '#1E73BE', clipPath: 'polygon(0 0, 100% 0, 75% 100%, 0% 100%)' }} />
      <div style={{ color: '#ffffff', fontWeight: 900, letterSpacing: 3, fontSize: 18, zIndex: 2, maxWidth: 170, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{logoText || 'LOGO'}</div>
    </div>
  )
}

StudentIDCard.displayName = 'StudentIDCard'

export default StudentIDCard
