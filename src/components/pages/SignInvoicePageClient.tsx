
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Edit, Check, Loader2, AlertTriangle, FileText, UserCircle, Building } from 'lucide-react';
import SignaturePadComponent from '@/components/invoice/SignaturePadComponent';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface InvoiceData {
  id?: string; 
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
  items?: { description: string; quantity: number; unitPrice: number; total: number }[];
}

const currencySymbols: { [key: string]: string } = {
  INR: '₹', USD: '$', EUR: '€', GBP: '£', AUD: 'A$', CAD: 'C$',
};

const mockInvoiceFallback: InvoiceData = {
  id: "INV-FALLBACK-001", invoiceNumber: "INV-FALLBACK-001",
  senderName: "Signify Demo Corp.", senderEmail: "billing@signifydemo.com",
  senderAddress: "123 Demo Street, Suite 400, Tech City, TC 54321",
  recipientName: "John Signee", recipientEmail: "john.signee@example.com",
  invoiceDescription: "Sample consulting services rendered for Q4, including project management and technical advisory.",
  amount: 3500.00, currency: 'USD', invoiceDate: new Date().toISOString(),
  items: [
    { description: "Project Management (10 hours)", quantity: 1, unitPrice: 1500, total: 1500 },
    { description: "Technical Advisory (5 hours)", quantity: 1, unitPrice: 1000, total: 1000 },
    { description: "Support Services", quantity: 1, unitPrice: 1000, total: 1000 },
  ]
};

