import { makeExecutableSchema } from '@graphql-tools/schema';
import { PrismaClient } from '@prisma/client';
import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { expressMiddleware } from '@apollo/server/express4';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { PubSub } from 'graphql-subscriptions';
import { useServer } from 'graphql-ws/lib/use/ws';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { getServerSession } from './util/functions.js';
import resolvers from './graphql/resolvers/index.js';
import typeDefs from './graphql/typeDefs/index.js';
import * as dotenv from 'dotenv';
import cors from 'cors';
import json from 'body-parser';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const __dirname = path.resolve();

const main = async () => {
  dotenv.config({ path: '.env.local' });

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers
  });

  const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, 'userfiles');
      },
      filename: (req, file, cb) => {
        const date = new Date().toISOString().replace(/T/, '-').replace(/\..+/, '').replace(/:/g, '-');

        cb(null, uuidv4() + '-' + date + '-' + file.originalname);
      }
  });

  const fileFilter = (req, file, cb) => {
      const allowedFileTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/gif', 'video/mp4'];

      if (allowedFileTypes.includes(file.mimetype)) cb(null, true);

      else {
        cb(null, false);

        return cb(new Error('Only PNG / JPG / GIF / MP4 formats are allowed!'));
      }
  };

  const limits = {
    fieldNameSize: 50,
    fileSize: 209715200
  };

  const upload = multer({ storage, fileFilter, limits });

  const app = express();
  const httpServer = createServer(app);

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/subscription'
  });

  const prisma = new PrismaClient();
  const pubsub = new PubSub();

  const getSubscriptionContext = async (ctx) => {
    if (ctx.connectionParams && ctx.connectionParams.session) {
      const { session } = ctx.connectionParams;

      return { session, prisma, pubsub };
    }

    return { session: null, prisma, pubsub };
  };

  const serverCleanup = useServer(
    {
      schema,
      context: (ctx) => {
        return getSubscriptionContext(ctx);
      }
    },
    wsServer
  );

  const server = new ApolloServer({
    schema,
    csrfPrevention: true,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            }
          };
        }
      }
    ]
  });

  await server.start();

  const corsOptions = {
    origin: process.env.BASE_URL,
    credentials: true
  };

  const dbLimiter = rateLimit({
    windowMs: 1000,
    max: 10,
    message: 'Too many requests',
    standardHeaders: true,
    legacyHeaders: false
  });

  app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', process.env.BASE_URL);
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

    next();
  });

  app.use('/graphql', dbLimiter);

  app.use(
    '/graphql',
    cors(corsOptions),
    json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        const session = await getServerSession(req.headers.cookie);

        return { session: session, prisma, pubsub };
      }
    })
  );

  app.use('/userfiles', express.static(path.join(__dirname, 'userfiles')));

  app.use('/sounds', express.static(path.join(__dirname, 'sounds')));

  app.post(
    '/upload',
    (req, res) => {
      upload.single('file')(req, res, (err) => {
        if (err) return res.status(400).json({ message: err.message });

        res.json(req.file?.filename ?? '');
      });
    }
  );

  const PORT = 4000;

  await new Promise((resolve) =>
    httpServer.listen({ port: PORT }, resolve)
  );

  console.log(`Server is now running on http://localhost:${PORT}/graphql`);
};

main().catch((err) => console.log(err));
