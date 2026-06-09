'use client'

import React from 'react'
import { QRCodeSVG } from 'qrcode.react'

type Props = {
  name: string
  idNumber: string
  role: string
  className?: string
  studentClassName?: string
  sectionName?: string
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
  guardianName?: string
  guardianPhone?: string
  admissionNumber?: string
  registrationNumber?: string
  stream?: string
  rollNumber?: string
  designation?: string
  department?: string
}

const normalizeRole = (role?: string) => {
  const value = String(role || 'user').toLowerCase().replace(/[\s-]+/g, '_')
  if (value === 'principal') return 'head'
  if (value === 'assistanthead') return 'assistant_head'
  if (value.includes('teacher') || value === 'class_teacher' || value === 'subject_teacher') return 'teacher'
  if (value === 'head' || value === 'assistant_head') return value
  if (value.includes('staff') || value.includes('librarian') || value.includes('account') || value.includes('finance')) return 'staff'
  if (value === 'student') return 'student'
  return value
}

const roleLabel = (role?: string) => {
  const normalized = normalizeRole(role)
  if (normalized === 'head') return 'Head Teacher / Principal'
  if (normalized === 'assistant_head') return 'Assistant Head Teacher'
  if (normalized === 'teacher') return 'Teacher'
  if (normalized === 'staff') return 'Staff'
  if (normalized === 'student') return 'Student'
  return normalized.split('_').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
}

