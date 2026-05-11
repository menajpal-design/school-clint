'use client'

import React from 'react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { Button } from '@/components/ui/button'
import { Download, FileText, Printer, Mail } from 'lucide-react'
import { api } from '@/lib/api'

export function DownloadButtons({ targetRef, filename = 'id-card', cardId }: { targetRef: React.RefObject<HTMLElement> | null; filename?: string; cardId?: string }) {
  const downloadPNG = async () => {
    if (!targetRef?.current) return
    const canvas = await html2canvas(targetRef.current, { scale: 2 })
    const dataUrl = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `${filename}.png`
    link.click()
  }

  const downloadPDF = async () => {
    if (!targetRef?.current) return
    const canvas = await html2canvas(targetRef.current, { scale: 2 })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ unit: 'px', format: [canvas.width, canvas.height] })
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
    pdf.save(`${filename}.pdf`)
  }

  const print = () => {
    if (!targetRef?.current) return
    const popup = window.open('', '_blank')
    if (!popup) return
    popup.document.write('<html><head><title>Print ID Card</title>')
    popup.document.write('<style>body{margin:0;padding:20px;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial}</style>')
    popup.document.write('</head><body>')
    popup.document.write(targetRef.current.innerHTML)
    popup.document.write('</body></html>')
    popup.document.close()
    popup.focus()
    popup.print()
  }

  const email = async () => {
    if (!targetRef?.current) return
    try {
      const canvas = await html2canvas(targetRef.current, { scale: 2 })
      const dataUrl = canvas.toDataURL('image/png')
      // Try server endpoint first
      if (api?.idCards?.email && cardId) {
        await api.idCards.email(cardId, { image: dataUrl, filename: `${filename}.png` })
        alert('Email sent (server)')
        return
      }
      // Fallback: open mailto (attachments not supported) — instruct user
      const subject = encodeURIComponent('ID Card')
      const body = encodeURIComponent('Please find the ID card attached. (Attach the generated PNG from the download option)')
      window.location.href = `mailto:?subject=${subject}&body=${body}`
    } catch (err) {
      // fallback
      const subject = encodeURIComponent('ID Card')
      const body = encodeURIComponent('Please find the ID card attached. (Attach the generated PNG from the download option)')
      window.location.href = `mailto:?subject=${subject}&body=${body}`
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <Button onClick={downloadPNG} size="sm">
        <Download className="mr-2 h-4 w-4" /> PNG
      </Button>
      <Button onClick={downloadPDF} size="sm">
        <FileText className="mr-2 h-4 w-4" /> PDF
      </Button>
      <Button onClick={print} size="sm">
        <Printer className="mr-2 h-4 w-4" /> Print
      </Button>
      <Button onClick={email} size="sm">
        <Mail className="mr-2 h-4 w-4" /> Email
      </Button>
    </div>
  )
}

export default DownloadButtons
