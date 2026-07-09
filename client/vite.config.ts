import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' keeps asset URLs relative so the build works on GitHub Pages
// under any project sub-path (https://user.github.io/<repo>/) without knowing
// the repo name at build time. Combined with the app's internal state-based
// navigation (no router), this sidesteps Pages' sub-path routing entirely.
export default defineConfig({
  plugins: [react()],
  base: './',
})
