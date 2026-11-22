import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/layouts/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        champagne: {
          50: '#FBF9F5',
          100: '#F6F2EB',
          200: '#ECE2D3',
          300: '#DFCFB8',
          400: '#CFB895',
          500: '#BFA073',
          600: '#A98656',
          700: '#8A6B41',
          800: '#6C5333',
          900: '#4D3B24',
        },
        charcoal: {
          50: '#F5F5F6',
          100: '#E5E6E7',
          200: '#C7C9CC',
          300: '#9EA1A7',
          400: '#6F737B',
          500: '#4F5259',
          600: '#3D3F45',
          700: '#2E3034',
          800: '#202124',
          900: '#141517',
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
