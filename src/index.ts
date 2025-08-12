/*
 * IMPORTS
 */
import express, { Application } from "express";
import { ApolloServer } from "apollo-server-express";
import { ApolloServerPluginLandingPageLocalDefault } from "apollo-server-core";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { typeDefs } from "./graphql/typeDefs";
import { resolvers } from "./graphql/resolvers";
import { applyDirectives, getDirectiveTypeDefs } from "./graphql/directives";
import { createContext } from "./context";
import cors from "cors";
import helmet from "helmet";
import debug from "debug";

/*
 * DEBUG LOGGING
 */
const log = {
  server: debug("app:server"),
};

/*
 * APP INITIALIZATION
 */
const app: Application = express();

/*
 * SECURITY MIDDLEWARE
 */
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

if (process.env.NODE_ENV === "production") {
  app.use(helmet());
} else {
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: false,
    })
  );
}

/*
 * GRAPHQL SCHEMA
 */
const schema = applyDirectives(
  makeExecutableSchema({
    typeDefs: [...getDirectiveTypeDefs(), typeDefs],
    resolvers,
  })
);

/*
 * APOLLO SERVER
 */
const server = new ApolloServer({
  schema,
  context: createContext,
  plugins: [ApolloServerPluginLandingPageLocalDefault()],
  introspection: true,
  cache: "bounded",
});

/*
 * HEALTH CHECK ENDPOINT
 */
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    sandbox: "http://localhost:4000/graphql",
    timestamp: new Date().toISOString(),
  });
});

/*
 * SERVER STARTUP
 */
async function startServer() {
  await server.start();
  server.applyMiddleware({ app, path: "/graphql", cors: false });
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => log.server(`Server running on port ${PORT}`));
}

startServer().catch((err) => {
  log.server("Server failed to start:", err);
  process.exit(1);
});
