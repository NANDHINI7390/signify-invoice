'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, CircleDot } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import AnimatedCheckmark from '@/components/animations/AnimatedCheckmark';

// Basic confetti pieces
const ConfettiPiece = ({ id, delay }: { id: number; delay: string }) => {
  const colors = ['bg-primary-blue-focus', 'bg-success-green', 'bg-purple-accent', 'bg-warning-orange'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  const randomX = Math.random() * 100; // vw
  const randomDuration = 3 + Math.random() * 2; // seconds

  return (
    <div
      key={id}
      className={`absolute w-2 h-4 ${randomColor} opacity-70 rounded-sm animate-confettiFall`}
      style={{
        left: `${randomX}vw`,
        animationDelay: delay,
        animationDuration: `${randomDuration}s`,
        top: '-20px', // Start above screen
      }}
    />
  );
};


export default function EmailSentPageClient() {
  const searchParams = useSearchParams();
  const recipientEmail = searchParams.get('recipientEmail');
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    setShowConfetti(true);
    const timer = setTimeout(() => setShowConfetti(false), 3000); // Confetti for 3 seconds
    return () => clearTimeout(timer);
  }, []);
  
  const confettiPieces = Array.from({ length: 50 }, (_, i) => i);


  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center relative overflow-hidden bg-gradient-to-br from-background to-green-50">
      {showConfetti && confettiPieces.map(id => (
        <ConfettiPiece key={id} id={id} delay={`${Math.random() * 1}s`} />
      ))}
      
      <AnimatedCheckmark className="w-24 h-24 text-success-green mb-8" />

      <h1 className="text-3xl md:text-4xl font-bold text-text-dark mb-4 animate-fadeIn font-headline" style={{animationDelay: '0.2s'}}>
        Invoice sent successfully!
      </h1>

      <Card className="bg-blue-50 border-primary-blue-focus/30 shadow-lg rounded-xl max-w-md mx-auto mb-8 animate-fadeIn" style={{animationDelay: '0.4s'}}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2 text-text-dark font-body">
            <Mail className="w-5 h-5 text-primary-blue-focus" />
            <p>We've emailed a signing link to <strong className="font-semibold">{recipientEmail || 'the recipient'}</strong>.</p>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex items-center text-text-light mb-10 animate-fadeIn font-body" style={{animationDelay: '0.6s'}}>
        <CircleDot className="w-5 h-5 text-primary mr-2 animate-ping opacity-75" style={{animationDuration: '1.5s'}} />
        <span>You'll receive an email notification when they sign.</span>
      </div>

      <Link href="/create-invoice" passHref>
        <Button
          size="lg"
          variant="outline"
          className="border-primary text-primary hover:bg-primary/10 font-semibold py-3 px-6 rounded-lg transition-all duration-300 hover:shadow-md hover:transform hover:-translate-y-0.5 animate-fadeIn active:scale-95 font-body"
          style={{animationDelay: '0.8s'}}
          aria-label="Create Another Invoice"
        >
          Create Another Invoice
        </Button>
      </Link>
    </div>
  );
}
