import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import BillingValidityPanel from './BillingValidityPanel';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ProtectedLayout><BillingValidityPanel />{children}</ProtectedLayout>;
}
