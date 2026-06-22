/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        /* Extended brand palette */
        brand: {
          primary:   '#6366f1',
          secondary: '#0ea5e9',
          accent:    '#ec4899',
          emerald:   '#10b981',
          amber:     '#f59e0b',
          violet:    '#8b5cf6',
          rose:      '#f43f5e',
          cyan:      '#06b6d4',
          orange:    '#f97316',
          bg:        '#f5f6fa',
          surface:   '#ffffff',
          text:      '#0f172a',
          muted:     '#64748b',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
        'gradient-ocean':   'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
        'gradient-sunset':  'linear-gradient(135deg, #f97316 0%, #ec4899 100%)',
        'gradient-forest':  'linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)',
        'gradient-gold':    'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
        'gradient-aurora':  'linear-gradient(135deg, #6366f1 0%, #06b6d4 40%, #10b981 100%)',
        'gradient-sidebar': 'linear-gradient(180deg, #1e1b4b 0%, #312e81 40%, #1e1b4b 100%)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0, opacity: 0 },
          to:   { height: "var(--radix-accordion-content-height)", opacity: 1 },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)", opacity: 1 },
          to:   { height: 0, opacity: 0 },
        },
        "blob-spin": {
          "0%":   { transform: "translate(0, 0) scale(1) rotate(0deg)" },
          "33%":  { transform: "translate(30px, -50px) scale(1.1) rotate(120deg)" },
          "66%":  { transform: "translate(-20px, 20px) scale(0.9) rotate(240deg)" },
          "100%": { transform: "translate(0, 0) scale(1) rotate(360deg)" },
        },
        "gradient-shift": {
          "0%":   { backgroundPosition: "0% 50%" },
          "50%":  { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        "float-up": {
          from: { transform: "translateY(8px)", opacity: 0 },
          to:   { transform: "translateY(0)", opacity: 1 },
        },
        "shimmer": {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(99,102,241,0.4)" },
          "50%":      { boxShadow: "0 0 0 8px rgba(99,102,241,0)" },
        },
        "slide-in-right": {
          from: { transform: "translateX(20px)", opacity: 0 },
          to:   { transform: "translateX(0)", opacity: 1 },
        },
        "ambient-shift": {
          "0%":   { transform: "translate(0, 0) scale(1)" },
          "33%":  { transform: "translate(20px, -30px) scale(1.05)" },
          "66%":  { transform: "translate(-15px, 15px) scale(0.97)" },
          "100%": { transform: "translate(5px, -10px) scale(1.02)" },
        },
        "rainbow-slide": {
          "0%":   { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
      },
      animation: {
        "accordion-down":   "accordion-down 0.25s ease-out",
        "accordion-up":     "accordion-up 0.25s ease-out",
        "blob-spin":        "blob-spin 22s infinite alternate ease-in-out",
        "gradient-shift":   "gradient-shift 12s ease infinite",
        "float-up":         "float-up 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "shimmer":          "shimmer 1.5s infinite linear",
        "pulse-glow":       "pulse-glow 2s ease-in-out infinite",
        "slide-in-right":   "slide-in-right 0.35s ease",
        "ambient-shift":    "ambient-shift 25s ease-in-out infinite alternate",
        "rainbow-slide":    "rainbow-slide 3s linear infinite",
        "spin-slow":        "spin 8s linear infinite",
      },
      boxShadow: {
        'glow-primary': '0 0 20px rgba(99,102,241,0.35)',
        'glow-accent':  '0 0 20px rgba(236,72,153,0.35)',
        'card':         '0 1px 3px rgba(15,23,42,0.04), 0 8px 24px rgba(99,102,241,0.06)',
        'card-hover':   '0 4px 6px rgba(15,23,42,0.04), 0 20px 48px rgba(99,102,241,0.12)',
        'btn':          '0 4px 15px rgba(99,102,241,0.35)',
        'btn-hover':    '0 8px 25px rgba(99,102,241,0.45)',
        'navbar':       '0 1px 3px rgba(15,23,42,0.04), 0 8px 24px rgba(99,102,241,0.06)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}