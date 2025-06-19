'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, User, Mail, MapPin, Phone, Hash, DollarSign, Edit3, Send, Sparkles, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { suggestInvoiceItems, type SuggestInvoiceItemsInput } from '@/ai/flows/suggest-invoice-items';
import { toast } from '@/hooks/use-toast';

const invoiceSchema = z.object({
  senderName: z.string().min(1, 'Your name is required.'),
  senderEmail: z.string().email('Invalid email address.').min(1, 'Your email is required.'),
  senderAddress: z.string().optional(),
  senderPhone: z.string().optional(),
  recipientName: z.string().min(1, 'Recipient name is required.'),
  recipientEmail: z.string().email('Invalid email address.').min(1, 'Recipient email is required.'),
  invoiceDescription: z.string().min(1, 'Description is required.'),
  amount: z.preprocess(
    (val) => parseFloat(String(val).replace(/[^0-9.-]+/g, "")),
    z.number().positive('Amount must be positive.')
  ),
  invoiceDate: z.date({ required_error: "Invoice date is required." }),
  invoiceNumber: z.string().min(1, 'Invoice number is required.'),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

// Mock previous entries for AI suggestions
const mockPreviousInvoiceItems: string[] = [
  "Web Design Services - 50 hours",
  "Consulting - Project Alpha",
  "Monthly Retainer - SEO Services",
  "Graphic Design - Logo and Branding Package",
];


export default function CreateInvoicePageClient() {
  const router = useRouter();
  const [progress, setProgress] = useState(33);
  const [currentInvoiceNumber, setCurrentInvoiceNumber] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const { register, handleSubmit, control, formState: { errors }, watch, setValue } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoiceDate: new Date(),
    }
  });

  const currentDescription = watch('invoiceDescription');

  useEffect(() => {
    // Auto-generate invoice number with typewriter effect (simplified)
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newInvoiceNumberValue = `INV-${new Date().getFullYear()}-${randomNum}`;
    
    let i = 0;
    const typeEffect = setInterval(() => {
      setCurrentInvoiceNumber(newInvoiceNumberValue.substring(0, i + 1));
      i++;
      if (i >= newInvoiceNumberValue.length) { // Changed to >= to ensure full string
        clearInterval(typeEffect);
        setValue('invoiceNumber', newInvoiceNumberValue); // Set final value for form
      }
    }, 50);
    return () => clearInterval(typeEffect);
  }, [setValue]);

  const onSubmit = (data: InvoiceFormData) => {
    console.log('Invoice Data:', data);
    setProgress(100);
    toast({ title: "Processing...", description: "Sending invoice for signature." });
    setTimeout(() => {
      router.push('/email-sent?recipientEmail=' + encodeURIComponent(data.recipientEmail));
    }, 1500);
  };

  const handleSuggestDescription = async () => {
    if (!currentDescription && mockPreviousInvoiceItems.length === 0) {
      toast({ variant: "destructive", title: "Cannot suggest", description: "Please type something or have previous items for suggestions." });
      return;
    }
    setIsSuggesting(true);
    setSuggestions([]);
    try {
      const input: SuggestInvoiceItemsInput = {
        previousEntries: mockPreviousInvoiceItems,
        currentInput: currentDescription || "",
      };
      const result = await suggestInvoiceItems(input);
      setSuggestions(result.suggestions);
      if (result.suggestions.length === 0) {
        toast({ title: "No suggestions", description: "AI couldn't find relevant suggestions for your input." });
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not fetch suggestions." });
    } finally {
      setIsSuggesting(false);
    }
  };


  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <div className="flex justify-between mb-1">
          <p className="text-sm font-medium text-primary font-body">Step 1 of 3</p>
          <p className="text-sm font-medium text-primary font-body">{progress}% Complete</p>
        </div>
        <Progress value={progress} className="w-full h-2 [&>div]:bg-primary-blue-focus" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <Card className="bg-invoice-your-details-bg shadow-lg rounded-xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-2xl font-headline text-text-dark">Your Details</CardTitle>
            <CardDescription className="font-body">Tell us who is sending this invoice.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {[
              { id: 'senderName', label: 'Your Name', type: 'text', icon: User, required: true },
              { id: 'senderEmail', label: 'Your Email', type: 'email', icon: Mail, required: true },
              { id: 'senderAddress', label: 'Your Address', type: 'text', icon: MapPin },
              { id: 'senderPhone', label: 'Your Phone', type: 'tel', icon: Phone },
            ].map(field => (
              <div key={field.id} className="space-y-2">
                <Label htmlFor={field.id} className="flex items-center text-text-dark font-body">
                  <field.icon className="w-4 h-4 mr-2 text-primary" />
                  {field.label} {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                <Input
                  id={field.id}
                  type={field.type}
                  {...register(field.id as keyof InvoiceFormData)}
                  className="bg-card focus:ring-2 focus:ring-primary-blue-focus font-body"
                  aria-invalid={errors[field.id as keyof InvoiceFormData] ? "true" : "false"}
                />
                {errors[field.id as keyof InvoiceFormData] && (
                  <p className="text-sm text-destructive flex items-center font-body"><AlertTriangle size={14} className="mr-1" />{errors[field.id as keyof InvoiceFormData]?.message as string}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="my-6 border-t-2 border-dashed border-border animate-fadeIn" style={{animationDelay: '0.2s'}}></div>

        <Card className="bg-invoice-recipient-details-bg shadow-lg rounded-xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-2xl font-headline text-text-dark">Recipient Details</CardTitle>
             <CardDescription className="font-body">Who is this invoice for?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {[
              { id: 'recipientName', label: 'Recipient Name', type: 'text', icon: User, required: true },
              { id: 'recipientEmail', label: 'Recipient Email', type: 'email', icon: Mail, required: true },
            ].map(field => (
               <div key={field.id} className="space-y-2">
                <Label htmlFor={field.id} className="flex items-center text-text-dark font-body">
                  <field.icon className="w-4 h-4 mr-2 text-accent" />
                  {field.label} {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                <Input
                  id={field.id}
                  type={field.type}
                  {...register(field.id as keyof InvoiceFormData)}
                  className="bg-card focus:ring-2 focus:ring-primary-blue-focus font-body"
                  aria-invalid={errors[field.id as keyof InvoiceFormData] ? "true" : "false"}
                />
                {errors[field.id as keyof InvoiceFormData] && (
                  <p className="text-sm text-destructive flex items-center font-body"><AlertTriangle size={14} className="mr-1" />{errors[field.id as keyof InvoiceFormData]?.message as string}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
        
        <div className="my-6 border-t-2 border-dashed border-border animate-fadeIn" style={{animationDelay: '0.4s'}}></div>

        <Card className="bg-invoice-info-bg shadow-lg rounded-xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-2xl font-headline text-text-dark">Invoice Information</CardTitle>
            <CardDescription className="font-body">Details about the service or product.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="invoiceDescription" className="flex items-center text-text-dark font-body">
                <Edit3 className="w-4 h-4 mr-2 text-purple-accent" />
                What is this for? <span className="text-destructive ml-1">*</span>
              </Label>
              <Textarea
                id="invoiceDescription"
                {...register('invoiceDescription')}
                className="min-h-[100px] bg-card focus:ring-2 focus:ring-primary-blue-focus transition-all duration-300 ease-in-out focus:min-h-[150px] font-body"
                aria-invalid={errors.invoiceDescription ? "true" : "false"}
              />
              {errors.invoiceDescription && (
                <p className="text-sm text-destructive flex items-center font-body"><AlertTriangle size={14} className="mr-1" />{errors.invoiceDescription.message}</p>
              )}
              <Button type="button" variant="outline" size="sm" onClick={handleSuggestDescription} disabled={isSuggesting} className="mt-2 font-body active:scale-95">
                <Sparkles className="w-4 h-4 mr-2" /> {isSuggesting ? 'Suggesting...' : 'Suggest Description'}
              </Button>
              {suggestions.length > 0 && (
                <div className="mt-2 space-y-1">
                  {suggestions.map((s, i) => (
                    <Button key={i} type="button" variant="ghost" size="sm" className="w-full justify-start text-left font-body active:scale-95" onClick={() => setValue('invoiceDescription', s)}>
                      {s}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="amount" className="flex items-center text-text-dark font-body">
                <DollarSign className="w-4 h-4 mr-2 text-purple-accent" />
                Amount (USD) <span className="text-destructive ml-1">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground font-body">$</span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  {...register('amount')}
                  className="pl-7 bg-card focus:ring-2 focus:ring-primary-blue-focus font-body"
                  aria-invalid={errors.amount ? "true" : "false"}
                />
              </div>
              {errors.amount && <p className="text-sm text-destructive flex items-center font-body"><AlertTriangle size={14} className="mr-1" />{errors.amount.message as string}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="invoiceDate" className="flex items-center text-text-dark font-body">
                  <CalendarIcon className="w-4 h-4 mr-2 text-purple-accent" />
                  Invoice Date <span className="text-destructive ml-1">*</span>
                </Label>
                <Controller
                  name="invoiceDate"
                  control={control}
                  render={({ field }) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={`w-full justify-start text-left font-normal bg-card hover:bg-muted ${!field.value && "text-muted-foreground"} focus:ring-2 focus:ring-primary-blue-focus font-body active:scale-95`}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-card" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => { if(date) field.onChange(date); setProgress(p => Math.max(p, 66)); }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
                {errors.invoiceDate && <p className="text-sm text-destructive flex items-center font-body"><AlertTriangle size={14} className="mr-1" />{errors.invoiceDate.message as string}</p>}
              </div>
              <div>
                <Label htmlFor="invoiceNumberDisplay" className="flex items-center text-text-dark font-body">
                  <Hash className="w-4 h-4 mr-2 text-purple-accent" />
                  Invoice Number
                </Label>
                <Input id="invoiceNumberDisplay" value={currentInvoiceNumber} readOnly className="bg-muted cursor-not-allowed font-body" />
                <input type="hidden" {...register('invoiceNumber')} value={currentInvoiceNumber} />
                {errors.invoiceNumber && <p className="text-sm text-destructive flex items-center font-body"><AlertTriangle size={14} className="mr-1" />{errors.invoiceNumber.message as string}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Button 
          type="submit" 
          className="w-full text-lg py-3 gradient-button-green-blue text-white font-semibold rounded-lg shadow-button-hover hover:transform hover:-translate-y-0.5 transition-all duration-300 active:scale-95"
        >
          Send for Signature <Send className="ml-2 w-5 h-5" />
        </Button>
      </form>
    </div>
  );
}
