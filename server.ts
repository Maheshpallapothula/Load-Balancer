import "dotenv/config";
import express, { Application } from "express";
import app from "./src/application/app";
import { ConnectDatabase } from "./src/common/database/config";
import loggerInstance from "./src/common/utils/loggingService";
import { connectRedis } from "./src/common/database/redis";

class Server {
  private readonly port: number;
  private readonly app: Application;
  private readonly logger: typeof loggerInstance;

  constructor(app: Application, port: number, logger: typeof loggerInstance) {
    this.app = app;
    this.port = port;
    this.logger = logger;
    this.configureMiddleware();
  }

  private configureMiddleware(): void {
    this.app.use(express.json());
  }

  public async start(): Promise<void> {
    try {
      await ConnectDatabase();
      await connectRedis();
      this.app.listen(this.port, () => {
        this.logger.log(
          "SERVER_RUNNING",
          `Server running on port ${this.port}`
        );
      });
    } catch (error) {
      this.logger.error(
        "DATABASE_CONNECTION_ERROR",
        `Database connection failed: ${error.message}`
      );
    }
  }
}

const port = Number(process.env.PORT) || 3000;
const server = new Server(app, port, loggerInstance);
server.start();
