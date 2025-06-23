
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Download, Loader2, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface InvoiceData {
  senderUid: string;
  senderName: string;
  senderEmail: string;
  senderAddress?: string;
  senderPhone?: string;
  recipientName: string;
  recipientEmail: string;
  invoiceDescription: string;
  amount: number;
  currency: string;
  invoiceDate: string; // Stored as ISO string
  invoiceNumber: string;
  status: 'pending' | 'signed';
  signatureType?: 'draw' | 'text';
  signatureData?: string;
  signedAt?: string;
}

const currencySymbols: { [key: string]: string } = {
  INR: '₹', USD: '$', EUR: '€', GBP: '£', AUD: 'A$', CAD: 'C$',
};

export default function ViewInvoicePageClient({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!invoiceId) {
      setError("No invoice ID provided.");
      setIsLoading(false);
      return;
    }
    if (!user) {
      setError("You must be logged in to view this page.");
      setIsLoading(false);
      return;
    }

    const fetchInvoice = async () => {
      setIsLoading(true);
      try {
        const docRef = doc(db, 'invoices', invoiceId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as InvoiceData;
          if (data.senderUid !== user.uid) {
            setError("You do not have permission to view this invoice.");
            toast({ variant: "destructive", title: "Access Denied", description: "This invoice belongs to another user." });
          } else {
            setInvoiceData(data);
          }
        } else {
          setError("Invoice not found.");
        }
      } catch (e) {
        console.error("Failed to fetch invoice data:", e);
        setError("Failed to fetch invoice data from the database.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceId, user]);
  
  const handleDownloadPdf = async () => {
    if (!invoiceData) return;
    
    toast({ title: "Preparing PDF...", description: "Please wait a moment." });

    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF({ compress: true, orientation: 'p', unit: 'mm', format: 'a4' });
    
    // This is a simplified version of the PDF generation logic from SigningCompletePage.
    // In a real app, this would be a shared utility function.
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    let yPos = 20;
    const margin = 15;

    doc.setFontSize(18); doc.setFont("helvetica", "bold");
    doc.text("Signed Invoice", margin, yPos); yPos += 16;
    
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    doc.text(`Invoice #: ${invoiceData.invoiceNumber}`, margin, yPos);
    const dateText = `Date: ${format(new Date(invoiceData.invoiceDate), 'PPP')}`;
    doc.text(dateText, pageWidth - margin - doc.getTextWidth(dateText), yPos);
    yPos += 10;
    
    doc.setLineWidth(0.2); doc.line(margin, yPos - 5, pageWidth - margin, yPos - 5);

    doc.setFont("helvetica", "bold"); doc.text("FROM:", margin, yPos);
    doc.setFont("helvetica", "normal"); doc.text(invoiceData.senderName, margin, yPos += 5);
    doc.text(invoiceData.senderEmail, margin, yPos += 5);

    doc.setFont("helvetica", "bold"); doc.text("TO:", pageWidth / 2, yPos - 10);
    doc.setFont("helvetica", "normal"); doc.text(invoiceData.recipientName, pageWidth / 2, yPos - 5);
    doc.text(invoiceData.recipientEmail, pageWidth / 2, yPos);
    yPos += 15;

    doc.line(margin, yPos - 5, pageWidth - margin, yPos - 5);
    doc.setFont("helvetica", "bold"); doc.text("Description:", margin, yPos);
    const descriptionLines = doc.splitTextToSize(invoiceData.invoiceDescription, pageWidth - (margin * 2));
    doc.setFont("helvetica", "normal"); doc.text(descriptionLines, margin, yPos += 5);
    yPos += descriptionLines.length * 5 + 5;

    doc.line(margin, yPos - 5, pageWidth - margin, yPos - 5);

    if (invoiceData.status === 'signed' && invoiceData.signedAt) {
      const signatureWidth = 50; const signatureHeight = 15;
      const signatureX = pageWidth - margin - signatureWidth;
      let signatureY = yPos;

      if (signatureY + signatureHeight > pageHeight - 30) {
        doc.addPage();
        signatureY = margin;
      }

      doc.setFontSize(8);
      doc.text(`Signed by: ${invoiceData.recipientName} on ${format(new Date(invoiceData.signedAt), 'PPP p')}`, margin, signatureY + 10);
      
      if (invoiceData.signatureData) {
        if (invoiceData.signatureType === 'draw') {
          doc.addImage(invoiceData.signatureData, 'PNG', signatureX, signatureY, signatureWidth, signatureHeight, undefined, 'FAST');
        } else {
          doc.setFont("cursive", "normal").setFontSize(16).text(invoiceData.signatureData, signatureX, signatureY + 10);
        }
      }
      doc.line(signatureX, signatureY + signatureHeight + 1, signatureX + signatureWidth, signatureY + signatureHeight + 1);
    }
    
    // Total Amount at bottom
    const totalY = pageHeight - 20;
    doc.setFontSize(14).setFont("helvetica", "bold");
    const totalText = `Total: ${currencySymbols[invoiceData.currency] || ''}${invoiceData.amount.toFixed(2)}`;
    doc.text(totalText, pageWidth - margin - doc.getTextWidth(totalText), totalY);

    doc.save(`signed_invoice_${invoiceData.invoiceNumber}.pdf`);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Fetching invoice details...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-4">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Access Error</h1>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={() => router.push('/create-invoice')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Go to Dashboard
        </Button>
      </div>
    );
  }

  if (!invoiceData) {
    return null; // Should be covered by error state
  }

  const currencySymbol = currencySymbols[invoiceData.currency] || invoiceData.currency;

  return (
    <div className="max-w-3xl mx-auto py-8 animate-fadeIn">
      <Button variant="ghost" onClick={() => router.push('/create-invoice')} className="mb-4 group text-primary">
        <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back to Invoices
      </Button>

      <Card className="bg-card shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="bg-primary/5 p-6 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-3xl font-headline text-primary">Invoice Details</CardTitle>
            <CardDescription className="text-muted-foreground font-body">Status for invoice #{invoiceData.invoiceNumber}</CardDescription>
          </div>
          {invoiceData.status === 'signed' ? (
            <div className="flex items-center gap-2 text-accent bg-accent/10 px-3 py-1.5 rounded-full text-sm font-medium">
              <CheckCircle size={16} />
              <span>Signed</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-destructive bg-destructive/10 px-3 py-1.5 rounded-full text-sm font-medium">
              <Clock size={16} />
              <span>Pending Signature</span>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-6 font-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-6">
            <div>
              <h3 className="font-semibold text-foreground mb-1 text-sm">FROM:</h3>
              <p className="text-muted-foreground">{invoiceData.senderName}</p>
            </div>
            <div className="md:text-right">
              <h3 className="font-semibold text-foreground mb-1 text-sm">TO:</h3>
              <p className="text-muted-foreground">{invoiceData.recipientName}</p>
            </div>
          </div>
          <Separator/>
          <div>
            <h3 className="font-semibold text-foreground mb-2">Description:</h3>
            <p className="text-muted-foreground whitespace-pre-wrap p-3 bg-background rounded-md text-sm">{invoiceData.invoiceDescription}</p>
          </div>
          <Separator/>
          <div className="text-right space-y-1">
            <p className="text-foreground text-lg">Total Amount:</p>
            <p className="text-accent font-bold text-3xl md:text-4xl font-headline">
              {currencySymbol}{invoiceData.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          
          {invoiceData.status === 'signed' && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold text-foreground mb-2">Signature:</h3>
                <div className="p-4 bg-background rounded-md border text-center">
                  {invoiceData.signatureType === 'draw' ? (
                    <Image src={invoiceData.signatureData!} alt="Drawn signature" width={200} height={50} className="mx-auto bg-white p-1 rounded" />
                  ) : (
                    <p className="text-2xl" style={{ fontFamily: 'cursive' }}>{invoiceData.signatureData}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Signed on {format(new Date(invoiceData.signedAt!), 'PPP \'at\' p')}
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      {invoiceData.status === 'signed' && (
        <div className="mt-6 text-center">
          <Button onClick={handleDownloadPdf} size="lg" className="bg-primary text-primary-foreground shadow-md hover:bg-primary/90">
            <Download className="mr-2 h-5 w-5" />
            Download Signed PDF
          </Button>
        </div>
      )}
    </div>
  );
}

    