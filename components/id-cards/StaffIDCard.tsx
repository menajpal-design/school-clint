'use client'

import React from 'react'
import { ProfessionalIDCard } from './ProfessionalIDCard'
import { IDCardProps } from './StudentIDCard'

export function StaffIDCard(props: IDCardProps) {
  return (
    <ProfessionalIDCard
      name={props.name}
      idNumber={props.id}
      role={String(props.role || 'staff').toLowerCase() as any}
      photoUrl={props.photoUrl}
      institutionName={props.institution?.name || 'My Institution'}
      institutionLogo={props.institution?.logoUrl}
      headName={props.headName || props.institution?.headName || ''}
      validityDate={props.validity}
      stream={props.studentClass}
    />
  )
}

export default StaffIDCard
