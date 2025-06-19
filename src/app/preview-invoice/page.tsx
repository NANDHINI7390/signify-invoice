import InvoicePreviewPageClient from '@/components/pages/InvoicePreviewPageClient';
import { Suspense } from 'react';

// This page will use query parameters to get invoice data from the creation page
// For a real app, you might use temporary server-side storage or encrypt the data in params

export default function InvoicePreviewPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading Preview...</div>}>
      <InvoicePreviewPageClient />
    </Suspense>
  );
}
