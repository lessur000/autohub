import { app } from "./app.js";
import { env } from "./config/env.js";
import {
  testDatabaseConnection,
  closeDatabaseConnection,
} from "./config/database.js";
import { logger } from "./config/logger.js";

let server;
let shuttingDown = false;

async function startServer() {
  try {
    const database = await testDatabaseConnection();

    logger.info("Database connected", {
      database: database.database_name,
    });

    server = app.listen(env.PORT, "0.0.0.0", () => {
      logger.info("AutoHub API started", {
        port: env.PORT,
        environment: env.NODE_ENV,
      });
    });

    server.on("error", (error) => {
      logger.fatal("HTTP server error", {
        message: error.message,
      });

      process.exitCode = 1;
      void shutdown();
    });
  } catch (error) {
    logger.fatal("Failed to start AutoHub API", {
      message: error.message,
    });

    process.exitCode = 1;

    try {
      await closeDatabaseConnection();
    } catch (closeError) {
      logger.error("Database pool shutdown failed", {
        message: closeError.message,
      });
    }
  }
}

async function shutdown() {
  if (shuttingDown) return;

  shuttingDown = true;
  logger.info("Shutting down AutoHub API");

  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }

    await closeDatabaseConnection();

    logger.info("AutoHub API shutdown complete");
  } catch (error) {
    logger.error("Shutdown failed", {
      message: error.message,
    });

    process.exitCode = 1;
  }
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());

await startServer();
