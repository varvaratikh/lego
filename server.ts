import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';
const isProduction = process.env.NODE_ENV === 'production';

// 1. SECURITY HARDENING
// Hide server fingerprint
app.disable('x-powered-by');

// Trust first proxy (required behind reverse proxies like Nginx, Cloudflare, Cloud Run, Heroku)
app.set('trust proxy', 1);

// Security Headers Middleware
app.use((_req: Request, res: Response, next: NextFunction) => {
  // Prevent MIME-sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Restrict unnecessary browser features
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Content Security Policy - Allows WebGL, Three.js shaders, inline styles, and data/blob textures
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self' ws: wss: https:",
      "worker-src 'self' blob:",
      "media-src 'self' data: blob:",
      "object-src 'none'",
      "base-uri 'self'",
    ].join('; ')
  );

  next();
});

// JSON body parsing with strict size limits to prevent DOS
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 2. HEALTH CHECK ENDPOINT (for Docker, Kubernetes, Cloud Run, Render, AWS)
app.get(['/health', '/api/health'], (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'LegoSim 3D',
  });
});

// 3. APPLICATION SERVING
async function startServer() {
  const distPath = path.resolve(__dirname, 'dist');
  const hasDist = fs.existsSync(distPath);

  if (isProduction || hasDist) {
    // Production static serving with caching
    app.use(
      express.static(distPath, {
        index: false,
        maxAge: '1y',
        immutable: true,
        setHeaders: (res, filePath) => {
          // Never cache index.html so updates are immediately visible
          if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          }
        },
      })
    );

    // SPA routing: return index.html for all non-static requests
    app.get('*', (_req: Request, res: Response) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Build not found. Please run "npm run build" first.');
      }
    });
  } else {
    // Development mode with dynamic Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  // Generic 500 error handler (does not leak stack trace in production)
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled server error:', err.message);
    res.status(500).json({
      error: isProduction ? 'Internal Server Error' : err.message,
    });
  });

  const server = app.listen(PORT, HOST, () => {
    console.log(`🚀 LegoSim 3D Server running in ${isProduction ? 'production' : 'development'} mode`);
    console.log(`🌐 URL: http://${HOST}:${PORT}`);
    console.log(`🩺 Health check: http://${HOST}:${PORT}/health`);
  });

  // Graceful shutdown
  const handleShutdown = (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Gracefully shutting down...`);
    server.close(() => {
      console.log('✅ Server closed. Exiting process.');
      process.exit(0);
    });
    // Force close if still hanging after 5s
    setTimeout(() => {
      console.error('⚠️ Forcing server exit after timeout.');
      process.exit(1);
    }, 5000);
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
