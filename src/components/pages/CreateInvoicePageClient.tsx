
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
import { Calendar as CalendarIcon, User, Mail, MapPin, Phone, Hash, DollarSign, Edit3, Eye, Sparkles, AlertTriangle, Check, Info, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { suggestInvoiceItems, type SuggestInvoiceItemsInput } from '@/ai/flows/suggest-invoice-items';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import SignIn from '@/components/auth/SignIn';
import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

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
    (val) => parseFloat(String(val).replace(/[^0-9.]+/g, "")),
    z.number({invalid_type_error: "Amount must be a number."}).positive('Amount must be positive.')
  ),
  invoiceDate: z.date({ required_error: "Invoice date is required." }),
  invoiceNumber: z.string().min(1, 'Invoice number is required.'),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

const currencyOptions = [
  { value: 'INR', label: '₹ INR (Indian Rupee)' },
  { value: 'USD', label: '$ USD (US Dollar)' },
  { value: 'EUR', label: '€ EUR (Euro)' },
  { value: 'GBP', label: '£ GBP (British Pound)' },
  { value: 'AUD', label: 'A$ AUD (Australian Dollar)' },
  { value: 'CAD', label: 'C$ CAD (Canadian Dollar)' },
];

export default function CreateInvoicePageClient() {
  const { user } = useAuth();
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [currentInvoiceNumber, setCurrentInvoiceNumber] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedCurrencySymbol, setSelectedCurrencySymbol] = useState('₹');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previousInvoiceItems, setPreviousInvoiceItems] = useState<string[]>([]);

  const { register, handleSubmit, control, formState: { errors, touchedFields, dirtyFields }, watch, setValue, getValues } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoiceDate: new Date(),
      currency: 'INR',
      amount: undefined,
      invoiceNumber: '',
    }
  });

  const currentDescription = watch('invoiceDescription');
  const watchedFields = watch();

  useEffect(() => {
    if (user) {
      if (!getValues('senderName')) setValue('senderName', user.displayName || '', { shouldDirty: true });
      if (!getValues('senderEmail')) setValue('senderEmail', user.email || '', { shouldDirty: true });
    }
  }, [user, setValue, getValues]);

  useEffect(() => {
    if (!user) return;

    const fetchPreviousItems = async () => {
        try {
            const q = query(
                collection(db, 'invoices'),
                where('senderUid', '==', user.uid),
                orderBy('createdAt', 'desc'),
                limit(10) // Fetch last 10 for variety
            );
            const querySnapshot = await getDocs(q);
            const items = new Set<string>(); // Use a Set to avoid duplicates
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.invoiceDescription) {
                    items.add(data.invoiceDescription);
                }
            });
            setPreviousInvoiceItems(Array.from(items));
        } catch (error) {
            console.error("Error fetching previous invoice items:", error);
            // Don't bother user with a toast for this, it's not critical
        }
    };

    fetchPreviousItems();
  }, [user]);

  useEffect(() => {
    const totalFields = Object.keys(invoiceSchema.shape).length;
    const filledFields = Object.keys(dirtyFields).filter(key => {
      const fieldKey = key as keyof InvoiceFormData;
      if (dirtyFields[fieldKey]) {
        if (typeof watchedFields[fieldKey] === 'string') return (watchedFields[fieldKey] as string).trim() !== '';
        if (typeof watchedFields[fieldKey] === 'number') return watchedFields[fieldKey] !== undefined && !isNaN(watchedFields[fieldKey] as number);
        return !!watchedFields[fieldKey];
      }
      return false;
    }).length;
    
    const newProgress = Math.round((filledFields / totalFields) * 100);
    setProgress(newProgress > 100 ? 100 : newProgress);
  }, [watchedFields, dirtyFields, invoiceSchema.shape]);

  useEffect(() => {
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
    }, 30);
    return () => clearInterval(typeEffect);
  }, [setValue]); 

  const onSubmit: SubmitHandler<InvoiceFormData> = async (data) => {
    if (!user) {
      toast({ variant: "destructive", title: "Authentication Error", description: "You must be signed in to create an invoice." });
      return;
    }
    setIsSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, "invoices"), {
        ...data,
        invoiceDate: data.invoiceDate.toISOString(), // Store date as ISO string
        senderUid: user.uid,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      
      toast({ variant: "success", title: "Invoice Saved", description: "Your invoice has been saved. Proceeding to preview." });
      router.push(`/preview-invoice/${docRef.id}`);

    } catch (error) {
      console.error("Error creating invoice:", error);
      toast({ variant: "destructive", title: "Save Failed", description: "Could not save the invoice to the database." });
      setIsSubmitting(false);
    }
  };

  const handleSuggestDescription = async () => {
    if (!currentDescription && previousInvoiceItems.length === 0) {
      toast({ variant: "destructive", title: "Cannot suggest", description: "Please type something or have previous items for suggestions." });
      return;
    }
    setIsSuggesting(true);
    setSuggestions([]);
    try {
      const input: SuggestInvoiceItemsInput = {
        previousEntries: previousInvoiceItems,
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
    if (errors[fieldName]) return 'border-destructive focus:border-destructive ring-destructive';
    if (touchedFields[fieldName] && !errors[fieldName]) return 'border-accent focus:border-accent ring-accent';
    return 'border-input focus:border-primary ring-primary';
  };

  if (!user) {
    return <SignIn />;
  }

  return (
    <div className="max-w-4xl mx-auto py-8 animate-fadeIn">
      <div className="mb-8">
        <div className="flex justify-between items-end mb-1">
          <p className="text-sm font-medium text-primary font-body">Step 1 of 3: Create Invoice</p>
          <p className="text-sm font-medium text-primary font-body">{progress}% Complete</p>
        </div>
        <Progress value={progress} className="w-full h-2 [&>div]:bg-primary transition-all duration-300" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <Card className="bg-invoice-your-details shadow-sm rounded-xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-2xl font-modern-sans text-foreground">Your Details</CardTitle>
            <CardDescription className="font-body text-muted-foreground">Tell us who is sending this invoice.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {[
              { id: 'senderName', label: 'Your Name', type: 'text', icon: User, required: true },
              { id: 'senderEmail', label: 'Your Email', type: 'email', icon: Mail, required: true },
              { id: 'senderAddress', label: 'Your Address (Optional)', type: 'text', icon: MapPin },
              { id: 'senderPhone', label: 'Your Phone (Optional)', type: 'tel', icon: Phone },
            ].map(field => (
              <div key={field.id} className="space-y-1.5 relative">
                <Label htmlFor={field.id} className="flex items-center text-foreground font-body text-sm">
                  <field.icon className="w-4 h-4 mr-2 text-primary" />
                  {field.label} {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                <Input
                  id={field.id}
                  type={field.type}
                  {...register(field.id as keyof InvoiceFormData)}
                  className={`bg-card input-focus-glow font-body ${checkFieldCompletion(field.id as keyof InvoiceFormData)}`}
                  aria-invalid={errors[field.id as keyof InvoiceFormData] ? "true" : "false"}
                  placeholder={field.type === 'email' ? 'you@example.com' : field.type === 'tel' ? '+1 234 567 8900' : `Enter ${field.label.toLowerCase()}`}
                />
                 {touchedFields[field.id as keyof InvoiceFormData] && !errors[field.id as keyof InvoiceFormData] && field.required && (
                  <Check className="absolute right-3 top-9 w-5 h-5 text-accent animate-fadeIn" style={{animationDuration: '0.2s'}}/>
                )}
                {errors[field.id as keyof InvoiceFormData] && (
                  <p className="text-xs text-destructive flex items-center font-body animate-gentleShake"><AlertTriangle size={12} className="mr-1" />{errors[field.id as keyof InvoiceFormData]?.message as string}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Separator className="my-6 border-dashed border-border/50" />

        <Card className="bg-invoice-recipient-details shadow-sm rounded-xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-2xl font-modern-sans text-foreground">Recipient Details</CardTitle>
             <CardDescription className="font-body text-muted-foreground">Who is this invoice for?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {[
              { id: 'recipientName', label: 'Recipient Name', type: 'text', icon: User, required: true },
              { id: 'recipientEmail', label: 'Recipient Email', type: 'email', icon: Mail, required: true },
            ].map(field => (
               <div key={field.id} className="space-y-1.5 relative">
                <Label htmlFor={field.id} className="flex items-center text-foreground font-body text-sm">
                  <field.icon className="w-4 h-4 mr-2 text-accent" />
                  {field.label} {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                <Input
                  id={field.id}
                  type={field.type}
                  {...register(field.id as keyof InvoiceFormData)}
                  className={`bg-card input-focus-glow font-body ${checkFieldCompletion(field.id as keyof InvoiceFormData)}`}
                  aria-invalid={errors[field.id as keyof InvoiceFormData] ? "true" : "false"}
                  placeholder={field.type === 'email' ? 'recipient@example.com' : `Enter ${field.label.toLowerCase()}`}
                />
                {touchedFields[field.id as keyof InvoiceFormData] && !errors[field.id as keyof InvoiceFormData] && field.required && (
                  <Check className="absolute right-3 top-9 w-5 h-5 text-accent animate-fadeIn" style={{animationDuration: '0.2s'}}/>
                )}
                {errors[field.id as keyof InvoiceFormData] && (
                  <p className="text-xs text-destructive flex items-center font-body animate-gentleShake"><AlertTriangle size={12} className="mr-1" />{errors[field.id as keyof InvoiceFormData]?.message as string}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
        
        <Separator className="my-6 border-dashed border-border/50" />

        <Card className="bg-invoice-info shadow-sm rounded-xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-2xl font-modern-sans text-foreground">Invoice Information</CardTitle>
            <CardDescription className="font-body text-muted-foreground">Details about the service or product.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="relative">
              <Label htmlFor="invoiceDescription" className="flex items-center text-foreground font-body text-sm">
                <Edit3 className="w-4 h-4 mr-2 text-purple-accent" />
                What is this for? <span className="text-destructive ml-1">*</span>
              </Label>
              <Textarea
                id="invoiceDescription"
                {...register('invoiceDescription')}
                className={`min-h-[100px] bg-card input-focus-glow transition-all duration-300 ease-in-out focus:min-h-[150px] font-body ${checkFieldCompletion('invoiceDescription')}`}
                aria-invalid={errors.invoiceDescription ? "true" : "false"}
                placeholder="e.g., Web development services, Monthly consulting fee"
              />
              {touchedFields.invoiceDescription && !errors.invoiceDescription && (
                <Check className="absolute right-3 top-[calc(1.25rem+8px)] w-5 h-5 text-accent animate-fadeIn" style={{animationDuration: '0.2s'}}/>
              )}
              {errors.invoiceDescription && (
                <p className="text-xs text-destructive flex items-center font-body animate-gentleShake"><AlertTriangle size={12} className="mr-1" />{errors.invoiceDescription.message}</p>
              )}
              <Button type="button" variant="outline" size="sm" onClick={handleSuggestDescription} disabled={isSuggesting} className="mt-2 font-body active:scale-95 text-purple-accent border-purple-accent/50 hover:bg-purple-accent/10 min-h-[36px]">
                <Sparkles className="w-4 h-4 mr-2" /> {isSuggesting ? 'Suggesting...' : 'Suggest Description (AI)'}
              </Button>
              {suggestions.length > 0 && (
                <div className="mt-2 space-y-1 border border-purple-accent/20 rounded-md p-2 bg-card/50">
                  <p className="text-xs text-purple-accent font-semibold mb-1">Suggestions:</p>
                  {suggestions.map((s, i) => (
                    <Button key={i} type="button" variant="ghost" size="sm" className="w-full justify-start text-left font-body active:scale-95 hover:bg-purple-accent/10 text-foreground text-xs h-auto py-1.5 px-2" onClick={() => setValue('invoiceDescription', s, { shouldDirty: true, shouldValidate: true })}>
                      {s}
                    </Button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="currency" className="flex items-center text-foreground font-body text-sm">
                        <DollarSign className="w-4 h-4 mr-2 text-purple-accent" />
                        Currency <span className="text-destructive ml-1">*</span>
                    </Label>
                    <Controller
                        name="currency"
                        control={control}
                        render={({ field }) => (
                        <Select onValueChange={(value) => { field.onChange(value); handleCurrencyChange(value); }} defaultValue={field.value}>
                            <SelectTrigger className={`bg-card input-focus-glow font-body ${checkFieldCompletion('currency')}`}>
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
                    {errors.currency && <p className="text-xs text-destructive flex items-center font-body animate-gentleShake"><AlertTriangle size={12} className="mr-1" />{errors.currency.message as string}</p>}
                </div>

                <div className="relative">
                    <Label htmlFor="amount" className="flex items-center text-foreground font-body text-sm">
                        <DollarSign className="w-4 h-4 mr-2 text-purple-accent" />
                        Amount <span className="text-destructive ml-1">*</span>
                    </Label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground font-body pointer-events-none">{selectedCurrencySymbol}</span>
                        <Input
                        id="amount"
                        type="text"
                        {...register('amount')}
                        className={`pl-7 bg-card input-focus-glow font-body ${checkFieldCompletion('amount')}`}
                        aria-invalid={errors.amount ? "true" : "false"}
                        placeholder="e.g., 1500.00"
                        onInput={(e) => {
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
                        <Check className="absolute right-3 top-9 w-5 h-5 text-accent animate-fadeIn" style={{animationDuration: '0.2s'}}/>
                    )}
                    {errors.amount && <p className="text-xs text-destructive flex items-center font-body animate-gentleShake"><AlertTriangle size={12} className="mr-1" />{errors.amount.message as string}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="invoiceDate" className="flex items-center text-foreground font-body text-sm">
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
                          className={`w-full justify-start text-left font-normal bg-card hover:bg-muted ${!field.value && "text-muted-foreground"} input-focus-glow font-body active:scale-95 min-h-[40px] ${checkFieldCompletion('invoiceDate')}`}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-card" align="start">
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
                {errors.invoiceDate && <p className="text-xs text-destructive flex items-center font-body animate-gentleShake"><AlertTriangle size={12} className="mr-1" />{errors.invoiceDate.message as string}</p>}
              </div>
              <div className="relative">
                <Label htmlFor="invoiceNumberDisplay" className="flex items-center text-foreground font-body text-sm">
                  <Hash className="w-4 h-4 mr-2 text-purple-accent" />
                  Invoice Number
                </Label>
                <div 
                    id="invoiceNumberDisplay" 
                    className="h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm font-body cursor-not-allowed flex items-center overflow-hidden whitespace-nowrap"
                    style={{"--typewriter-chars": `${currentInvoiceNumber.length}ch`, "--typewriter-steps": `${currentInvoiceNumber.length || 1}`} as React.CSSProperties}
                >
                    {currentInvoiceNumber.length > 0 ? <span className="animate-typewriter border-r-foreground">{currentInvoiceNumber}</span> : <span className="text-muted-foreground">Generating...</span>}
                </div>
                <input type="hidden" {...register('invoiceNumber')} />
                 {touchedFields.invoiceNumber && !errors.invoiceNumber && currentInvoiceNumber && (
                  <Check className="absolute right-3 top-9 w-5 h-5 text-accent animate-fadeIn" style={{animationDuration: '0.2s'}}/>
                )}
                {errors.invoiceNumber && <p className="text-xs text-destructive flex items-center font-body animate-gentleShake"><AlertTriangle size={12} className="mr-1" />{errors.invoiceNumber.message as string}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full text-lg py-3 min-h-[48px] bg-primary text-primary-foreground font-semibold rounded-xl shadow-md transform hover:-translate-y-1 transition-all duration-300 active:scale-95"
        >
          {isSubmitting ? <Loader2 className="mr-2 w-5 h-5 animate-spin" /> : <Eye className="mr-2 w-5 h-5" />}
          {isSubmitting ? 'Saving...' : 'Save & Preview Invoice'}
        </Button>
      </form>
    </div>
  );
}
