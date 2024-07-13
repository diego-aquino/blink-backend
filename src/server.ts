import express from 'express';
import path from 'path';

const HOSTNAME = process.env.HOSTNAME ?? '0.0.0.0';
const PORT = Number(process.env.PORT ?? '3000');

const server = express();

const rootDirectory = path.join(__dirname, '..');
const publicDirectory = path.join(rootDirectory, 'public');
server.use(express.static(publicDirectory));

server.get('/', (_request, response) => {
  response.send('Hello World!');
});

server.listen(PORT, HOSTNAME, () => {
  console.log(`Server is running at ${HOSTNAME}:${PORT}`);
});
