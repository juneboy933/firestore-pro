import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist'
  },
  // This line ensures correct routing on refresh:
  server: {
    historyApiFallback: true
  }
})
