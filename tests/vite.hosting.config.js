import config from '../vite.config.js'

// Local verification only. This is not the deployed Vercel routing layer.
export default {
  ...config,
  server: {
    host: '127.0.0.1', port: Number(process.env.ASTRO_BROWSER_PORT || 5186), strictPort: true,
    proxy: { '/api': { target: process.env.ASTRO_BROWSER_API || 'http://127.0.0.1:18000' } },
  },
}
