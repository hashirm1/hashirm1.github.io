import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        bio: resolve(__dirname, 'bio/index.html'),
        projects: resolve(__dirname, 'projects/index.html'),
        photos: resolve(__dirname, 'photos/index.html'),
        blog: resolve(__dirname, 'blog/index.html'),
        blogWelcome: resolve(__dirname, 'blog/posts/welcome-to-the-board/index.html'),
      },
    },
  },
})
