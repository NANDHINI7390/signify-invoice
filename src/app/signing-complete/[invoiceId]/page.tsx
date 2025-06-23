
import SigningCompletePageClient from '@/components/pages/SigningCompletePageClient';

export default function SigningCompletePage({ params }: { params: { invoiceId: string } }) {
  return <SigningCompletePageClient invoiceId={params.invoiceId} />;
}

    