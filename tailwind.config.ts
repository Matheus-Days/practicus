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
        xs: [
          '0.625rem',
          {
            lineHeight: '0.7625rem',
            letterSpacing: '0.025rem'
          }
        ],
        sm: [
          '0.75rem',
          {
            lineHeight: '0.9125rem',
            letterSpacing: '0.0156rem'
          }
        ],
        base: [
          '0.875rem',
          {
            lineHeight: '1.0688rem',
            letterSpacing: '0.0156rem'
          }
        ],
        lg: [
          '1rem',
          {
            lineHeight: '1.5rem',
            letterSpacing: '0.0094rem'
          }
        ],
        xl: [
          '1.25rem',
          {
            lineHeight: '1.875rem',
            letterSpacing: '0.0094rem'
          }
        ],
        '2xl': [
          '1.75rem',
          {
            lineHeight: '2.625rem',
            letterSpacing: '0.0156rem'
          }
        ]
      },
      boxShadow: {
        md: '0px 4px 4px 0px #52818A40'
      }
    }
  },
  plugins: []
};
export default config;
