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
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
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
        'success-green': '#10B981',
        'success-green-dark': '#059669',
        'primary-blue-focus': '#3B82F6',
        'purple-accent': '#8B5CF6',
        'warning-orange': '#F59E0B',
        'background-gray': '#F8FAFC',
        'text-dark': '#1F2937',
        'text-light': '#6B7280',
        'invoice-your-details-bg': '#F0F9FF', // Light blue
        'invoice-recipient-details-bg': '#F0FDF4', // Light green
        'invoice-info-bg': '#FAF5FF', // Light purple
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        'xl': 'calc(var(--radius) + 4px)', // For 12px border radius
        '2xl': 'calc(var(--radius) + 8px)',
      },
      fontFamily: {
        headline: ['Playfair Display', 'serif'],
        body: ['PT Sans', 'sans-serif'],
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
        drawCheckmark: {
          '0%': { 'stroke-dashoffset': '30' }, /* Adjust based on SVG path length */
          '100%': { 'stroke-dashoffset': '0' },
        },
        slideInUp: {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        typewriter: {
          from: { width: '0' },
          to: { width: '100%' },
        },
        gentleShake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' },
        },
        confettiFall: {
          '0%': { transform: 'translateY(-100vh) rotateZ(0deg)' },
          '100%': { transform: 'translateY(100vh) rotateZ(360deg)' },
        },
        gradientAnimation: { /* For animated gradient background */
          '0%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
          '100%': { 'background-position': '0% 50%' },
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        fadeIn: 'fadeIn 0.3s ease-out forwards',
        subtleBounce: 'subtleBounce 1.5s ease-in-out infinite',
        gentlePulse: 'gentlePulse 2s ease-in-out infinite',
        drawCheckmark: 'drawCheckmark 0.5s ease-out forwards',
        slideInUp: 'slideInUp 0.5s ease-out forwards',
        typewriter: 'typewriter 2s steps(40, end) forwards',
        gentleShake: 'gentleShake 0.5s ease-in-out',
        confettiFall: 'confettiFall 5s linear infinite',
        gradient: 'gradientAnimation 10s ease infinite', /* For animated gradient background */
      },
      boxShadow: {
        'subtle-lift': '0 4px 15px rgba(0, 0, 0, 0.1)',
        'button-hover': '0 6px 20px rgba(59, 130, 246, 0.3)', // #3B82F6 primary blue
      }
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
