'use client'

import React from 'react'
import html2canvas from 'html2canvas'
import { Button } from '@/components/ui/button'
import { Download, FileText, Printer, Mail } from 'lucide-react'
import { api } from '@/lib/api'
import { downloadBlob } from '@/lib/utils'
import { downloadElementPdf, printElement } from '@/lib/export-utils'

export function DownloadButtons({ targetRef, formData, filename = 'id-card', cardId, printTitle = 'Print ID Card', emailSubject = 'ID Card' }: { targetRef: React.RefObject<HTMLElement> | null; formData?: any; filename?: string; cardId?: string; printTitle?: string; emailSubject?: string }) {
  const hasPreviewTarget = Boolean(targetRef?.current)
  const hasFormData = Boolean(formData)

  const copyComputedStyles = (clone: HTMLElement, source: Element) => {
    const computed = window.getComputedStyle(source)
    for (let index = 0; index < computed.length; index += 1) {
      const property = computed.item(index)
      clone.style.setProperty(property, computed.getPropertyValue(property), computed.getPropertyPriority(property))
    }

    const cloneChildren = Array.from(clone.children) as HTMLElement[]
    const sourceChildren = Array.from(source.children) as Element[]
    cloneChildren.forEach((child, index) => {
      if (sourceChildren[index]) copyComputedStyles(child, sourceChildren[index])
    })
  }

  const inlineImages = async (root: HTMLElement) => {
    const imgs = Array.from(root.querySelectorAll('img')) as HTMLImageElement[]
    await Promise.all(imgs.map(async (img) => {
      try {
        const src = img.getAttribute('src') || ''
        if (!src || src.startsWith('data:') || src.startsWith('blob:')) return
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
        // Leave the original source if the browser cannot fetch it.
      }
    }))
  }

  const captureElement = async () => {
    if (!targetRef?.current) return null
    await document.fonts?.ready?.catch(() => undefined)

    // Normalize zoom to ensure consistent output regardless of page zoom level
    const currentZoom = window.devicePixelRatio || 1
    
    // Use fixed dimensions to ensure consistent output across devices
    const isAdmitCard = targetRef.current.classList.contains('admit-card')
    const captureWidth = isAdmitCard ? 850 : 800
    const captureHeight = isAdmitCard ? 600 : 500

    const wrapper = document.createElement('div')
    wrapper.style.position = 'fixed'
    wrapper.style.left = '-9999px'
    wrapper.style.top = '0'
    wrapper.style.background = 'white'
    wrapper.style.padding = '0'
    wrapper.style.width = `${captureWidth}px`
    wrapper.style.height = `${captureHeight}px`
    wrapper.style.overflow = 'hidden'
    wrapper.style.zoom = '1'
    wrapper.style.transform = 'scale(1)'
    
    const cloned = targetRef.current.cloneNode(true) as HTMLElement
    cloned.style.zoom = '1'
    cloned.style.transform = 'scale(1)'
    
    // Force zoom: 1 on all child elements
    const forceZoom = (el: Element) => {
      if (el instanceof HTMLElement) {
        el.style.zoom = '1'
        el.style.transform = 'scale(1)'
      }
      Array.from(el.children).forEach(forceZoom)
    }
    forceZoom(cloned)
    
    copyComputedStyles(cloned, targetRef.current)
    await inlineImages(cloned)
    wrapper.appendChild(cloned)
    document.body.appendChild(wrapper)

    // Normalize to 1:1 pixel ratio, accounting for device pixel ratio
    const scale = Math.max(0.5, 1 / currentZoom)
    const canvas = await html2canvas(wrapper, {
      scale: scale,
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: true,
      foreignObjectRendering: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: captureWidth,
      windowHeight: captureHeight,
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
    if (hasFormData) {
      const blob = await api.idCards.renderPdf(formData)
      downloadBlob(blob, `${filename}.pdf`)
      return
    }
    await downloadElementPdf(targetRef?.current || null, `${filename}.pdf`)
  }

  const print = () => {
    if (hasFormData) {
      api.idCards.renderPdf(formData).then((blob) => {
        const url = URL.createObjectURL(blob)
        const popup = window.open(url, '_blank')
        if (popup) {
          popup.focus()
          setTimeout(() => {
            try {
              popup.print()
            } catch (e) {
              // ignore
            }
          }, 1200)
        }
        setTimeout(() => URL.revokeObjectURL(url), 30000)
      }).catch(() => undefined)
      return
    }
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
      {hasPreviewTarget && (
        <Button onClick={downloadPNG} size="sm">
          <Download className="mr-2 h-4 w-4" /> PNG
        </Button>
      )}
      <Button onClick={downloadPDF} size="sm">
        <FileText className="mr-2 h-4 w-4" /> PDF
      </Button>
      <Button onClick={print} size="sm">
        <Printer className="mr-2 h-4 w-4" /> Print
      </Button>
      {hasPreviewTarget && cardId && (
        <Button onClick={email} size="sm">
          <Mail className="mr-2 h-4 w-4" /> Email
        </Button>
      )}
    </div>
  )
}

export default DownloadButtons
