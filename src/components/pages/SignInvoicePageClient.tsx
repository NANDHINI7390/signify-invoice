
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Edit, Check, Loader2, AlertTriangle, FileText, UserCircle, Building } from 'lucide-react';
import SignaturePadComponent from '@/components/invoice/SignaturePadComponent';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface InvoiceData {
  id?: string; // For mock
  invoiceNumber: string;
  senderName: string;
  senderEmail: string;
  senderAddress?: string;
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

// Mock data if no data is passed via params (for development/fallback)
const mockInvoiceFallback: InvoiceData = {
  id: "INV-FALLBACK-001",
  invoiceNumber: "INV-FALLBACK-001",
  senderName: "Signify Demo Corp.",
  senderEmail: "billing@signifydemo.com",
  senderAddress: "123 Demo Street, Suite 400, Tech City, TC 54321",
  recipientName: "John Signee",
  recipientEmail: "john.signee@example.com",
  invoiceDescription: "Sample consulting services rendered for Q4, including project management and technical advisory.",
  amount: 3500.00,
  currency: 'USD',
  invoiceDate: new Date().toISOString(),
  items: [
    { description: "Project Management (10 hours)", quantity: 1, unitPrice: 1500, total: 1500 },
    { description: "Technical Advisory (5 hours)", quantity: 1, unitPrice: 1000, total: 1000 },
    { description: "Support Services", quantity: 1, unitPrice: 1000, total: 1000 },
  ]
};


export default function SignInvoicePageClient({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [useTextSignature, setUseTextSignature] = useState(false);
  const [textSignature, setTextSignature] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dataString = searchParams.get('data');
    if (dataString) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(dataString)) as InvoiceData;
        parsedData.amount = parseFloat(String(parsedData.amount));
        setInvoiceData(parsedData);
      } catch (e) {
        console.error("Failed to parse invoice data from URL:", e);
        setError("Invalid invoice link. Data is corrupted.");
        setInvoiceData(mockInvoiceFallback); // Fallback to mock on error
        toast({ variant: "destructive", title: "Error", description: "Corrupted invoice data in link. Displaying sample." });
      }
    } else {
      // Fallback to mock if no data is provided (e.g. direct navigation)
      console.warn(`No invoice data in URL for ID: ${invoiceId}. Using mock data.`);
      setInvoiceData(mockInvoiceFallback);
      // toast({ title: "Notice", description: "Displaying sample invoice data." });
    }
  }, [invoiceId, searchParams]);


  const handleSign = () => {
    if (!agreementChecked) {
      toast({ variant: "destructive", title: "Agreement Required", description: "Please agree to the terms before signing.", duration: 3000 });
      const agreeCheckbox = document.getElementById('agreement');
      if (agreeCheckbox) agreeCheckbox.focus();
      return;
    }
    if (!useTextSignature && !signatureDataUrl) {
      toast({ variant: "destructive", title: "Signature Required", description: "Please draw your signature or type it.", duration: 3000 });
      return;
    }
    if (useTextSignature && !textSignature.trim()) {
      toast({ variant: "destructive", title: "Signature Required", description: "Please type your name for text signature.", duration: 3000 });
      const textSigInput = document.getElementById('textSignature');
      if (textSigInput) textSigInput.focus();
      return;
    }

    setIsLoading(true);
    toast({ title: "Processing Signature...", description: "Please wait a moment.", duration: 2000 });
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      // Here, you would typically send the signatureDataUrl or textSignature to your backend
      // And trigger PDF generation and emailing.
      // For now, we navigate to signing complete page.
      const finalInvoiceId = invoiceData?.invoiceNumber || invoiceId;
      const signatureToSend = useTextSignature ? textSignature : signatureDataUrl;
      const signatureType = useTextSignature ? 'text' : 'draw';

      let url = `/signing-complete?invoiceId=${encodeURIComponent(finalInvoiceId)}`;
      if (invoiceData) {
        // Make sure all relevant data is passed for PDF generation
        const dataToPass = {
          ...invoiceData,
          // Add any other fields that might be missing but needed for the PDF
        };
        url += `&data=${encodeURIComponent(JSON.stringify(dataToPass))}`;
      }
      if (signatureToSend) {
        url += `&signature=${encodeURIComponent(signatureToSend)}`;
      }
      url += `&signatureType=${signatureType}`;
      
      router.push(url);
    }, 2000);
  };

  if (error && !invoiceData) { // Only show full error state if invoiceData also couldn't be set to mock
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-4">
        <AlertTriangle className="w-16 h-16 text-destructive-DEFAULT mb-4" />
        <h1 className="text-2xl font-bold text-text-dark mb-2">Error Loading Invoice</h1>
        <p className="text-text-light mb-6">{error}</p>
      </div>
    );
  }
  
  if (!invoiceData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary-blue-DEFAULT" />
        <p className="mt-4 text-text-light">Loading invoice...</p>
      </div>
    );
  }
  
  const currencySymbol = currencySymbols[invoiceData.currency] || invoiceData.currency;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-0 animate-fadeIn">
      <Card className="bg-card-white shadow-card-shadow rounded-xl overflow-hidden border border-border">
        <CardHeader className="bg-primary-blue-DEFAULT/5 p-6 border-b border-primary-blue-DEFAULT/10">
          <div className="flex items-center justify-center space-x-3">
            <FileText className="w-10 h-10 text-primary-blue-DEFAULT" />
            <div>
              <CardTitle className="text-2xl md:text-3xl font-headline text-primary-blue-DEFAULT">Invoice for Signing</CardTitle>
              <CardDescription className="text-text-light font-body">Please review the details carefully.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-6 font-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-6 text-sm">
            <div>
              <h3 className="font-semibold text-text-dark mb-2 flex items-center"><Building size={16} className="mr-2 text-text-light" />FROM:</h3>
              <p className="text-text-dark font-medium">{invoiceData.senderName}</p>
              <p className="text-text-light">{invoiceData.senderEmail}</p>
              {invoiceData.senderAddress && <p className="text-text-light text-xs mt-1">{invoiceData.senderAddress}</p>}
            </div>
            <div className="md:text-left md:pl-0">
              <h3 className="font-semibold text-text-dark mb-2 flex items-center"><UserCircle size={16} className="mr-2 text-text-light" />TO:</h3>
              <p className="text-text-dark font-medium">{invoiceData.recipientName}</p>
              <p className="text-text-light">{invoiceData.recipientEmail}</p>
            </div>
          </div>
          
          <Separator />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
                <span className="font-semibold text-text-dark">Invoice Number:</span>
                <span className="text-text-light">{invoiceData.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
                <span className="font-semibold text-text-dark">Invoice Date:</span>
                <span className="text-text-light">{format(new Date(invoiceData.invoiceDate), 'PPP')}</span>
            </div>
          </div>
          
          <Separator />

          <div>
            <h3 className="font-semibold text-text-dark mb-2">Description:</h3>
            <p className="text-text-light whitespace-pre-wrap p-3 bg-background-gray rounded-md text-sm border border-border">{invoiceData.invoiceDescription}</p>
          </div>

          {invoiceData.items && invoiceData.items.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold text-text-dark mb-2">Itemized Breakdown:</h3>
                <div className="space-y-2 border border-border rounded-md p-3 bg-background-gray/50">
                  {invoiceData.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-text-light text-sm pb-1 border-b border-border/50 last:border-b-0 last:pb-0">
                      <span>{item.description} (x{item.quantity})</span>
                      <span>{currencySymbols[invoiceData.currency] || invoiceData.currency}{item.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          
          <Separator className="my-6" />
          
          <div className="text-right space-y-1 bg-success-green-DEFAULT/5 p-4 rounded-lg border border-success-green-DEFAULT/20">
            <p className="text-text-dark text-xl font-medium">Total Amount Due:</p>
            <p className="text-success-green-dark font-bold text-3xl md:text-4xl font-headline">
              {currencySymbol}{invoiceData.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-text-light text-xs">({invoiceData.currency})</p>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-8 bg-card-white shadow-card-shadow rounded-xl overflow-hidden border border-border">
        <CardHeader className="bg-purple-accent-DEFAULT/5 p-6 border-b border-purple-accent-DEFAULT/10 animate-slideInUp">
             <CardTitle className="text-2xl font-modern-sans text-purple-accent-DEFAULT text-center">Please Review and Sign Below</CardTitle>
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-6 font-body">
          <div className="flex items-center space-x-2 mb-4">
            <Button 
              variant={!useTextSignature ? "default" : "outline"} 
              onClick={() => setUseTextSignature(false)}
              className={`flex-1 min-h-[44px] ${!useTextSignature ? "bg-primary-blue-DEFAULT hover:bg-primary-blue-dark text-white" : "border-primary-blue-DEFAULT text-primary-blue-DEFAULT hover:bg-primary-blue-DEFAULT/10"} active:scale-95 transition-all`}
            >
              <Edit className="mr-2 h-4 w-4" /> Draw Signature
            </Button>
            <Button 
              variant={useTextSignature ? "default" : "outline"} 
              onClick={() => setUseTextSignature(true)}
              className={`flex-1 min-h-[44px] ${useTextSignature ? "bg-primary-blue-DEFAULT hover:bg-primary-blue-dark text-white" : "border-primary-blue-DEFAULT text-primary-blue-DEFAULT hover:bg-primary-blue-DEFAULT/10"} active:scale-95 transition-all`}
            >
              <Edit className="mr-2 h-4 w-4" /> Type Signature
            </Button>
          </div>

          {useTextSignature ? (
            <div>
              <Label htmlFor="textSignature" className="text-text-dark font-semibold">Type your full name:</Label>
              <Input 
                id="textSignature"
                placeholder="Your Full Legal Name"
                value={textSignature}
                onChange={(e) => setTextSignature(e.target.value)}
                className="mt-1 border-primary-blue-DEFAULT focus:ring-primary-blue-DEFAULT focus:ring-2 text-xl p-4 rounded-lg input-focus-glow min-h-[56px]"
                style={{ fontFamily: 'cursive', fontSize: '1.5rem' }}
              />
              {textSignature && <p className="mt-2 text-sm text-text-light">Preview: <span className="font-medium" style={{ fontFamily: 'cursive', fontSize: '1.2rem' }}>{textSignature}</span></p>}
            </div>
          ) : (
            <div className="border border-primary-blue-DEFAULT rounded-lg p-1 bg-card-white">
                 <SignaturePadComponent onSignatureChange={setSignatureDataUrl} />
            </div>
          )}
          
          <div className="mt-6 pt-4 border-t border-border">
            <Label
              htmlFor="agreement"
              id="agreement-label"
              className="flex items-start space-x-3 text-sm text-text-light leading-relaxed cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              <Checkbox
                id="agreement"
                checked={agreementChecked}
                onCheckedChange={(checked) => setAgreementChecked(checked as boolean)}
                className="data-[state=checked]:bg-primary-blue-DEFAULT data-[state=checked]:border-primary-blue-DEFAULT data-[state=checked]:text-white transition-all duration-200 w-5 h-5 rounded mt-1 shrink-0"
                aria-labelledby="agreement-label"
              />
              <span className="flex-1">
                I, <span className="font-semibold text-text-dark">{invoiceData.recipientName}</span>, agree that my electronic signature is the legal equivalent of my manual signature on this invoice and that I have reviewed and agree to its terms.
              </span>
            </Label>
          </div>
        </CardContent>
        <CardFooter className="p-6 bg-background-gray border-t border-border">
          <Button 
            onClick={handleSign} 
            disabled={isLoading || (!agreementChecked || (useTextSignature ? !textSignature.trim() : !signatureDataUrl)) }
            className="w-full text-lg py-3 min-h-[50px] gradient-button-blue-to-green text-white font-semibold rounded-xl shadow-button-hover-blue hover:transform hover:-translate-y-1 transition-all duration-300 active:scale-95"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Check className="mr-2 h-5 w-5" />
            )}
            {isLoading ? 'Processing Signature...' : 'Sign and Confirm Invoice'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
