/*
 * IMPORTS
 */
import express, { Application } from 'express';
import { ApolloServer } from 'apollo-server-express';
import { ApolloServerPluginLandingPageLocalDefault } from 'apollo-server-core';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { typeDefs } from './graphql/typeDefs';
import { resolvers } from './graphql/resolvers';
import { applyDirectives, getDirectiveTypeDefs } from './graphql/directives';
import { verifyToken } from './utils/verifyToken';
import { prisma } from './prisma/client';
import cors from 'cors';
import helmet from 'helmet';

/*
 * APP INITIALIZATION
 */
const app: Application = express();

/*
 * SECURITY MIDDLEWARE (Modified for Apollo Sandbox)
 */
// 1. Configure CORS first
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true
}));

// 2. Configure Helmet with relaxed CSP for development
if (process.env.NODE_ENV === 'production') {
  app.use(helmet());
} else {
  // Development-specific CSP that allows Apollo Sandbox
  app.use(
    helmet({
      contentSecurityPolicy: false, // Disable CSP for development
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: false
    })
  );
}

/*
 * GRAPHQL SCHEMA SETUP
 */
const schema = applyDirectives(
  makeExecutableSchema({
    typeDefs: [...getDirectiveTypeDefs(), typeDefs],
    resolvers,
  })
);

/*
 * APOLLO SERVER CONFIGURATION
 */
const server = new ApolloServer({
  schema,
  context: ({ req }) => ({
    prisma,
    user: verifyToken(req.headers.authorization),
    ip: req.headers['x-forwarded-for'] || req.ip
  }),
  plugins: [
    // Force embedded playground in all environments
    ApolloServerPluginLandingPageLocalDefault()
  ],
  introspection: true, // Always enable introspection
  cache: 'bounded'
});

/*
 * HEALTH CHECK ENDPOINT
 */
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    sandbox: 'http://localhost:4000/graphql',
    timestamp: new Date().toISOString()
  });
});

/*
 * SERVER STARTUP
 */
async function startServer() {
  await server.start();
  
  server.applyMiddleware({ 
    app,
    path: '/graphql',
    cors: false // CORS already handled by express middleware
  });

  const PORT = parseInt(process.env.PORT || "4000", 10);

  app.listen(PORT, '0.0.0.0', () => { // Listen on all network interfaces
    console.log(`
    🚀 Server ready at http://localhost:${PORT}/graphql
    🔥 Health check: http://localhost:${PORT}/health
    💡 Try these fixes if Sandbox doesn't load:
        1. Clear browser cache
        2. Try incognito mode
        3. Disable ad-blockers
    `);
  });
}

startServer().catch(err => {
  console.error('🔥 Server failed to start:', err);
  process.exit(1);
});