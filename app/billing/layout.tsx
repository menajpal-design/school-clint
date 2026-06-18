import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import BillingValidityPanel from './BillingValidityPanel';
import BillingPaymentGuard from './BillingPaymentGuard';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ProtectedLayout><BillingPaymentGuard /><BillingValidityPanel />{children}</ProtectedLayout>;
}
