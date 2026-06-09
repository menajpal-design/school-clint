'use client'

import React from 'react'
import RoleBasedIDCard from './RoleBasedIDCard'

export type ProfessionalIDRole = 'student' | 'teacher' | 'head' | 'assistant_head' | 'staff' | 'admin' | 'super_admin' | 'accountant' | 'finance_officer' | 'parent' | 'guardian' | 'user'

export interface ProfessionalIDCardProps {
  name: string
  idNumber: string
  role: ProfessionalIDRole | string
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

export const ProfessionalIDCard = React.forwardRef<HTMLDivElement, ProfessionalIDCardProps>((props, ref) => {
  return <RoleBasedIDCard ref={ref} {...props} />
})

ProfessionalIDCard.displayName = 'ProfessionalIDCard'
export default ProfessionalIDCard
