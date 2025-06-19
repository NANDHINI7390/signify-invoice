
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, User, Mail, MapPin, Phone, Hash, DollarSign, Edit3, Eye, Sparkles, AlertTriangle, Check, Info } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  currency: z.string().min(1, 'Currency is required.'),
  amount: z.preprocess(
    (val) => parseFloat(String(val).replace(/[^0-9.]+/g, "")), // Allow only numbers and one dot
    z.number({invalid_type_error: "Amount must be a number."}).positive('Amount must be positive.')
  ),
  invoiceDate: z.date({ required_error: "Invoice date is required." }),
  invoiceNumber: z.string().min(1, 'Invoice number is required.'),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

const mockPreviousInvoiceItems: string[] = [
  "Web Design Services - Full Project",
  "Consulting - Q1 Strategy",
  "Monthly Retainer - Social Media Management",
  "Graphic Design - Brand Identity Package",
];

const currencyOptions = [
  { value: 'INR', label: '₹ INR (Indian Rupee)' },
  { value: 'USD', label: '$ USD (US Dollar)' },
  { value: 'EUR', label: '€ EUR (Euro)' },
  { value: 'GBP', label: '£ GBP (British Pound)' },
  { value: 'AUD', label: 'A$ AUD (Australian Dollar)' },
  { value: 'CAD', label: 'C$ CAD (Canadian Dollar)' },
];

