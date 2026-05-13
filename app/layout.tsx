import type { Metadata } from 'next'
import './globals.css'
import { ToastProvider } from '@/hooks/useToast'

export const metadata: Metadata = {
  title: 'EASY SCHOOL - School Management System',
  description: 'Complete School/Madrasah Management System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
