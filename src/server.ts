import { createId, init as createIdFactory } from '@paralleldrive/cuid2';
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
  name: string;
  url: string;
  redirectId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

const database = {
  users: {
    rows: [] as User[],

    findById(id: User['id']) {
      return database.users.rows.find((user) => user.id === id);
    },

    findByEmail(email: User['email']) {
      return database.users.rows.find((user) => user.email === email);
    },
  },

  blinks: {
    rows: [] as Blink[],

    findById(id: Blink['id']) {
      return database.blinks.rows.find((blink) => blink.id === id);
    },

    findByRedirectId(redirectId: Blink['redirectId']) {
      return database.blinks.rows.find((blink) => blink.redirectId === redirectId);
    },

    findByUserId(userId: Blink['userId']) {
      return database.blinks.rows.filter((blink) => blink.userId === userId);
    },
  },
};

const userCreationSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

app.post('/users', (request, response) => {
  const { name, email } = userCreationSchema.parse(request.body);

  const userWithExistingEmail = database.users.findByEmail(email);
  if (userWithExistingEmail) {
    return response.status(409).json({ message: 'Email already in use' });
  }

  const user: User = {
    id: createId(),
    name,
    email,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  database.users.rows.push(user);

  return response.status(201).json(user);
});

const blinkCreationSchema = z.object({
  userId: z.string().uuid(), // Temporário; será extraído do token de autenticação
  name: z.string().min(1),
  url: z.string().url(),
  redirectId: z.string().min(1).optional(),
});

const generateRedirectId = createIdFactory({ length: 8 });

function generateUnusedRedirectId() {
  while (true) {
    const redirectIdCandidate = generateRedirectId();
    const isRedirectIdInUse = database.blinks.findByRedirectId(redirectIdCandidate);
    if (!isRedirectIdInUse) {
      return redirectIdCandidate;
    }
  }
}

app.post('/blinks', (request, response) => {
  const { userId, name, url, redirectId = generateUnusedRedirectId() } = blinkCreationSchema.parse(request.body);

  const user = database.users.findById(userId);
  if (!user) {
    return response.status(404).json({ message: 'User not found' });
  }

  const blinkWithExistingRedirectId = database.blinks.findByRedirectId(redirectId);
  if (blinkWithExistingRedirectId) {
    return response.status(409).json({ message: 'Redirect id is already in use' });
  }

  const blink: Blink = {
    id: createId(),
    userId,
    name,
    url,
    redirectId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  database.blinks.rows.push(blink);

  return response.status(201).json(blink);
});

const BLINK_ORDER_BY = ['createdAt.desc', 'createdAt.asc', 'name.desc', 'name.asc'] as const;
type BlinkOrderBy = (typeof BLINK_ORDER_BY)[number];

function blinksComparedBy(orderBy: BlinkOrderBy) {
  return function compare(blink: Blink, otherBlink: Blink) {
    switch (orderBy) {
      case 'createdAt.asc':
        return blink.createdAt.getTime() - otherBlink.createdAt.getTime();
      case 'createdAt.desc':
        return otherBlink.createdAt.getTime() - blink.createdAt.getTime();
      case 'name.asc':
        return blink.name.localeCompare(otherBlink.name);
      case 'name.desc':
        return otherBlink.name.localeCompare(blink.name);
    }
  };
}

const listBlinksSchema = z.object({
  userId: z.string().uuid(), // Temporário; será extraído do token de autenticação
  orderBy: z.enum(BLINK_ORDER_BY).optional().default('createdAt.desc'),
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().optional().default(10),
});

app.get('/blinks', (request, response) => {
  const { userId, orderBy, page, perPage } = listBlinksSchema.parse(request.query);

  const user = database.users.findById(userId);
  if (!user) {
    return response.status(404).json({ message: 'User not found' });
  }

  const paginationFrom = (page - 1) * perPage;
  const paginationTo = page * perPage;

  const blinks = database.blinks
    .findByUserId(userId)
    .sort(blinksComparedBy(orderBy))
    .slice(paginationFrom, paginationTo);

  return response.status(200).json(blinks);
});

const blinkUpdateSchema = z.object({
  userId: z.string().uuid(), // Temporário; será extraído do token de autenticação
  blinkId: z.string().uuid(),
  name: z.string().min(1).optional(),
  url: z.string().url().optional(),
  redirectId: z.string().min(1).optional(),
});

app.patch('/blinks/:blinkId', (request, response) => {
  const { userId, blinkId, name, url, redirectId } = blinkUpdateSchema.parse({
    ...request.params,
    ...request.body,
  });

  const user = database.users.findById(userId);
  if (!user) {
    return response.status(404).json({ message: 'User not found' });
  }

  const blinkIndex = database.blinks.rows.findIndex((blink) => blink.id === blinkId);
  if (blinkIndex === -1) {
    return response.status(404).json({ message: 'Blink not found' });
  }

  const blink = database.blinks.rows[blinkIndex];

  const updatedBlink: Blink = {
    ...blink,
    name: name ?? blink.name,
    url: url ?? blink.url,
    redirectId: redirectId ?? blink.redirectId,
    updatedAt: new Date(),
  };

  database.blinks.rows[blinkIndex] = updatedBlink;

  return response.status(200).json(updatedBlink);
});

const blinkDeletionSchema = z.object({
  userId: z.string().uuid(), // Temporário; será extraído do token de autenticação
  blinkId: z.string().uuid(),
});

app.delete('/blinks/:blinkId', (request, response) => {
  const { userId, blinkId } = blinkDeletionSchema.parse({
    ...request.params,
    ...request.body,
  });

  const user = database.users.findById(userId);
  if (!user) {
    return response.status(404).json({ message: 'User not found' });
  }

  const blinkIndex = database.blinks.rows.findIndex((blink) => blink.id === blinkId);
  if (blinkIndex === -1) {
    return response.status(404).json({ message: 'Blink not found' });
  }

  database.blinks.rows.splice(blinkIndex, 1);

  return response.status(204).end();
});

const redirectSchema = z.object({
  redirectId: z.string().min(1),
});

app.get('/:redirectId', (request, response) => {
  const { redirectId } = redirectSchema.parse(request.params);

  const blink = database.blinks.findByRedirectId(redirectId);
  if (!blink) {
    return response.status(404).json({ message: 'Blink not found' });
  }

  return response.header('cache-control', 'public, max-age=0, must-revalidate').redirect(308, blink.url);
});

const handleError: ErrorRequestHandler = (error, _request, response, next) => {
  if (!error) {
    next();
  }

  if (!(error instanceof Error)) {
    throw error;
  }

  if (error instanceof ZodError) {
    return response.status(400).json({
      message: 'Validation failed',
      issues: error.issues,
    });
  } else {
    return response.status(500).json({
      message: error.message,
    });
  }
};

app.use(handleError);

app.listen(PORT, HOSTNAME, () => {
  console.log(`Server is running at http://${HOSTNAME}:${PORT}`);
});
