
'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, FileText, Send, ShieldCheck, Zap, TrendingUp, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import InvoiceList from '@/components/invoice/InvoiceList';

const StepCard = ({ number, title, description, delay, icon: Icon }: { number: number; title: string; description: string; delay: string; icon: React.ElementType }) => (
  <Card 
    className="bg-card-white/80 backdrop-blur-md shadow-card-shadow p-6 text-center transform transition-all duration-300 hover:scale-105 group animate-fadeIn"
    style={{ animationDelay: delay }}
  >
    <div className="flex flex-col items-center mb-4">
      <div className="bg-primary-blue-DEFAULT text-white rounded-full w-12 h-12 flex items-center justify-center text-2xl font-bold shadow-lg mb-3 transition-transform duration-300 group-hover:scale-110">
        {number}
      </div>
      <Icon className="text-primary-blue-DEFAULT mb-2 transition-transform duration-300 group-hover:rotate-12" size={36} />
      <h3 className="text-xl font-modern-sans text-text-dark mb-1">{title}</h3>
    </div>
    <p className="text-text-light text-sm font-body">{description}</p>
    {number < 3 && <ArrowRight className="mx-auto mt-4 text-primary-blue-DEFAULT transition-transform duration-300 group-hover:translate-x-1" size={24} />}
  </Card>
);

const TrustIndicator = ({ icon: Icon, text, delay }: { icon: React.ElementType; text: string; delay: string }) => (
  <div 
    className="flex flex-col items-center space-y-2 animate-fadeIn"
    style={{ animationDelay: delay }}
  >
    <div className="p-3 bg-success-green-DEFAULT/10 rounded-full">
      <Icon className="text-success-green-DEFAULT" size={32} />
    </div>
    <span className="text-sm text-text-light font-medium font-body">{text}</span>
  </div>
);

const MarketingHomePage = () => (
  <div className="flex flex-col items-center justify-center text-center overflow-x-hidden">
    {/* Hero Section */}
    <section className="w-full py-20 md:py-32 animated-gradient-blue-purple relative">
      <div className="absolute inset-0 bg-black/30"></div> {/* Overlay for better text readability */}
      <div className="container mx-auto px-4 relative z-10">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 animate-slideInUp font-headline" style={{ animationDelay: '0.1s' }}>
          Digital Invoice Signing Made Simple
        </h1>
        <p className="text-lg md:text-xl text-gray-200 mb-10 animate-slideInUp font-body" style={{ animationDelay: '0.3s' }}>
          Create professional invoices and get them signed instantly, securely, and for free.
        </p>
        <Button
          asChild
          size="lg"
          className="bg-success-green-DEFAULT hover:bg-success-green-dark text-white font-semibold py-4 px-8 rounded-xl text-lg shadow-button-hover-green transform hover:-translate-y-1 transition-all duration-300 animate-slideInUp active:scale-95 min-h-[44px]"
          style={{ animationDelay: '0.5s' }}
          aria-label="Create New Invoice"
        >
          <Link href="/create-invoice">
            Get Started Now <ArrowRight className="ml-2" />
          </Link>
        </Button>
      </div>
    </section>

    {/* How It Works Section - Animated Step Indicators */}
    <section className="py-16 md:py-24 bg-background-gray w-full">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-text-dark mb-16 text-center font-headline animate-fadeIn">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <StepCard number={1} title="Create Invoice" description="Fill in the details quickly with our intuitive form." delay="0.1s" icon={FileText} />
          <StepCard number={2} title="Send for Signature" description="Email a secure signing link directly to the recipient." delay="0.3s" icon={Send} />
          <StepCard number={3} title="Get it Signed" description="Recipient signs digitally, and both parties get a PDF copy." delay="0.5s" icon={CheckCircle} />
        </div>
      </div>
    </section>
    
    {/* Features/Illustrations Section */}
    <section className="py-16 md:py-24 bg-card-white w-full">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="animate-fadeIn" style={{animationDelay: '0.2s'}}>
            <Image src="https://placehold.co/600x400.png" alt="Professional Invoice Illustration" data-ai-hint="invoice document" width={600} height={400} className="rounded-xl shadow-card-shadow" />
          </div>
          <div className="text-left">
            <h2 className="text-3xl md:text-4xl font-bold text-text-dark mb-6 font-headline animate-fadeIn" style={{animationDelay: '0.4s'}}>
              Streamline Your Invoicing
            </h2>
            <p className="text-text-light mb-4 font-body animate-fadeIn" style={{animationDelay: '0.5s'}}>
              Signify Invoice empowers you to create, send, and manage signed invoices with unparalleled ease. Our platform is designed for speed and professionalism.
            </p>
            <ul className="space-y-3 font-body text-text-dark animate-fadeIn" style={{animationDelay: '0.6s'}}>
              <li className="flex items-center"><Zap className="text-purple-accent-DEFAULT mr-3" size={20}/> AI-Powered Suggestions</li>
              <li className="flex items-center"><TrendingUp className="text-purple-accent-DEFAULT mr-3" size={20}/> Mobile-Optimized Signing Experience</li>
              <li className="flex items-center"><ShieldCheck className="text-purple-accent-DEFAULT mr-3" size={20}/> Secure Digital Signatures</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    {/* Trust Indicators Section */}
    <section className="py-16 bg-background-gray w-full">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-text-dark mb-10 text-center font-headline animate-fadeIn">Trusted & Reliable</h2>
        <div className="flex flex-wrap justify-around items-center gap-8 md:gap-16 max-w-3xl mx-auto">
          <TrustIndicator icon={ShieldCheck} text="Secure & Encrypted" delay="0.1s" />
          <TrustIndicator icon={FileText} text="Legally Binding Option" delay="0.3s" />
          <TrustIndicator icon={Send} text="Instant Notifications" delay="0.5s" />
        </div>
      </div>
    </section>
  </div>
);

export default function HomePageClient() {
  const { user } = useAuth();

  if (!user) {
    return <MarketingHomePage />;
  }

  // If user is logged in, show the dashboard.
  return (
    <div className="max-w-5xl mx-auto text-left w-full animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold font-headline text-foreground">
          Welcome back, {user.displayName?.split(' ')[0]}!
        </h1>
        <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg shadow-sm transform hover:-translate-y-0.5 transition-all duration-300 active:scale-95">
          <Link href="/create-invoice">
            <FileText className="mr-2" /> Create New Invoice
          </Link>
        </Button>
      </div>
      <InvoiceList />
    </div>
  );
}
