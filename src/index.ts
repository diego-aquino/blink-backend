import 'express-async-errors';

import createApp from './server/app';
import environment from './config/environment';
import database from './database/client';

async function startServer() {
  await database.initialize();

  const app = await createApp();

  return new Promise<void>((resolve) => {
    app.listen(environment.PORT, environment.HOSTNAME, () => {
      console.log(`Server is running at http://${environment.HOSTNAME}:${environment.PORT}`);
      resolve();
    });
  });
}

startServer();
