import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Auto-detect GitHub Pages base path in CI; use "/" locally
const isCI = process.env.GITHUB_ACTIONS === 'true'
const repoName = process.env.GITHUB_REPOSITORY?.split('/')?.[1]

export default defineConfig({
  plugins: [react()],
  base: isCI && repoName ? `/${repoName}/` : '/',
})
