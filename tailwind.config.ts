import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/slices/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ['var(--font-montserrat)'],
        display: ['var(--font-poppins)']
      },
      colors: {
        primary: '#163945',
        surface: '#F1F1F1',
        accent: '#52818A',
        contrast: '#163945'
      },
      fontSize: {
        xs: '0.625rem',
        sm: '0.75rem',
        base: '0.875rem',
        lg: '1rem',
        xl: '1.25rem',
        '2xl': '1.75rem'
      },
      dropShadow: {
        md: '0px 4px 4px 0px #52818A40'
      }
    }
  },
  plugins: []
};
export default config;
