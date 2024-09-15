import 'express-async-errors';

import { Express } from 'express';
import createApp from './server/app';
import environment from './config/environment';
import database from './database/client';
import { Server } from 'http';

function closeServerOnUncaughtError(server: Server) {
  for (const event of ['uncaughtException', 'unhandledRejection']) {
    process.on(event, async (error) => {
      console.error(error);
      console.warn(`Stopping accepting new connections and closing the server due to '${event}'...`);

      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });

      console.warn('Server closed.');
      process.exit(1);
    });
  }
}

async function startServer() {
  await database.initialize();

  const app = await createApp();

  await new Promise<void>((resolve) => {
    const server = app.listen(environment.PORT, environment.HOSTNAME, () => {
      console.log(`Server is running at http://${environment.HOSTNAME}:${environment.PORT}`);
      resolve();
    });

    closeServerOnUncaughtError(server);
  });
}

void startServer();
