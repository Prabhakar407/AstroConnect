import config from '../vite.config.js'

// Local verification only. This is not the deployed Vercel routing layer.
export default {
  ...config,
  server: {
    host: '127.0.0.1', port: 5186, strictPort: true,
    proxy: { '/api': { target: 'http://127.0.0.1:18000' } },
  },
}
