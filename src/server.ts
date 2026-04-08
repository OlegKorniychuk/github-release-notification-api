import app from './app.js';

const server = app.listen(3000, () =>
  console.log('Server up and running at port 3000'),
);

const shutdown = async () => {
  console.log('Server shutting down...');

  server.close(async (err) => {
    if (err) {
      console.error('Error closing server:', err);
      process.exit(1);
    }
    console.log('Server stopped gracefully.');
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
