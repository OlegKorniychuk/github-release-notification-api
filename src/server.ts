import type { Express } from 'express';

import app from './app.js';
import { scannerCron, shutdownDependencies } from './dependencies-container.js';
import type { ScannerCron } from './cron/scanner-cron.js';

const PORT = process.env.PORT || 3000;

const startServer = async (app: Express, scannerCron: ScannerCron) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log('Starting background jobs...');
    await scannerCron.startSchedule();
  }

  return app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
};

startServer(app, scannerCron)
  .then((server) => {
    const shutdown = async () => {
      console.log('Server shutting down...');

      server.close(async (err) => {
        if (err) {
          console.error('Error closing Express server:', err);
          process.exit(1);
        }

        try {
          await shutdownDependencies();
          console.log('Server stopped gracefully.');

          process.exit(0);
        } catch (dbErr) {
          console.error('Error during dependency teardown:', dbErr);
          process.exit(1);
        }
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  })
  .catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
