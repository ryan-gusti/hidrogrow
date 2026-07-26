import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { authRequired } from './auth.js';
import authRoutes from './routes/auth.js';
import installationRoutes from './routes/installations.js';
import plantRoutes from './routes/plants.js';
import batchRoutes from './routes/batches.js';
import taskRoutes from './routes/tasks.js';
import calendarRoutes from './routes/calendar.js';
import logRoutes from './routes/logs.js';
import harvestRoutes from './routes/harvests.js';
import noteRoutes from './routes/notes.js';
import reportRoutes from './routes/reports.js';
import uploadRoutes, { UPLOAD_DIR } from './routes/upload.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // Static: foto upload & hasil build klien (produksi)
  app.use('/uploads', express.static(UPLOAD_DIR));

  app.get('/api/health', (req, res) => res.json({ ok: true, app: 'HidroGrow' }));

  app.use('/api/auth', authRoutes);
  app.use('/api/installations', authRequired, installationRoutes);
  app.use('/api/plants', authRequired, plantRoutes);
  app.use('/api/batches', authRequired, batchRoutes);
  app.use('/api/tasks', authRequired, taskRoutes);
  app.use('/api/calendar', authRequired, calendarRoutes);
  app.use('/api/logs', authRequired, logRoutes);
  app.use('/api/harvests', authRequired, harvestRoutes);
  app.use('/api/notes', authRequired, noteRoutes);
  app.use('/api/reports', authRequired, reportRoutes);
  app.use('/api/upload', authRequired, uploadRoutes);

  // Sajikan client build (SPA fallback)
  const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get(/^(?!\/api|\/uploads).*/, (req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  // Error handler
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || 'Kesalahan server' });
  });

  return app;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const PORT = process.env.PORT || 3000;
  createApp().listen(PORT, () => {
    console.log(`HidroGrow server berjalan di http://localhost:${PORT}`);
  });
}
