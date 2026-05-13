'use client'

import React from 'react'
import { ProfessionalIDCard } from './ProfessionalIDCard'

export type IDCardProps = {
  name: string
  id: string
  role?: string
  className?: string
  photoUrl?: string
  studentClass?: string
  headName?: string
  institution?: {
    name?: string
    logoUrl?: string
    headName?: string
  }
  validity?: string
  qrData?: string
  barcode?: string
}

export function StudentIDCard({
  name,
  id,
  role = 'Student',
  className = '',
  photoUrl,
  studentClass,
  headName,
  institution,
  validity,
  qrData,
}: IDCardProps) {
  return (
    <ProfessionalIDCard
      className={className}
      name={name}
      idNumber={id}
      role={String(role || 'student').toLowerCase() as any}
      photoUrl={photoUrl}
      institutionName={institution?.name || 'My Institution'}
      institutionLogo={institution?.logoUrl}
      headName={headName || institution?.headName || ''}
      validityDate={validity}
      stream={studentClass}
      qrData={qrData}
    />
  )
}

export default StudentIDCard
