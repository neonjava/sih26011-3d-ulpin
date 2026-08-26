/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cadastre: {
          950: '#070A12',
          900: '#0B0F19',
          850: '#0E1626',
          800: '#111827',
          750: '#162238',
          700: '#1F2937',
          600: '#374151',
          500: '#4B5563',
          border: 'rgba(59, 130, 246, 0.2)',
          accent: '#3B82F6',
          cyan: '#06B6D4',
          emerald: '#10B981',
          amber: '#F59E0B',
          rose: '#F43F5E',
          red: '#EF4444',
          purple: '#8B5CF6',
          gold: '#EAB308'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'Monaco', 'Courier New', 'monospace']
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-red': 'pulseRed 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scanline': 'scanline 8s linear infinite',
        'radar': 'radar 3s linear infinite',
        'float': 'float 4s ease-in-out infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 12px rgba(59, 130, 246, 0.6))' },
          '50%': { opacity: '0.6', filter: 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.2))' }
        },
        pulseRed: {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 16px rgba(239, 68, 68, 0.8))' },
          '50%': { opacity: '0.5', filter: 'drop-shadow(0 0 4px rgba(239, 68, 68, 0.2))' }
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' }
        },
        radar: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' }
        }
      },
      boxShadow: {
        'neon-blue': '0 0 20px -3px rgba(59, 130, 246, 0.45)',
        'neon-cyan': '0 0 20px -3px rgba(6, 182, 212, 0.45)',
        'neon-red': '0 0 25px -2px rgba(239, 68, 68, 0.6)',
        'neon-amber': '0 0 20px -3px rgba(245, 158, 11, 0.45)',
        'neon-green': '0 0 20px -3px rgba(16, 185, 129, 0.45)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      }
    },
  },
  plugins: [],
}