const formatDate = (value?: string) => {
  if (!value) return ''
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

const joinText = (...values: any[]) => values.filter((v) => v !== undefined && v !== null && String(v).trim() !== '').map((v) => String(v).trim()).join(' · ')

const roleTheme = (role?: string) => {
  const normalized = normalizeRole(role)
  if (normalized === 'student') return { key: 'student', primary: '#064e3b', secondary: '#0f766e', accent: '#f59e0b', soft: '#ecfdf5', title: 'Student Identity Card', pattern: '#d1fae5' }
  if (normalized === 'teacher') return { key: 'teacher', primary: '#172554', secondary: '#2563eb', accent: '#fbbf24', soft: '#eff6ff', title: 'Teacher Identity Card', pattern: '#dbeafe' }
  if (normalized === 'staff') return { key: 'staff', primary: '#312e81', secondary: '#7c3aed', accent: '#f472b6', soft: '#f5f3ff', title: 'Staff Identity Card', pattern: '#ede9fe' }
  if (normalized === 'head' || normalized === 'assistant_head') return { key: 'leadership', primary: '#451a03', secondary: '#b45309', accent: '#facc15', soft: '#fffbeb', title: 'Leadership Identity Card', pattern: '#fef3c7' }
  return { key: 'staff', primary: '#0f172a', secondary: '#334155', accent: '#f59e0b', soft: '#f8fafc', title: 'Identity Card', pattern: '#e2e8f0' }
}

function Logo({ logo, name, color }: { logo?: string; name?: string; color: string }) {
  if (logo) return <img src={logo} alt="Institution logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
  return <div style={{ width: '100%', height: '100%', borderRadius: 16, background: '#fff', color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 950 }}>{String(name || 'S').charAt(0).toUpperCase()}</div>
}

function Photo({ src, name, role }: { src?: string; name: string; role: string }) {
  const normalized = normalizeRole(role)
  const radius = normalized === 'student' ? 22 : normalized === 'teacher' ? 999 : normalized === 'staff' ? 14 : 18
  return <div style={{ width: 132, height: 158, borderRadius: radius, border: '5px solid #fff', background: '#e2e8f0', overflow: 'hidden', boxShadow: '0 18px 35px rgba(15,23,42,.26)' }}>{src ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#f8fafc,#cbd5e1)' }} />}</div>
}

function Field({ label, value, dark = false }: { label: string; value?: string; dark?: boolean }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '86px 1fr', gap: 8, borderBottom: `1px solid ${dark ? 'rgba(255,255,255,.18)' : '#e2e8f0'}`, padding: '6px 0', fontSize: 10.5, lineHeight: '14px' }}><span style={{ color: dark ? 'rgba(255,255,255,.68)' : '#64748b', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.08em' }}>{label}</span><span style={{ color: dark ? '#fff' : '#0f172a', fontWeight: 850, overflowWrap: 'anywhere' }}>{value || '-'}</span></div>
}

function ReturnBlock({ p, theme }: { p: Props; theme: ReturnType<typeof roleTheme> }) {
  return <div style={{ borderRadius: 14, background: theme.soft, border: `1px solid ${theme.pattern}`, padding: '9px 11px', fontSize: 9.5, lineHeight: '13px', color: '#334155', fontWeight: 700 }}>
    <div style={{ color: theme.primary, fontSize: 9, fontWeight: 950, textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 4 }}>Return Instruction</div>
    <div>If found outside, please return this ID card to the school address below.</div>
    {p.institutionAddress ? <div style={{ marginTop: 3 }}><b>School Address:</b> {p.institutionAddress}</div> : null}
    <div style={{ marginTop: 3 }}>{[p.institutionPhone && `Phone: ${p.institutionPhone}`, p.institutionEmail && `Email: ${p.institutionEmail}`, p.institutionWebsite && `Web: ${p.institutionWebsite}`].filter(Boolean).join(' | ')}</div>
  </div>
}

export const RoleBasedIDCard = React.forwardRef<HTMLDivElement, Props>((p, ref) => {
  const normalized = normalizeRole(p.role)
  const theme = roleTheme(p.role)
  const label = roleLabel(p.role)
  const valid = formatDate(p.validityDate)
  const classInfo = joinText(p.studentClassName || p.stream, p.sectionName ? `Section ${p.sectionName}` : '')
  const deptInfo = p.designation || p.department || p.stream || label
  const mainId = normalized === 'student' ? (p.rollNumber || p.idNumber) : p.idNumber
  const qr = p.qrData || JSON.stringify({ name: p.name, id: p.idNumber, roll: p.rollNumber, role: label, class: classInfo, department: deptInfo, institution: p.institutionName, valid })

  return <div ref={ref} className={`professional-id-card role-id-card role-id-card-${theme.key} ${p.className || ''}`} style={{ position: 'relative', width: 800, height: 500, minWidth: 800, maxWidth: 800, minHeight: 500, maxHeight: 500, overflow: 'hidden', background: '#ffffff', boxSizing: 'border-box', fontFamily: 'Arial, Helvetica, sans-serif', flex: '0 0 auto', WebkitPrintColorAdjust: 'exact' as any, printColorAdjust: 'exact' as any }}>
    <div style={{ position: 'absolute', inset: 0, background: '#ffffff' }} />
    <div style={{ position: 'absolute', left: 0, top: 0, width: 390, height: 500, background: `linear-gradient(145deg, ${theme.primary}, ${theme.secondary})` }} />
    <div style={{ position: 'absolute', left: -90, top: -90, width: 240, height: 240, borderRadius: '50%', background: theme.accent, opacity: .28 }} />
    <div style={{ position: 'absolute', right: -120, bottom: -125, width: 340, height: 340, borderRadius: '50%', background: theme.pattern }} />
    <div style={{ position: 'absolute', left: 24, right: 24, top: 24, bottom: 24, borderRadius: 24, overflow: 'hidden', boxShadow: '0 22px 48px rgba(15,23,42,.25)', background: '#fff', border: '1px solid #cbd5e1' }}>
      <section style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 312, background: `linear-gradient(160deg, ${theme.primary}, ${theme.secondary})`, color: '#fff', padding: '22px 20px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><div style={{ width: 58, height: 58, borderRadius: 16, background: '#fff', padding: 6 }}><Logo logo={p.institutionLogo} name={p.institutionName} color={theme.primary} /></div><div style={{ fontSize: 15, lineHeight: '17px', fontWeight: 950, overflowWrap: 'anywhere' }}>{p.institutionName || 'Educational Institution'}</div></div>
        <div style={{ marginTop: 28, display: 'flex', justifyContent: 'center' }}><Photo src={p.photoUrl} name={p.name} role={p.role} /></div>
        <div style={{ marginTop: 18, textAlign: 'center' }}><div style={{ display: 'inline-block', borderRadius: 999, background: theme.accent, color: normalized === 'staff' ? '#fff' : '#111827', padding: '7px 18px', fontSize: 12, fontWeight: 950, letterSpacing: '.08em', textTransform: 'uppercase' }}>{label}</div><h2 style={{ margin: '12px 0 0', fontSize: 22, lineHeight: '25px', fontWeight: 950, overflowWrap: 'anywhere' }}>{p.name}</h2><div style={{ marginTop: 8, fontSize: 12, color: 'rgba(255,255,255,.84)', fontWeight: 800 }}>{normalized === 'student' ? `Roll: ${mainId || '-'}` : `ID: ${mainId || '-'}`}</div></div>
      </section>

      <section style={{ position: 'absolute', left: 312, right: 0, top: 0, bottom: 0, padding: '24px 28px', boxSizing: 'border-box', background: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div><div style={{ fontSize: 10, fontWeight: 950, letterSpacing: '.16em', textTransform: 'uppercase', color: theme.secondary }}>{theme.title}</div><div style={{ marginTop: 6, fontSize: 24, lineHeight: '28px', fontWeight: 950, color: '#0f172a' }}>{normalized === 'student' ? 'Student Details' : normalized === 'teacher' ? 'Academic Staff' : normalized === 'staff' ? 'Administrative Staff' : 'Leadership Office'}</div></div>
          <div style={{ width: 92, height: 92, borderRadius: 18, border: '1px solid #cbd5e1', padding: 7, background: '#fff' }}><QRCodeSVG value={qr} size={76} level="M" includeMargin={false} /></div>
        </div>

        <div style={{ marginTop: 17, display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 18, rowGap: 0 }}>
          {normalized === 'student' ? <><Field label="Roll" value={mainId} /><Field label="Class" value={classInfo} /><Field label="DOB" value={formatDate(p.dateOfBirth)} /><Field label="Guardian" value={p.guardianName || p.fatherName || p.motherName} /><Field label="Father" value={p.fatherName} /><Field label="Mother" value={p.motherName} /><Field label="Phone" value={p.guardianPhone} /><Field label="Valid" value={valid} /></> : <><Field label="ID No" value={mainId} /><Field label="Role" value={label} /><Field label="Dept" value={p.department || deptInfo} /><Field label="Post" value={p.designation || label} /><Field label="Authority" value={p.headName} /><Field label="Valid" value={valid} /></>}
        </div>

        <div style={{ position: 'absolute', left: 28, right: 28, bottom: 24, display: 'grid', gridTemplateColumns: '1fr 132px', gap: 16, alignItems: 'end' }}>
          <ReturnBlock p={p} theme={theme} />
          <div style={{ textAlign: 'center' }}><div style={{ height: 38, display: 'flex', justifyContent: 'center', alignItems: 'end' }}>{p.headSignature ? <img src={p.headSignature} alt="Signature" style={{ maxWidth: 95, maxHeight: 34, objectFit: 'contain' }} /> : <div style={{ width: 88, height: 1, background: '#334155' }} />}</div><div style={{ marginTop: 4, borderTop: '1px solid #0f172a', paddingTop: 4, color: '#334155', fontSize: 9.5, fontWeight: 900 }}>{p.headName || 'Authorized'}</div><div style={{ color: '#64748b', fontSize: 8, letterSpacing: '.1em', textTransform: 'uppercase' }}>Signature</div></div>
        </div>
      </section>
    </div>
  </div>
})

RoleBasedIDCard.displayName = 'RoleBasedIDCard'
export default RoleBasedIDCard
