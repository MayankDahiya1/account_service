/*
 * IMPORTS
 */
import express, { Application } from "express";
import { ApolloServer } from "apollo-server-express";
import {
  ApolloServerPluginLandingPageLocalDefault,
  ApolloServerPluginLandingPageDisabled,
} from "apollo-server-core";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { typeDefs } from "./graphql/typeDefs";
import { resolvers } from "./graphql/resolvers";
import { applyDirectives, getDirectiveTypeDefs } from "./graphql/directives";
import { createContext, shutdownContext } from "./context";
import cors from "cors";
import helmet from "helmet";
import debug from "debug";
import http from "http";
import { initKafka, shutdownKafka } from "./kafka/kafkaClient";

// Testing

/*
 * DEBUG LOGGING
 */
const _Log = {
  server: debug("app:server"),
};

/*
 * APP INITIALIZATION
 */
const _App: Application = express();

/*
 * SECURITY MIDDLEWARE
 */
if (process.env.NODE_ENV === "production") {
  _App.use(
    cors({
      origin: process.env.GATEWAY_URL,
      credentials: true,
    })
  );
  _App.use(helmet());
} else {
  _App.use(
    cors({
      origin: true,
      credentials: true,
    })
  );
  _App.use(
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
  introspection: process.env.NODE_ENV !== "production",
  plugins: [
    process.env.NODE_ENV !== "production"
      ? ApolloServerPluginLandingPageLocalDefault()
      : ApolloServerPluginLandingPageDisabled(),
  ],
  cache: "bounded",
});

/*
 * HEALTH CHECK ENDPOINT
 */
_App.get("/health", (_req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

/*
 * SERVER STARTUP WITH GRACEFUL SHUTDOWN
 */
async function startServer() {
  await server.start();
  server.applyMiddleware({ app: _App, path: "/graphql", cors: false });

  const PORT = process.env.PORT || 4000;
  const httpServer = http.createServer(_App);

  // Kafka init
  await initKafka();

  httpServer.listen(PORT, () => _Log.server(`Server running on port ${PORT}`));

  // Graceful shutdown
  const shutdown = async () => {
    _Log.server("Shutting down server...");

    httpServer.close(async (err) => {
      if (err) {
        _Log.server("Error closing HTTP server:", err);
        process.exit(1);
      }

      try {
        // Shutdown context
        await shutdownContext();

        // Shutdown Kafka
        await shutdownKafka();

        _Log.server("Server gracefully stopped");
        process.exit(0);
      } catch (contextErr) {
        _Log.server("Error during shutdown:", contextErr);
        process.exit(1);
      }
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

startServer().catch((err) => {
  _Log.server("Server failed to start:", err);
  process.exit(1);
});
