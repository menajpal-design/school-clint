'use client';

import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { useAuth } from '@/hooks/useAuth';
import { isFreeLifetimePlan } from '@/lib/permissions';
import { PlanLockedFeature } from '@/components/shared/PlanLockedFeature';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const isFree = isFreeLifetimePlan(user);

  return (
    <ProtectedLayout>
      {isFree ? (
        <div className="p-4 md:p-6">
          <PlanLockedFeature
            title="ID Card মডিউলটি লক করা আছে"
            description="ডিজিটাল আইডি কার্ড জেনারেট, ওয়ান-ক্লিক পিডিএফ এবং অ্যাডমিট কার্ড ডিক্লেয়ারেশন ফিচার ব্যবহার করতে দয়া করে সাবস্ক্রিপশন আপডেট করুন।"
            featureName="ID Card Module"
            fullPage
          />
        </div>
      ) : (
        children
      )}
    </ProtectedLayout>
  );
}
