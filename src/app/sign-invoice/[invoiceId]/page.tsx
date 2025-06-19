import SignInvoicePageClient from '@/components/pages/SignInvoicePageClient';

export default function SignInvoicePage({ params }: { params: { invoiceId: string } }) {
  return <SignInvoicePageClient invoiceId={params.invoiceId} />;
}
