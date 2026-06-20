import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import './mobile-comfort.css'
import { ToastProvider } from '@/hooks/useToast'
import { LanguageProvider } from '@/lib/i18n'
import { MobileTableEnhancer } from '@/components/layout/MobileTableEnhancer'
import { ImageUploadGuard } from '@/components/layout/ImageUploadGuard'
import { RootAppShell } from '@/components/layout/RootAppShell'
import { AttendanceApiCompatLoader } from '@/components/layout/AttendanceApiCompatLoader'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://easyschool.live'
const siteName = 'EASY SCHOOL'
const siteDescription =
  'EASY SCHOOL is a school and madrasah management system for admissions, attendance, fees, results, notices, ID cards, documents and parent communication.'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: siteName,
  title: {
    default: 'EASY SCHOOL - School and Madrasah Management System',
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: [
    'school management system',
    'madrasah management system',
    'student attendance software',
    'school fees management',
    'online admission system',
    'school result management',
    'school ERP Bangladesh',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName,
    title: 'EASY SCHOOL - School and Madrasah Management System',
    description: siteDescription,
    images: [
      {
        url: '/icon.svg',
        width: 512,
        height: 512,
        alt: siteName,
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'EASY SCHOOL - School and Madrasah Management System',
    description: siteDescription,
    images: ['/icon.svg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/apple-icon.svg',
  },
  manifest: '/manifest.webmanifest',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${plusJakartaSans.variable} min-h-screen bg-background font-sans`}>
        <LanguageProvider>
          <ToastProvider>
            <AttendanceApiCompatLoader />
            <MobileTableEnhancer />
            <ImageUploadGuard />
            <RootAppShell>{children}</RootAppShell>
          </ToastProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
