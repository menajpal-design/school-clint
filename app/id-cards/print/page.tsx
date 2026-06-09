'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { ProfessionalIDCard } from '@/components/id-cards/ProfessionalIDCard'
import { AdmitCard } from '@/components/id-cards/AdmitCard'
import { DownloadButtons } from '@/components/id-cards/DownloadButtons'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'

interface CardData {
  cardType: string
  name: string
  idNumber: string
  email?: string
  phone?: string
  designation?: string
  department?: string
  photoUrl?: string
  institutionName?: string
  institutionLogo?: string
  institutionAddress?: string
  institutionPhone?: string
  institutionEmail?: string
  institutionWebsite?: string
  institutionSeal?: string
  headSignature?: string
  validityDate?: string
  dateOfBirth?: string
  fatherName?: string
  motherName?: string
  guardianName?: string
  guardianPhone?: string
  admissionNumber?: string
  registrationNumber?: string
  stream?: string
  rollNumber?: string
  sectionName?: string
  examName?: string
  examDate?: string
  examCenter?: string
  centerCode?: string
  headName?: string
  examData?: Array<{ courseCode?: string; examDate?: string; examTime?: string; examCentre?: string; centreCode?: string; centreName?: string; code?: string; date?: string; time?: string }>
}

const roleFromCardType = (cardType?: string) => {
  const value = String(cardType || '').toLowerCase()
  if (value.includes('student')) return 'student'
  if (value.includes('teacher')) return 'teacher'
  if (value.includes('head')) return value.includes('assistant') ? 'assistant_head' : 'head'
  if (value.includes('staff')) return 'staff'
  return 'staff'
}

export default function PrintPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const cardRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const cardDataJson = searchParams.get('data')
  const cardData: CardData | null = cardDataJson ? JSON.parse(decodeURIComponent(cardDataJson)) : null

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 300)
    return () => clearTimeout(timer)
  }, [cardDataJson])

  if (!cardData) {
    return <div className="min-h-screen flex items-center justify-center p-4"><div className="text-center"><h1 className="text-2xl font-bold mb-4">No card data provided</h1><Button onClick={() => router.back()}>Go Back</Button></div></div>
  }

  const renderCard = () => {
    if (cardData.cardType === 'admit-card') {
      return <AdmitCard ref={cardRef} name={cardData.name} rollNumber={cardData.idNumber} photoUrl={cardData.photoUrl} institutionName={cardData.institutionName} institutionLogo={cardData.institutionLogo} institutionAddress={cardData.institutionAddress} institutionPhone={cardData.institutionPhone} institutionEmail={cardData.institutionEmail} institutionSeal={cardData.institutionSeal} headSignature={cardData.headSignature} examName={cardData.examName} examDate={cardData.examDate} examCenter={cardData.examCenter} centerCode={cardData.centerCode} headName={cardData.headName} dateOfBirth={cardData.dateOfBirth} fatherName={cardData.fatherName} motherName={cardData.motherName} stream={cardData.stream} examData={cardData.examData} />
    }
    const role = roleFromCardType(cardData.cardType)
    return <ProfessionalIDCard ref={cardRef} role={role} name={cardData.name || ''} idNumber={cardData.idNumber || ''} photoUrl={cardData.photoUrl || ''} institutionName={cardData.institutionName || ''} institutionLogo={cardData.institutionLogo || ''} institutionAddress={cardData.institutionAddress || ''} institutionPhone={cardData.institutionPhone || ''} institutionEmail={cardData.institutionEmail || ''} institutionWebsite={cardData.institutionWebsite || ''} institutionSeal={cardData.institutionSeal || ''} headSignature={cardData.headSignature || ''} validityDate={cardData.validityDate || ''} dateOfBirth={cardData.dateOfBirth || ''} fatherName={cardData.fatherName || ''} motherName={cardData.motherName || ''} guardianName={cardData.guardianName || ''} guardianPhone={cardData.guardianPhone || ''} admissionNumber={cardData.admissionNumber || ''} registrationNumber={cardData.registrationNumber || ''} stream={cardData.stream || ''} rollNumber={cardData.rollNumber || ''} studentClassName={cardData.stream || ''} sectionName={cardData.sectionName || ''} designation={cardData.designation || ''} department={cardData.department || ''} headName={cardData.headName || ''} />
  }

  return (
    <div className="w-full min-h-screen bg-white">
      <div className="sticky top-0 z-50 bg-white border-b p-4 flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}><ChevronLeft className="mr-2 h-4 w-4" />Back to Generate</Button>
        <h1 className="flex-1 text-lg font-semibold">Print ID Card</h1>
        <span className="text-xs text-slate-500">Role-based professional ID card design.</span>
      </div>
      <div className="w-full flex items-center justify-center py-8 bg-gray-50 overflow-x-auto">
        <div>{renderCard()}</div>
      </div>
      <div className="sticky bottom-0 z-50 bg-white border-t p-4 flex justify-center gap-4">
        {ready && cardRef.current && <DownloadButtons targetRef={cardRef} filename={`${cardData.cardType}-${cardData.name}`} printTitle={`${cardData.cardType} Card`} emailSubject={`${cardData.cardType} Card for ${cardData.name}`} />}
      </div>
    </div>
  )
}
