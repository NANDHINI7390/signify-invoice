'use client';

import { useEffect, useState } from "react";

interface AnimatedCheckmarkProps extends React.SVGProps<SVGSVGElement> {
  // No custom props needed for now, using standard SVGProps
}

export default function AnimatedCheckmark({ className, ...props }: AnimatedCheckmarkProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null; // Or a placeholder if needed before animation
  }
  
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 52 52"
      className={className}
      {...props}
    >
      <circle
        className="text-current opacity-20"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
        cx="26"
        cy="26"
        r="24"
      />
      <path
        className="text-current"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14 27l7.647 7.647L38 20"
        style={{
          strokeDasharray: 50, // Approximate path length
          strokeDashoffset: 50, // Start with path hidden
          animation: 'drawCheckmarkPath 0.5s 0.2s ease-out forwards',
        }}
      />
      <style jsx>{`
        @keyframes drawCheckmarkPath {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </svg>
  );
}
