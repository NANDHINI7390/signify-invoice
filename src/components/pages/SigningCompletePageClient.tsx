'use client';

import { Button } from '@/components/ui/button';
import { Download, AlertTriangle, Loader2 } from 'lucide-react';
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
       toast({ variant: "destructive", title: "Data Error", description: "Invoice details not found for PDF generation." });
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
      const doc = new jsPDF({ compress: true });
      const pageHeight = doc.internal.pageSize.height;
      let yPos = 20;
      const lineSpacing = 7;
      const smallLineSpacing = 5;
      const sectionSpacing = 10;
      const margin = 15; // Reduced margin slightly for more space
      const contentWidth = doc.internal.pageSize.width - 2 * margin;

      const addText = (text: string, x: number, y: number, options?: any) => {
        doc.text(text, x, y, options);
      };
      
      const addWrappedText = (text: string, x: number, currentYPos: number, maxWidth: number, spacing: number): number => {
        let localYPos = currentYPos;
        const lines = doc.splitTextToSize(text, maxWidth);
        lines.forEach((line: string) => {
          if (localYPos > pageHeight - margin - spacing) {
            doc.addPage();
            localYPos = margin;
          }
          doc.text(line, x, localYPos);
          localYPos += spacing;
        });
        return localYPos;
      };

      // Header
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      addText("Signed Invoice", margin, yPos);
      yPos += sectionSpacing * 1.2;

      doc.setLineWidth(0.3);
      doc.line(margin, yPos, doc.internal.pageSize.width - margin, yPos);
      yPos += sectionSpacing;
      
      doc.setFontSize(10); // Reduced base font size for more content fit
      doc.setFont("helvetica", "normal");

      // Sender and Recipient
      const senderX = margin;
      const recipientX = doc.internal.pageSize.width / 2 + 5; 
      let currentSectionYPos = yPos;
      let senderBlockHeight = 0;
      let recipientBlockHeight = 0;

      let tempY = currentSectionYPos;
      doc.setFont("helvetica", "bold");
      addText("FROM:", senderX, tempY);
      tempY += lineSpacing;
      doc.setFont("helvetica", "normal");
      addText(invoiceData.senderName, senderX, tempY);
      tempY += smallLineSpacing;
      addText(invoiceData.senderEmail, senderX, tempY);
      tempY += smallLineSpacing;
      if (invoiceData.senderAddress) {
        tempY = addWrappedText(invoiceData.senderAddress, senderX, tempY, contentWidth / 2 - 10, smallLineSpacing);
      }
      if (invoiceData.senderPhone) {
        if (tempY > pageHeight - margin - smallLineSpacing) { doc.addPage(); tempY = margin; }
        addText(invoiceData.senderPhone, senderX, tempY);
        tempY += smallLineSpacing;
      }
      senderBlockHeight = tempY - currentSectionYPos;

      tempY = currentSectionYPos; 
      doc.setFont("helvetica", "bold");
      addText("TO:", recipientX, tempY);
      tempY += lineSpacing;
      doc.setFont("helvetica", "normal");
      addText(invoiceData.recipientName, recipientX, tempY);
      tempY += smallLineSpacing;
      addText(invoiceData.recipientEmail, recipientX, tempY);
      recipientBlockHeight = tempY - currentSectionYPos;
      
      yPos = currentSectionYPos + Math.max(senderBlockHeight, recipientBlockHeight);
      
      if (yPos > pageHeight - margin - sectionSpacing) {
        doc.addPage();
        yPos = margin;
      } else {
        yPos += sectionSpacing;
      }

      doc.line(margin, yPos, doc.internal.pageSize.width - margin, yPos);
      yPos += sectionSpacing;

      doc.setFont("helvetica", "bold");
      addText("Invoice Number:", margin, yPos);
      doc.setFont("helvetica", "normal");
      addText(invoiceData.invoiceNumber, margin + 40, yPos); // Adjusted X offset
      
      const dateLabel = "Invoice Date:";
      const formattedDate = format(new Date(invoiceData.invoiceDate), 'PPP');
      const dateXPos = doc.internal.pageSize.width - margin - doc.getTextWidth(formattedDate) - doc.getTextWidth(dateLabel) - 5;
      doc.setFont("helvetica", "bold");
      addText(dateLabel, dateXPos, yPos);
      doc.setFont("helvetica", "normal");
      addText(formattedDate, dateXPos + doc.getTextWidth(dateLabel) + 2, yPos);
      yPos += lineSpacing;
      yPos += sectionSpacing / 2;

      doc.line(margin, yPos, doc.internal.pageSize.width - margin, yPos);
      yPos += sectionSpacing;
      
      doc.setFont("helvetica", "bold");
      addText("Description:", margin, yPos);
      yPos += lineSpacing;
      doc.setFont("helvetica", "normal");
      yPos = addWrappedText(invoiceData.invoiceDescription, margin, yPos, contentWidth, smallLineSpacing);
      yPos += sectionSpacing/2; 

      if (invoiceData.items && invoiceData.items.length > 0) {
        if (yPos > pageHeight - margin - sectionSpacing) { doc.addPage(); yPos = margin; }
        doc.line(margin, yPos, doc.internal.pageSize.width - margin, yPos);
        yPos += sectionSpacing;
        doc.setFont("helvetica", "bold");
        addText("Itemized Breakdown:", margin, yPos);
        yPos += lineSpacing;
        doc.setFont("helvetica", "normal");
        invoiceData.items.forEach(item => {
            if (yPos > pageHeight - margin - smallLineSpacing) { doc.addPage(); yPos = margin; }
            const itemText = `${item.description} (x${item.quantity})`;
            const itemTotal = `${currencySymbols[invoiceData.currency] || invoiceData.currency}${item.total.toFixed(2)}`;
            addText(itemText, margin + 2, yPos); // Small indent for items
            addText(itemTotal, doc.internal.pageSize.width - margin - doc.getTextWidth(itemTotal), yPos);
            yPos += smallLineSpacing;
        });
        yPos += sectionSpacing;
      }
      
      if (yPos > pageHeight - margin - sectionSpacing) { doc.addPage(); yPos = margin; }
      doc.line(margin, yPos, doc.internal.pageSize.width - margin, yPos);
      yPos += sectionSpacing;

      // Total Amount - Smaller Font
      doc.setFontSize(12); // Reduced from 16
      doc.setFont("helvetica", "bold");
      if (yPos > pageHeight - margin - lineSpacing) { doc.addPage(); yPos = margin; }
      addText("TOTAL AMOUNT:", margin, yPos);
      
      const amountValueText = `${currencySymbols[invoiceData.currency] || invoiceData.currency}${invoiceData.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      doc.setFontSize(14); // Slightly larger for the amount itself
      addText(amountValueText, doc.internal.pageSize.width - margin - doc.getTextWidth(amountValueText) - doc.getTextWidth(` (${invoiceData.currency})`) - 2 , yPos);
      
      doc.setFontSize(10); // Smaller for currency code
      doc.setFont("helvetica", "normal");
      addText(`(${invoiceData.currency})`, doc.internal.pageSize.width - margin - doc.getTextWidth(` (${invoiceData.currency})`), yPos);
      
      yPos += sectionSpacing * 1.2; // Adjusted spacing
      
      if (yPos > pageHeight - margin - sectionSpacing) { doc.addPage(); yPos = margin; }
      doc.line(margin, yPos, doc.internal.pageSize.width - margin, yPos);
      yPos += sectionSpacing;
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      if (yPos > pageHeight - margin - (smallLineSpacing*2)) { doc.addPage(); yPos = margin; }
      addText(`Signed by: ${invoiceData.recipientName}`, margin, yPos);
      yPos += smallLineSpacing;
      addText(`Date Signed: ${format(new Date(), 'PPP')}`, margin, yPos);
      yPos += sectionSpacing;

      doc.setFont("helvetica", "bold");
      if (yPos > pageHeight - margin - smallLineSpacing) { doc.addPage(); yPos = margin; }
      addText("Signature:", margin, yPos);
      yPos += smallLineSpacing;

      if (signature) {
        if (signatureType === 'draw' && signature.startsWith('data:image/png;base64,')) {
          const imgWidth = 60; // Reduced image size
          const imgHeight = 30; 
          if (yPos + imgHeight > pageHeight - margin) { 
            doc.addPage();
            yPos = margin;
          }
          doc.addImage(signature, 'PNG', margin, yPos, imgWidth, imgHeight);
          yPos += imgHeight + smallLineSpacing;
        } else if (signatureType === 'text') {
          doc.setFont("cursive", "normal"); 
          doc.setFontSize(12); // Text signature size
          if (yPos > pageHeight - margin - (lineSpacing*1.5)) { doc.addPage(); yPos = margin; }
          yPos = addWrappedText(signature, margin, yPos, contentWidth, lineSpacing * 1.2); 
        }
      } else {
        if (yPos > pageHeight - margin - smallLineSpacing) { doc.addPage(); yPos = margin; }
        doc.setFont("helvetica", "italic");
        addText("[Signature Not Provided]", margin, yPos);
        yPos += smallLineSpacing;
      }
      
      doc.save(`signed_invoice_${invoiceData.invoiceNumber || 'document'}.pdf`);
      toast({
        variant: "success",
        title: "Download Started",
        description: `PDF for invoice ${invoiceData.invoiceNumber} should be downloading.`,
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
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Error</h1>
        <p className="text-muted-foreground mb-6">{error}</p>
      </div>
    );
  }
  
  if (!invoiceData && !error) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading invoice details...</p>
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
      <div className="bg-card/95 backdrop-blur-sm p-8 md:p-12 rounded-xl shadow-xl max-w-lg w-full">
        <AnimatedCheckmark className="w-28 h-28 text-accent mx-auto mb-6 animate-fadeIn" style={{animationDelay: '0.2s'}}/>

        <h1 
          id="typewriter-heading"
          className="text-2xl md:text-3xl font-bold text-foreground mb-6 h-16 font-headline whitespace-nowrap overflow-hidden animate-typewriter mx-auto"
          style={{ width: `${typewriterText.length}ch`, borderRightColor: 'hsl(var(--foreground))'}}
        >
          {typewriterText}
        </h1>


        <p className="text-muted-foreground mb-8 text-lg animate-fadeIn font-body" style={{animationDelay: '2.8s'}}>
          Both parties have been notified and should receive the signed invoice via email shortly.
        </p>

        <Button
          size="lg"
          onClick={handleDownloadPdf}
          disabled={!invoiceData} 
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-8 rounded-lg text-lg shadow-button-hover-blue transform hover:-translate-y-0.5 transition-all duration-300 animate-fadeIn active:scale-95 min-h-[48px]"
          style={{animationDelay: '3.2s'}}
          aria-label="Download Signed PDF"
        >
          <Download className="mr-2 w-5 h-5" /> Download Signed PDF
        </Button>
      </div>
    </div>
  );
}
