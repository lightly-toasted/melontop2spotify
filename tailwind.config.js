/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      fontFamily: {
        'body': ['Noto Sans KR', 'sans-serif']
      },
      colors: {
        'text': 'rgb(236, 231, 228)',
        'background': 'rgb(24, 19, 17)',
        'primary': 'rgb(198, 180, 171)',
        'secondary': 'rgb(74, 97, 66)',
        'accent': 'rgb(129, 169, 138)',
       },              
    },
  },  
  plugins: [],
}

