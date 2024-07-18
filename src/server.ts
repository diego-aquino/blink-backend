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
  name: z
    .string({ invalid_type_error: 'Deve ser uma string', required_error: 'Obrigatório' })
    .min(1, 'Não pode ser vazio'),
  email: z
    .string({ invalid_type_error: 'Deve ser uma string', required_error: 'Obrigatório' })
    .email('O email deve ser válido'),
});

app.post('/users', (request, response) => {
  const { name, email } = userCreationSchema.parse(request.body);

  const userWithExistingEmail = database.users.findByEmail(email);
  if (userWithExistingEmail) {
    return response.status(409).json({ message: 'Email already in use' });
  }

  const user: User = {
    id: crypto.randomUUID(),
    name,
    email,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  database.users.rows.push(user);

  return response.status(201).json(user);
});

const blinkCreationSchema = z.object({
  userId: z
    .string({ invalid_type_error: 'Deve ser uma string', required_error: 'Obrigatório' })
    .uuid('Deve ser um uuid v4'), // Temporário; será extraído do token de autenticação
  title: z
    .string({ invalid_type_error: 'Deve ser uma string', required_error: 'Obrigatório' })
    .min(1, 'Não pode ser vazio'),
  url: z
    .string({ invalid_type_error: 'Deve ser uma string', required_error: 'Obrigatório' })
    .url('Deve ser uma URL válida'),
  redirectId: z
    .string({ invalid_type_error: 'Deve ser uma string', required_error: 'Obrigatório' })
    .min(1, 'Não pode ser vazio')
    .optional(),
});

function randomInteger(lowerLimit: number, upperLimit: number) {
  return Math.floor(Math.random() * (upperLimit - lowerLimit)) + lowerLimit;
}

const DEFAULT_REDIRECT_ID_ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function generateRedirectId(length: number) {
  const redirectId = Array.from({ length }, () => {
    const indexOfNextCharacterInAlphabet = randomInteger(0, DEFAULT_REDIRECT_ID_ALPHABET.length);
    const nextCharacter = DEFAULT_REDIRECT_ID_ALPHABET[indexOfNextCharacterInAlphabet];
    return nextCharacter;
  }).join('');

  return redirectId;
}

function generateUnusedRedirectId(length: number) {
  while (true) {
    const redirectIdCandidate = generateRedirectId(length);
    const isRedirectIdInUse = database.blinks.findByRedirectId(redirectIdCandidate);
    if (!isRedirectIdInUse) {
      return redirectIdCandidate;
    }
  }
}

app.post('/blinks', (request, response) => {
  const { userId, title, url, redirectId = generateUnusedRedirectId(6) } = blinkCreationSchema.parse(request.body);

  const user = database.users.findById(userId);
  if (!user) {
    return response.status(404).json({ message: 'User not found' });
  }

  const blinkWithExistingRedirectId = database.blinks.findByRedirectId(redirectId);
  if (blinkWithExistingRedirectId) {
    return response.status(409).json({ message: 'Redirect id is already in use' });
  }

  const blink: Blink = {
    id: crypto.randomUUID(),
    userId,
    title,
    url,
    redirectId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  database.blinks.rows.push(blink);

  return response.status(201).json(blink);
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
  userId: z
    .string({ invalid_type_error: 'Deve ser uma string', required_error: 'Obrigatório' })
    .uuid('Deve ser um uuid v4'), // Temporário; será extraído do token de autenticação
  orderBy: z
    .enum(BLINK_ORDER_BY, { invalid_type_error: 'Valor inválido', required_error: 'Obrigatório' })
    .optional()
    .default('createdAt.desc'),
  page: z.coerce
    .number({ invalid_type_error: 'Deve ser um número', required_error: 'Obrigatório' })
    .int('Deve ser um número inteiro')
    .positive('Deve ser um número positivo')
    .optional()
    .default(1),
  perPage: z.coerce
    .number({ invalid_type_error: 'Deve ser um número', required_error: 'Obrigatório' })
    .int('Deve ser um número inteiro')
    .positive('Deve ser um número positivo')
    .optional()
    .default(10),
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
  userId: z
    .string({ invalid_type_error: 'Deve ser uma string', required_error: 'Obrigatório' })
    .uuid('Deve ser um uuid v4'), // Temporário; será extraído do token de autenticação
  blinkId: z
    .string({ invalid_type_error: 'Deve ser uma string', required_error: 'Obrigatório' })
    .uuid('Deve ser um uuid v4'),
  title: z
    .string({ invalid_type_error: 'Deve ser uma string', required_error: 'Obrigatório' })
    .min(1, 'Não pode ser vazio')
    .optional(),
  url: z.string({ invalid_type_error: 'Deve ser uma string', required_error: 'Obrigatório' }).url().optional(),
  redirectId: z
    .string({ invalid_type_error: 'Deve ser uma string', required_error: 'Obrigatório' })
    .min(1, 'Não pode ser vazio')
    .optional(),
});

app.patch('/blinks/:blinkId', (request, response) => {
  const { userId, blinkId, title, url, redirectId } = blinkUpdateSchema.parse({
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
    title: title ?? blink.title,
    url: url ?? blink.url,
    redirectId: redirectId ?? blink.redirectId,
    updatedAt: new Date(),
  };

  database.blinks.rows[blinkIndex] = updatedBlink;

  return response.status(200).json(updatedBlink);
});

const blinkDeletionSchema = z.object({
  userId: z
    .string({ invalid_type_error: 'Deve ser uma string', required_error: 'Obrigatório' })
    .uuid('Deve ser um uuid v4'), // Temporário; será extraído do token de autenticação
  blinkId: z
    .string({ invalid_type_error: 'Deve ser uma string', required_error: 'Obrigatório' })
    .uuid('Deve ser um uuid v4'),
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
  redirectId: z
    .string({ invalid_type_error: 'Deve ser uma string', required_error: 'Obrigatório' })
    .min(1, 'Não pode ser vazio'),
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
