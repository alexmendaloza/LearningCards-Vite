import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Configuramos el proxy para interceptar todo lo relacionado con el backend
      '/login': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        configure: (proxy, options) => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // 1. Reescribimos redirecciones para que no salten al puerto 8000
            if (proxyRes.headers.location) {
              proxyRes.headers.location = proxyRes.headers.location.replace(/^https?:\/\/[^\/]+/, '');
            }
            // 2. IMPORTANTE: Limpiamos las cookies para que el navegador las acepte entre puertos
            if (proxyRes.headers['set-cookie']) {
              proxyRes.headers['set-cookie'] = proxyRes.headers['set-cookie'].map(cookie => 
                cookie.replace(/Domain=[^;]+;?/, '').replace(/Secure;?/, '')
              );
            }
          });
        },
      },
      '/register': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        configure: (proxy, options) => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            if (proxyRes.headers.location) {
              proxyRes.headers.location = proxyRes.headers.location.replace(/^https?:\/\/[^\/]+/, '');
            }
            if (proxyRes.headers['set-cookie']) {
              proxyRes.headers['set-cookie'] = proxyRes.headers['set-cookie'].map(cookie => 
                cookie.replace(/Domain=[^;]+;?/, '').replace(/Secure;?/, '')
              );
            }
          });
        },
      },
      '/user': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        configure: (proxy, options) => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            if (proxyRes.headers.location) {
              proxyRes.headers.location = proxyRes.headers.location.replace(/^https?:\/\/[^\/]+/, '');
            }
            if (proxyRes.headers['set-cookie']) {
              proxyRes.headers['set-cookie'] = proxyRes.headers['set-cookie'].map(cookie => 
                cookie.replace(/Domain=[^;]+;?/, '').replace(/Secure;?/, '')
              );
            }
          });
        },
      },
      '/admin': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        configure: (proxy, options) => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            if (proxyRes.headers.location) {
              proxyRes.headers.location = proxyRes.headers.location.replace(/^https?:\/\/[^\/]+/, '');
            }
            if (proxyRes.headers['set-cookie']) {
              proxyRes.headers['set-cookie'] = proxyRes.headers['set-cookie'].map(cookie => 
                cookie.replace(/Domain=[^;]+;?/, '').replace(/Secure;?/, '')
              );
            }
          });
        },
      },
      '/mazos': { target: 'http://localhost:8000', changeOrigin: true },
      '/marketplace': { target: 'http://localhost:8000', changeOrigin: true },
      '/storage': { target: 'http://localhost:8000', changeOrigin: true },
    }
  }
})
