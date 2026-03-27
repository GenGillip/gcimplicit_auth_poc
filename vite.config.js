import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  server: {
    port: 3001, // Set the development server port
    strictPort: true, // Exit if the port is already in use, instead of automatically trying the next available port
  },
  plugins: [react()],
})
