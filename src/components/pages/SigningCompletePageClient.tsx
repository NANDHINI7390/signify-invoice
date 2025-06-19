
'use client';

import { Button } from '@/components/ui/button';
import { Download, AlertTriangle, Loader2, CalendarDays, Smartphone, Monitor, MailCheck, MailWarning, RefreshCcw } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import AnimatedCheckmark from '@/components/animations/AnimatedCheckmark';
import { toast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import { format as formatDateFn } from 'date-fns';
import emailjs from '@emailjs/browser';

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
  invoiceDate: string; 
  items?: { description: string; quantity: number; unitPrice: number; total: number }[];
}

const currencySymbols: { [key: string]: string } = {
  INR: '₹', USD: '$', EUR: '€', GBP: '£', AUD: 'A$', CAD: 'C$',
};

const BLANK_IMAGE_DATA_URL = 'data:,';
const MIN_DATA_URL_LENGTH = 150; 
const TEMP_DRAWN_SIGNATURE_KEY = 'tempDrawnSignatureData';

const SenderNotificationStatus = ({ status, onRetry }: { status: 'pending' | 'success' | 'error' | 'idle' | 'retrying', onRetry: () => void }) => {
  if (status === 'idle') return null;

  let icon = <Loader2 size={14} className="mr-1.5 animate-spin" />;
  let text = "Notifying sender...";
  let color = "text-muted-foreground";

  if (status === 'success') {
    icon = <MailCheck size={14} className="mr-1.5 text-accent" />;
    text = "Sender notified successfully.";
    color = "text-accent";
  } else if (status === 'error') {
    icon = <MailWarning size={14} className="mr-1.5 text-destructive" />;
    text = "Failed to notify sender.";
    color = "text-destructive";
  } else if (status === 'retrying') {
    icon = <Loader2 size={14} className="mr-1.5 animate-spin" />;
    text = "Retrying notification...";
    color = "text-muted-foreground";
  }


  return (
    <div className={`text-xs mt-1 mb-3 animate-fadeIn flex items-center justify-center ${color}`} style={{ animationDelay: '2.9s' }}>
      {icon}
      <span>{text}</span>
      {status === 'error' && (
        <Button variant="link" size="sm" onClick={onRetry} className="ml-2 h-auto p-0 text-xs text-primary hover:underline">
           <RefreshCcw size={12} className="mr-1"/> Retry
        </Button>
      )}
    </div>
  );
};


