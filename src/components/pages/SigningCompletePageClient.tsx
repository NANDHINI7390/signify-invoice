
'use client';

import { Button } from '@/components/ui/button';
import { Download, AlertTriangle, Loader2, CalendarDays, Smartphone, Monitor, MailCheck, MailWarning, RefreshCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, Suspense } from 'react';
import AnimatedCheckmark from '@/components/animations/AnimatedCheckmark';
import { toast } from '@/hooks/use-toast';
import { format as formatDateFn } from 'date-fns';
import emailjs from '@emailjs/browser';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

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
  signatureType?: 'draw' | 'text';
  signatureData?: string;
  signedAt?: string;
  signedUserAgent?: string;
  items?: { description: string; quantity: number; unitPrice: number; total: number }[];
}

const currencySymbols: { [key: string]: string } = {
  INR: '₹', USD: '$', EUR: '€', GBP: '£', AUD: 'A$', CAD: 'C$',
};

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


function SigningCompletePageClientInternal({ invoiceId }: { invoiceId: string }) {
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [typewriterText, setTypewriterText] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const [notificationStatus, setNotificationStatus] = useState<'idle' | 'pending' | 'success' | 'error' | 'retrying'>('idle');
  const [notificationAttempted, setNotificationAttempted] = useState(false);


  const getDeviceType = (userAgent: string | null): string => {
    if (!userAgent) return "Unknown Device";
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) return "Tablet";
    if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) return "Mobile Device";
    return "Desktop Device";
  };
  
  const sendNotificationToSender = useCallback(async (data: InvoiceData) => {
    if (notificationStatus === 'pending' || notificationStatus === 'retrying') return;

    setNotificationStatus(notificationAttempted ? 'retrying' : 'pending');
    setNotificationAttempted(true);

    const SENDER_NOTIFY_SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SENDER_NOTIFICATION_SERVICE_ID;
    const SENDER_NOTIFY_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_SENDER_NOTIFICATION_TEMPLATE_ID;
    const EMAILJS_PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

    if (!SENDER_NOTIFY_SERVICE_ID || !SENDER_NOTIFY_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
      toast({ variant: "default", title: "Dev Note: Sender Notification Skipped", description: "EmailJS sender variables not set.", duration: 8000 });
      setNotificationStatus('error');
      return;
    }

    const templateParams = {
      sender_name: data.senderName,
      sender_email: data.senderEmail,
      recipient_name: data.recipientName,
      invoice_number: data.invoiceNumber,
      signed_date: data.signedAt ? formatDateFn(new Date(data.signedAt), 'PPP p') : 'N/A',
      signed_invoice_link: `${window.location.origin}/view-invoice/${invoiceId}`,
    };

    try {
      await emailjs.send(SENDER_NOTIFY_SERVICE_ID, SENDER_NOTIFY_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY);
      toast({ variant: "success", title: "Sender Notified", description: `An email has been sent to ${data.senderEmail}.` });
      setNotificationStatus('success');
    } catch (emailError) {
      console.error('EmailJS sender notification error:', emailError);
      toast({ variant: "destructive", title: "Sender Notification Failed", description: "Could not send the notification." });
      setNotificationStatus('error');
    }
  }, [invoiceId, notificationStatus, notificationAttempted]);

  useEffect(() => {
    if (!invoiceId) {
      setError("No Invoice ID found.");
      return;
    }

    const fetchInvoiceAndProcess = async () => {
      try {
        const docRef = doc(db, 'invoices', invoiceId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          setError("Signed invoice not found.");
          return;
        }

        const data = docSnap.data() as InvoiceData;
        setInvoiceData(data);

        // Handle signature retrieval
        if (data.signatureType === 'draw') {
          const drawnSig = localStorage.getItem(TEMP_DRAWN_SIGNATURE_KEY);
          setSignature(drawnSig);
          localStorage.removeItem(TEMP_DRAWN_SIGNATURE_KEY);
        } else {
          setSignature(data.signatureData || null);
        }

        // Trigger sender notification
        if (!notificationAttempted) {
          sendNotificationToSender(data);
        }

      } catch (err) {
        console.error("Error fetching signed invoice:", err);
        setError("Could not load signed invoice details.");
      }
    };

    fetchInvoiceAndProcess();
  }, [invoiceId, sendNotificationToSender, notificationAttempted]);


  useEffect(() => {
    const textToType = `Invoice ${invoiceData?.invoiceNumber || ''} signed successfully!`;
    const element = document.getElementById('typewriter-heading');
    if (element) {
        element.style.setProperty('--typewriter-chars', `${textToType.length}ch`);
        element.style.setProperty('--typewriter-steps', `${textToType.length}`);
    }
    setTypewriterText(textToType);
  }, [invoiceData]);


  const handleDownloadPdf = async () => {
    if (!invoiceData) {
      toast({ variant: "destructive", title: "Error Generating PDF", description: "Invoice data is missing." });
      return;
    }
    toast({ title: "Preparing PDF...", description: "Please wait while the PDF is generated." });

    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF({ compress: true, orientation: 'p', unit: 'mm', format: 'a4' });
    
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    let yPos = 20;
    const lineSpacing = 6; 
    const smallLineSpacing = 4.5;
    const sectionSpacing = 8;
    const margin = 15; 
    const contentWidth = pageWidth - 2 * margin;

    const addText = (text: string, x: number, y: number, options?: any) => doc.text(text, x, y, options);
    
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
    doc.setLineWidth(0.3); doc.line(margin, yPos, pageWidth - margin, yPos); yPos += sectionSpacing;
    
    doc.setFontSize(10); doc.setFont("helvetica", "normal");

    const senderX = margin; const recipientX = pageWidth / 2 + 5; 
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

    doc.line(margin, yPos, pageWidth - margin, yPos); yPos += sectionSpacing;

    doc.setFont("helvetica", "bold"); addText("Invoice Number:", margin, yPos);
    doc.setFont("helvetica", "normal"); addText(invoiceData.invoiceNumber, margin + 35, yPos);
    
    const dateLabel = "Invoice Date:";
    const formattedInvoiceDate = formatDateFn(new Date(invoiceData.invoiceDate), 'PPP');
    const dateStringWidth = doc.getTextWidth(formattedInvoiceDate);
    const dateXPos = pageWidth - margin - dateStringWidth;
    doc.setFont("helvetica", "normal"); addText(formattedInvoiceDate, dateXPos, yPos);
    doc.setFont("helvetica", "bold"); addText(dateLabel, dateXPos - doc.getTextWidth(dateLabel) - 2, yPos);
    yPos += lineSpacing + sectionSpacing / 2;

    doc.line(margin, yPos, pageWidth - margin, yPos); yPos += sectionSpacing;
    
    doc.setFont("helvetica", "bold"); addText("Description:", margin, yPos); yPos += lineSpacing;
    doc.setFont("helvetica", "normal"); yPos = addWrappedText(invoiceData.invoiceDescription, margin, yPos, contentWidth, smallLineSpacing); yPos += sectionSpacing / 2;
    
    const signatureWidth = 50; const signatureHeight = 15;
    const signatureX = pageWidth - margin - signatureWidth;
    const signatureY = pageHeight - margin - 40;

    doc.setFontSize(8);
    if (invoiceData.signedAt) {
      addText(`Signed by: ${invoiceData.recipientName}`, margin, signatureY + 4);
      addText(`Date Signed: ${formatDateFn(new Date(invoiceData.signedAt), 'PPP p')}`, margin, signatureY + 8);
    }
    
    const BLANK_PNG_DATA_URL_SLICE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

    if (signature && signature !== BLANK_PNG_DATA_URL_SLICE) {
      if (invoiceData.signatureType === 'draw') {
        doc.addImage(signature, 'PNG', signatureX, signatureY, signatureWidth, signatureHeight, undefined, 'MEDIUM');
      } else if (invoiceData.signatureType === 'text') {
        doc.setFont("cursive", "normal");
        doc.setFontSize(16);
        doc.text(signature, signatureX, signatureY + signatureHeight / 2 + 4);
      }
    } else {
      doc.setFont("helvetica", "italic");
      doc.setTextColor(150, 150, 150);
      addText("[Signature data not available]", signatureX, signatureY + signatureHeight / 2);
    }

    doc.line(signatureX, signatureY + signatureHeight + 1, signatureX + signatureWidth, signatureY + signatureHeight + 1);
    doc.setFontSize(6); doc.setTextColor(150, 150, 150);
    addText("Digitally Signed via Signify Invoice", signatureX, signatureY + signatureHeight + 4);

    doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(0, 0, 0);
    const totalAmountLabel = "TOTAL AMOUNT:";
    const amountValueText = `${currencySymbols[invoiceData.currency] || invoiceData.currency}${invoiceData.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const totalYPos = pageHeight - 30;
    addText(totalAmountLabel, margin, totalYPos);
    doc.setFontSize(16);
    addText(amountValueText, margin, totalYPos + 7);

    doc.save(`signed_invoice_${invoiceData.invoiceNumber || 'document'}.pdf`);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-4">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Error</h1>
        <p className="text-muted-foreground mb-6">{error}</p>
      </div>
    );
  }
  
  if (!invoiceData) {
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
        backgroundImage: `radial-gradient(circle, hsl(var(--background)) 60%, transparent 100%), repeating-linear-gradient(45deg, hsl(var(--accent)/0.02), hsl(var(--accent)/0.02) 10px, transparent 10px, transparent 20px)`, 
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
        {invoiceData.signedAt && (
          <p className="text-sm text-muted-foreground mb-1 animate-fadeIn flex items-center justify-center" style={{animationDelay: '2.5s'}}>
            <CalendarDays size={14} className="mr-1.5"/> Signed on: {formatDateFn(new Date(invoiceData.signedAt), 'MMM d, yyyy \'at\' h:mm a')}
          </p>
        )}
         {invoiceData.signedUserAgent && (
          <p className="text-sm text-muted-foreground mb-2 animate-fadeIn flex items-center justify-center" style={{animationDelay: '2.7s'}}>
            {getDeviceType(invoiceData.signedUserAgent) === "Mobile Device" ? <Smartphone size={14} className="mr-1.5"/> : <Monitor size={14} className="mr-1.5"/>}
            Device: {getDeviceType(invoiceData.signedUserAgent)}
          </p>
        )}
        
        <SenderNotificationStatus status={notificationStatus} onRetry={() => sendNotificationToSender(invoiceData)} />

        <p className="text-muted-foreground mb-8 text-lg animate-fadeIn font-body" style={{animationDelay: '2.8s'}}>
          A copy of the signed invoice will be sent to both parties. You can also download it below.
        </p>

        <Button
          size="lg"
          onClick={handleDownloadPdf}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-8 rounded-lg text-lg shadow-md transform hover:-translate-y-0.5 transition-all duration-300 animate-fadeIn active:scale-95 min-h-[48px]"
          style={{animationDelay: '3.2s'}}
          aria-label="Download Signed PDF"
        >
          <Download className="mr-2 w-5 h-5" /> Download Signed PDF
        </Button>
      </div>
    </div>
  );
}

// Use Suspense to handle client-side data fetching gracefully
export default function SigningCompletePageClient({ invoiceId }: { invoiceId: string }) {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Loading signing confirmation...</p>
            </div>
        }>
            <SigningCompletePageClientInternal invoiceId={invoiceId} />
        </Suspense>
    );
}

    