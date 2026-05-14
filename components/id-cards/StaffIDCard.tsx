'use client'

import React from 'react'
import { ProfessionalIDCard } from './ProfessionalIDCard'
import { IDCardProps } from './StudentIDCard'

export const StaffIDCard = React.forwardRef<HTMLDivElement, IDCardProps>((props, ref) => {
  return (
    <ProfessionalIDCard
      ref={ref}
      name={props.name}
      idNumber={props.id || props.idNumber || ''}
      role={String(props.role || 'staff').toLowerCase() as any}
      photoUrl={props.photoUrl}
      institutionName={props.institution?.name || ''}
      institutionLogo={props.institution?.logoUrl}
      institutionAddress={props.institution?.address}
      institutionPhone={props.institution?.phone}
      institutionEmail={props.institution?.email}
      institutionWebsite={props.institution?.website}
      headName={props.headName || props.institution?.headName || ''}
      validityDate={props.validity}
      stream={props.studentClass}
      qrData={props.qrData}
    />
  )
})

StaffIDCard.displayName = 'StaffIDCard'

export default StaffIDCard
