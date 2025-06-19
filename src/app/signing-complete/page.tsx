import SigningCompletePageClient from '@/components/pages/SigningCompletePageClient';
import { Suspense } from 'react';

export default function SigningCompletePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SigningCompletePageClient />
    </Suspense>
  );
}
