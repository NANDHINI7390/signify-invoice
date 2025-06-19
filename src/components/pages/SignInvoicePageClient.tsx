'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Edit, Check } from 'lucide-react';
import SignaturePadComponent from '@/components/invoice/SignaturePadComponent';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';

interface SignInvoicePageClientProps {
  invoiceId: string;
}

// Mock invoice data
const mockInvoice = {
  id: "INV-2023-001",
  senderName: "Global Corp Inc.",
  senderEmail: "billing@globalcorp.com",
  senderAddress: "123 Corporate Drive, Business City, BC 12345",
  recipientName: "Alice Wonderland",
  recipientEmail: "alice.w@example.com",
  invoiceDescription: "Consulting services for Q3 - Project Phoenix, including strategic planning, market analysis, and implementation support.",
  amount: 2500.00,
  invoiceDate: "2023-09-15",
  dueDate: "2023-10-15",
  items: [
    { description: "Strategic Planning Session (4 hours)", quantity: 1, unitPrice: 500, total: 500 },
    { description: "Market Analysis Report", quantity: 1, unitPrice: 1200, total: 1200 },
    { description: "Implementation Support (8 hours)", quantity: 1, unitPrice: 800, total: 800 },
  ]
};

export default function SignInvoicePageClient({ invoiceId }: SignInvoicePageClientProps) {
  const router = useRouter();
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [useTextSignature, setUseTextSignature] = useState(false);
  const [textSignature, setTextSignature] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    console.log("Signing invoice ID:", invoiceId);
  }, [invoiceId]);

  const handleSign = () => {
    if (!agreementChecked) {
      toast({ variant: "destructive", title: "Agreement Required", description: "Please agree to the terms before signing." });
      return;
    }
    if (!useTextSignature && !signatureDataUrl) {
      toast({ variant: "destructive", title: "Signature Required", description: "Please provide your signature." });
      return;
    }
    if (useTextSignature && !textSignature.trim()) {
      toast({ variant: "destructive", title: "Signature Required", description: "Please type your name for text signature." });
      return;
    }

    setIsLoading(true);
    toast({ title: "Processing Signature...", description: "Please wait." });
    setTimeout(() => {
      setIsLoading(false);
      router.push(`/signing-complete?invoiceId=${invoiceId}`);
    }, 2000);
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <Card className="shadow-2xl rounded-xl overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground p-6">
          <CardTitle className="text-3xl font-headline text-center">Invoice Details</CardTitle>
          <CardDescription className="text-primary-foreground/80 text-center font-body">Please review the invoice carefully before signing.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-6 bg-card font-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold text-text-dark mb-1">From:</h3>
              <p className="text-text-light">{mockInvoice.senderName}</p>
              <p className="text-text-light">{mockInvoice.senderEmail}</p>
              <p className="text-text-light">{mockInvoice.senderAddress}</p>
            </div>
            <div className="md:text-right">
              <h3 className="font-semibold text-text-dark mb-1">To:</h3>
              <p className="text-text-light">{mockInvoice.recipientName}</p>
              <p className="text-text-light">{mockInvoice.recipientEmail}</p>
            </div>
          </div>
          
          <Separator />

          <div className="space-y-2">
            <h3 className="font-semibold text-text-dark">Invoice ID: <span className="font-normal text-text-light">{mockInvoice.id}</span></h3>
            <h3 className="font-semibold text-text-dark">Date: <span className="font-normal text-text-light">{new Date(mockInvoice.invoiceDate).toLocaleDateString()}</span></h3>
          </div>
          
          <Separator />

          <div>
            <h3 className="font-semibold text-text-dark mb-2">Description:</h3>
            <p className="text-text-light whitespace-pre-wrap">{mockInvoice.invoiceDescription}</p>
          </div>

          {mockInvoice.items && mockInvoice.items.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold text-text-dark mb-2">Items:</h3>
                <div className="space-y-1">
                  {mockInvoice.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-text-light">
                      <span>{item.description} (x{item.quantity})</span>
                      <span>${item.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          
          <Separator />
          
          <div className="text-right">
            <p className="text-text-dark text-xl">Total Amount:</p>
            <p className="text-success-green font-bold text-3xl md:text-4xl font-headline">
              ${mockInvoice.amount.toFixed(2)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-8 shadow-2xl rounded-xl overflow-hidden">
        <CardHeader className="bg-accent text-accent-foreground p-6">
          <div className="animate-slideInUp">
             <CardTitle className="text-2xl font-headline text-center">Please Review and Sign Below</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-6 bg-card font-body">
          <div className="flex items-center space-x-2 mb-4">
            <Button 
              variant={useTextSignature ? "outline" : "default"} 
              onClick={() => setUseTextSignature(false)}
              className={`${!useTextSignature ? "bg-primary-blue-focus hover:bg-primary-blue-focus/90 text-white" : "border-primary text-primary hover:bg-primary/10"} active:scale-95`}
            >
              <Edit className="mr-2 h-4 w-4" /> Draw Signature
            </Button>
            <Button 
              variant={!useTextSignature ? "outline" : "default"} 
              onClick={() => setUseTextSignature(true)}
              className={`${useTextSignature ? "bg-primary-blue-focus hover:bg-primary-blue-focus/90 text-white" : "border-primary text-primary hover:bg-primary/10"} active:scale-95`}
            >
              <Edit className="mr-2 h-4 w-4" /> Type Signature
            </Button>
          </div>

          {useTextSignature ? (
            <div>
              <Label htmlFor="textSignature" className="text-text-dark font-semibold">Type your full name:</Label>
              <Input 
                id="textSignature"
                placeholder="Your Full Name"
                value={textSignature}
                onChange={(e) => setTextSignature(e.target.value)}
                className="mt-2 border-primary-blue-focus focus:ring-ring focus:ring-2 text-xl p-4 rounded-lg"
                style={{ fontFamily: 'cursive', fontSize: '1.5rem' }} 
              />
              {textSignature && <p className="mt-2 text-sm text-muted-foreground">Preview: <span style={{ fontFamily: 'cursive', fontSize: '1.2rem' }}>{textSignature}</span></p>}
            </div>
          ) : (
            <SignaturePadComponent onSignatureChange={setSignatureDataUrl} />
          )}
          
          <div className="flex items-center space-x-2 mt-6">
            <Checkbox 
              id="agreement" 
              checked={agreementChecked}
              onCheckedChange={(checked) => setAgreementChecked(checked as boolean)}
              className="data-[state=checked]:bg-primary-blue-focus data-[state=checked]:border-primary-blue-focus data-[state=checked]:text-white transition-all duration-200 w-5 h-5 rounded"
              aria-labelledby="agreement-label"
            />
            <Label htmlFor="agreement" id="agreement-label" className="text-sm text-text-light leading-normal peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
              I agree that my electronic signature is the legal equivalent of my manual signature on this invoice.
            </Label>
          </div>
        </CardContent>
        <CardFooter className="p-6 bg-card">
          <Button 
            onClick={handleSign} 
            disabled={isLoading}
            className="w-full text-lg py-3 gradient-button-blue-green text-white font-semibold rounded-lg shadow-button-hover hover:transform hover:-translate-y-0.5 transition-all duration-300 active:scale-95 min-h-[44px]"
          >
            {isLoading ? (
              <><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg> Processing...</>
            ) : (
              <><Check className="mr-2 h-5 w-5" /> Sign Invoice</>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
