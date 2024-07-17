import express from 'express';
import path from 'path';

const HOSTNAME = process.env.HOSTNAME ?? '0.0.0.0';
const PORT = Number(process.env.PORT ?? '3000');

const app = express();

app.use(express.json());

app.get('/', (_request, response) => {
  response.send('Hello World!');
});

const rootDirectory = path.join(__dirname, '..');
const publicDirectory = path.join(rootDirectory, 'public');
app.use(express.static(publicDirectory));

app.listen(PORT, HOSTNAME, () => {
  console.log(`Server is running at http://${HOSTNAME}:${PORT}`);
});
