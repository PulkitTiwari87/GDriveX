/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#0d9488', // Teal 600
                secondary: '#06b6d4', // Cyan 500
                dark: '#1F2937', // Gray 800
            }
        },
    },
    plugins: [],
}
