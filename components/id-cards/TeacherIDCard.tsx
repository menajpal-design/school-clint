'use client'

import React from 'react'
import StudentIDCard, { IDCardProps } from './StudentIDCard'

export function TeacherIDCard(props: IDCardProps) {
  return <StudentIDCard {...props} role={props.role || 'teacher'} />
}

export default TeacherIDCard