const BLANK_IMAGE_DATA_URL = 'data:,';
const MIN_DATA_URL_LENGTH = 150; 
const TEMP_DRAWN_SIGNATURE_KEY = 'tempDrawnSignatureData';

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

  const [signButtonText, setSignButtonText] = useState('⏸️ Complete signature and agreement');
  const [signButtonDisabled, setSignButtonDisabled] = useState(true);
  const [signButtonStyle, setSignButtonStyle] = useState<React.CSSProperties>({ backgroundColor: '#6B7280', cursor: 'not-allowed', opacity: '0.5' });
  const [signatureStatusText, setSignatureStatusText] = useState('Please sign above and agree to terms');
  const [signatureStatusColor, setSignatureStatusColor] = useState('#6B7280');

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
        setInvoiceData(mockInvoiceFallback); 
        toast({ variant: "destructive", title: "Error", description: "Corrupted invoice data in link. Displaying sample." });
      }
    } else {
      console.warn(`No invoice data in URL for ID: ${invoiceId}. Using mock data.`);
      setInvoiceData(mockInvoiceFallback);
    }
  }, [invoiceId, searchParams]);

  const handleSignatureDataChange = useCallback((dataUrl: string | null) => {
    console.log('SignInvoicePageClient: Received signature data. URL (prefix & length):', dataUrl ? dataUrl.substring(0,50) + '...' : null, dataUrl ? dataUrl.length : 0);
    setSignatureDataUrl(dataUrl);
  }, []);
  
  const toggleAgreement = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAgreementChecked(prev => !prev);
  }, []);

  useEffect(() => {
    const isDrawSignatureMeaningful = signatureDataUrl && signatureDataUrl !== BLANK_IMAGE_DATA_URL && signatureDataUrl.length > MIN_DATA_URL_LENGTH;
    const isTextSignatureProvided = useTextSignature && textSignature.trim() !== '';
    const hasSignature = isDrawSignatureMeaningful || isTextSignatureProvided;
    
    console.log('SignInvoicePageClient useEffect: signatureDataUrl (prefix & length):', signatureDataUrl ? signatureDataUrl.substring(0,30) : 'null', 'length:', signatureDataUrl?.length);
    console.log('SignInvoicePageClient useEffect: isDrawSignatureMeaningful:', isDrawSignatureMeaningful, 'isTextSignatureProvided:', isTextSignatureProvided, 'agreementChecked:', agreementChecked);


    if (hasSignature && agreementChecked) {
      setSignButtonText('✅ Sign Invoice Now');
      setSignButtonDisabled(false);
      setSignButtonStyle({ backgroundColor: '#10B981', cursor: 'pointer', opacity: '1' });
      setSignatureStatusText('✓ Ready to sign!');
      setSignatureStatusColor('#10B981');
    } else if (hasSignature && !agreementChecked) {
      setSignButtonText('📋 Please agree to terms below');
      setSignButtonDisabled(true);
      setSignButtonStyle({ backgroundColor: '#F59E0B', cursor: 'not-allowed', opacity: '0.7' });
      setSignatureStatusText('⚠️ Please check the agreement box');
      setSignatureStatusColor('#F59E0B');
    } else if (!hasSignature && agreementChecked) {
      setSignButtonText(useTextSignature ? '✍️ Please type your signature' : '✍️ Please draw your signature above');
      setSignButtonDisabled(true);
      setSignButtonStyle({ backgroundColor: '#3B82F6', cursor: 'not-allowed', opacity: '0.7' });
      setSignatureStatusText(useTextSignature ? '✍️ Type your signature in the box above' : '✍️ Draw your signature in the box above');
      setSignatureStatusColor('#3B82F6');
    } else {
      setSignButtonText('⏸️ Complete signature and agreement');
      setSignButtonDisabled(true);
      setSignButtonStyle({ backgroundColor: '#6B7280', cursor: 'not-allowed', opacity: '0.5' });
      setSignatureStatusText('Please sign above and agree to terms');
      setSignatureStatusColor('#6B7280');
    }
  }, [signatureDataUrl, textSignature, useTextSignature, agreementChecked]);


  const handleSign = () => {
    const isDrawSignatureActuallyMeaningful = signatureDataUrl && signatureDataUrl !== BLANK_IMAGE_DATA_URL && signatureDataUrl.length > MIN_DATA_URL_LENGTH;
    const isTextSignatureProvided = useTextSignature && textSignature.trim() !== '';
    const hasValidSignature = isDrawSignatureActuallyMeaningful || isTextSignatureProvided;

    console.log('SignInvoicePageClient: handleSign called.');
    console.log('  isDrawSignatureActuallyMeaningful:', isDrawSignatureActuallyMeaningful, '(URL prefix:', signatureDataUrl ? signatureDataUrl.substring(0,30) : null, ', length:', signatureDataUrl?.length, ')');
    console.log('  isTextSignatureProvided:', isTextSignatureProvided, '(Text:', textSignature, ')');
    console.log('  agreementChecked:', agreementChecked);

    if (!agreementChecked) {
      toast({ variant: "destructive", title: "Agreement Required", description: "Please agree to the terms before signing.", duration: 3000 });
      return;
    }
    if (!hasValidSignature) {
      toast({ variant: "destructive", title: "Signature Required", description: "Please provide a valid signature.", duration: 3000 });
      return;
    }

    setIsLoading(true);
    toast({ title: "Processing Signature...", description: "Please wait a moment.", duration: 2000 });
    
    const signedAt = new Date().toISOString();
    const signedUserAgent = navigator.userAgent;
    const finalInvoiceId = invoiceData?.invoiceNumber || invoiceId;
    const signatureTypeParam = useTextSignature ? 'text' : 'draw';
    
    let signatureForUrlParam: string | null = null;
    
    if (useTextSignature) {
      signatureForUrlParam = textSignature.trim();
    } else if (isDrawSignatureActuallyMeaningful && signatureDataUrl) {
      // Store drawn signature in localStorage instead of URL param
      try {
        localStorage.setItem(TEMP_DRAWN_SIGNATURE_KEY, signatureDataUrl);
        console.log('SignInvoicePageClient: Stored drawn signature in localStorage (key:', TEMP_DRAWN_SIGNATURE_KEY, 'length:', signatureDataUrl.length, ')');
      } catch (e) {
        console.error('SignInvoicePageClient: Failed to store signature in localStorage', e);
        toast({ variant: "destructive", title: "Storage Error", description: "Could not temporarily save signature." });
        setIsLoading(false);
        return;
      }
    }
    
    console.log('SignInvoicePageClient: Preparing to navigate. Drawn signature (if any) stored in localStorage.');
    console.log('SignInvoicePageClient: signatureForUrlParam (for typed sig):', signatureForUrlParam ? signatureForUrlParam.substring(0,50) : 'null');


    setTimeout(() => {
      setIsLoading(false);
      
      let url = `/signing-complete?invoiceId=${encodeURIComponent(finalInvoiceId)}`;
      if (invoiceData) {
        const dataToPass = { ...invoiceData };
        url += `&data=${encodeURIComponent(JSON.stringify(dataToPass))}`;
      }

      if (useTextSignature && signatureForUrlParam) { 
        url += `&signature=${encodeURIComponent(signatureForUrlParam)}`;
      }
      
      url += `&signatureType=${signatureTypeParam}`;
      url += `&signedAt=${encodeURIComponent(signedAt)}`;
      url += `&signedUserAgent=${encodeURIComponent(signedUserAgent)}`;
      
      console.log('SignInvoicePageClient: Navigating to URL:', url.substring(0, 200) + '...');
      router.push(url);
    }, 1500); // Reduced timeout slightly
  };

  if (error && !invoiceData) { 
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-4">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-text-dark mb-2">Error Loading Invoice</h1>
        <p className="text-text-light mb-6">{error}</p>
      </div>
    );
  }
  
  if (!invoiceData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-text-light">Loading invoice...</p>
      </div>
    );
  }
  
  const currencySymbol = currencySymbols[invoiceData.currency] || invoiceData.currency;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-0 animate-fadeIn">
      <Card className="bg-card-white shadow-card-shadow rounded-xl overflow-hidden border border-border">
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

          {invoiceData.items && invoiceData.items.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold text-foreground mb-2">Itemized Breakdown:</h3>
                <div className="space-y-2 border border-border rounded-md p-3 bg-background/50">
                  {invoiceData.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-muted-foreground text-sm pb-1 border-b border-border/50 last:border-b-0 last:pb-0">
                      <span>{item.description} (x{item.quantity})</span>
                      <span>{currencySymbols[invoiceData.currency] || invoiceData.currency}{item.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          
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

      <Card className="mt-8 bg-card-white shadow-card-shadow rounded-xl overflow-hidden border border-border signature-section">
        <CardHeader className="bg-purple-accent-DEFAULT/5 p-6 border-b border-purple-accent-DEFAULT/10">
          <CardTitle className="text-2xl font-modern-sans text-purple-accent-DEFAULT text-center">Please Review and Sign Below</CardTitle>
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-4 font-body">
          <div className="flex items-center space-x-2 mb-4">
            <Button 
              variant={!useTextSignature ? "default" : "outline"} 
              onClick={() => setUseTextSignature(false)}
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
              <Label htmlFor="textSignature" className="text-text-dark font-semibold">Type your full name:</Label>
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
          
          <div id="signature-status" className="signature-status text-center my-2" style={{ color: signatureStatusColor }}>
            {signatureStatusText}
          </div>
          
          <div className="agreement-section" onClick={toggleAgreement} style={{ cursor: 'pointer' }}>
            <div className="checkbox-container flex items-center space-x-3">
              <div 
                id="custom-checkbox" 
                role="checkbox"
                aria-checked={agreementChecked}
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') toggleAgreement(e as any);}}
                className={`custom-checkbox w-5 h-5 border-2 rounded-sm flex items-center justify-center text-white focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 ${agreementChecked ? 'bg-primary border-primary' : 'bg-card border-primary/50'}`}
              >
                {agreementChecked && <Check className="w-3.5 h-3.5" />}
              </div>
              <input type="checkbox" id="agreement-checkbox" checked={agreementChecked} onChange={() => {}} className="sr-only" />
              <Label htmlFor="agreement-checkbox" className="text-sm text-muted-foreground leading-relaxed select-none cursor-pointer">
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
            className="w-full text-lg py-3 min-h-[50px] font-semibold rounded-xl shadow-button-hover-blue transition-all duration-300 active:scale-95"
            style={isLoading ? { backgroundColor: '#A0AEC0', cursor: 'wait', opacity: '0.7', color: 'white' } : signButtonStyle}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              signButtonText.startsWith('✅') && <Check className="mr-2 h-5 w-5" />
            )}
            {isLoading ? 'Processing Signature...' : signButtonText}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

    