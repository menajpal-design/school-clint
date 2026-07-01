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
            title="ইনবক্স ও চ্যাট মডিউলটি লক করা আছে"
            description="ছাত্র, শিক্ষক এবং অভিভাবকদের মাঝে অভ্যন্তরীণ নোটিফিকেশন ও চ্যাট গ্রুপ ফিচার ব্যবহার করতে দয়া করে সাবস্ক্রিপশন আপডেট করুন।"
            featureName="Messaging & Chat"
            fullPage
          />
        </div>
      ) : (
        children
      )}
    </ProtectedLayout>
  );
}