export default function CreateInvoicePageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0); // Start at 0, update based on fields
  const [currentInvoiceNumber, setCurrentInvoiceNumber] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  const [selectedCurrencySymbol, setSelectedCurrencySymbol] = useState('₹');


  const { register, handleSubmit, control, formState: { errors, touchedFields, dirtyFields }, watch, setValue, reset } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoiceDate: new Date(),
      currency: 'INR', // Default currency
      amount: undefined, // Explicitly undefined
      invoiceNumber: '',
    }
  });

  const currentDescription = watch('invoiceDescription');
  const watchedFields = watch(); // Watch all fields for progress calculation

  // Effect for loading edit data
  useEffect(() => {
    const editDataString = searchParams.get('editData');
    if (editDataString) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(editDataString));
        // Convert date string back to Date object
        if (parsedData.invoiceDate) {
          parsedData.invoiceDate = new Date(parsedData.invoiceDate);
        }
        reset(parsedData); // Populate form with edit data
        const selectedOpt = currencyOptions.find(opt => opt.value === parsedData.currency);
        if (selectedOpt) setSelectedCurrencySymbol(selectedOpt.label.charAt(0));

      } catch (e) {
        console.error("Failed to parse edit data:", e);
        toast({ variant: "destructive", title: "Error", description: "Could not load data for editing." });
      }
    }
  }, [searchParams, reset]);


  // Calculate progress
  useEffect(() => {
    const totalFields = Object.keys(invoiceSchema.shape).length;
    const filledFields = Object.keys(dirtyFields).filter(key => {
      const fieldKey = key as keyof InvoiceFormData;
      // Check if the field is dirty (changed by user) and not empty or default
      if (dirtyFields[fieldKey]) {
        if (typeof watchedFields[fieldKey] === 'string') return (watchedFields[fieldKey] as string).trim() !== '';
        if (typeof watchedFields[fieldKey] === 'number') return watchedFields[fieldKey] !== undefined && !isNaN(watchedFields[fieldKey] as number);
        if (watchedFields[fieldKey] instanceof Date) return true; // Date is always considered filled if dirty (default is new Date())
        return !!watchedFields[fieldKey];
      }
      return false;
    }).length;
    
    const newProgress = Math.round((filledFields / totalFields) * 100);
    setProgress(newProgress > 100 ? 100 : newProgress); // Cap at 100
  }, [watchedFields, dirtyFields, invoiceSchema.shape]);


  // Typewriter for Invoice Number
  useEffect(() => {
    if (watchedFields.invoiceNumber && searchParams.get('editData')) { // If editing, use existing number
        setCurrentInvoiceNumber(watchedFields.invoiceNumber);
        return;
    }
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newInvoiceNumberValue = `INV-${new Date().getFullYear()}-${randomNum}`;
    
    let i = 0;
    const typeEffect = setInterval(() => {
      setCurrentInvoiceNumber(newInvoiceNumberValue.substring(0, i + 1));
      i++;
      if (i >= newInvoiceNumberValue.length) {
        clearInterval(typeEffect);
        setValue('invoiceNumber', newInvoiceNumberValue, { shouldDirty: true, shouldValidate: true });
      }
    }, 30); // Faster typing
    return () => clearInterval(typeEffect);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setValue, searchParams]); 

  const onSubmit: SubmitHandler<InvoiceFormData> = (data) => {
    // Navigate to preview page with data
    const query = encodeURIComponent(JSON.stringify(data));
    router.push(`/preview-invoice?data=${query}`);
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
  
  const handleCurrencyChange = (value: string) => {
    setValue('currency', value, { shouldDirty: true });
    const option = currencyOptions.find(opt => opt.value === value);
    setSelectedCurrencySymbol(option ? option.label.charAt(0) : '');
  };

  const checkFieldCompletion = (fieldName: keyof InvoiceFormData) => {
    if (errors[fieldName]) return 'border-destructive-DEFAULT focus:border-destructive-DEFAULT ring-destructive-DEFAULT';
    if (touchedFields[fieldName] && !errors[fieldName]) return 'border-success-green-DEFAULT focus:border-success-green-DEFAULT ring-success-green-DEFAULT';
    return 'border-input focus:border-primary-blue-DEFAULT ring-primary-blue-DEFAULT';
  };

  return (
    <div className="max-w-4xl mx-auto py-8 animate-fadeIn">
      <div className="mb-8">
        <div className="flex justify-between items-end mb-1">
          <p className="text-sm font-medium text-primary-blue-DEFAULT font-body">Step 1 of 3: Create Invoice</p>
          <p className="text-sm font-medium text-primary-blue-DEFAULT font-body">{progress}% Complete</p>
        </div>
        <Progress value={progress} className="w-full h-2 [&>div]:bg-primary-blue-DEFAULT transition-all duration-300" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Your Details Card */}
        <Card className="bg-invoice-your-details-bg shadow-card-shadow rounded-xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-2xl font-modern-sans text-text-dark">Your Details</CardTitle>
            <CardDescription className="font-body text-text-light">Tell us who is sending this invoice.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {[
              { id: 'senderName', label: 'Your Name', type: 'text', icon: User, required: true },
              { id: 'senderEmail', label: 'Your Email', type: 'email', icon: Mail, required: true },
              { id: 'senderAddress', label: 'Your Address (Optional)', type: 'text', icon: MapPin },
              { id: 'senderPhone', label: 'Your Phone (Optional)', type: 'tel', icon: Phone },
            ].map(field => (
              <div key={field.id} className="space-y-1.5 relative">
                <Label htmlFor={field.id} className="flex items-center text-text-dark font-body text-sm">
                  <field.icon className="w-4 h-4 mr-2 text-primary-blue-DEFAULT" />
                  {field.label} {field.required && <span className="text-destructive-DEFAULT ml-1">*</span>}
                </Label>
                <Input
                  id={field.id}
                  type={field.type}
                  {...register(field.id as keyof InvoiceFormData)}
                  className={`bg-card-white input-focus-glow font-body ${checkFieldCompletion(field.id as keyof InvoiceFormData)}`}
                  aria-invalid={errors[field.id as keyof InvoiceFormData] ? "true" : "false"}
                  placeholder={field.type === 'email' ? 'you@example.com' : field.type === 'tel' ? '+1 234 567 8900' : `Enter ${field.label.toLowerCase()}`}
                />
                 {touchedFields[field.id as keyof InvoiceFormData] && !errors[field.id as keyof InvoiceFormData] && field.required && (
                  <Check className="absolute right-3 top-9 w-5 h-5 text-success-green-DEFAULT animate-fadeIn" style={{animationDuration: '0.2s'}}/>
                )}
                {errors[field.id as keyof InvoiceFormData] && (
                  <p className="text-xs text-destructive-DEFAULT flex items-center font-body animate-gentleShake"><AlertTriangle size={12} className="mr-1" />{errors[field.id as keyof InvoiceFormData]?.message as string}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Separator className="my-6 border-dashed border-border/50" />

        {/* Recipient Details Card */}
        <Card className="bg-invoice-recipient-details-bg shadow-card-shadow rounded-xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-2xl font-modern-sans text-text-dark">Recipient Details</CardTitle>
             <CardDescription className="font-body text-text-light">Who is this invoice for?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {[
              { id: 'recipientName', label: 'Recipient Name', type: 'text', icon: User, required: true },
              { id: 'recipientEmail', label: 'Recipient Email', type: 'email', icon: Mail, required: true },
            ].map(field => (
               <div key={field.id} className="space-y-1.5 relative">
                <Label htmlFor={field.id} className="flex items-center text-text-dark font-body text-sm">
                  <field.icon className="w-4 h-4 mr-2 text-success-green-DEFAULT" />
                  {field.label} {field.required && <span className="text-destructive-DEFAULT ml-1">*</span>}
                </Label>
                <Input
                  id={field.id}
                  type={field.type}
                  {...register(field.id as keyof InvoiceFormData)}
                  className={`bg-card-white input-focus-glow font-body ${checkFieldCompletion(field.id as keyof InvoiceFormData)}`}
                  aria-invalid={errors[field.id as keyof InvoiceFormData] ? "true" : "false"}
                  placeholder={field.type === 'email' ? 'recipient@example.com' : `Enter ${field.label.toLowerCase()}`}
                />
                {touchedFields[field.id as keyof InvoiceFormData] && !errors[field.id as keyof InvoiceFormData] && field.required && (
                  <Check className="absolute right-3 top-9 w-5 h-5 text-success-green-DEFAULT animate-fadeIn" style={{animationDuration: '0.2s'}}/>
                )}
                {errors[field.id as keyof InvoiceFormData] && (
                  <p className="text-xs text-destructive-DEFAULT flex items-center font-body animate-gentleShake"><AlertTriangle size={12} className="mr-1" />{errors[field.id as keyof InvoiceFormData]?.message as string}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
        
        <Separator className="my-6 border-dashed border-border/50" />

        {/* Invoice Information Card */}
        <Card className="bg-invoice-info-bg shadow-card-shadow rounded-xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-2xl font-modern-sans text-text-dark">Invoice Information</CardTitle>
            <CardDescription className="font-body text-text-light">Details about the service or product.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="relative">
              <Label htmlFor="invoiceDescription" className="flex items-center text-text-dark font-body text-sm">
                <Edit3 className="w-4 h-4 mr-2 text-purple-accent-DEFAULT" />
                What is this for? <span className="text-destructive-DEFAULT ml-1">*</span>
              </Label>
              <Textarea
                id="invoiceDescription"
                {...register('invoiceDescription')}
                className={`min-h-[100px] bg-card-white input-focus-glow transition-all duration-300 ease-in-out focus:min-h-[150px] font-body ${checkFieldCompletion('invoiceDescription')}`}
                aria-invalid={errors.invoiceDescription ? "true" : "false"}
                placeholder="e.g., Web development services, Monthly consulting fee"
              />
              {touchedFields.invoiceDescription && !errors.invoiceDescription && (
                <Check className="absolute right-3 top-[calc(1.25rem+8px)] w-5 h-5 text-success-green-DEFAULT animate-fadeIn" style={{animationDuration: '0.2s'}}/>
              )}
              {errors.invoiceDescription && (
                <p className="text-xs text-destructive-DEFAULT flex items-center font-body animate-gentleShake"><AlertTriangle size={12} className="mr-1" />{errors.invoiceDescription.message}</p>
              )}
              <Button type="button" variant="outline" size="sm" onClick={handleSuggestDescription} disabled={isSuggesting} className="mt-2 font-body active:scale-95 text-purple-accent-DEFAULT border-purple-accent-DEFAULT/50 hover:bg-purple-accent-DEFAULT/10 min-h-[36px]">
                <Sparkles className="w-4 h-4 mr-2" /> {isSuggesting ? 'Suggesting...' : 'Suggest Description (AI)'}
              </Button>
              {suggestions.length > 0 && (
                <div className="mt-2 space-y-1 border border-purple-accent-DEFAULT/20 rounded-md p-2 bg-card-white/50">
                  <p className="text-xs text-purple-accent-DEFAULT font-semibold mb-1">Suggestions:</p>
                  {suggestions.map((s, i) => (
                    <Button key={i} type="button" variant="ghost" size="sm" className="w-full justify-start text-left font-body active:scale-95 hover:bg-purple-accent-DEFAULT/10 text-text-dark text-xs h-auto py-1.5 px-2" onClick={() => setValue('invoiceDescription', s, { shouldDirty: true, shouldValidate: true })}>
                      {s}
                    </Button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="currency" className="flex items-center text-text-dark font-body text-sm">
                        <DollarSign className="w-4 h-4 mr-2 text-purple-accent-DEFAULT" />
                        Currency <span className="text-destructive-DEFAULT ml-1">*</span>
                    </Label>
                    <Controller
                        name="currency"
                        control={control}
                        render={({ field }) => (
                        <Select onValueChange={(value) => { field.onChange(value); handleCurrencyChange(value); }} defaultValue={field.value}>
                            <SelectTrigger className={`bg-card-white input-focus-glow font-body ${checkFieldCompletion('currency')}`}>
                                <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                            <SelectContent>
                            {currencyOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                {option.label}
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        )}
                    />
                    {errors.currency && <p className="text-xs text-destructive-DEFAULT flex items-center font-body animate-gentleShake"><AlertTriangle size={12} className="mr-1" />{errors.currency.message as string}</p>}
                </div>

                <div className="relative">
                    <Label htmlFor="amount" className="flex items-center text-text-dark font-body text-sm">
                        <DollarSign className="w-4 h-4 mr-2 text-purple-accent-DEFAULT" />
                        Amount <span className="text-destructive-DEFAULT ml-1">*</span>
                    </Label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground font-body pointer-events-none">{selectedCurrencySymbol}</span>
                        <Input
                        id="amount"
                        type="text" // Use text to better control input, Zod handles parsing
                        {...register('amount')}
                        className={`pl-7 bg-card-white input-focus-glow font-body ${checkFieldCompletion('amount')}`}
                        aria-invalid={errors.amount ? "true" : "false"}
                        placeholder="e.g., 1500.00"
                        onInput={(e) => { // Basic input formatting guidance
                            const target = e.target as HTMLInputElement;
                            let value = target.value.replace(/[^0-9.]/g, '');
                            const parts = value.split('.');
                            if (parts.length > 2) {
                                value = parts[0] + '.' + parts.slice(1).join('');
                            }
                            target.value = value;
                        }}
                        />
                    </div>
                    {touchedFields.amount && !errors.amount && (
                        <Check className="absolute right-3 top-9 w-5 h-5 text-success-green-DEFAULT animate-fadeIn" style={{animationDuration: '0.2s'}}/>
                    )}
                    {errors.amount && <p className="text-xs text-destructive-DEFAULT flex items-center font-body animate-gentleShake"><AlertTriangle size={12} className="mr-1" />{errors.amount.message as string}</p>}
                </div>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="invoiceDate" className="flex items-center text-text-dark font-body text-sm">
                  <CalendarIcon className="w-4 h-4 mr-2 text-purple-accent-DEFAULT" />
                  Invoice Date <span className="text-destructive-DEFAULT ml-1">*</span>
                </Label>
                <Controller
                  name="invoiceDate"
                  control={control}
                  render={({ field }) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={`w-full justify-start text-left font-normal bg-card-white hover:bg-muted-DEFAULT ${!field.value && "text-text-light"} input-focus-glow font-body active:scale-95 min-h-[40px] ${checkFieldCompletion('invoiceDate')}`}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-card-white" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => { if(date) field.onChange(date); setValue('invoiceDate', date, {shouldDirty: true, shouldValidate: true}); }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
                {errors.invoiceDate && <p className="text-xs text-destructive-DEFAULT flex items-center font-body animate-gentleShake"><AlertTriangle size={12} className="mr-1" />{errors.invoiceDate.message as string}</p>}
              </div>
              <div className="relative">
                <Label htmlFor="invoiceNumberDisplay" className="flex items-center text-text-dark font-body text-sm">
                  <Hash className="w-4 h-4 mr-2 text-purple-accent-DEFAULT" />
                  Invoice Number
                </Label>
                {/* Display with typewriter effect */}
                <div 
                    id="invoiceNumberDisplay" 
                    className="h-10 w-full rounded-md border border-input bg-muted-DEFAULT px-3 py-2 text-sm font-body cursor-not-allowed flex items-center overflow-hidden whitespace-nowrap"
                    style={{"--typewriter-chars": `${currentInvoiceNumber.length}ch`, "--typewriter-steps": `${currentInvoiceNumber.length || 1}`} as React.CSSProperties}
                >
                    {currentInvoiceNumber.length > 0 ? <span className="animate-typewriter border-r-text-dark">{currentInvoiceNumber}</span> : <span className="text-text-light">Generating...</span>}
                </div>
                <input type="hidden" {...register('invoiceNumber')} />
                 {touchedFields.invoiceNumber && !errors.invoiceNumber && currentInvoiceNumber && (
                  <Check className="absolute right-3 top-9 w-5 h-5 text-success-green-DEFAULT animate-fadeIn" style={{animationDuration: '0.2s'}}/>
                )}
                {errors.invoiceNumber && <p className="text-xs text-destructive-DEFAULT flex items-center font-body animate-gentleShake"><AlertTriangle size={12} className="mr-1" />{errors.invoiceNumber.message as string}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Button 
          type="submit" 
          className="w-full text-lg py-3 min-h-[48px] gradient-button-blue-primary text-white font-semibold rounded-xl shadow-button-hover-blue transform hover:-translate-y-1 transition-all duration-300 active:scale-95"
        >
          <Eye className="mr-2 w-5 h-5" /> Preview Invoice
        </Button>
      </form>
    </div>
  );
}


    