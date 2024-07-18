import express, { ErrorRequestHandler } from 'express';
import path from 'path';
import { z, ZodError } from 'zod';

const HOSTNAME = process.env.HOSTNAME ?? '0.0.0.0';
const PORT = Number(process.env.PORT ?? '3000');

const app = express();
app.use(express.json());

const rootDirectory = path.join(__dirname, '..');
const publicDirectory = path.join(rootDirectory, 'public');
app.use(express.static(publicDirectory));

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Blink {
  id: string;
  title: string;
  url: string;
  redirectId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

const database: {
  users: User[];
  blinks: Blink[];
} = {
  users: [],
  blinks: [],
};

const userCreationSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

app.post('/users', (request, response) => {
  const { name, email } = userCreationSchema.parse(request.body);

  const userWithExistingEmail = database.users.find((user) => user.email === email);
  if (userWithExistingEmail) {
    response.status(409).json({ message: 'Email already in use' });
    return;
  }

  const user: User = {
    id: crypto.randomUUID(),
    name,
    email,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  database.users.push(user);

  response.status(201).json(user);
});

const blinkCreationSchema = z.object({
  userId: z.string().uuid(), // Temporary; will be inferred from the auth token
  title: z.string().min(1),
  url: z.string().url(),
  redirectId: z.string().min(1).optional(),
});

function randomInteger(lowerLimit: number, upperLimit: number) {
  return Math.floor(Math.random() * (upperLimit - lowerLimit)) + lowerLimit;
}

const DEFAULT_REDIRECT_ID_ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function generateRedirectId(length: number) {
  const redirectId = Array.from({ length }, () => {
    const nextCharacterIndex = randomInteger(0, DEFAULT_REDIRECT_ID_ALPHABET.length);
    const nextCharacter = DEFAULT_REDIRECT_ID_ALPHABET[nextCharacterIndex];
    return nextCharacter;
  }).join('');

  return redirectId;
}

function generateUnusedRedirectId(length: number) {
  while (true) {
    const redirectIdCandidate = generateRedirectId(length);

    const existingBlink = database.blinks.find((blink) => blink.redirectId === redirectIdCandidate);
    if (!existingBlink) {
      return redirectIdCandidate;
    }
  }
}

app.post('/blinks', (request, response) => {
  const { userId, title, url: url, redirectId } = blinkCreationSchema.parse(request.body);

  const user = database.users.find((user) => user.id === userId);
  if (!user) {
    response.status(404).json({ message: 'User not found' });
    return;
  }

  const blinkWithExistingRedirectId = database.blinks.find((blink) => blink.redirectId === redirectId);
  if (blinkWithExistingRedirectId) {
    response.status(409).json({ message: 'Redirect id is already in use' });
    return;
  }

  const blink: Blink = {
    id: crypto.randomUUID(),
    userId,
    title,
    url: url,
    redirectId: redirectId ?? generateUnusedRedirectId(6),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  database.blinks.push(blink);

  response.status(201).json(blink);
});

const BLINK_ORDER_BY = ['createdAt.desc', 'createdAt.asc', 'title.desc', 'title.asc'] as const;
type BlinkOrderBy = (typeof BLINK_ORDER_BY)[number];

function blinksComparedBy(orderBy: BlinkOrderBy) {
  return function compare(blink: Blink, otherBlink: Blink) {
    switch (orderBy) {
      case 'createdAt.asc':
        return blink.createdAt.getTime() - otherBlink.createdAt.getTime();
      case 'createdAt.desc':
        return otherBlink.createdAt.getTime() - blink.createdAt.getTime();
      case 'title.asc':
        return blink.title.localeCompare(otherBlink.title);
      case 'title.desc':
        return otherBlink.title.localeCompare(blink.title);
    }
  };
}

const listBlinksSchema = z.object({
  userId: z.string().uuid(), // Temporary; will be inferred from the auth token
  orderBy: z.enum(BLINK_ORDER_BY).optional().default('createdAt.desc'),
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().optional().default(10),
});

app.get('/blinks', (request, response) => {
  const { userId, orderBy, page, perPage } = listBlinksSchema.parse(request.query);

  const user = database.users.find((user) => user.id === userId);
  if (!user) {
    response.status(404).json({ message: 'User not found' });
    return;
  }

  const paginationFrom = (page - 1) * perPage;
  const paginationTo = page * perPage;

  const blinks = database.blinks
    .filter((blink) => blink.userId === userId)
    .sort(blinksComparedBy(orderBy))
    .slice(paginationFrom, paginationTo);

  response.status(200).json(blinks);
});

const blinkUpdateSchema = z.object({
  userId: z.string().uuid(), // Temporary; will be inferred from the auth token
  blinkId: z.string().uuid(),
  title: z.string().min(1).optional(),
  url: z.string().url().optional(),
  redirectId: z.string().min(1).optional(),
});

app.patch('/blinks/:blinkId', (request, response) => {
  const { userId, blinkId, title, url, redirectId } = blinkUpdateSchema.parse({
    ...request.params,
    ...request.body,
  });

  const user = database.users.find((user) => user.id === userId);
  if (!user) {
    response.status(404).json({ message: 'User not found' });
    return;
  }

  const blinkIndex = database.blinks.findIndex((blink) => blink.id === blinkId);
  if (blinkIndex === -1) {
    response.status(404).json({ message: 'Blink not found' });
    return;
  }

  const blink = database.blinks[blinkIndex];

  const updatedBlink: Blink = {
    ...blink,
    title: title ?? blink.title,
    url: url ?? blink.url,
    redirectId: redirectId ?? blink.redirectId,
    updatedAt: new Date(),
  };

  database.blinks[blinkIndex] = updatedBlink;

  response.status(200).json(updatedBlink);
});

const blinkDeletionSchema = z.object({
  userId: z.string().uuid(), // Temporary; will be inferred from the auth token
  blinkId: z.string().uuid(),
});

app.delete('/blinks/:blinkId', (request, response) => {
  const { userId, blinkId } = blinkDeletionSchema.parse({
    ...request.params,
    ...request.body,
  });

  const user = database.users.find((user) => user.id === userId);
  if (!user) {
    response.status(404).json({ message: 'User not found' });
    return;
  }

  const blink = database.blinks.find((blink) => blink.id === blinkId);
  if (!blink) {
    response.status(404).json({ message: 'Blink not found' });
    return;
  }

  database.blinks = database.blinks.filter((blink) => blink.id !== blinkId);

  response.status(204).end();
});

const redirectSchema = z.object({
  redirectId: z.string().min(1),
});

app.get('/:redirectId', (request, response) => {
  const { redirectId } = redirectSchema.parse(request.params);

  const blink = database.blinks.find((blink) => blink.redirectId === redirectId);

  if (!blink) {
    response.status(404).json({ message: 'Blink not found' });
    return;
  }

  response.header('cache-control', 'public, max-age=0, must-revalidate').redirect(308, blink.url);
});

app.use(((error, _request, response, next) => {
  if (!error) {
    next();
  }

  if (!(error instanceof Error)) {
    throw error;
  }

  if (error instanceof ZodError) {
    response.status(400).json({
      message: 'Validation failed',
      issues: error.issues,
    });
  } else {
    response.status(500).json({
      message: error.message,
    });
  }
}) satisfies ErrorRequestHandler);

app.listen(PORT, HOSTNAME, () => {
  console.log(`Server is running at http://${HOSTNAME}:${PORT}`);
});
