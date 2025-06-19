
'use client';

import { Button } from '@/components/ui/button';
import { Download, AlertTriangle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import AnimatedCheckmark from '@/components/animations/AnimatedCheckmark';
import { toast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import { format } from 'date-fns';

interface InvoiceData {
  invoiceNumber: string;
  senderName: string;
  senderEmail: string;
  senderAddress?: string;
  senderPhone?: string;
  recipientName: string;
  recipientEmail: string;
  invoiceDescription: string;
  amount: number;
  currency: string;
  invoiceDate: string; // ISO string
  items?: { description: string; quantity: number; unitPrice: number; total: number }[];
}

const currencySymbols: { [key: string]: string } = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AUD: 'A$',
  CAD: 'C$',
};

export default function SigningCompletePageClient() {
  const searchParams = useSearchParams();
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [signatureType, setSignatureType] = useState<'draw' | 'text' | null>(null);
  const [typewriterText, setTypewriterText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const invoiceId = searchParams.get('invoiceId');

  useEffect(() => {
    const dataString = searchParams.get('data');
    const sigString = searchParams.get('signature');
    const sigType = searchParams.get('signatureType') as 'draw' | 'text' | null;

    if (dataString) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(dataString)) as InvoiceData;
        parsedData.amount = parseFloat(String(parsedData.amount));
        setInvoiceData(parsedData);
      } catch (e) {
        console.error("Failed to parse invoice data from URL for PDF:", e);
        setError("Could not load invoice details for PDF generation.");
        toast({ variant: "destructive", title: "PDF Error", description: "Corrupted invoice data." });
      }
    } else {
      setError("Invoice details not found for PDF generation.");
    }

    if (sigString) {
      setSignature(decodeURIComponent(sigString));
    }
    if (sigType) {
      setSignatureType(sigType);
    }

  }, [searchParams]);


  useEffect(() => {
    let i = 0;
    const textToType = `Invoice ${invoiceId || ''} signed successfully!`;
    const element = document.getElementById('typewriter-heading');
    if (element) {
        element.style.setProperty('--typewriter-chars', `${textToType.length}ch`);
        element.style.setProperty('--typewriter-steps', `${textToType.length}`);
    }
    setTypewriterText(textToType);
  }, [invoiceId]);

  const handleDownloadPdf = () => {
    if (!invoiceData) {
      toast({
        variant: "destructive",
        title: "Error Generating PDF",
        description: "Invoice data is missing. Cannot generate PDF.",
      });
      return;
    }

    toast({
      title: "Preparing PDF...",
      description: `Generating PDF for invoice ${invoiceData.invoiceNumber}.`,
    });

    try {
      const doc = new jsPDF();
      const pageHeight = doc.internal.pageSize.height;
      let yPos = 20;
      const lineSpacing = 7;
      const sectionSpacing = 10;
      const indent = 25;
      const margin = 20;
      const contentWidth = doc.internal.pageSize.width - 2 * margin;

      const addText = (text: string, x: number, y: number, options?: any) => {
        if (yPos > pageHeight - margin) { // Add new page if content overflows
            doc.addPage();
            yPos = margin;
        }
        doc.text(text, x, y, options);
      }
      
      const addWrappedText = (text: string, x: number, currentY: number, maxWidth: number, spacing: number) => {
        const lines = doc.splitTextToSize(text, maxWidth);
        lines.forEach((line: string) => {
          if (yPos > pageHeight - margin - lineSpacing) {
            doc.addPage();
            yPos = margin;
          }
          doc.text(line, x, yPos);
          yPos += spacing;
        });
        return yPos; // Return the new yPos
      };


      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      addText("Signed Invoice", margin, yPos);
      yPos += sectionSpacing * 1.5;

      doc.setLineWidth(0.5);
      doc.line(margin, yPos, doc.internal.pageSize.width - margin, yPos);
      yPos += sectionSpacing;
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");

      // Sender and Recipient
      const senderX = margin;
      const recipientX = doc.internal.pageSize.width / 2 + 10;
      const initialYSection = yPos;

      doc.setFont("helvetica", "bold");
      addText("FROM:", senderX, yPos);
      yPos += lineSpacing;
      doc.setFont("helvetica", "normal");
      addText(invoiceData.senderName, senderX, yPos);
      yPos += lineSpacing;
      addText(invoiceData.senderEmail, senderX, yPos);
      yPos += lineSpacing;
      if (invoiceData.senderAddress) {
        yPos = addWrappedText(invoiceData.senderAddress, senderX, yPos, contentWidth / 2 - 10, lineSpacing) - lineSpacing;
      }
      if (invoiceData.senderPhone) {
        addText(invoiceData.senderPhone, senderX, yPos);
        yPos += lineSpacing;
      }
      
      let recipientYPos = initialYSection;
      doc.setFont("helvetica", "bold");
      doc.text("TO:", recipientX, recipientYPos); // Use doc.text directly if not managing yPos for this column yet
      recipientYPos += lineSpacing;
      doc.setFont("helvetica", "normal");
      doc.text(invoiceData.recipientName, recipientX, recipientYPos);
      recipientYPos += lineSpacing;
      doc.text(invoiceData.recipientEmail, recipientX, recipientYPos);
      
      yPos = Math.max(yPos, recipientYPos) + sectionSpacing;

      doc.line(margin, yPos, doc.internal.pageSize.width - margin, yPos);
      yPos += sectionSpacing;

      doc.setFont("helvetica", "bold");
      addText("Invoice Number:", margin, yPos);
      doc.setFont("helvetica", "normal");
      addText(invoiceData.invoiceNumber, margin + 45, yPos);
      yPos += lineSpacing;
      
      doc.setFont("helvetica", "bold");
      addText("Invoice Date:", margin, yPos);
      doc.setFont("helvetica", "normal");
      addText(format(new Date(invoiceData.invoiceDate), 'PPP'), margin + 45, yPos);
      yPos += sectionSpacing;

      doc.line(margin, yPos, doc.internal.pageSize.width - margin, yPos);
      yPos += sectionSpacing;
      
      doc.setFont("helvetica", "bold");
      addText("Description:", margin, yPos);
      yPos += lineSpacing;
      doc.setFont("helvetica", "normal");
      yPos = addWrappedText(invoiceData.invoiceDescription, margin, yPos, contentWidth, lineSpacing);
      yPos += sectionSpacing;

      // Itemized breakdown if available
      if (invoiceData.items && invoiceData.items.length > 0) {
        doc.line(margin, yPos, doc.internal.pageSize.width - margin, yPos);
        yPos += sectionSpacing;
        doc.setFont("helvetica", "bold");
        addText("Itemized Breakdown:", margin, yPos);
        yPos += lineSpacing;
        doc.setFont("helvetica", "normal");
        invoiceData.items.forEach(item => {
            const itemText = `${item.description} (x${item.quantity})`;
            const itemTotal = `${currencySymbols[invoiceData.currency] || invoiceData.currency}${item.total.toFixed(2)}`;
            addText(itemText, margin + 5, yPos);
            addText(itemTotal, doc.internal.pageSize.width - margin - doc.getTextWidth(itemTotal), yPos);
            yPos += lineSpacing;
        });
        yPos += sectionSpacing;
      }
      
      doc.line(margin, yPos, doc.internal.pageSize.width - margin, yPos);
      yPos += sectionSpacing;

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      addText("Total Amount:", margin, yPos);
      const amountText = `${currencySymbols[invoiceData.currency] || invoiceData.currency}${invoiceData.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${invoiceData.currency})`;
      addText(amountText, doc.internal.pageSize.width - margin - doc.getTextWidth(amountText), yPos);
      yPos += sectionSpacing * 1.5;
      
      doc.line(margin, yPos, doc.internal.pageSize.width - margin, yPos);
      yPos += sectionSpacing;
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      addText(`Signed by: ${invoiceData.recipientName}`, margin, yPos);
      yPos += lineSpacing;
      addText(`Date Signed: ${format(new Date(), 'PPP')}`, margin, yPos);
      yPos += sectionSpacing;

      doc.setFont("helvetica", "bold");
      addText("Signature:", margin, yPos);
      yPos += lineSpacing;

      if (signature) {
        if (signatureType === 'draw' && signature.startsWith('data:image/png;base64,')) {
          const imgWidth = 100; // Adjust as needed
          const imgHeight = 50; // Adjust as needed
          if (yPos + imgHeight > pageHeight - margin) { // Check for page overflow before adding image
            doc.addPage();
            yPos = margin;
          }
          doc.addImage(signature, 'PNG', margin, yPos, imgWidth, imgHeight);
          yPos += imgHeight + lineSpacing;
        } else if (signatureType === 'text') {
          doc.setFont("cursive", "normal"); // Attempt to use a cursive font
          addText(signature, margin, yPos, {maxWidth: contentWidth});
          yPos += lineSpacing * 2; // Add more space for text signature
        }
      } else {
        addText("[Signature Not Provided]", margin, yPos);
        yPos += lineSpacing;
      }
      
      doc.save(`signed_invoice_${invoiceData.invoiceNumber || 'document'}.pdf`);
      toast({
        title: "Download Started",
        description: `PDF for invoice ${invoiceData.invoiceNumber} should be downloading.`,
        className: "bg-success-green-DEFAULT text-white"
      });
    } catch (pdfError) {
        console.error("PDF generation failed:", pdfError);
        toast({
            variant: "destructive",
            title: "PDF Generation Failed",
            description: "Could not generate the PDF. Please try again or contact support.",
        });
    }
  };


  if (error && !invoiceData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-4">
        <AlertTriangle className="w-16 h-16 text-destructive-DEFAULT mb-4" />
        <h1 className="text-2xl font-bold text-text-dark mb-2">Error</h1>
        <p className="text-text-light mb-6">{error}</p>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center relative py-10 px-4"
      style={{
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
          {typewriterText}
        </h1>


        <p className="text-text-light mb-8 text-lg animate-fadeIn font-body" style={{animationDelay: '2.8s'}}>
          Both parties have been notified and should receive the signed invoice via email shortly.
        </p>

        <Button
          size="lg"
          onClick={handleDownloadPdf}
          disabled={!invoiceData || !signature}
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

