/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        outfit: ['Outfit', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        sora: ['Sora', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        brand: {
          pink: '#FF4D6D',
          purple: '#6C63FF',
          gold: '#FFD166',
          ink: '#1F2937',
          mist: '#F8F9FA',
        },
      },
      boxShadow: {
        glow: '0 20px 60px rgba(108, 99, 255, 0.12)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, rgba(255,77,109,0.14), rgba(108,99,255,0.14), rgba(255,209,102,0.18))',
      },
    },
  },
  plugins: [],
};
