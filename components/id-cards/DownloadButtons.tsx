'use client'

import React from 'react'
import html2canvas from 'html2canvas'
import { Button } from '@/components/ui/button'
import { Download, FileText, Printer, Mail } from 'lucide-react'
import { api } from '@/lib/api'
import { downloadBlob } from '@/lib/utils'
import { downloadElementPdf, printElement } from '@/lib/export-utils'

export function DownloadButtons({ targetRef, filename = 'id-card', cardId, printTitle = 'Print ID Card', emailSubject = 'ID Card' }: { targetRef: React.RefObject<HTMLElement> | null; filename?: string; cardId?: string; printTitle?: string; emailSubject?: string }) {
  const captureElement = async () => {
    if (!targetRef?.current) return null
    await document.fonts?.ready?.catch(() => undefined)
    
    // Inline remote images to data URLs to avoid CORS tainting
    const inlineImages = async (root: HTMLElement) => {
      const imgs = Array.from(root.querySelectorAll('img')) as HTMLImageElement[]
      await Promise.all(imgs.map(async (img) => {
        try {
          const src = img.getAttribute('src') || ''
          if (!src || src.startsWith('data:') || src.startsWith('blob:')) return
          // fetch and convert to data URL
          const res = await fetch(src)
          if (!res.ok) return
          const blob = await res.blob()
          const reader = new FileReader()
          const dataUrl: string = await new Promise((resolve, reject) => {
            reader.onloadend = () => resolve(String(reader.result || ''))
            reader.onerror = reject
            reader.readAsDataURL(blob)
          })
          img.setAttribute('src', dataUrl)
        } catch (e) {
          // ignore failures and leave original src
        }
      }))
    }

    await inlineImages(targetRef.current)

    // Create a wrapper div and clone with computed styles inlined
    const wrapper = document.createElement('div')
    wrapper.style.position = 'fixed'
    wrapper.style.left = '-9999px'
    wrapper.style.top = '0'
    wrapper.style.background = 'white'
    
    const cloned = targetRef.current.cloneNode(true) as HTMLElement
    
    // Walk through all elements and copy computed styles
    const walk = (el: HTMLElement, original: Element) => {
      const computed = window.getComputedStyle(original)
      el.style.color = computed.color
      el.style.backgroundColor = computed.backgroundColor
      el.style.borderColor = computed.borderColor
      el.style.borderWidth = computed.borderWidth
      el.style.borderStyle = computed.borderStyle
      el.style.borderRadius = computed.borderRadius
      el.style.padding = computed.padding
      el.style.margin = computed.margin
      el.style.fontSize = computed.fontSize
      el.style.fontWeight = computed.fontWeight
      el.style.textAlign = computed.textAlign
      el.style.display = computed.display
      
      const childEls = Array.from(el.children) as HTMLElement[]
      const origChildEls = Array.from(original.children) as Element[]
      childEls.forEach((child, idx) => {
        if (origChildEls[idx]) walk(child, origChildEls[idx])
      })
    }
    
    walk(cloned, targetRef.current)
    wrapper.appendChild(cloned)
    document.body.appendChild(wrapper)

    const canvas = await html2canvas(wrapper, {
      scale: 3,
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: true,
      scrollX: 0,
      scrollY: 0,
      windowWidth: wrapper.scrollWidth,
      windowHeight: wrapper.scrollHeight,
    })
    
    document.body.removeChild(wrapper)
    return canvas
  }

  const downloadPNG = async () => {
    const canvas = await captureElement()
    if (!canvas) return

    const dataUrl = canvas.toDataURL('image/png')
    const response = await fetch(dataUrl)
    downloadBlob(await response.blob(), `${filename}.png`)
  }

  const downloadPDF = async () => {
    await downloadElementPdf(targetRef?.current || null, `${filename}.pdf`)
  }

  const print = () => {
    printElement(targetRef?.current || null, printTitle)
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
