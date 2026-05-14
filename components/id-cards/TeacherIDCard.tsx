'use client'

import React from 'react'
import { QRCodeSVG } from 'qrcode.react'

type InstitutionInfo = {
  name?: string
  logoUrl?: string
  address?: string
  email?: string
  phone?: string
  website?: string
  headName?: string
}

export type TeacherIDCardProps = {
  name: string
  id?: string
  idNumber?: string
  role?: string
  className?: string
  photoUrl?: string
  qualification?: string
  designation?: string
  studentClass?: string
  stream?: string
  joined?: string
  joinDate?: string
  validity?: string
  validityDate?: string
  headName?: string
  qrData?: string
  phone?: string
  email?: string
  institution?: InstitutionInfo
  institutionName?: string
  institutionLogo?: string
  institutionAddress?: string
  institutionPhone?: string
  institutionEmail?: string
  institutionWebsite?: string
}

const formatDate = (value?: string) => {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

const InfoRow = ({ label, value }: { label: string; value?: string }) => (
  <tr>
    <td style={{ padding: 7, border: '1px solid rgba(255,255,255,0.1)', fontWeight: 800, width: '40%' }}>{label}</td>
    <td style={{ padding: 7, border: '1px solid rgba(255,255,255,0.1)', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{value || ''}</td>
  </tr>
)

const TermItem = ({ children }: { children: React.ReactNode }) => (
  <li style={{ marginBottom: 8 }}>{children}</li>
)

export const TeacherIDCard = React.forwardRef<HTMLDivElement, TeacherIDCardProps>(
  (
    {
      name,
      id,
      idNumber,
      className = '',
      photoUrl,
      qualification,
      designation,
      studentClass,
      stream,
      joined,
      joinDate,
      validity,
      validityDate,
      headName,
      qrData,
      phone,
      email,
      institution,
      institutionName,
      institutionAddress,
      institutionPhone,
      institutionEmail,
      institutionWebsite,
    },
    ref
  ) => {
    const resolvedInstitutionName = institutionName || institution?.name || 'Institute Logo'
    const resolvedAddress = institutionAddress || institution?.address || ''
    const resolvedPhone = institutionPhone || institution?.phone || phone || ''
    const resolvedEmail = institutionEmail || institution?.email || email || ''
    const resolvedWebsite = institutionWebsite || institution?.website || ''
    const resolvedId = idNumber || id || ''
    const resolvedQualification = qualification || designation || studentClass || stream || ''
    const resolvedJoined = joined || joinDate || formatDate(validityDate || validity)
    const resolvedQrData = qrData || JSON.stringify({
      type: 'teacher-id',
      name,
      id: resolvedId,
      institution: resolvedInstitutionName,
    })

    return (
      <div ref={ref} className={`teacher-id-card ${className}`} style={{ width: 730, height: 500, maxWidth: 'none', maxHeight: 'none', display: 'flex', gap: 30, justifyContent: 'center', flexWrap: 'nowrap', fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif', flex: '0 0 auto' }}>
        <section style={{ width: 350, height: 500, backgroundColor: '#002B36', position: 'relative', overflow: 'hidden', borderRadius: 15, color: '#ffffff', flex: '0 0 auto' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 230, background: '#ffffff', borderBottomLeftRadius: '50% 20%', borderBottomRightRadius: '50% 20%', zIndex: 1 }} />
          <div style={{ position: 'absolute', top: 0, left: 0, width: 90, height: 90, background: '#D49B41', borderBottomRightRadius: '100%', zIndex: 2 }} />

          <div style={{ position: 'relative', zIndex: 3, marginTop: 45, textAlign: 'center' }}>
            <div style={{ width: 150, height: 180, border: '6px solid #002B36', borderRadius: 30, display: 'inline-block', overflow: 'hidden', background: '#eeeeee' }}>
              {photoUrl ? (
                <img src={photoUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #f8fafc, #cbd5e1)' }} />
              )}
            </div>
          </div>

          <h1 style={{ margin: '15px 0', position: 'relative', zIndex: 3, textAlign: 'center', fontSize: 45, fontWeight: 900, letterSpacing: 3, lineHeight: 1 }}>TEACHER</h1>

          <div style={{ padding: '0 25px', position: 'relative', zIndex: 3 }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <tbody>
                <InfoRow label="Name:" value={name} />
                <InfoRow label="Qualification:" value={resolvedQualification} />
                <InfoRow label="ID Number:" value={resolvedId} />
                <InfoRow label="Joined:" value={resolvedJoined} />
              </tbody>
            </table>
          </div>
        </section>

        <section style={{ width: 350, height: 500, backgroundColor: '#ffffff', position: 'relative', overflow: 'hidden', borderRadius: 15, color: '#333333', flex: '0 0 auto' }}>
          <div style={{ height: 100, background: '#002B36', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }}>
            <div style={{ textAlign: 'left', color: '#D49B41' }}>
              <div style={{ fontWeight: 800, fontSize: 16, maxWidth: 220, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{resolvedInstitutionName}</div>
              <div style={{ fontSize: 10, color: '#cccccc' }}>Education for future</div>
            </div>
            <div style={{ fontSize: 22, color: '#D49B41', fontWeight: 900 }}>LOGO</div>
          </div>

          <div style={{ padding: 25, height: 200 }}>
            <h3 style={{ color: '#002B36', fontSize: 16, margin: '0 0 10px', borderBottom: '2px solid #D49B41', display: 'inline-block' }}>Terms & Conditions</h3>
            <ul style={{ listStyle: 'disc', paddingLeft: 20, fontSize: 11, color: '#555555', margin: 0 }}>
              <TermItem>This card is property of the Institute.</TermItem>
              <TermItem>Loss must be reported immediately to the office.</TermItem>
              <TermItem>Always wear this ID card within premises.</TermItem>
              <TermItem>Non-transferable and must be returned on exit.</TermItem>
            </ul>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 25px', marginTop: 10 }}>
            <div style={{ width: 88, height: 88, border: '1px solid #dddddd', padding: 3, background: '#ffffff' }}>
              <QRCodeSVG value={resolvedQrData} size={80} level="M" includeMargin={false} />
            </div>
            <div style={{ textAlign: 'center', borderTop: '1px solid #002B36', width: 120, paddingTop: 5, fontSize: 10, fontWeight: 800 }}>
              <div style={{ height: 30 }} />
              {headName || institution?.headName || 'AUTHORITY SIGN'}
            </div>
          </div>

          <div style={{ position: 'absolute', bottom: 6, width: '100%', background: '#f9f9f9', padding: '15px 25px', borderTop: '1px solid #eeeeee', fontSize: 10, color: '#666666', lineHeight: 1.5 }}>
            {resolvedAddress && <p style={{ margin: 0 }}>{resolvedAddress}</p>}
            {(resolvedPhone || resolvedEmail) && <p style={{ margin: 0 }}>{[resolvedPhone, resolvedEmail].filter(Boolean).join(' | ')}</p>}
            {resolvedWebsite && <p style={{ margin: 0 }}>{resolvedWebsite}</p>}
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 6, background: '#D49B41' }} />
        </section>
      </div>
    )
  }
)

TeacherIDCard.displayName = 'TeacherIDCard'

export default TeacherIDCard
