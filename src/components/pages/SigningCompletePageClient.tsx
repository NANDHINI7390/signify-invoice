'use client';

import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import AnimatedCheckmark from '@/components/animations/AnimatedCheckmark';
import { toast } from '@/hooks/use-toast'; // Keep for download placeholder
import jsPDF from 'jspdf'; // Added for actual PDF generation attempt

export default function SigningCompletePageClient() {
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get('invoiceId');
  const [typewriterText, setTypewriterText] = useState('');
  const fullText = "Invoice signed successfully!"; // Removed checkmark, using AnimatedCheckmark

  useEffect(() => {
    let i = 0;
    const textToType = `Invoice ${invoiceId || ''} signed successfully!`;
    // Calculate steps for typewriter effect based on text length for smoother animation
    const element = document.getElementById('typewriter-heading');
    if (element) {
        element.style.setProperty('--typewriter-chars', `${textToType.length}ch`);
        element.style.setProperty('--typewriter-steps', `${textToType.length}`);
    }
    setTypewriterText(textToType); // Set full text for animation to handle

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]); // Rerun if invoiceId changes (though unlikely on this page)

  const handleDownloadPdf = () => {
    toast({
      title: "Preparing PDF...",
      description: `Generating PDF for invoice ${invoiceId}.`,
    });

    // Basic PDF Generation with jsPDF
    try {
      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.text("Signed Invoice", 20, 20);
      doc.setFontSize(16);
      doc.text(`Invoice ID: ${invoiceId || 'N/A'}`, 20, 30);
      doc.setFontSize(12);
      doc.text("This invoice has been digitally signed.", 20, 40);
      // Add more invoice details here if available or retrieved
      // For example, if invoice data was stored in localStorage or passed differently
      doc.text("Content:", 20, 50);
      doc.text(" - Service A: $100", 25, 60);
      doc.text(" - Service B: $150", 25, 70);
      doc.text("Total: $250", 20, 80);
      doc.text("Signature: [Digital Signature Placeholder]", 20, 100);
      
      doc.save(`signed_invoice_${invoiceId || 'document'}.pdf`);
      toast({
        title: "Download Started",
        description: `PDF for invoice ${invoiceId} should be downloading.`,
        className: "bg-success-green-DEFAULT text-white"
      });
    } catch (error) {
        console.error("PDF generation failed:", error);
        toast({
            variant: "destructive",
            title: "PDF Generation Failed",
            description: "Could not generate the PDF. Please try again or contact support.",
        });
    }
  };

  return (
    <div 
      className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center relative py-10 px-4"
      style={{
        // Subtle background pattern with document icons (simplified with CSS gradients)
        backgroundImage: `
          radial-gradient(circle, hsl(var(--background)) 60%, transparent 100%),
          repeating-linear-gradient(45deg, 
            hsl(var(--accent)/0.02), 
            hsl(var(--accent)/0.02) 10px, 
            transparent 10px, 
            transparent 20px
          )
        `, 
        backgroundSize: 'cover, auto',
      }}
    >
      <div className="bg-card-white/95 backdrop-blur-sm p-8 md:p-12 rounded-xl shadow-xl max-w-lg w-full">
        <AnimatedCheckmark className="w-28 h-28 text-success-green-DEFAULT mx-auto mb-6 animate-fadeIn" style={{animationDelay: '0.2s'}}/>

        <h1 
          id="typewriter-heading"
          className="text-2xl md:text-3xl font-bold text-text-dark mb-6 h-16 font-headline whitespace-nowrap overflow-hidden animate-typewriter mx-auto"
          style={{ width: `${typewriterText.length}ch`, borderRightColor: 'hsl(var(--text-dark))'}}
        >
          {/* Text is set by JS for animation to pick up length for steps */}
        </h1>


        <p className="text-text-light mb-8 text-lg animate-fadeIn font-body" style={{animationDelay: '2.8s'}}>
          Both parties have been notified and should receive the signed invoice via email shortly.
        </p>

        <Button
          size="lg"
          onClick={handleDownloadPdf}
          className="bg-primary-blue-DEFAULT hover:bg-primary-blue-dark text-white font-semibold py-3 px-8 rounded-lg text-lg shadow-button-hover-blue transform hover:-translate-y-0.5 transition-all duration-300 animate-fadeIn active:scale-95 min-h-[48px]"
          style={{animationDelay: '3.2s'}}
          aria-label="Download Signed PDF"
        >
          <Download className="mr-2 w-5 h-5" /> Download Signed PDF
        </Button>
      </div>
    </div>
  );
}
