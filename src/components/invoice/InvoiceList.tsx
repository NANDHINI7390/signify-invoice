
'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, FileText, ArrowRight, Eye, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface Invoice {
  id: string;
  recipientName: string;
  invoiceDate: string;
  amount: number;
  currency: string;
  status: 'pending' | 'signed';
  invoiceNumber: string;
  createdAt: any; // Keep any for sorting flexibility with serverTimestamp
}

const currencySymbols: { [key: string]: string } = {
  INR: '₹', USD: '$', EUR: '€', GBP: '£', AUD: 'A$', CAD: 'C$',
};

export default function InvoiceList() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    };

    const fetchInvoices = async () => {
      setIsLoading(true);
      try {
        const q = query(
          collection(db, 'invoices'),
          where('senderUid', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        const querySnapshot = await getDocs(q);
        const userInvoices: Invoice[] = [];
        querySnapshot.forEach((doc) => {
          userInvoices.push({ id: doc.id, ...doc.data() } as Invoice);
        });
        setInvoices(userInvoices);
      } catch (error) {
        console.error("Error fetching invoices: ", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoices();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Loading your invoices...</p>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <Card className="text-center py-12 bg-primary/5 border-primary/10">
        <CardHeader>
          <FileText className="mx-auto h-12 w-12 text-primary" />
          <CardTitle>No Invoices Yet</CardTitle>
          <CardDescription>You haven't created any invoices. Get started now!</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/create-invoice">Create Your First Invoice <ArrowRight className="ml-2" /></Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Your Invoices</CardTitle>
        <CardDescription>Here is a list of your most recent invoices.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.recipientName}</TableCell>
                  <TableCell>{format(new Date(invoice.invoiceDate), 'PP')}</TableCell>
                  <TableCell>{`${currencySymbols[invoice.currency] || invoice.currency}${invoice.amount.toFixed(2)}`}</TableCell>
                  <TableCell>
                    <Badge variant={invoice.status === 'signed' ? 'default' : 'secondary'} className={invoice.status === 'signed' ? 'bg-accent text-accent-foreground' : ''}>
                      {invoice.status === 'signed' ? <CheckCircle className="mr-1 h-3 w-3" /> : <Clock className="mr-1 h-3 w-3" />}
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/view-invoice/${invoice.id}`}>
                        <Eye className="mr-2 h-4 w-4" /> View
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