export default function SigningCompletePageClient() {
  const searchParams = useSearchParams();
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [signatureType, setSignatureType] = useState<'draw' | 'text' | null>(null);
  const [typewriterText, setTypewriterText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [signedAt, setSignedAt] = useState<string | null>(null);
  const [signedUserAgent, setSignedUserAgent] = useState<string | null>(null);
  
  const [isNotifyingSender, setIsNotifyingSender] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<'idle' | 'pending' | 'success' | 'error' | 'retrying'>('idle');
  const [notificationAttempted, setNotificationAttempted] = useState(false);


  const invoiceId = searchParams.get('invoiceId');

  useEffect(() => {
    const dataString = searchParams.get('data');
    const sigType = searchParams.get('signatureType') as 'draw' | 'text' | null;
    const signedAtParam = searchParams.get('signedAt');
    const signedUserAgentParam = searchParams.get('signedUserAgent');

    let sigValue: string | null = null;

    if (sigType === 'draw') {
      try {
        sigValue = localStorage.getItem(TEMP_DRAWN_SIGNATURE_KEY);
        if (sigValue) {
          console.log('SigningCompletePageClient useEffect: Retrieved drawn signature from localStorage (length:', sigValue.length, ')');
          localStorage.removeItem(TEMP_DRAWN_SIGNATURE_KEY); // Clean up
        } else {
          console.warn('SigningCompletePageClient useEffect: Drawn signature expected but not found in localStorage.');
        }
      } catch (e) {
        console.error('SigningCompletePageClient useEffect: Error accessing localStorage for signature', e);
      }
    } else if (sigType === 'text') {
      sigValue = searchParams.get('signature');
      if (sigValue) {
        sigValue = decodeURIComponent(sigValue);
        console.log('SigningCompletePageClient useEffect: Retrieved typed signature from URL params:', sigValue);
      }
    }
    
    console.log('SigningCompletePageClient useEffect: sigType:', sigType, 'sigValue (prefix & length):', sigValue ? sigValue.substring(0,50) + '...' : null, sigValue ? sigValue.length : 0);


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

    if (sigValue && sigValue !== BLANK_IMAGE_DATA_URL && sigValue.length > MIN_DATA_URL_LENGTH) {
        setSignature(sigValue); // No need to decodeURIComponent if it's from localStorage or already decoded
    } else {
        console.log('SigningCompletePageClient useEffect: sigValue is blank or too short, setting signature to null.');
        setSignature(null); 
    }
    
    if (sigType) setSignatureType(sigType);
    if (signedAtParam) setSignedAt(decodeURIComponent(signedAtParam));
    if (signedUserAgentParam) setSignedUserAgent(decodeURIComponent(signedUserAgentParam));

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

  const getDeviceType = (userAgent: string | null): string => {
    if (!userAgent) return "Unknown Device";
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
      return "Tablet";
    }
    if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
      return "Mobile Device";
    }
    return "Desktop Device";
  };
  
  const sendNotificationToSender = useCallback(async () => {
    if (!invoiceData || !signedAt || isNotifyingSender) {
      console.log("sendNotificationToSender: Aborting - missing data, already notifying, or already attempted.");
      if (!notificationAttempted) setNotificationStatus('idle'); // Only reset to idle if not attempted
      return;
    }

    console.log("sendNotificationToSender: Attempting to notify sender.");
    setIsNotifyingSender(true);
    setNotificationStatus(notificationAttempted ? 'retrying' : 'pending'); // Use 'retrying' if it's a retry
    setNotificationAttempted(true); // Mark that an attempt is being made/has been made

    const SENDER_NOTIFY_SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SENDER_NOTIFICATION_SERVICE_ID;
    const SENDER_NOTIFY_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_SENDER_NOTIFICATION_TEMPLATE_ID;
    const EMAILJS_PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

    if (!SENDER_NOTIFY_SERVICE_ID || !SENDER_NOTIFY_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
      toast({
        variant: "destructive",
        title: "Sender Notification Not Configured",
        description: "EmailJS variables for sender notification are not set. Please configure NEXT_PUBLIC_EMAILJS_SENDER_NOTIFICATION_SERVICE_ID and NEXT_PUBLIC_EMAILJS_SENDER_NOTIFICATION_TEMPLATE_ID.",
        duration: 8000,
      });
      console.warn("EmailJS for sender notification not fully configured.");
      setIsNotifyingSender(false);
      setNotificationStatus('error');
      return;
    }

    const templateParams = {
      sender_name: invoiceData.senderName,
      sender_email: invoiceData.senderEmail,
      recipient_name: invoiceData.recipientName,
      invoice_number: invoiceData.invoiceNumber,
      signed_date: formatDateFn(new Date(signedAt), 'PPP p'),
      // Add any other relevant details for the sender notification template
    };

    try {
      await emailjs.send(SENDER_NOTIFY_SERVICE_ID, SENDER_NOTIFY_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY);
      toast({ variant: "success", title: "Sender Notified", description: `An email has been sent to ${invoiceData.senderEmail}.` });
      setNotificationStatus('success');
    } catch (emailError) {
      console.error('EmailJS sender notification error:', emailError);
      toast({ variant: "destructive", title: "Sender Notification Failed", description: "Could not send the notification email to the sender." });
      setNotificationStatus('error');
    } finally {
      setIsNotifyingSender(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceData, signedAt, isNotifyingSender, notificationAttempted]);

  useEffect(() => {
    if (invoiceData && signedAt && !notificationAttempted && notificationStatus === 'idle') {
       console.log("useEffect: Triggering initial sender notification.");
      sendNotificationToSender();
    }
  }, [invoiceData, signedAt, sendNotificationToSender, notificationAttempted, notificationStatus]);


  const handleDownloadPdf = () => {
    if (!invoiceData) {
      toast({ variant: "destructive", title: "Error Generating PDF", description: "Invoice data is missing." });
      return;
    }
    toast({ title: "Preparing PDF...", description: `Generating PDF for invoice ${invoiceData.invoiceNumber}.` });

    console.log('SigningCompletePageClient handleDownloadPdf: Using signature (prefix & length):', signature ? signature.substring(0,50) + '...' : null, signature ? signature.length : 0);
    console.log('SigningCompletePageClient handleDownloadPdf: Using signatureType:', signatureType);


    try {
      const doc = new jsPDF({ compress: true, orientation: 'p', unit: 'mm', format: 'a4', precision: 16 });
      const pageHeight = doc.internal.pageSize.height;
      let yPos = 20;
      const lineSpacing = 6; 
      const smallLineSpacing = 4.5;
      const sectionSpacing = 8;
      const margin = 15; 
      const contentWidth = doc.internal.pageSize.width - 2 * margin;

      const addText = (text: string, x: number, y: number, options?: any) => {
        doc.text(text, x, y, options);
      };
      
      const addWrappedText = (text: string, x: number, currentYPos: number, maxWidth: number, spacing: number): number => {
        let localYPos = currentYPos;
        const lines = doc.splitTextToSize(text, maxWidth);
        lines.forEach((line: string) => {
          if (localYPos > pageHeight - margin - spacing) { doc.addPage(); localYPos = margin; }
          doc.text(line, x, localYPos);
          localYPos += spacing;
        });
        return localYPos;
      };

      doc.setFontSize(18); doc.setFont("helvetica", "bold");
      addText("Signed Invoice", margin, yPos); yPos += sectionSpacing * 1.2;
      doc.setLineWidth(0.3); doc.line(margin, yPos, doc.internal.pageSize.width - margin, yPos); yPos += sectionSpacing;
      
      doc.setFontSize(10); doc.setFont("helvetica", "normal");

      const senderX = margin; const recipientX = doc.internal.pageSize.width / 2 + 5; 
      let currentSectionYPos = yPos; let senderBlockHeight = 0; let recipientBlockHeight = 0;
      let tempY = currentSectionYPos;
      doc.setFont("helvetica", "bold"); addText("FROM:", senderX, tempY); tempY += lineSpacing;
      doc.setFont("helvetica", "normal"); addText(invoiceData.senderName, senderX, tempY); tempY += smallLineSpacing;
      addText(invoiceData.senderEmail, senderX, tempY); tempY += smallLineSpacing;
      if (invoiceData.senderAddress) tempY = addWrappedText(invoiceData.senderAddress, senderX, tempY, contentWidth / 2 - 10, smallLineSpacing);
      if (invoiceData.senderPhone) { if (tempY > pageHeight - margin - smallLineSpacing) { doc.addPage(); tempY = margin; } addText(invoiceData.senderPhone, senderX, tempY); tempY += smallLineSpacing; }
      senderBlockHeight = tempY - currentSectionYPos;

      tempY = currentSectionYPos; 
      doc.setFont("helvetica", "bold"); addText("TO:", recipientX, tempY); tempY += lineSpacing;
      doc.setFont("helvetica", "normal"); addText(invoiceData.recipientName, recipientX, tempY); tempY += smallLineSpacing;
      addText(invoiceData.recipientEmail, recipientX, tempY);
      recipientBlockHeight = tempY - currentSectionYPos;
      yPos = currentSectionYPos + Math.max(senderBlockHeight, recipientBlockHeight);
      if (yPos > pageHeight - margin - sectionSpacing) { doc.addPage(); yPos = margin; } else { yPos += sectionSpacing; }

      doc.line(margin, yPos, doc.internal.pageSize.width - margin, yPos); yPos += sectionSpacing;

      doc.setFont("helvetica", "bold"); addText("Invoice Number:", margin, yPos);
      doc.setFont("helvetica", "normal"); addText(invoiceData.invoiceNumber, margin + 35, yPos);
      
      const dateLabel = "Invoice Date:";
      const formattedInvoiceDate = formatDateFn(new Date(invoiceData.invoiceDate), 'PPP');
      const dateStringWidth = doc.getTextWidth(formattedInvoiceDate);
      const dateXPos = doc.internal.pageSize.width - margin - dateStringWidth;
      doc.setFont("helvetica", "normal"); addText(formattedInvoiceDate, dateXPos, yPos);
      doc.setFont("helvetica", "bold"); addText(dateLabel, dateXPos - doc.getTextWidth(dateLabel) - 2, yPos);
      yPos += lineSpacing; yPos += sectionSpacing / 2;


      doc.line(margin, yPos, doc.internal.pageSize.width - margin, yPos); yPos += sectionSpacing;
      
      doc.setFont("helvetica", "bold"); addText("Description:", margin, yPos); yPos += lineSpacing;
      doc.setFont("helvetica", "normal"); yPos = addWrappedText(invoiceData.invoiceDescription, margin, yPos, contentWidth, smallLineSpacing); yPos += sectionSpacing/2; 

      if (invoiceData.items && invoiceData.items.length > 0) {
        if (yPos > pageHeight - margin - sectionSpacing) { doc.addPage(); yPos = margin; }
        doc.line(margin, yPos, doc.internal.pageSize.width - margin, yPos); yPos += sectionSpacing;
        doc.setFont("helvetica", "bold"); addText("Itemized Breakdown:", margin, yPos); yPos += lineSpacing;
        doc.setFont("helvetica", "normal");
        invoiceData.items.forEach(item => {
            if (yPos > pageHeight - margin - smallLineSpacing) { doc.addPage(); yPos = margin; }
            const itemText = `${item.description} (x${item.quantity})`;
            const itemTotal = `${currencySymbols[invoiceData.currency] || invoiceData.currency}${item.total.toFixed(2)}`;
            addText(itemText, margin + 2, yPos);
            addText(itemTotal, doc.internal.pageSize.width - margin - doc.getTextWidth(itemTotal), yPos);
            yPos += smallLineSpacing;
        });
        yPos += sectionSpacing/2; 
      }
      
      if (yPos > pageHeight - margin - sectionSpacing * 2) { doc.addPage(); yPos = margin; } 
      doc.line(margin, yPos, doc.internal.pageSize.width - margin, yPos); yPos += sectionSpacing;

      doc.setFontSize(12); doc.setFont("helvetica", "bold");
      if (yPos > pageHeight - margin - lineSpacing) { doc.addPage(); yPos = margin; }
      addText("TOTAL AMOUNT:", margin, yPos);
      const amountValueText = `${currencySymbols[invoiceData.currency] || invoiceData.currency}${invoiceData.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      const amountTextWidth = doc.getTextWidth(amountValueText);
      const currencyTextWidth = doc.getTextWidth(` (${invoiceData.currency})`);
      doc.setFontSize(14); addText(amountValueText, doc.internal.pageSize.width - margin - amountTextWidth - currencyTextWidth - 2, yPos);
      doc.setFontSize(10); doc.setFont("helvetica", "normal"); addText(`(${invoiceData.currency})`, doc.internal.pageSize.width - margin - currencyTextWidth, yPos);
      yPos += sectionSpacing * 1.5; 
      
      const signatureAreaYStart = pageHeight - margin - 50; // Reserve bottom 50mm for signature block
      if (yPos > signatureAreaYStart - sectionSpacing) { // If current content is too close or overlaps, new page
          doc.addPage();
          yPos = margin;
      } else {
          yPos = signatureAreaYStart; // Move to start of signature block area
      }
      
      doc.line(margin, yPos, doc.internal.pageSize.width - margin, yPos); yPos += sectionSpacing;
      
      doc.setFontSize(10); doc.setFont("helvetica", "normal");
      addText(`Signed by: ${invoiceData.recipientName}`, margin, yPos); yPos += smallLineSpacing;

      if (signedAt) {
        addText(`Date Signed: ${formatDateFn(new Date(signedAt), 'PPP p')}`, margin, yPos); yPos += smallLineSpacing;
      }
      if (signedUserAgent) {
        addText(`Signed Using: ${getDeviceType(signedUserAgent)}`, margin, yPos); yPos += smallLineSpacing;
      }
      addText("Signed IP Address: (Client-Side Context)", margin, yPos);
      yPos += sectionSpacing / 2;

      doc.setFont("helvetica", "bold");
      if (yPos > pageHeight - margin - smallLineSpacing) { doc.addPage(); yPos = margin; }
      addText("Signature:", margin, yPos); yPos += smallLineSpacing;

      const signatureImageWidth = 50; 
      const signatureImageHeight = 15; 

      if (signature && signature !== BLANK_IMAGE_DATA_URL && signature.length > MIN_DATA_URL_LENGTH) {
        const signatureAreaHeight = signatureType === 'draw' ? signatureImageHeight : (doc.splitTextToSize(signature, contentWidth).length * lineSpacing * 1.2);
        if (yPos + signatureAreaHeight > pageHeight - margin) { doc.addPage(); yPos = margin; }

        if (signatureType === 'draw' && signature.startsWith('data:image/png;base64,')) {
          doc.addImage(signature, 'PNG', margin, yPos, signatureImageWidth, signatureImageHeight, undefined, 'MEDIUM'); 
          yPos += signatureImageHeight + smallLineSpacing;
        } else if (signatureType === 'text') {
          doc.setFont("cursive", "normal"); doc.setFontSize(12);
          yPos = addWrappedText(signature, margin, yPos, contentWidth, lineSpacing * 1.1); 
        } else { 
            doc.setFont("helvetica", "italic"); 
            const errorText = signatureType === 'draw' ? "[Drawn Signature Data Invalid or Blank]" : "[Text Signature Data Invalid]";
            addText(errorText, margin, yPos); 
            console.error("PDF Signature Error:", errorText, "Type:", signatureType, "Data (prefix):", signature ? signature.substring(0,30) : "null");
            yPos += smallLineSpacing;
        }
      } else {
        if (yPos > pageHeight - margin - smallLineSpacing) { doc.addPage(); yPos = margin; }
        doc.setFont("helvetica", "italic"); 
        const errorText = "[Signature Not Provided or Empty]";
        addText(errorText, margin, yPos); 
        console.error("PDF Signature Error:", errorText, "Type:", signatureType, "Data (prefix):", signature ? signature.substring(0,30) : "null");
        yPos += smallLineSpacing;
      }
      
      doc.save(`signed_invoice_${invoiceData.invoiceNumber || 'document'}.pdf`);
      toast({ variant: "success", title: "Download Started", description: `PDF for invoice ${invoiceData.invoiceNumber} should be downloading.` });
    } catch (pdfError) {
        console.error("PDF generation failed:", pdfError);
        toast({ variant: "destructive", title: "PDF Generation Failed", description: "Could not generate the PDF." });
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
          className="text-2xl md:text-3xl font-bold text-foreground mb-3 font-headline whitespace-nowrap overflow-hidden animate-typewriter mx-auto"
          style={{ width: `${typewriterText.length}ch`, borderRightColor: 'hsl(var(--foreground))'}}
        >
          {typewriterText}
        </h1>
        {invoiceData && signedAt && (
          <p className="text-sm text-muted-foreground mb-1 animate-fadeIn flex items-center justify-center" style={{animationDelay: '2.5s'}}>
            <CalendarDays size={14} className="mr-1.5"/> Signed on: {formatDateFn(new Date(signedAt), 'MMM d, yyyy \\'at\\' h:mm a')}
          </p>
        )}
         {invoiceData && signedUserAgent && (
          <p className="text-sm text-muted-foreground mb-2 animate-fadeIn flex items-center justify-center" style={{animationDelay: '2.7s'}}>
            {getDeviceType(signedUserAgent) === "Mobile Device" ? <Smartphone size={14} className="mr-1.5"/> : <Monitor size={14} className="mr-1.5"/>}
            Device: {getDeviceType(signedUserAgent)}
          </p>
        )}
        
        <SenderNotificationStatus status={notificationStatus} onRetry={sendNotificationToSender} />

        <p className="text-muted-foreground mb-8 text-lg animate-fadeIn font-body" style={{animationDelay: '2.8s'}}>
          A copy of the signed invoice should be sent to both parties. You can also download it below.
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

    