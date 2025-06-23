
import InvoicePreviewPageClient from '@/components/pages/InvoicePreviewPageClient';

export default function InvoicePreviewPage({ params }: { params: { invoiceId: string } }) {
  return <InvoicePreviewPageClient invoiceId={params.invoiceId} />;
}

    