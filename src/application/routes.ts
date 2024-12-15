import "dotenv/config";
import { Application, Request, Response } from "express";
import loggerInstance from "../common/utils/loggingService";
import userRoutes from '../application/routes/user.routes';
import serverRoutes from '../application/routes/server.routes';

export class MainRoutes {
  public initialize(app: Application): void {
    this.configureRoutes(app);
    this.configureHealthCheckRoute(app);
    this.configureMismatchRoute(app);
  }
  
  private configureRoutes(app: Application) {
    app.use('/api/users', userRoutes);
    app.use('/api/servers', serverRoutes);
  }

  // Health check
  private configureHealthCheckRoute(app: Application): void {
    app.get("/health-check", async function (req: Request, res: Response) {
      try {
        res
          .status(200)
          .send({
            error: false,
            statusCode: 200,
            message: "Health check successful",
          });
      } catch (error) {
        loggerInstance.warn("HEALTH_CHECK_ERROR",`Health check failed`);
        res
          .status(500)
          .send({
            error: true,
            statusCode: 500,
            message: "Health check failed",
          });
      }
    });
  }

  // Mismatch URL
  private configureMismatchRoute(app: Application): void {
    app.all("*", (req: Request, res: Response) => {
      loggerInstance.warn("WRONG_URL_ERROR",`Check your URL, please`);
      res
        .status(404)
        .send({
          error: true,
          statusCode: 404,
          message: "Check your URL, please",
        });
    });
  }
}
