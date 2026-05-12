'use client'

import React from 'react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { Button } from '@/components/ui/button'
import { Download, FileText, Printer, Mail } from 'lucide-react'
import { api } from '@/lib/api'

export function DownloadButtons({ targetRef, filename = 'id-card', cardId, printTitle = 'Print ID Card', emailSubject = 'ID Card' }: { targetRef: React.RefObject<HTMLElement> | null; filename?: string; cardId?: string; printTitle?: string; emailSubject?: string }) {
  const captureElement = async () => {
    if (!targetRef?.current) return null

    await document.fonts?.ready?.catch(() => undefined)
    return html2canvas(targetRef.current, {
      scale: 3,
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: true,
      scrollX: 0,
      scrollY: -window.scrollY,
      windowWidth: targetRef.current.scrollWidth,
      windowHeight: targetRef.current.scrollHeight,
    })
  }

  const downloadPNG = async () => {
    const canvas = await captureElement()
    if (!canvas) return

    const dataUrl = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `${filename}.png`
    link.click()
  }

  const downloadPDF = async () => {
    const canvas = await captureElement()
    if (!canvas) return

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ unit: 'px', format: [canvas.width, canvas.height] })
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
    pdf.save(`${filename}.pdf`)
  }

  const print = () => {
    if (!targetRef?.current) return

    const popup = window.open('', '_blank', 'width=1200,height=900')
    if (!popup) return

    const styleTags = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((node) => node.outerHTML)
      .join('')

    popup.document.open()
    popup.document.write(`
      <html>
        <head>
          <title>${printTitle}</title>
          ${styleTags}
          <style>
            @page { size: auto; margin: 12mm; }
            html, body { margin: 0; padding: 0; background: #f8fafc; }
            body { display: flex; justify-content: center; align-items: flex-start; padding: 20px; }
          </style>
        </head>
        <body>
          ${targetRef.current.outerHTML}
        </body>
      </html>
    `)
    popup.document.close()
    popup.focus()
    setTimeout(() => {
      popup.print()
      popup.close()
    }, 250)
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
      const subject = encodeURIComponent(emailSubject)
      const body = encodeURIComponent('Please find the attached file. (Attach the generated PNG from the download option)')
      window.location.href = `mailto:?subject=${subject}&body=${body}`
    } catch (err) {
      // fallback
      const subject = encodeURIComponent(emailSubject)
      const body = encodeURIComponent('Please find the attached file. (Attach the generated PNG from the download option)')
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
