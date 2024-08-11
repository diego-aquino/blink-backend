import 'express-async-errors';

import createApp from './server/app';

const HOSTNAME = process.env.HOSTNAME ?? '0.0.0.0';
const PORT = Number(process.env.PORT ?? '3000');

async function startServer() {
  const app = await createApp();

  return new Promise<void>((resolve) => {
    app.listen(PORT, HOSTNAME, () => {
      console.log(`Server is running at http://${HOSTNAME}:${PORT}`);
      resolve();
    });
  });
}

startServer();
