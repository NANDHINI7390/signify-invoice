'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, CheckCircle, CircleDot } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import AnimatedCheckmark from '@/components/animations/AnimatedCheckmark';

// Basic confetti piece, to be styled with Tailwind in globals.css
const ConfettiPiece = ({ id, delay, duration }: { id: number; delay: string; duration: string }) => {
  const colors = ['bg-primary-blue-DEFAULT', 'bg-success-green-DEFAULT', 'bg-purple-accent-DEFAULT', 'bg-warning-orange-DEFAULT'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  const randomX = Math.random() * 100; // vw

  return (
    <div
      key={id}
      className={`absolute w-2 h-3 ${randomColor} opacity-70 rounded-sm animate-confettiFall`}
      style={{
        left: `${randomX}vw`,
        animationDelay: delay,
        animationDuration: duration,
        top: '-20px', 
      }}
    />
  );
};


export default function EmailSentPageClient() {
  const searchParams = useSearchParams();
  const recipientEmail = searchParams.get('recipientEmail');
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiPiecesData, setConfettiPiecesData] = useState<{id: number, delay: string, duration: string}[]>([]);

  useEffect(() => {
    // Generate confetti pieces once on mount
    const pieces = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        delay: `${Math.random() * 0.5}s`, // Shorter delay spread
        duration: `${2 + Math.random() * 1}s` // 2-3 second fall
    }));
    setConfettiPiecesData(pieces);
    
    setShowConfetti(true);
    // Confetti should stop based on animation duration 'forwards'
  }, []);
  

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center relative overflow-hidden bg-gradient-to-br from-card-white to-success-green-DEFAULT/10 py-10">
      {showConfetti && confettiPiecesData.map(piece => (
        <ConfettiPiece key={piece.id} id={piece.id} delay={piece.delay} duration={piece.duration} />
      ))}
      
      <div className="animate-fadeIn" style={{animationDelay: '0.2s'}}>
        <AnimatedCheckmark className="w-24 h-24 text-success-green-DEFAULT mb-6" />
      </div>

      <h1 className="text-3xl md:text-4xl font-bold text-text-dark mb-4 animate-fadeIn font-headline" style={{animationDelay: '0.5s'}}>
        <CheckCircle className="inline-block mr-2 text-success-green-DEFAULT w-8 h-8 align-bottom" /> Invoice sent successfully!
      </h1>

      <Card className="bg-primary-blue-DEFAULT/5 border-primary-blue-DEFAULT/20 shadow-lg rounded-xl max-w-md mx-auto mb-8 animate-fadeIn" style={{animationDelay: '0.8s'}}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-3 text-text-dark font-body">
            <Mail className="w-6 h-6 text-primary-blue-DEFAULT flex-shrink-0" />
            <p>We've emailed a signing link to <strong className="font-semibold text-primary-blue-DEFAULT">{recipientEmail || 'the recipient'}</strong>.</p>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex items-center text-text-light mb-10 animate-fadeIn font-body" style={{animationDelay: '1.1s'}}>
        <CircleDot className="w-5 h-5 text-primary-blue-DEFAULT mr-2 animate-ping opacity-75" style={{animationDuration: '1.5s'}} />
        <span>You'll receive an email notification when they sign.</span>
      </div>

      <Link href="/create-invoice" passHref>
        <Button
          size="lg"
          variant="outline"
          className="border-primary-blue-DEFAULT text-primary-blue-DEFAULT hover:bg-primary-blue-DEFAULT/10 font-semibold py-3 px-6 rounded-lg transition-all duration-300 hover:shadow-md transform hover:-translate-y-0.5 animate-fadeIn active:scale-95 min-h-[44px] font-body"
          style={{animationDelay: '1.4s'}}
          aria-label="Create Another Invoice"
        >
          Create Another Invoice
        </Button>
      </Link>
    </div>
  );
}
