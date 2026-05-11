'use client'

import React from 'react'
import StudentIDCard, { IDCardProps } from './StudentIDCard'

export function StaffIDCard(props: IDCardProps) {
  return <StudentIDCard {...props} role={props.role || 'Staff'} />
}

export default StaffIDCard
