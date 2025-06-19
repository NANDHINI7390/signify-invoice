import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-card shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-headline font-bold text-primary hover:text-primary-blue-focus transition-colors">
          Signify Invoice
        </Link>
        <nav>
          {/* Navigation links can be added here if needed */}
        </nav>
      </div>
    </header>
  );
}
