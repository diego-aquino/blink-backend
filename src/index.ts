import 'express-async-errors';
import app from './server/app';

const HOSTNAME = process.env.HOSTNAME ?? '0.0.0.0';
const PORT = Number(process.env.PORT ?? '3000');

app.listen(PORT, HOSTNAME, () => {
  console.log(`Server is running at http://${HOSTNAME}:${PORT}`);
});
