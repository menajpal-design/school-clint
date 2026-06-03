import { Metadata } from 'next';
import SchoolNotFound from '@/components/SchoolNotFound';

interface PageProps {
  searchParams: { subdomain?: string; from?: string };
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const subdomain = searchParams?.subdomain || 'unknown';
  return {
    title: `বিদ্যালয় খুঁজে পাওয়া যায়নি — ${subdomain}.easyschool.live`,
    description: 'এই সাবডোমেনটি আমাদের সিস্টেমে নিবন্ধিত নেই।',
    robots: { index: false, follow: false },
  };
}

export default function SchoolNotFoundPage({ searchParams }: PageProps) {
  const subdomain = searchParams?.subdomain || 'unknown';
  return <SchoolNotFound subdomain={subdomain} />;
}
