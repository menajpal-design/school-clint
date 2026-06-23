'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import html2canvas from 'html2canvas'
import { Button } from '@/components/ui/button'
import { Download, FileText, Printer, Mail } from 'lucide-react'
import { api } from '@/lib/api'
import { downloadBlob } from '@/lib/utils'
import { downloadElementPdf, printElement } from '@/lib/export-utils'

export function DownloadButtons({ targetRef, formData, filename = 'id-card', cardId, printTitle = 'Print ID Card', emailSubject = 'ID Card' }: { targetRef: React.RefObject<HTMLElement> | null; formData?: any; filename?: string; cardId?: string; printTitle?: string; emailSubject?: string }) {
  const hasPreviewTarget = Boolean(targetRef?.current)
  const hasFormData = Boolean(formData)
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null)

  const findCardElement = () => {
    const root = targetRef?.current
    if (!root) return null
    return (root.querySelector('.professional-id-card, .teacher-staff-landscape-id-card, .teacher-staff-id-card, .student-id-card, #student-card, .admit-card') as HTMLElement) || root
  }

  const inlineImages = async (root: HTMLElement) => {
    const imgs = Array.from(root.querySelectorAll('img')) as HTMLImageElement[]
    await Promise.all(imgs.map(async (img) => {
      try {
        const src = img.getAttribute('src') || ''
        if (!src || src.startsWith('data:') || src.startsWith('blob:')) return
        const res = await fetch(src, { mode: 'cors', credentials: 'omit' })
        if (!res.ok) return
        const blob = await res.blob()
        const reader = new FileReader()
        const dataUrl: string = await new Promise((resolve, reject) => {
          reader.onloadend = () => resolve(String(reader.result || ''))
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })
        img.setAttribute('src', dataUrl)
      } catch {}
    }))
  }

  const forcePrintColor = (root: HTMLElement) => {
    const all = [root, ...Array.from(root.querySelectorAll('*'))] as HTMLElement[]
    all.forEach((el) => {
      el.style.setProperty('-webkit-print-color-adjust', 'exact')
      el.style.setProperty('print-color-adjust', 'exact')
      el.style.setProperty('color-adjust', 'exact')
      el.style.boxSizing = 'border-box'
      el.style.maxWidth = 'none'
      el.style.transform = 'none'
      el.style.zoom = '1'
    })
  }

  const captureElement = async () => {
    const card = findCardElement()
    if (!card) return null
    await document.fonts?.ready?.catch(() => undefined)
    const rect = card.getBoundingClientRect()
    const width = Math.ceil(Math.max(card.scrollWidth, card.offsetWidth, rect.width, 320))
    const height = Math.ceil(Math.max(card.scrollHeight, card.offsetHeight, rect.height, 200))
    const wrapper = document.createElement('div')
    wrapper.style.cssText = `position:fixed;left:0;top:0;width:${width}px;min-width:${width}px;height:${height}px;min-height:${height}px;overflow:hidden;margin:0;padding:0;background:#ffffff;display:block;box-sizing:border-box;z-index:2147483647;pointer-events:none;`
    wrapper.style.setProperty('-webkit-print-color-adjust', 'exact')
    wrapper.style.setProperty('print-color-adjust', 'exact')

    const cloned = card.cloneNode(true) as HTMLElement
    cloned.style.margin = '0'
    cloned.style.left = '0'
    cloned.style.top = '0'
    cloned.style.transform = 'none'
    cloned.style.zoom = '1'
    cloned.style.maxWidth = 'none'
    cloned.style.minWidth = `${width}px`
    cloned.style.width = `${width}px`
    cloned.style.minHeight = `${height}px`
    cloned.style.height = `${height}px`
    cloned.style.background = cloned.style.background || '#ffffff'
    cloned.style.overflow = 'hidden'
    forcePrintColor(cloned)
    await inlineImages(cloned)
    wrapper.appendChild(cloned)
    document.body.appendChild(wrapper)

    try {
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      const canvas = await html2canvas(cloned, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: false,
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
        width,
        height,
        windowWidth: width,
        windowHeight: height,
        onclone: (doc) => {
          const style = doc.createElement('style')
          style.textContent = '@page{size:auto;margin:0}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;box-sizing:border-box!important;max-width:none!important}html,body{margin:0!important;background:#fff!important;width:auto!important;overflow:visible!important}'
          doc.head.appendChild(style)
        },
      })
      return { canvas, width, height }
    } finally {
      try { document.body.removeChild(wrapper) } catch {}
    }
  }

  const downloadPNG = async () => {
    const captured = await captureElement()
    if (!captured) return
    const dataUrl = captured.canvas.toDataURL('image/png')
    const response = await fetch(dataUrl)
    downloadBlob(await response.blob(), `${filename}.png`)
  }

  const downloadPDF = async () => {
    if (hasFormData) {
      const blob = await api.idCards.renderPdf(formData)
      downloadBlob(blob, `${filename}.pdf`)
      return
    }
    const card = findCardElement()
    if (!card) return
    await downloadElementPdf(card, `${filename}.pdf`)
  }

  const print = async () => {
    if (hasFormData) {
      const blob = await api.idCards.renderPdf(formData)
      downloadBlob(blob, `${filename}.pdf`)
      return
    }
    const card = findCardElement()
    if (!card) return
    await printElement(card, printTitle)
  }

  const email = async () => {
    try {
      const captured = await captureElement()
      if (!captured) return
      const dataUrl = captured.canvas.toDataURL('image/png')
      if (api?.idCards?.email && cardId) {
        await api.idCards.email(cardId, { image: dataUrl, filename: `${filename}.png` })
        alert('Email sent')
        return
      }
      window.location.href = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent('Please attach the generated ID card file from the download option.')}`
    } catch {
      window.location.href = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent('Please attach the generated ID card file from the download option.')}`
    }
  }

  const buttons = (
    <div className="flex flex-wrap items-center gap-2" style={{ marginTop: 8 }}>
      {hasPreviewTarget && <Button onClick={downloadPNG} size="sm"><Download className="mr-2 h-4 w-4" /> PNG</Button>}
      <Button onClick={downloadPDF} size="sm"><FileText className="mr-2 h-4 w-4" /> PDF</Button>
      <Button onClick={print} size="sm"><Printer className="mr-2 h-4 w-4" /> Print</Button>
      {hasPreviewTarget && cardId && <Button onClick={email} size="sm"><Mail className="mr-2 h-4 w-4" /> Email</Button>}
    </div>
  )

  useEffect(() => {
    const target = targetRef?.current
    if (!target) { setPortalRoot(null); return }
    const el = document.createElement('div')
    el.className = 'download-buttons-portal'
    el.style.width = '100%'
    el.style.boxSizing = 'border-box'
    el.style.marginTop = '8px'
    const containerParent = (target.closest && (target.closest('section') as HTMLElement)) || target.parentElement
    if (containerParent) { containerParent.appendChild(el); setPortalRoot(el) }
    return () => { try { if (el.parentElement) el.parentElement.removeChild(el) } catch {} }
  }, [targetRef])

  if (portalRoot) return createPortal(buttons, portalRoot)
  return buttons
}

export default DownloadButtons
