import express from 'express';

const server = express();

server.get('/', (_request, response) => {
  response.send('Hello World!');
});

const HOSTNAME = process.env.HOSTNAME ?? '0.0.0.0';
const PORT = Number(process.env.PORT ?? '3000');

server.listen(PORT, HOSTNAME, () => {
  console.log(`Server is running on port ${PORT}`);
});
