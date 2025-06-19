'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import AnimatedCheckmark from '@/components/animations/AnimatedCheckmark';

export default function SigningCompletePageClient() {
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get('invoiceId');
  const [typewriterText, setTypewriterText] = useState('');
  const fullText = "✅ Invoice signed successfully!";

  useEffect(() => {
    let i = 0;
    const intervalId = setInterval(() => {
      setTypewriterText(fullText.substring(0, i + 1));
      i++;
      if (i >= fullText.length) { // Changed to >=
        clearInterval(intervalId);
      }
    }, 100); 
    return () => clearInterval(intervalId);
  }, []);

  const handleDownloadPdf = () => {
    toast({
      title: "Download Started (Simulated)",
      description: `Preparing PDF for invoice ${invoiceId}... This is a placeholder action.`,
    });
    // Placeholder for PDF download logic using jsPDF
    // Example:
    // if (typeof window !== 'undefined') {
    //   const jsPDF = require('jspdf');
    //   const doc = new jsPDF.default();
    //   doc.text("Signed Invoice Content...", 10, 10);
    //   doc.save(`signed_invoice_${invoiceId}.pdf`);
    // }
  };

  return (
    <div 
      className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center relative py-10"
      style={{
        backgroundImage: `
          radial-gradient(circle, rgba(255,255,255,0) 0%, hsl(var(--background)) 70%),
          repeating-conic-gradient(hsl(var(--accent)/0.03) 0% 2.5%, transparent 2.5% 5%)
        `, 
        backgroundSize: 'cover, 60px 60px',
      }}
    >
      <div className="bg-card/90 backdrop-blur-md p-8 md:p-12 rounded-xl shadow-2xl max-w-lg">
        <AnimatedCheckmark className="w-28 h-28 text-success-green mx-auto mb-6" />

        <h1 className="text-3xl md:text-4xl font-bold text-text-dark mb-6 h-12 font-headline">
          {typewriterText}
          {typewriterText.length < fullText.length && (
            <span className="inline-block w-1 h-8 bg-text-dark animate-pulse ml-1 align-bottom">&nbsp;</span>
          )}
        </h1>

        <p className="text-text-light mb-8 text-lg animate-fadeIn font-body" style={{animationDelay: '2.5s'}}>
          Both parties have received the signed invoice via email.
        </p>

        <Button
          size="lg"
          onClick={handleDownloadPdf}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-8 rounded-lg text-lg shadow-button-hover hover:transform hover:-translate-y-0.5 transition-all duration-300 animate-fadeIn active:scale-95 min-h-[44px]"
          style={{animationDelay: '3s'}}
          aria-label="Download Signed PDF"
        >
          <Download className="mr-2 w-5 h-5" /> Download Signed PDF
        </Button>
      </div>
    </div>
  );
}
