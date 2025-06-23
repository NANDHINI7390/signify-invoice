
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Edit, Send, AlertTriangle, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import emailjs from '@emailjs/browser';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface InvoiceData {
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
}

const currencySymbols: { [key: string]: string } = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AUD: 'A$',
  CAD: 'C$',
};

export default function InvoicePreviewPageClient({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!invoiceId) {
      setError("No invoice ID provided.");
      return;
    }

    const fetchInvoice = async () => {
      try {
        const docRef = doc(db, 'invoices', invoiceId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setInvoiceData(docSnap.data() as InvoiceData);
        } else {
          setError("Invoice not found.");
          toast({ variant: "destructive", title: "Error", description: "Could not find the specified invoice." });
        }
      } catch (e) {
        console.error("Failed to fetch invoice data:", e);
        setError("Failed to fetch invoice data from the database.");
        toast({ variant: "destructive", title: "Error", description: "There was a problem fetching the invoice." });
      }
    };

    fetchInvoice();
  }, [invoiceId]);

  const handleEdit = () => {
    // Note: The edit flow would need to be updated to use Firestore.
    // For now, it's disabled. A user can create a new one.
    toast({ title: "Edit Not Implemented", description: "Please create a new invoice to make changes." });
    // router.push(`/create-invoice?editId=${invoiceId}`);
  };

  const handleSendInvoice = async () => {
    if (!invoiceData) {
      toast({ variant: "destructive", title: "Error", description: "No invoice data to send." });
      return;
    }
    setIsSending(true);
    toast({ title: "Processing...", description: "Sending invoice for signature." });

    const formattedDate = invoiceData.invoiceDate ? format(new Date(invoiceData.invoiceDate), 'PPP') : 'N/A';
    const currencySymbol = currencySymbols[invoiceData.currency] || invoiceData.currency;

    const EMAILJS_PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
    const EMAILJS_SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
    const EMAILJS_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;

    const templateParams = {
      to_email: invoiceData.recipientEmail,
      to_name: invoiceData.recipientName,
      from_name: invoiceData.senderName,
      from_email: invoiceData.senderEmail,
      invoice_link: `${window.location.origin}/sign-invoice/${invoiceId}`,
      invoice_number: invoiceData.invoiceNumber,
      invoice_date: formattedDate,
      invoice_description: invoiceData.invoiceDescription,
      invoice_amount: `${currencySymbol}${invoiceData.amount.toFixed(2)}`,
      sender_address: invoiceData.senderAddress || 'N/A',
      sender_phone: invoiceData.senderPhone || 'N/A',
    };
    
    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
      toast({
        variant: "default",
        title: "Developer Note: Email Not Configured",
        description: "Simulating email send. Set up EmailJS environment variables to send real emails.",
        duration: 8000,
      });
      console.warn("EmailJS not fully configured. Simulating email send for navigation.");
      setTimeout(() => {
        router.push(`/email-sent?invoiceId=${invoiceId}&recipientEmail=${encodeURIComponent(invoiceData.recipientEmail)}`);
        setIsSending(false);
      }, 1500);
      return;
    }

    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY);
      toast({ variant: "success", title: "Invoice Sent!", description: "The invoice has been successfully emailed for signature." });
      router.push(`/email-sent?invoiceId=${invoiceId}&recipientEmail=${encodeURIComponent(invoiceData.recipientEmail)}`);
    } catch (emailError) {
      console.error('EmailJS send error:', emailError);
      toast({ variant: "destructive", title: "Email Send Failed", description: "Could not send the invoice email. Please check your EmailJS configuration or try again later." });
    } finally {
      setIsSending(false);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-4">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Error Loading Preview</h1>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={() => router.push('/create-invoice')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Create Invoice
        </Button>
      </div>
    );
  }

  if (!invoiceData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading invoice preview...</p>
      </div>
    );
  }
  
  const currencySymbol = currencySymbols[invoiceData.currency] || invoiceData.currency;

  return (
    <div className="max-w-3xl mx-auto py-8 animate-fadeIn">
      <Button variant="outline" onClick={() => router.push('/create-invoice')} className="mb-6 group transition-all hover:shadow-md active:scale-95">
        <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back to Form
      </Button>

      <Card className="bg-card shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="bg-primary/5 p-6">
          <CardTitle className="text-3xl font-headline text-primary text-center">Invoice Preview</CardTitle>
          <CardDescription className="text-muted-foreground text-center font-body">Review the invoice details below before sending.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-6 font-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-6">
            <div>
              <h3 className="font-semibold text-foreground mb-1 text-sm">FROM:</h3>
              <p className="text-muted-foreground">{invoiceData.senderName}</p>
              <p className="text-muted-foreground">{invoiceData.senderEmail}</p>
              {invoiceData.senderAddress && <p className="text-muted-foreground text-xs">{invoiceData.senderAddress}</p>}
              {invoiceData.senderPhone && <p className="text-muted-foreground text-xs">{invoiceData.senderPhone}</p>}
            </div>
            <div className="md:text-right">
              <h3 className="font-semibold text-foreground mb-1 text-sm">TO:</h3>
              <p className="text-muted-foreground">{invoiceData.recipientName}</p>
              <p className="text-muted-foreground">{invoiceData.recipientEmail}</p>
            </div>
          </div>
          
          <Separator />

          <div className="flex justify-between items-center text-sm">
            <div>
              <span className="font-semibold text-foreground">Invoice #: </span>
              <span className="text-muted-foreground">{invoiceData.invoiceNumber}</span>
            </div>
            <div>
              <span className="font-semibold text-foreground">Date: </span>
              <span className="text-muted-foreground">{format(new Date(invoiceData.invoiceDate), 'PPP')}</span>
            </div>
          </div>
          
          <Separator />

          <div>
            <h3 className="font-semibold text-foreground mb-2">Description:</h3>
            <p className="text-muted-foreground whitespace-pre-wrap p-3 bg-background rounded-md text-sm">{invoiceData.invoiceDescription}</p>
          </div>
          
          <Separator />
          
          <div className="text-right space-y-1">
            <p className="text-foreground text-lg">Total Amount:</p>
            <p className="text-accent font-bold text-3xl md:text-4xl font-headline">
              {currencySymbol}{invoiceData.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-muted-foreground text-xs">({invoiceData.currency})</p>
          </div>

        </CardContent>
      </Card>

      <Card className="mt-8 bg-card shadow-sm rounded-xl">
        <CardHeader>
            <h2 className="text-xl font-modern-sans text-foreground text-center">Ready to send for signature?</h2>
        </CardHeader>
        <CardContent className="text-center">
            <p className="text-muted-foreground mb-1">This invoice will be sent to:</p>
            <p className="font-semibold text-primary mb-6">{invoiceData.recipientEmail}</p>
        
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" onClick={handleEdit} className="group transition-all hover:shadow-md active:scale-95 border-primary text-primary hover:bg-primary/10 px-6 py-3 text-base">
              <Edit className="mr-2 h-4 w-4 group-hover:rotate-[-10deg] transition-transform" /> Edit Invoice
            </Button>
            <Button 
              onClick={handleSendInvoice} 
              disabled={isSending}
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold rounded-lg shadow-sm transform hover:-translate-y-0.5 transition-all duration-300 active:scale-95 flex items-center justify-center px-6 py-3 text-base"
            >
              {isSending ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Send className="mr-2 h-5 w-5" />
              )}
              {isSending ? 'Sending...' : 'Confirm & Send Signing Link'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    