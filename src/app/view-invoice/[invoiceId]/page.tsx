
import ViewInvoicePageClient from '@/components/pages/ViewInvoicePageClient';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export default function ViewInvoicePage({ params }: { params: { invoiceId: string } }) {
  return (
    <Suspense fallback={
        <div className="flex justify-center items-center h-screen">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Loading Invoice...</p>
        </div>
    }>
      <ViewInvoicePageClient invoiceId={params.invoiceId} />
    </Suspense>
  );
}

    