/** @type {import('tailwindcss').Config} */
import forms from '@tailwindcss/forms';
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    fontFamily: {
      'sans': ['Solway', 'sans-serif'],
    },
    extend: {
      boxShadow: {
        'custom': '0 2px 1px rgba(0, 0, 0, 0.8)',
        'custom-dark': '0 1px 1px rgba(219, 234, 254, 0.8)'
      },
      dropShadow: {
        'custom': '0 2px 1px rgba(0, 0, 0, 0.8)',
        'custom-dark': '0 1px 1px rgba(219, 234, 254, 0.8)'
      }
    },
  },
  plugins: [
    forms,
  ],
  darkMode: 'selector'
}

