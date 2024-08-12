import 'express-async-errors';

import createApp from './server/app';
import environment from './config/environment';

async function startServer() {
  const app = await createApp();

  return new Promise<void>((resolve) => {
    app.listen(environment.PORT, environment.HOSTNAME, () => {
      console.log(`Server is running at http://${environment.HOSTNAME}:${environment.PORT}`);
      resolve();
    });
  });
}

startServer();
