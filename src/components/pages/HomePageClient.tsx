'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card'; // Removed CardContent as it's not used directly here for simple cards
import { ArrowRight, FileText, Send, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

const StepCard = ({ number, title, delay }: { number: number; title: string; delay: string }) => (
  <Card 
    className="bg-card/80 backdrop-blur-sm shadow-xl p-6 text-center transform transition-all duration-300 hover:scale-105 animate-subtleBounce"
    style={{ animationDelay: delay }}
  >
    <div className="flex items-center justify-center mb-3">
      <div className="bg-primary-blue-focus text-white rounded-full w-10 h-10 flex items-center justify-center text-xl font-bold shadow-md">
        {number}
      </div>
    </div>
    <h3 className="text-xl font-semibold text-text-dark mb-1 font-body">{title}</h3> {/* Ensure body font for consistency */}
    {number < 3 && <ArrowRight className="mx-auto mt-2 text-primary-blue-focus" size={24} />}
  </Card>
);

const TrustIndicator = ({ icon: Icon, text, delay }: { icon: React.ElementType; text: string; delay: string }) => (
  <div 
    className="flex flex-col items-center space-y-2 animate-gentlePulse"
    style={{ animationDelay: delay }}
  >
    <Icon className="text-success-green" size={36} />
    <span className="text-sm text-text-light font-medium font-body">{text}</span> {/* Ensure body font */}
  </div>
);

export default function HomePageClient() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-var(--header-height,10rem))] text-center -mt-8 sm:-mt-16"> {/* Adjust mt for header */}
      <section className="w-full py-20 md:py-32 animated-gradient-blue-purple -mx-4">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 animate-slideInUp font-headline" style={{ animationDelay: '0.1s' }}>
            Digital Invoice Signing Made Simple
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-10 animate-slideInUp font-body" style={{ animationDelay: '0.3s' }}>
            Create professional invoices and get them signed instantly
          </p>
          <Link href="/create-invoice" passHref>
            <Button
              size="lg"
              className="bg-success-green hover:bg-success-green-dark text-white font-semibold py-4 px-8 rounded-xl text-lg shadow-subtle-lift hover:transform hover:-translate-y-1 transition-all duration-300 animate-slideInUp active:scale-95"
              style={{ animationDelay: '0.5s' }}
              aria-label="Create New Invoice"
            >
              Get Started Now <ArrowRight className="ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-background w-full -mx-4">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-text-dark mb-12 text-center font-headline">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <StepCard number={1} title="Create Invoice" delay="0s" />
            <StepCard number={2} title="Send for Signature" delay="0.2s" />
            <StepCard number={3} title="Get it Signed" delay="0.4s" />
          </div>
        </div>
      </section>

      <section className="py-16 bg-background-gray w-full -mx-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-around items-center gap-8 md:gap-16 max-w-3xl mx-auto">
            <TrustIndicator icon={ShieldCheck} text="Secure & Encrypted" delay="0s" />
            <TrustIndicator icon={FileText} text="Legally Binding" delay="0.2s" />
            <TrustIndicator icon={Send} text="Instant Notifications" delay="0.4s" />
          </div>
        </div>
      </section>
    </div>
  );
}
