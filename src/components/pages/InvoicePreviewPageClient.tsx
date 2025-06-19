'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Edit, Send, AlertTriangle, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import emailjs from '@emailjs/browser';

const EMAILJS_PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
const EMAILJS_SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;

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
  invoiceDate: string; // Store as ISO string
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

export default function InvoicePreviewPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const dataString = searchParams.get('data');
      if (dataString) {
        const decodedData = JSON.parse(decodeURIComponent(dataString)) as InvoiceData;
        decodedData.amount = parseFloat(String(decodedData.amount));
        setInvoiceData(decodedData);
      } else {
        setError("No invoice data found to preview.");
        toast({ variant: "destructive", title: "Error", description: "Could not load invoice data for preview." });
      }
    } catch (e) {
      console.error("Failed to parse invoice data:", e);
      setError("Invalid invoice data format.");
      toast({ variant: "destructive", title: "Error", description: "Could not parse invoice data for preview." });
    }
  }, [searchParams]);

  const handleEdit = () => {
    if (invoiceData) {
      const query = encodeURIComponent(JSON.stringify(invoiceData));
      router.push(`/create-invoice?editData=${query}`);
    }
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

    const templateParams = {
      to_email: invoiceData.recipientEmail,
      to_name: invoiceData.recipientName,
      from_name: invoiceData.senderName,
      from_email: invoiceData.senderEmail,
      invoice_link: `${window.location.origin}/sign-invoice/${encodeURIComponent(invoiceData.invoiceNumber)}?data=${encodeURIComponent(JSON.stringify(invoiceData))}`,
      invoice_number: invoiceData.invoiceNumber,
      invoice_date: formattedDate,
      invoice_description: invoiceData.invoiceDescription,
      invoice_amount: `${currencySymbol}${invoiceData.amount.toFixed(2)}`,
      sender_address: invoiceData.senderAddress || 'N/A',
      sender_phone: invoiceData.senderPhone || 'N/A',
    };
    
    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
       toast({
        variant: "destructive",
        title: "EmailJS Not Fully Configured",
        description: "EmailJS environment variables are not set. Please configure them in Vercel or your .env.local file.",
        duration: 7000,
      });
      console.warn("EmailJS not fully configured. Check Vercel environment variables or .env.local: NEXT_PUBLIC_EMAILJS_SERVICE_ID, NEXT_PUBLIC_EMAILJS_TEMPLATE_ID, NEXT_PUBLIC_EMAILJS_PUBLIC_KEY. Simulating email send for navigation.");
      setTimeout(() => {
        router.push('/email-sent?recipientEmail=' + encodeURIComponent(invoiceData.recipientEmail));
        setIsSending(false);
      }, 1500);
      return;
    }

    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY);
      toast({ variant: "success", title: "Invoice Sent!", description: "The invoice has been successfully emailed for signature." });
      router.push('/email-sent?recipientEmail=' + encodeURIComponent(invoiceData.recipientEmail));
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
        <h1 className="text-2xl font-bold text-text-dark mb-2">Error Loading Preview</h1>
        <p className="text-text-light mb-6">{error}</p>
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
        <p className="mt-4 text-text-light">Loading invoice preview...</p>
      </div>
    );
  }
  
  const currencySymbol = currencySymbols[invoiceData.currency] || invoiceData.currency;

  return (
    <div className="max-w-3xl mx-auto py-8 animate-fadeIn">
      <Button variant="outline" onClick={() => router.push('/create-invoice')} className="mb-6 group transition-all hover:shadow-md active:scale-95">
        <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back to Form
      </Button>

      <Card className="bg-card shadow-card-shadow rounded-xl overflow-hidden">
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

      <Card className="mt-8 bg-card shadow-card-shadow rounded-xl">
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
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold rounded-lg shadow-button-hover-green transform hover:-translate-y-0.5 transition-all duration-300 active:scale-95 flex items-center justify-center px-6 py-3 text-base"
            >
              {isSending ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Send className="mr-2 h-5 w-5" />}
              {isSending ? 'Sending...' : 'Confirm &amp; Send Signing Link'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
