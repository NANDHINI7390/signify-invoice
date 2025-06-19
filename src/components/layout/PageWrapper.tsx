'use client';
import { useEffect, useState, type ReactNode } from 'react';

export default function PageWrapper({ children }: { children: ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Ensure the animation runs after the component is mounted on the client
    const timeoutId = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div className={`flex-grow container mx-auto px-4 py-8 ${isMounted ? 'animate-fadeIn' : 'opacity-0'}`}>
      {children}
    </div>
  );
}
