/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'chat-bg': {
          light: '#ffffff',
          dark: '#343541',
        },
        'sidebar': {
          light: '#f7f7f8',
          dark: '#202123',
        },
        'input-bg': {
          light: '#ffffff',
          dark: '#40414f',
        },
        'user-msg': {
          light: '#f7f7f8',
          dark: '#343541',
        },
        'assistant-msg': {
          light: '#ffffff',
          dark: '#444654',
        }
      }
    },
  },
  plugins: [],
}
