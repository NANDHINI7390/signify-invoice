import CreateInvoicePageClient from '@/components/pages/CreateInvoicePageClient';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export default function CreateInvoicePage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary-blue-DEFAULT" /><p className="ml-4 text-text-light">Loading Invoice Creator...</p></div>}>
      <CreateInvoicePageClient />
    </Suspense>
  );
}
