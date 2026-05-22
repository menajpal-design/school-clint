'use client'

import React from 'react'
import { QRCodeSVG } from 'qrcode.react'
import type { ProfessionalIDCardProps } from './ProfessionalIDCard'

const formatDate = (value?: string) => {
  if (!value) return ''
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

const roleText = (role?: string) => {
  const value = String(role || 'staff').toLowerCase().replace(/[\s-]+/g, '_')
  if (value.includes('teacher')) return 'Teacher'
  if (value === 'head') return 'Head / Principal'
  if (value === 'assistant_head') return 'Assistant Head'
  if (value.includes('finance')) return 'Finance Officer'
  return 'Staff'
}

const line = (label: string, value?: string) => value ? (
  <div style={{ display: 'grid', gridTemplateColumns: '95px 1fr', gap: 10, fontSize: 11, lineHeight: '15px', color: '#1f2937' }}>
    <span style={{ color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
    <span style={{ fontWeight: 800, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{value}</span>
  </div>
) : null

export default function TeacherStaffLandscapeIDCard(props: ProfessionalIDCardProps) {
  const role = roleText(props.role)
  const id = props.idNumber || props.rollNumber || 'ID'
  const department = props.department || props.designation || props.stream || role
  const valid = formatDate(props.validityDate)
  const qr = props.qrData || JSON.stringify({ name: props.name, id, role, department, institution: props.institutionName, valid })

  return (
    <div className={`professional-id-card ${props.className || ''}`} style={{ position: 'relative', width: 800, height: 500, minWidth: 800, maxWidth: 800, minHeight: 500, maxHeight: 500, overflow: 'hidden', background: '#f8fafc', borderRadius: 18, boxSizing: 'border-box', fontFamily: 'Arial, Helvetica, sans-serif', color: '#111827', flex: '0 0 auto', marginBottom: 18 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0f172a 0%, #123c69 50%, #0f766e 100%)' }} />
      <div style={{ position: 'absolute', top: -92, right: -72, width: 260, height: 260, borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }} />
      <div style={{ position: 'absolute', bottom: -100, left: -80, width: 280, height: 280, borderRadius: '50%', background: 'rgba(212,166,59,0.18)' }} />
      <div style={{ position: 'absolute', left: 26, right: 26, top: 24, bottom: 24, borderRadius: 16, background: '#ffffff', overflow: 'hidden', boxShadow: '0 18px 45px rgba(15,23,42,0.35)' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 244, background: 'linear-gradient(180deg, #0f172a, #164e63)', color: '#ffffff' }}>
          <div style={{ padding: '22px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
            {props.institutionLogo ? <img src={props.institutionLogo} alt="Logo" style={{ width: 54, height: 54, objectFit: 'contain', background: '#fff', borderRadius: 10, padding: 5 }} /> : <div style={{ width: 54, height: 54, borderRadius: 10, background: '#fff', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 900 }}>{String(props.institutionName || 'S').charAt(0)}</div>}
            <div style={{ fontSize: 15, lineHeight: '17px', fontWeight: 900, overflowWrap: 'anywhere' }}>{props.institutionName || 'Educational Institution'}</div>
          </div>
          <div style={{ margin: '6px auto 0', width: 142, height: 172, borderRadius: 16, background: '#e5e7eb', border: '5px solid #ffffff', overflow: 'hidden' }}>
            {props.photoUrl ? <img src={props.photoUrl} alt={props.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #e2e8f0, #bae6fd)' }} />}
          </div>
          <div style={{ margin: '16px 20px 0', padding: '8px 10px', borderRadius: 999, background: '#d4a63b', color: '#111827', textAlign: 'center', fontSize: 13, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{role}</div>
          <div style={{ position: 'absolute', left: 18, right: 18, bottom: 18, fontSize: 9.5, lineHeight: '13px', color: '#dbeafe', overflowWrap: 'anywhere' }}>{props.institutionAddress}</div>
        </div>

        <div style={{ position: 'absolute', left: 244, right: 0, top: 0, bottom: 0, padding: '28px 30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20 }}>
            <div>
              <div style={{ fontSize: 11, color: '#0f766e', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Professional Identity Card</div>
              <div style={{ marginTop: 7, fontSize: 31, lineHeight: '34px', color: '#0f172a', fontWeight: 900, overflowWrap: 'anywhere' }}>{props.name}</div>
              <div style={{ marginTop: 8, fontSize: 14, color: '#475569', fontWeight: 800 }}>{props.designation || role}</div>
            </div>
            <div style={{ width: 102, height: 102, padding: 6, borderRadius: 12, border: '1px solid #cbd5e1', background: '#fff' }}><QRCodeSVG value={qr} size={90} level="M" includeMargin={false} /></div>
          </div>

          <div style={{ marginTop: 24, display: 'grid', gap: 10, padding: '16px 18px', borderRadius: 14, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            {line('ID No.', id)}
            {line('Department', department)}
            {line('Valid Until', valid)}
            {line('Authority', props.headName)}
          </div>

          <div style={{ position: 'absolute', left: 30, right: 30, bottom: 28, display: 'grid', gap: 5, padding: '9px 12px', borderRadius: 12, background: '#ecfeff', border: '1px solid #a5f3fc', fontSize: 10, lineHeight: '14px', color: '#0f3f49', fontWeight: 750 }}>
            <div style={{ fontSize: 10.5, fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Return Instruction</div>
            <div>If found outside, please return this ID card to the school address below.</div>
            {props.institutionAddress ? <div><b>School Address: </b>{props.institutionAddress}</div> : null}
            <div>{[props.institutionPhone && `Phone: ${props.institutionPhone}`, props.institutionEmail && `Email: ${props.institutionEmail}`, props.institutionWebsite && `Website: ${props.institutionWebsite}`].filter(Boolean).join('  |  ')}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
