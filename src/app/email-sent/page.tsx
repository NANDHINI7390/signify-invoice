import EmailSentPageClient from '@/components/pages/EmailSentPageClient';
import { Suspense } from 'react';

export default function EmailSentPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EmailSentPageClient />
    </Suspense>
  );
}
