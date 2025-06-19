
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
       toast({ variant: "destructive", title: "Data Error", description: "Invoice details not found for PDF generation." });
    }

    if (sigString) {
      setSignature(decodeURIComponent(sigString));
    } else {
        // setError("Signature data not found."); // Potentially too noisy if signature can be optional for viewing
        // toast({ variant: "destructive", title: "Data Error", description: "Signature data not found." });
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
      // const indent = 25; // Not used currently
      const margin = 20;
      const contentWidth = doc.internal.pageSize.width - 2 * margin;

      const addText = (text: string, x: number, y: number, options?: any) => {
        // This yPos update logic should be within the calling scope, not addText directly, 
        // or addText should return new yPos. For now, manage yPos outside.
        doc.text(text, x, y, options);
      }
      
      const addWrappedText = (text: string, x: number, currentYPos: number, maxWidth: number, spacing: number): number => {
        let localYPos = currentYPos;
        const lines = doc.splitTextToSize(text, maxWidth);
        lines.forEach((line: string) => {
          if (localYPos > pageHeight - margin - spacing) { // Check space for current line
            doc.addPage();
            localYPos = margin;
          }
          doc.text(line, x, localYPos);
          localYPos += spacing;
        });
        return localYPos;
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
      const recipientX = doc.internal.pageSize.width / 2 + 10; // Start recipient details slightly to the right
      let currentSectionYPos = yPos;
      let senderBlockHeight = 0;
      let recipientBlockHeight = 0;

      // Calculate Sender Block
      let tempY = currentSectionYPos;
      doc.setFont("helvetica", "bold");
      addText("FROM:", senderX, tempY);
      tempY += lineSpacing;
      doc.setFont("helvetica", "normal");
      addText(invoiceData.senderName, senderX, tempY);
      tempY += lineSpacing;
      addText(invoiceData.senderEmail, senderX, tempY);
      tempY += lineSpacing;
      if (invoiceData.senderAddress) {
        const addressLines = doc.splitTextToSize(invoiceData.senderAddress, contentWidth / 2 - 10);
        addressLines.forEach((line: string) => {
            addText(line, senderX, tempY); tempY+=lineSpacing;
        });
      }
      if (invoiceData.senderPhone) {
        addText(invoiceData.senderPhone, senderX, tempY);
        tempY += lineSpacing;
      }
      senderBlockHeight = tempY - currentSectionYPos;

      // Calculate Recipient Block
      tempY = currentSectionYPos;
      doc.setFont("helvetica", "bold");
      addText("TO:", recipientX, tempY);
      tempY += lineSpacing;
      doc.setFont("helvetica", "normal");
      addText(invoiceData.recipientName, recipientX, tempY);
      tempY += lineSpacing;
      addText(invoiceData.recipientEmail, recipientX, tempY);
      // No address/phone for recipient in current data model
      recipientBlockHeight = tempY - currentSectionYPos;
      
      yPos = currentSectionYPos + Math.max(senderBlockHeight, recipientBlockHeight) + sectionSpacing;

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
      // yPos already updated by addWrappedText
      yPos += sectionSpacing/2; // Reduced spacing after wrapped text

      // Itemized breakdown if available
      if (invoiceData.items && invoiceData.items.length > 0) {
        doc.line(margin, yPos, doc.internal.pageSize.width - margin, yPos);
        yPos += sectionSpacing;
        doc.setFont("helvetica", "bold");
        addText("Itemized Breakdown:", margin, yPos);
        yPos += lineSpacing;
        doc.setFont("helvetica", "normal");
        invoiceData.items.forEach(item => {
            if (yPos > pageHeight - margin - lineSpacing) { doc.addPage(); yPos = margin; }
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
      if (yPos > pageHeight - margin - lineSpacing) { doc.addPage(); yPos = margin; }
      addText("Total Amount:", margin, yPos);
      const amountText = `${currencySymbols[invoiceData.currency] || invoiceData.currency}${invoiceData.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${invoiceData.currency})`;
      addText(amountText, doc.internal.pageSize.width - margin - doc.getTextWidth(amountText), yPos);
      yPos += sectionSpacing * 1.5;
      
      doc.line(margin, yPos, doc.internal.pageSize.width - margin, yPos);
      yPos += sectionSpacing;
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      if (yPos > pageHeight - margin - (lineSpacing*2)) { doc.addPage(); yPos = margin; }
      addText(`Signed by: ${invoiceData.recipientName}`, margin, yPos);
      yPos += lineSpacing;
      addText(`Date Signed: ${format(new Date(), 'PPP')}`, margin, yPos);
      yPos += sectionSpacing;

      doc.setFont("helvetica", "bold");
      if (yPos > pageHeight - margin - lineSpacing) { doc.addPage(); yPos = margin; }
      addText("Signature:", margin, yPos);
      yPos += lineSpacing;

      if (signature) {
        if (signatureType === 'draw' && signature.startsWith('data:image/png;base64,')) {
          const imgWidth = 80; 
          const imgHeight = 40; 
          if (yPos + imgHeight > pageHeight - margin) { 
            doc.addPage();
            yPos = margin;
          }
          doc.addImage(signature, 'PNG', margin, yPos, imgWidth, imgHeight);
          yPos += imgHeight + lineSpacing;
        } else if (signatureType === 'text') {
          doc.setFont("cursive", "normal"); 
          if (yPos > pageHeight - margin - (lineSpacing*2)) { doc.addPage(); yPos = margin; }
          // Use addWrappedText for potentially long text signatures
          yPos = addWrappedText(signature, margin, yPos, contentWidth, lineSpacing * 1.5); // Using 1.5 for cursive font
          // yPos += lineSpacing * 2; 
        }
      } else {
        if (yPos > pageHeight - margin - lineSpacing) { doc.addPage(); yPos = margin; }
        addText("[Signature Not Provided]", margin, yPos);
        yPos += lineSpacing;
      }
      
      doc.save(`signed_invoice_${invoiceData.invoiceNumber || 'document'}.pdf`);
      toast({
        variant: "success", // Use the new success variant
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


  if (error && !invoiceData) { // Show full error state only if invoiceData also failed to load
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-4">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Error</h1>
        <p className="text-muted-foreground mb-6">{error}</p>
      </div>
    );
  }
  
  // Show loading or a less critical error if invoiceData is missing but no major error string was set
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
          disabled={!invoiceData || !signature} // Disable if critical data for PDF is missing
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
