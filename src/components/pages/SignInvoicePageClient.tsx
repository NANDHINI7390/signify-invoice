
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Edit, Check, Loader2, AlertTriangle, FileText, UserCircle, Building } from 'lucide-react';
import SignaturePadComponent from '@/components/invoice/SignaturePadComponent';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

interface InvoiceData {
  invoiceNumber: string;
  senderName: string;
  senderEmail: string;
  senderAddress?: string;
  recipientName: string;
  recipientEmail: string;
  invoiceDescription: string;
  amount: number;
  currency: string;
  invoiceDate: string;
  status: 'pending' | 'signed';
  items?: { description: string; quantity: number; unitPrice: number; total: number }[];
}

const currencySymbols: { [key: string]: string } = {
  INR: '₹', USD: '$', EUR: '€', GBP: '£', AUD: 'A$', CAD: 'C$',
};

const TEMP_DRAWN_SIGNATURE_KEY = 'tempDrawnSignatureData';

export default function SignInvoicePageClient({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [useTextSignature, setUseTextSignature] = useState(false);
  const [textSignature, setTextSignature] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [signButtonText, setSignButtonText] = useState('⏸️ Complete signature and agreement');
  const [signButtonDisabled, setSignButtonDisabled] = useState(true);
  const [signButtonStyle, setSignButtonStyle] = useState<React.CSSProperties>({ cursor: 'not-allowed', opacity: '0.5' });
  const [signatureStatusText, setSignatureStatusText] = useState('Please sign above and agree to terms');
  const [signatureStatusColor, setSignatureStatusColor] = useState('hsl(var(--muted-foreground))');

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
          const data = docSnap.data() as InvoiceData;
          if (data.status === 'signed') {
            setError('This invoice has already been signed.');
            toast({ variant: "destructive", title: "Already Signed", description: "This invoice cannot be signed again." });
          }
          setInvoiceData(data);
          if (data.recipientName) {
            setTextSignature(data.recipientName);
          }
        } else {
          setError("Invoice not found.");
        }
      } catch (e) {
        setError("Failed to load invoice.");
        console.error("Error fetching invoice for signing:", e);
      }
    };
    fetchInvoice();
  }, [invoiceId]);

  const handleSignatureDataChange = useCallback((dataUrl: string | null) => {
    setSignatureDataUrl(dataUrl);
  }, []);

  const toggleAgreement = useCallback((e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAgreementChecked(prev => !prev);
  }, []);

  useEffect(() => {
    const isDrawSignatureMeaningful = !!signatureDataUrl;
    const isTextSignatureProvided = useTextSignature && textSignature.trim() !== '';
    const hasSignature = isDrawSignatureMeaningful || isTextSignatureProvided;

    if (hasSignature && agreementChecked) {
      setSignButtonText('✅ Sign Invoice Now');
      setSignButtonDisabled(false);
      setSignButtonStyle({ backgroundColor: 'hsl(var(--accent))', cursor: 'pointer', opacity: '1' });
      setSignatureStatusText('✓ Ready to sign!');
      setSignatureStatusColor('hsl(var(--accent))');
    } else if (hasSignature && !agreementChecked) {
      setSignButtonText('📋 Please agree to terms below');
      setSignButtonDisabled(true);
      setSignButtonStyle({ backgroundColor: 'hsl(var(--destructive))', cursor: 'not-allowed', opacity: '0.7' });
      setSignatureStatusText('⚠️ Please check the agreement box');
      setSignatureStatusColor('hsl(var(--destructive))');
    } else {
      setSignButtonText('⏸️ Complete signature and agreement');
      setSignButtonDisabled(true);
      setSignButtonStyle({ backgroundColor: 'hsl(var(--muted-foreground))', cursor: 'not-allowed', opacity: '0.5' });
      setSignatureStatusText('Please sign above and agree to terms');
      setSignatureStatusColor('hsl(var(--muted-foreground))');
    }
  }, [signatureDataUrl, textSignature, useTextSignature, agreementChecked]);

  const handleSign = async () => {
    const hasValidSignature = (useTextSignature && textSignature.trim()) || (!useTextSignature && signatureDataUrl);
    if (!agreementChecked) {
      toast({ variant: "destructive", title: "Agreement Required", description: "Please agree to the terms." });
      return;
    }
    if (!hasValidSignature) {
      toast({ variant: "destructive", title: "Signature Required", description: "Please provide a signature." });
      return;
    }

    setIsLoading(true);
    toast({ title: "Processing Signature...", description: "Please wait a moment." });

    try {
      const signaturePayload = {
        signatureType: useTextSignature ? 'text' : 'draw',
        signatureData: useTextSignature ? textSignature.trim() : signatureDataUrl,
        signedAt: new Date().toISOString(),
        signedUserAgent: navigator.userAgent,
        status: 'signed'
      };

      const invoiceRef = doc(db, 'invoices', invoiceId);
      await updateDoc(invoiceRef, signaturePayload as any);

      // Temporary storage for drawn signature to pass to next page, as it can be too long for URL
      if (!useTextSignature && signatureDataUrl) {
          localStorage.setItem(TEMP_DRAWN_SIGNATURE_KEY, signatureDataUrl);
      }

      router.push(`/signing-complete/${invoiceId}`);
    } catch (error) {
      console.error("Error signing invoice:", error);
      toast({ variant: "destructive", title: "Signing Failed", description: "Could not save the signature." });
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-4">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Cannot Sign Invoice</h1>
        <p className="text-muted-foreground mb-6">{error}</p>
      </div>
    );
  }

  if (!invoiceData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading invoice...</p>
      </div>
    );
  }

  const currencySymbol = currencySymbols[invoiceData.currency] || invoiceData.currency;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-0 animate-fadeIn">
      <Card className="bg-card shadow-sm rounded-xl overflow-hidden border border-border">
        <CardHeader className="bg-primary/5 p-6 border-b border-primary/10">
          <div className="flex items-center justify-center space-x-3">
            <FileText className="w-10 h-10 text-primary" />
            <div>
              <CardTitle className="text-2xl md:text-3xl font-headline text-primary">Invoice for Signing</CardTitle>
              <CardDescription className="text-muted-foreground font-body">Please review the details carefully.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-6 font-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-6 text-sm">
            <div>
              <h3 className="font-semibold text-foreground mb-2 flex items-center"><Building size={16} className="mr-2 text-muted-foreground" />FROM:</h3>
              <p className="text-foreground font-medium">{invoiceData.senderName}</p>
              <p className="text-muted-foreground">{invoiceData.senderEmail}</p>
              {invoiceData.senderAddress && <p className="text-muted-foreground text-xs mt-1">{invoiceData.senderAddress}</p>}
            </div>
            <div className="md:text-left md:pl-0">
              <h3 className="font-semibold text-foreground mb-2 flex items-center"><UserCircle size={16} className="mr-2 text-muted-foreground" />TO:</h3>
              <p className="text-foreground font-medium">{invoiceData.recipientName}</p>
              <p className="text-muted-foreground">{invoiceData.recipientEmail}</p>
            </div>
          </div>
          <Separator />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
                <span className="font-semibold text-foreground">Invoice Number:</span>
                <span className="text-muted-foreground">{invoiceData.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
                <span className="font-semibold text-foreground">Invoice Date:</span>
                <span className="text-muted-foreground">{format(new Date(invoiceData.invoiceDate), 'PPP')}</span>
            </div>
          </div>
          <Separator />
          <div>
            <h3 className="font-semibold text-foreground mb-2">Description:</h3>
            <p className="text-muted-foreground whitespace-pre-wrap p-3 bg-background rounded-md text-sm border border-border">{invoiceData.invoiceDescription}</p>
          </div>
          <Separator className="my-6" />
          <div className="text-right space-y-1 bg-accent/5 p-4 rounded-lg border border-accent/20">
            <p className="text-foreground text-xl font-medium">Total Amount Due:</p>
            <p className="text-accent font-bold text-3xl md:text-4xl font-headline">
              {currencySymbol}{invoiceData.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-muted-foreground text-xs">({invoiceData.currency})</p>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-8 bg-card shadow-sm rounded-xl overflow-hidden border border-border signature-section">
        <CardHeader className="bg-purple-accent/5 p-6 border-b border-purple-accent/10">
          <CardTitle className="text-2xl font-modern-sans text-purple-accent text-center">Please Review and Sign Below</CardTitle>
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-4 font-body">
          <div className="flex items-center space-x-2 mb-4">
            <Button 
              variant={!useTextSignature ? "default" : "outline"} 
              onClick={() => { setUseTextSignature(false); setSignatureDataUrl(null); }}
              className={`flex-1 min-h-[44px] ${!useTextSignature ? "bg-primary hover:bg-primary/90 text-primary-foreground" : "border-primary text-primary hover:bg-primary/10"} active:scale-95 transition-all`}
            >
              <Edit className="mr-2 h-4 w-4" /> Draw Signature
            </Button>
            <Button 
              variant={useTextSignature ? "default" : "outline"} 
              onClick={() => setUseTextSignature(true)}
              className={`flex-1 min-h-[44px] ${useTextSignature ? "bg-primary hover:bg-primary/90 text-primary-foreground" : "border-primary text-primary hover:bg-primary/10"} active:scale-95 transition-all`}
            >
              <Edit className="mr-2 h-4 w-4" /> Type Signature
            </Button>
          </div>

          {useTextSignature ? (
            <div>
              <Label htmlFor="textSignature" className="text-foreground font-semibold">Type your full name:</Label>
              <Input 
                id="textSignature"
                placeholder="Your Full Legal Name"
                value={textSignature}
                onChange={(e) => setTextSignature(e.target.value)}
                className="mt-1 border-primary focus:ring-primary focus:ring-2 text-xl p-4 rounded-lg input-focus-glow min-h-[56px]"
                style={{ fontFamily: 'cursive', fontSize: '1.5rem' }}
              />
              {textSignature && <p className="mt-2 text-sm text-muted-foreground">Preview: <span className="font-medium" style={{ fontFamily: 'cursive', fontSize: '1.2rem' }}>{textSignature}</span></p>}
            </div>
          ) : (
            <div className="signature-container my-5">
                <SignaturePadComponent onSignatureChange={handleSignatureDataChange} />
            </div>
          )}
          
          <div id="signature-status" className="signature-status text-center my-2 text-sm font-medium" style={{ color: signatureStatusColor }}>
            {signatureStatusText}
          </div>
          
          <div className="agreement-section" onClick={toggleAgreement} style={{ cursor: 'pointer' }}>
            <div className="checkbox-container flex items-center space-x-3 p-3 rounded-md hover:bg-muted transition-colors border border-transparent hover:border-border">
              <div 
                id="custom-checkbox" 
                role="checkbox"
                aria-checked={agreementChecked}
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') toggleAgreement(e);}}
                className={`w-5 h-5 border-2 rounded-sm flex items-center justify-center text-white focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 transition-all ${agreementChecked ? 'bg-primary border-primary' : 'bg-card border-primary/50'}`}
              >
                {agreementChecked && <Check className="w-3.5 h-3.5" />}
              </div>
              <Label htmlFor="custom-checkbox" className="text-sm text-muted-foreground leading-relaxed select-none cursor-pointer">
                I, <span className="font-semibold text-foreground">{invoiceData.recipientName}</span>, agree that my electronic signature is the legal equivalent of my manual signature on this invoice and that I have reviewed and agree to its terms.
              </Label>
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-6 bg-background border-t border-border">
          <Button 
            type="button"
            id="sign-invoice-button"
            onClick={handleSign} 
            disabled={isLoading || signButtonDisabled}
            className="w-full text-lg py-3 min-h-[50px] font-semibold rounded-xl shadow-md transition-all duration-300 active:scale-95"
            style={isLoading ? { cursor: 'wait', opacity: '0.7' } : signButtonStyle}
          >
            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : signButtonText.startsWith('✅') && <Check className="mr-2 h-5 w-5" />}
            {isLoading ? 'Processing Signature...' : signButtonText}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

    