import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))', // #F8FAFC Background Gray
        foreground: 'hsl(var(--foreground))', // #1F2937 Text Dark
        primary: {
          DEFAULT: 'hsl(var(--primary))', // #3B82F6 Primary Blue
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))', // #F59E0B Warning Orange
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))', // #10B981 Success Green
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))', // #FFFFFF Card White
          foreground: 'hsl(var(--card-foreground))',
        },
        // Direct color names from PRD
        'primary-blue': {
          DEFAULT: '#3B82F6',
          dark: '#2563EB', // A darker shade for gradients or hovers
        },
        'success-green': {
          DEFAULT: '#10B981',
          dark: '#059669',
        },
        'purple-accent': {
          DEFAULT: '#8B5CF6',
          dark: '#7C3AED',
        },
        'warning-orange': {
          DEFAULT: '#F59E0B',
          dark: '#D97706',
        },
        'background-gray': '#F8FAFC',
        'card-white': '#FFFFFF',
        'text-dark': '#1F2937',
        'text-light': '#6B7280',
        
        // Specific invoice card backgrounds from PRD
        'invoice-your-details-bg': '#F0F9FF',
        'invoice-recipient-details-bg': '#F0FDF4',
        'invoice-info-bg': '#FAF5FF',

        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)', // 0.5rem / 8px
        md: 'calc(var(--radius) - 2px)', // 6px
        sm: 'calc(var(--radius) - 4px)', // 4px
        xl: 'calc(var(--radius) + 4px)', // 0.75rem / 12px (as per PRD for cards)
        '2xl': 'calc(var(--radius) + 8px)', // 1rem / 16px
      },
      fontFamily: {
        headline: ['Playfair Display', 'serif'], // Kept as per existing for "premium" main titles
        body: ['PT Sans', 'sans-serif'], // Clean, readable for body and general UI text
        // For "modern sans-serif" headings within cards, we can use PT Sans Bold or specify another
        'modern-sans': ['PT Sans', 'sans-serif'], 
        code: ['monospace', 'monospace'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        gradientAnimation: {
          '0%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
          '100%': { 'background-position': '0% 50%' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        subtleBounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        gentlePulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.7' },
          '50%': { transform: 'scale(1.05)', opacity: '1' },
        },
        drawCheckmarkPath: { /* Renamed to avoid conflict with globals.css if any */
          to: { 'stroke-dashoffset': '0' },
        },
        slideInUp: {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        typewriter: {
          from: { width: '0ch' },
          to: { width: 'var(--typewriter-chars, 20ch)' }, /* Use CSS var for char count */
        },
        caretBlink: {
          '0%, 100%': { 'border-color': 'transparent' },
          '50%': { 'border-color': 'hsl(var(--foreground))' },
        },
        gentleShake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-3px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(3px)' },
        },
        confettiFall: {
          '0%': { transform: 'translateY(-20px) rotateZ(0deg)', opacity: '1'},
          '100%': { transform: 'translateY(100vh) rotateZ(720deg)', opacity: '0'},
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'gradient': 'gradientAnimation 10s ease infinite',
        'fadeIn': 'fadeIn 0.3s ease-out forwards',
        'subtleBounce': 'subtleBounce 2s ease-in-out infinite',
        'gentlePulse': 'gentlePulse 2.5s ease-in-out infinite',
        'drawCheckmark': 'drawCheckmarkPath 0.5s 0.2s ease-out forwards',
        'slideInUp': 'slideInUp 0.5s ease-out forwards',
        'typewriter': 'typewriter 2s steps(var(--typewriter-steps, 40), end) 0.5s 1 normal both, caretBlink 750ms steps(var(--typewriter-steps, 40), end) infinite normal',
        'gentleShake': 'gentleShake 0.4s ease-in-out',
        'confetti': 'confettiFall 3s linear forwards', // forwards to stop after one fall
      },
      boxShadow: {
        'subtle-lift': '0 4px 15px rgba(0, 0, 0, 0.08)',
        'button-hover-green': '0 6px 20px rgba(16, 185, 129, 0.3)', // Success Green
        'button-hover-blue': '0 6px 20px rgba(59, 130, 246, 0.3)', // Primary Blue
        'card-shadow': '0 10px 25px -5px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.03)',
      }
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
