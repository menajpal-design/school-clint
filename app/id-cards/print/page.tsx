'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { StudentIDCard } from '@/components/id-cards/StudentIDCard'
import { TeacherIDCard } from '@/components/id-cards/TeacherIDCard'
import { StaffIDCard } from '@/components/id-cards/StaffIDCard'
import { IDCardPreview } from '@/components/id-cards/IDCardPreview'
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
  institutionSeal?: string
  headSignature?: string
  validityDate?: string
  dateOfBirth?: string
  fatherName?: string
  admissionNumber?: string
  registrationNumber?: string
  stream?: string
  examName?: string
  examDate?: string
  examCenter?: string
  centerCode?: string
  headName?: string
  examData?: Array<{ courseCode?: string; examDate?: string; examTime?: string; examCentre?: string; centreCode?: string; centreName?: string; code?: string; date?: string; time?: string }>
}

export default function PrintPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const cardRef = useRef<HTMLDivElement>(null)

  // Get card data from URL params
  const cardDataJson = searchParams.get('data')
  const cardData: CardData | null = cardDataJson ? JSON.parse(decodeURIComponent(cardDataJson)) : null

  useEffect(() => {
    // Auto-trigger print dialog on page load
    if (cardData && cardRef.current) {
      setTimeout(() => {
        window.print()
      }, 500)
    }
  }, [cardData])

  if (!cardData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No card data provided</h1>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  const renderCard = () => {
    switch (cardData.cardType) {
      case 'student-id':
        return (
          <StudentIDCard
            ref={cardRef}
            name={cardData.name || ''}
            idNumber={cardData.idNumber || ''}
            email={cardData.email || ''}
            phone={cardData.phone || ''}
            photoUrl={cardData.photoUrl || ''}
            institutionName={cardData.institutionName || ''}
            institutionLogo={cardData.institutionLogo || ''}
            institutionAddress={cardData.institutionAddress || ''}
            institutionPhone={cardData.institutionPhone || ''}
            institutionEmail={cardData.institutionEmail || ''}
            institutionSeal={cardData.institutionSeal || ''}
            headSignature={cardData.headSignature || ''}
            validityDate={cardData.validityDate || ''}
            dateOfBirth={cardData.dateOfBirth || ''}
            fatherName={cardData.fatherName || ''}
            admissionNumber={cardData.admissionNumber || ''}
            registrationNumber={cardData.registrationNumber || ''}
            stream={cardData.stream || ''}
          />
        )

      case 'teacher-id':
        return (
          <TeacherIDCard
            ref={cardRef}
            name={cardData.name || ''}
            idNumber={cardData.idNumber || ''}
            email={cardData.email || ''}
            phone={cardData.phone || ''}
            designation={cardData.designation || ''}
            photoUrl={cardData.photoUrl || ''}
            institutionName={cardData.institutionName || ''}
            institutionLogo={cardData.institutionLogo || ''}
            institutionAddress={cardData.institutionAddress || ''}
            institutionPhone={cardData.institutionPhone || ''}
            institutionEmail={cardData.institutionEmail || ''}
            institutionSeal={cardData.institutionSeal || ''}
            headSignature={cardData.headSignature || ''}
            validityDate={cardData.validityDate || ''}
            dateOfBirth={cardData.dateOfBirth || ''}
          />
        )

      case 'staff-id':
        return (
          <StaffIDCard
            ref={cardRef}
            name={cardData.name || ''}
            idNumber={cardData.idNumber || ''}
            email={cardData.email || ''}
            phone={cardData.phone || ''}
            designation={cardData.designation || ''}
            department={cardData.department || ''}
            photoUrl={cardData.photoUrl || ''}
            institutionName={cardData.institutionName || ''}
            institutionLogo={cardData.institutionLogo || ''}
            institutionAddress={cardData.institutionAddress || ''}
            institutionPhone={cardData.institutionPhone || ''}
            institutionEmail={cardData.institutionEmail || ''}
            institutionSeal={cardData.institutionSeal || ''}
            headSignature={cardData.headSignature || ''}
            validityDate={cardData.validityDate || ''}
            dateOfBirth={cardData.dateOfBirth || ''}
          />
        )

      case 'head-id':
        return (
          <IDCardPreview
            ref={cardRef}
            name={cardData.name || ''}
            idNumber={cardData.idNumber || ''}
            email={cardData.email || ''}
            phone={cardData.phone || ''}
            designation={cardData.designation || ''}
            photoUrl={cardData.photoUrl || ''}
            institutionName={cardData.institutionName || ''}
            institutionLogo={cardData.institutionLogo || ''}
            institutionAddress={cardData.institutionAddress || ''}
            institutionPhone={cardData.institutionPhone || ''}
            institutionEmail={cardData.institutionEmail || ''}
            institutionSeal={cardData.institutionSeal || ''}
            headSignature={cardData.headSignature || ''}
            validityDate={cardData.validityDate || ''}
            dateOfBirth={cardData.dateOfBirth || ''}
            type="head"
          />
        )

      case 'admit-card':
        return (
          <AdmitCard
            ref={cardRef}
            name={cardData.name}
            rollNumber={cardData.idNumber}
            photoUrl={cardData.photoUrl}
            institutionName={cardData.institutionName}
            institutionLogo={cardData.institutionLogo}
            institutionAddress={cardData.institutionAddress}
            institutionPhone={cardData.institutionPhone}
            institutionEmail={cardData.institutionEmail}
            institutionSeal={cardData.institutionSeal}
            headSignature={cardData.headSignature}
            examName={cardData.examName}
            examDate={cardData.examDate}
            examCenter={cardData.examCenter}
            centerCode={cardData.centerCode}
            headName={cardData.headName}
            dateOfBirth={cardData.dateOfBirth}
            fatherName={cardData.fatherName}
            stream={cardData.stream}
            examData={cardData.examData}
          />
        )

      default:
        return null
    }
  }

  return (
    <div className="w-full min-h-screen bg-white print:bg-white">
      {/* Non-print UI */}
      <div className="print:hidden sticky top-0 z-50 bg-white border-b p-4 flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Generate
        </Button>
        <h1 className="flex-1 text-lg font-semibold">Print ID Card</h1>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => window.print()}>
            Print / PDF Download
          </Button>
        </div>
      </div>

      {/* Card rendering area - optimized for print */}
      <div className="w-full flex items-center justify-center py-8 print:py-0 print:m-0 bg-gray-50 print:bg-white">
        <div style={{ zoom: '1', transform: 'scale(1)' }} className="print:w-full print:bg-white">
          {renderCard()}
        </div>
      </div>

      {/* Download buttons - hidden on print */}
      <div className="print:hidden sticky bottom-0 z-50 bg-white border-t p-4 flex justify-center gap-4">
        {cardRef.current && (
          <DownloadButtons
            targetRef={cardRef}
            filename={`${cardData.cardType}-${cardData.name}`}
            printTitle={`${cardData.cardType} Card`}
            emailSubject={`${cardData.cardType} Card for ${cardData.name}`}
          />
        )}
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          * {
            zoom: 1 !important;
            transform: scale(1) !important;
          }
          
          body, html {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background: white !important;
          }
          
          @page {
            size: auto;
            margin: 0;
            padding: 0;
          }
          
          .professional-id-card {
            zoom: 1 !important;
            transform: scale(1) !important;
            page-break-after: avoid !important;
          }
          
          .admit-card {
            zoom: 1 !important;
            transform: scale(1) !important;
            page-break-after: avoid !important;
          }
        }
      `}</style>
    </div>
  )
}
